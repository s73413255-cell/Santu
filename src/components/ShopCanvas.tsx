import React, { useState, useEffect, useRef } from 'react';
import { GameState, Customer, FloorSpill, FloatingText, Product, ShopStageId } from '../types/game';
import { SHOP_STAGES } from '../data/gameData';
import { soundService } from '../services/sound';
import { Zap, Sparkles } from 'lucide-react';

interface ShopCanvasProps {
  state: GameState;
  onCustomerCheckout: (coinsEarned: number, product: Product) => void;
  onCleanSpill: (bonusCoins: number) => void;
  onOpenAdModal: () => void;
  onQuickRestock: (sectionId: string) => void;
  onTriggerCustomerRush: () => void;
  onOpenWindowShopping: () => void;
}

const CUSTOMER_TYPES: Array<'kid' | 'teen' | 'adult' | 'senior' | 'hipster' | 'business'> = [
  'kid',
  'teen',
  'adult',
  'senior',
  'hipster',
  'business',
];

const OUTFIT_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B',
];

const HAIR_COLORS = ['#3E2723', '#212121', '#E65100', '#F59E0B', '#B0BEC5', '#795548'];
const SKIN_COLORS = ['#FCD34D', '#FDE68A', '#FDBA74', '#F87171', '#D97706'];

export const ShopCanvas: React.FC<ShopCanvasProps> = ({
  state,
  onCustomerCheckout,
  onCleanSpill,
  onOpenAdModal,
  onQuickRestock,
  onOpenWindowShopping,
}) => {
  const currentStage = SHOP_STAGES[state.currentStageId];
  const containerRef = useRef<HTMLDivElement>(null);

  // Active entities in shop
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [spills, setSpills] = useState<FloorSpill[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [restockerTarget, setRestockerTarget] = useState<{ x: number; y: number } | null>(null);
  const [restockerPos, setRestockerPos] = useState({ x: 20, y: 70 });
  const [cleanerPos, setCleanerPos] = useState({ x: 80, y: 65 });
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Second interval for live UI timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Store dimensions & layout bounds
  const storeSizeBonus = state.upgrades.storeSize;
  const customerCap = currentStage.baseCustomerCap + (state.upgrades.customerCapacity - 1) * 2;
  const isRushActive = state.activeRushEndTime > currentTime;
  const isHappinessActive = (state.activeHappinessEndTime || 0) > currentTime;
  const happinessRemaining = Math.max(0, Math.ceil(((state.activeHappinessEndTime || 0) - currentTime) / 1000));
  const effectiveCap = isRushActive ? customerCap + 4 : customerCap;

  // Decor styles
  const equippedFloor = state.equippedFloorId && state.decor ? state.decor[state.equippedFloorId] : null;
  const floorBgColor = (equippedFloor && equippedFloor.purchased) ? (equippedFloor.floorColor || currentStage.floorPattern) : currentStage.floorPattern;
  const floorBgImage = (equippedFloor && equippedFloor.purchased && equippedFloor.floorPattern)
    ? equippedFloor.floorPattern
    : (state.currentStageId >= ShopStageId.SUPERMARKET
      ? 'radial-gradient(#CBD5E1 1.5px, transparent 1.5px)'
      : 'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)');

  // Shelf coordinates by section (percentage based inside shop floor)
  const SHELF_COORDINATES: Record<string, { x: number; y: number; label: string; icon: string }> = {
    vegetables: { x: 22, y: 38, label: 'Veg Stand', icon: '🥕' },
    fruits: { x: 50, y: 38, label: 'Fruit Stand', icon: '🍎' },
    drinks: { x: 78, y: 38, label: 'Drink Cooler', icon: '🥤' },
    snacks: { x: 22, y: 60, label: 'Snack Shelf', icon: '🥔' },
    dairy: { x: 50, y: 60, label: 'Dairy Chiller', icon: '🧀' },
    bakery: { x: 78, y: 60, label: 'Bakery Case', icon: '🥐' },
    household: { x: 22, y: 78, label: 'Household', icon: '🧼' },
    electronics: { x: 78, y: 78, label: 'Electronics', icon: '🎧' },
  };

  // Checkout counter coordinate
  const CHECKOUT_POS = { x: 50, y: 84 };
  const ENTRANCE_POS = { x: 12, y: 92 };

  // Helper to get random unlocked product
  const getAvailableProduct = (): Product | null => {
    const unlocked = (Object.values(state.products) as Product[]).filter((p) => p.unlocked);
    if (unlocked.length === 0) return null;
    return unlocked[Math.floor(Math.random() * unlocked.length)];
  };

  // Add floating text
  const addFloatingText = (text: string, x: number, y: number, color = '#FBBF24') => {
    const id = `${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev.slice(-8), { id, text, x, y, color, createdAt: Date.now() }]);
  };

  // 1. Spawning Customers
  useEffect(() => {
    const spawnInterval = window.setInterval(() => {
      setCustomers((prev) => {
        if (prev.length >= effectiveCap) return prev;

        const product = getAvailableProduct();
        if (!product) return prev;

        const shelfInfo = SHELF_COORDINATES[product.sectionId] || { x: 40, y: 50 };
        const customerType = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
        const outfit = OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)];
        const hair = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
        const skin = SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)];

        const speedMod = 1 + (state.upgrades.customerWalkSpeed - 1) * 0.2 + (state.staff.greeter?.hired ? 0.2 : 0);
        const baseSpeed = (customerType === 'kid' ? 1.4 : customerType === 'senior' ? 0.8 : 1.0) * speedMod;

        const newCustomer: Customer = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: `Shopper`,
          outfitColor: outfit,
          hairColor: hair,
          skinColor: skin,
          type: customerType,
          x: ENTRANCE_POS.x + (Math.random() * 4 - 2),
          y: ENTRANCE_POS.y,
          targetX: shelfInfo.x + (Math.random() * 6 - 3),
          targetY: shelfInfo.y + (Math.random() * 4 - 2),
          speed: baseSpeed,
          state: 'browsing',
          stateTimer: 0,
          targetProduct: product,
          hasProduct: false,
          facing: 'right',
          basket: [],
          totalBill: 0,
          bobPhase: Math.random() * Math.PI,
        };

        return [...prev, newCustomer];
      });
    }, isRushActive ? 800 : 2000);

    return () => clearInterval(spawnInterval);
  }, [effectiveCap, state.products, state.upgrades.customerWalkSpeed, state.staff.greeter?.hired, isRushActive]);

  // 2. Periodic Floor Spills
  useEffect(() => {
    const spillInterval = window.setInterval(() => {
      setSpills((prev) => {
        if (prev.length >= 3) return prev;
        const types: Array<'juice' | 'dust' | 'banana'> = ['juice', 'dust', 'banana'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const newSpill: FloorSpill = {
          id: `spill_${Date.now()}`,
          x: 25 + Math.random() * 50,
          y: 45 + Math.random() * 30,
          type: chosenType,
          bonusCoins: 15 + state.shopLevel * 5,
        };
        return [...prev, newSpill];
      });
    }, 12000);

    return () => clearInterval(spillInterval);
  }, [state.shopLevel]);

  // 3. Customer Simulation Loop (Movement & State Machine)
  useEffect(() => {
    const dt = 0.05; // 50ms step ~ 20 FPS simulation
    const loopInterval = window.setInterval(() => {
      setCustomers((prevCustomers) => {
        const updated: Customer[] = [];

        prevCustomers.forEach((c) => {
          let { x, y, targetX, targetY, state: cState, stateTimer, facing, hasProduct, bobPhase } = c;
          bobPhase += 0.25;

          const dx = targetX - x;
          const dy = targetY - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dx > 0.5) facing = 'right';
          else if (dx < -0.5) facing = 'left';

          // Moving toward target
          if (dist > 1.2) {
            const speedBoost = isHappinessActive ? 1.35 : 1;
            const step = c.speed * dt * 18 * speedBoost;
            x += (dx / dist) * Math.min(dist, step);
            y += (dy / dist) * Math.min(dist, step);
          } else {
            // Reached target -> handle state transitions
            if (cState === 'browsing') {
              stateTimer += dt;
              if (stateTimer > 0.8) {
                // Pick product
                cState = 'picking';
                hasProduct = true;
                if (c.targetProduct) {
                  c.basket.push(c.targetProduct);
                  const priceMultiplier = 1 + (state.upgrades.productPrice - 1) * 0.15;
                  c.totalBill = Math.round(c.targetProduct.basePrice * (1 + (c.targetProduct.level - 1) * 0.3) * priceMultiplier);
                }
                stateTimer = 0;
                // Move to checkout
                targetX = CHECKOUT_POS.x + (Math.random() * 6 - 3);
                targetY = CHECKOUT_POS.y - 2;
                cState = 'queueing';
              }
            } else if (cState === 'queueing') {
              // At checkout counter
              cState = 'checkout';
              stateTimer = 0;
            } else if (cState === 'checkout') {
              stateTimer += dt;
              // Ringing speed influenced by checkoutSpeed upgrade and cashier staff
              let requiredTime = 1.2 / (1 + (state.upgrades.checkoutSpeed - 1) * 0.25);
              if (state.staff.cashier?.hired) {
                requiredTime /= (1 + state.staff.cashier.level * 0.3);
              }

              if (stateTimer >= requiredTime) {
                // Checkout complete!
                cState = 'paying';
                const bill = c.totalBill || 10;
                const isFrenzy = state.activeFrenzyEndTime > Date.now();
                const finalCoins = isFrenzy ? bill * 2 : bill;

                if (c.targetProduct) {
                  onCustomerCheckout(finalCoins, c.targetProduct);
                }

                // Play kaching & coin chime
                soundService.playCashRegister();
                soundService.playCoin();

                addFloatingText(`+${finalCoins} 🪙`, x, y - 8, isFrenzy ? '#F97316' : '#FBBF24');
                if (isHappinessActive) {
                  addFloatingText(`💖 +50% Tip!`, x, y - 16, '#F43F5E');
                }

                // Customer heads to exit
                cState = 'leaving';
                targetX = ENTRANCE_POS.x;
                targetY = ENTRANCE_POS.y;
              }
            } else if (cState === 'leaving') {
              // Reached exit -> remove from shop
              return;
            }
          }

          updated.push({
            ...c,
            x,
            y,
            targetX,
            targetY,
            state: cState,
            stateTimer,
            facing,
            hasProduct,
            bobPhase,
          });
        });

        return updated;
      });

      // Staff autonomous behaviors
      // 1. Restocker walking
      if (state.staff.restocker?.hired) {
        setRestockerPos((prev) => {
          if (!restockerTarget) {
            // Pick a random shelf to walk to
            const shelves = Object.values(SHELF_COORDINATES);
            const target = shelves[Math.floor(Math.random() * shelves.length)];
            setRestockerTarget(target);
            return prev;
          }
          const dx = restockerTarget.x - prev.x;
          const dy = restockerTarget.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 2) {
            setRestockerTarget(null); // Arrived
            return prev;
          }
          const spd = 1.2 * (1 + (state.staff.restocker?.level || 1) * 0.15);
          return {
            x: prev.x + (dx / dist) * spd * 0.4,
            y: prev.y + (dy / dist) * spd * 0.4,
          };
        });
      }

      // 2. Cleaner automatic spill cleaning
      if (state.staff.cleaner?.hired && spills.length > 0) {
        const targetSpill = spills[0];
        setCleanerPos((prev) => {
          const dx = targetSpill.x - prev.x;
          const dy = targetSpill.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 3) {
            // Clean it automatically!
            onCleanSpill(targetSpill.bonusCoins);
            soundService.playCleanSpill();
            addFloatingText(`🧹 +${targetSpill.bonusCoins}`, targetSpill.x, targetSpill.y - 4, '#34D399');
            setSpills((s) => s.filter((item) => item.id !== targetSpill.id));
            return prev;
          }
          const spd = 1.4 * (1 + (state.staff.cleaner?.level || 1) * 0.15);
          return {
            x: prev.x + (dx / dist) * spd * 0.5,
            y: prev.y + (dy / dist) * spd * 0.5,
          };
        });
      }
    }, 50);

    return () => clearInterval(loopInterval);
  }, [state, spills, restockerTarget, onCustomerCheckout, onCleanSpill]);

  // Clean expired floating text
  useEffect(() => {
    const textCleanup = window.setInterval(() => {
      const now = Date.now();
      setFloatingTexts((prev) => prev.filter((t) => now - t.createdAt < 1200));
    }, 300);
    return () => clearInterval(textCleanup);
  }, []);

  // Manual tap register to speed up checkout
  const handleTapRegister = () => {
    soundService.playClick();
    const waitingCust = customers.find((c) => c.state === 'queueing' || c.state === 'checkout');
    if (waitingCust) {
      waitingCust.stateTimer += 0.8;
      addFloatingText('⚡ Speed Tap!', CHECKOUT_POS.x, CHECKOUT_POS.y - 12, '#38BDF8');
    }
  };

  // Manual tap spill
  const handleTapSpill = (spill: FloorSpill, e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playCleanSpill();
    onCleanSpill(spill.bonusCoins);
    addFloatingText(`+${spill.bonusCoins} 🪙`, spill.x, spill.y - 5, '#10B981');
    setSpills((prev) => prev.filter((s) => s.id !== spill.id));
  };

  // Manual tap shelf
  const handleTapShelf = (sectionId: string) => {
    soundService.playClick();
    onQuickRestock(sectionId);
    const coords = SHELF_COORDINATES[sectionId];
    if (coords) {
      addFloatingText('✨ Restocked!', coords.x, coords.y - 8, '#34D399');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full overflow-hidden select-none bg-slate-950 flex flex-col justify-between"
      style={{ touchAction: 'none' }}
    >
      {/* Cartoon Shop Outer Awning / Marquee Header */}
      <div className="w-full relative z-10 flex flex-col items-center">
        {/* Striped Canopy / Awning */}
        <div className="w-full h-6 flex overflow-hidden shadow-md relative">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full ${
                i % 2 === 0 ? 'bg-red-500' : 'bg-white'
              } rounded-b-[4px] shadow-sm transform transition-transform`}
            />
          ))}
          {/* Fairy Lights on Awning */}
          {state.decor?.decor_fixture_lights?.purchased && (
            <div className="absolute inset-0 flex justify-around items-center px-1 pointer-events-none z-10 text-[10px]">
              <span className="animate-pulse">🏮</span>
              <span className="animate-ping">✨</span>
              <span className="animate-pulse">🏮</span>
              <span className="animate-ping">✨</span>
              <span className="animate-pulse">🏮</span>
              <span className="animate-ping">✨</span>
              <span className="animate-pulse">🏮</span>
            </div>
          )}
        </div>

        {/* Shop Sign Banner */}
        <div
          className={`w-[90%] max-w-sm mt-1 px-4 py-1.5 rounded-xl bg-gradient-to-r ${currentStage.themeColor} text-white font-black text-center shadow-lg border-2 border-white/80 flex items-center justify-between`}
        >
          <span className="text-lg">{currentStage.icon}</span>
          <div className="flex flex-col items-center leading-none">
            <span className="text-xs tracking-wider uppercase drop-shadow-md">{currentStage.signText}</span>
            <span className="text-[10px] text-yellow-100 font-semibold mt-0.5">{currentStage.subtitle}</span>
          </div>
          <span className="text-lg">{currentStage.icon}</span>
        </div>

        {/* Customer Happiness Surge Active Alert Banner */}
        {isHappinessActive && (
          <div className="w-[92%] max-w-sm mt-1 px-3 py-1 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white font-black text-center shadow-lg border-2 border-pink-300 flex items-center justify-between text-xs animate-pulse">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💖</span>
              <span className="text-[10px] tracking-wide uppercase font-extrabold">Happiness Surge!</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/30 px-2 py-0.5 rounded-lg text-[10px] font-mono">
              <span className="text-yellow-300 font-bold">{happinessRemaining}s</span>
              <span className="text-pink-100 text-[9px]">(+50% Tips & +35% Spd)</span>
            </div>
          </div>
        )}

        {/* Interactive External Storefront Window Displays Bar */}
        <div className="w-[92%] max-w-sm flex items-center justify-between gap-1.5 mt-1">
          {/* Left Window Display: Boutique Fashion */}
          <button
            onClick={() => {
              soundService.playClick();
              onOpenWindowShopping();
            }}
            className="flex-1 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border-2 border-pink-400/80 hover:border-pink-300 rounded-xl p-1.5 flex items-center gap-1.5 shadow-md cartoon-btn relative overflow-hidden group text-left transition-all hover:scale-[1.02]"
            title="Tap to window shop!"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-lg shrink-0 shadow-inner group-hover:scale-110 transition-transform">
              <span className="animate-pulse">🪟</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1 leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-pink-300 uppercase tracking-tight truncate">
                  Window #1
                </span>
                <span className="px-1 py-0.5 rounded bg-pink-500 text-white text-[7px] font-black animate-pulse">
                  PEEK
                </span>
              </div>
              <span className="text-[8px] text-slate-300 font-bold truncate mt-1">
                ✨ Mini-Game & Tips
              </span>
            </div>
            <span className="text-xs shrink-0 animate-bounce">👗</span>
          </button>

          {/* Right Window Display: Deluxe Showcase */}
          <button
            onClick={() => {
              soundService.playClick();
              onOpenWindowShopping();
            }}
            className="flex-1 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-400/80 hover:border-cyan-300 rounded-xl p-1.5 flex items-center gap-1.5 shadow-md cartoon-btn relative overflow-hidden group text-left transition-all hover:scale-[1.02]"
            title="Tap to window shop!"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-lg shrink-0 shadow-inner group-hover:scale-110 transition-transform">
              <span className="animate-pulse">🎁</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1 leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-tight truncate">
                  Window #2
                </span>
                <span className="px-1 py-0.5 rounded bg-cyan-500 text-white text-[7px] font-black animate-pulse">
                  PLAY
                </span>
              </div>
              <span className="text-[8px] text-slate-300 font-bold truncate mt-1">
                💖 Happiness Boost
              </span>
            </div>
            <span className="text-xs shrink-0 animate-bounce">💎</span>
          </button>
        </div>
      </div>

      {/* Main Shop Interior Isometric Floor Plan */}
      <div className="relative flex-1 w-full mx-auto max-w-md my-1 px-2 flex items-center justify-center">
        <div
          className="relative w-full h-full max-h-[500px] rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: floorBgColor,
            backgroundImage: floorBgImage,
            backgroundSize: '24px 24px',
          }}
        >
          {/* Shop Walls & Top Border */}
          <div
            className="absolute top-0 left-0 right-0 h-10 border-b-2 border-slate-400/30 flex items-center justify-between px-2.5 z-20"
            style={{ backgroundColor: currentStage.wallColor }}
          >
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-white/70 px-2 py-0.5 rounded-md shadow-xs">
              <span>🌟 Shop Level {state.shopLevel}</span>
            </div>

            {/* Wall Neon & Clock Fixtures */}
            <div className="flex items-center gap-1.5 overflow-hidden max-w-[210px]">
              {state.decor?.decor_fixture_clock?.purchased && (
                <span className="text-xs" title="Vintage Clock">🕰️</span>
              )}
              {state.decor?.decor_neon_open?.purchased && (
                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300 text-[8px] font-black tracking-widest border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse whitespace-nowrap">
                  OPEN 24/7
                </span>
              )}
              {state.decor?.decor_neon_fresh?.purchased && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[8px] font-black tracking-widest border border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] whitespace-nowrap">
                  FRESH
                </span>
              )}
              {state.decor?.decor_neon_crown?.purchased && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[8px] font-black tracking-widest border border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse whitespace-nowrap">
                  👑 VIP
                </span>
              )}
            </div>
          </div>

          {/* Hanging Ivy Canopy along upper wall */}
          {state.decor?.decor_plant_hanging?.purchased && (
            <div className="absolute top-10 left-0 right-0 h-4 flex justify-around pointer-events-none z-15 overflow-hidden opacity-90">
              <span className="text-xs animate-pulse">🍃</span>
              <span className="text-xs">🍃</span>
              <span className="text-xs animate-pulse">🍃</span>
              <span className="text-xs">🍃</span>
              <span className="text-xs animate-pulse">🍃</span>
            </div>
          )}

          {/* Crystal Chandelier Hanging from Center */}
          {state.decor?.decor_fixture_chand?.purchased && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 pointer-events-none z-15 flex flex-col items-center">
              <div className="w-0.5 h-1.5 bg-amber-400" />
              <span className="text-base drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse">💎</span>
            </div>
          )}

          {/* Hot Deals Neon Banner Floating above Middle Aisles */}
          {state.decor?.decor_neon_deals?.purchased && (
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 pointer-events-none z-15">
              <span className="px-2 py-0.5 rounded-full bg-pink-950/90 text-pink-300 text-[8px] font-black tracking-wider border border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.7)] animate-bounce whitespace-nowrap flex items-center gap-1">
                <span>🔥</span> HOT DEALS
              </span>
            </div>
          )}

          {/* Left Storefront Window Bay (Interactive) */}
          <div
            onClick={() => {
              soundService.playClick();
              onOpenWindowShopping();
            }}
            className="absolute top-11 left-1.5 z-20 cursor-pointer cartoon-btn group"
            title="Tap to window shop!"
          >
            <div className="relative bg-slate-900/90 border-2 border-pink-400 rounded-lg p-1 shadow-lg flex flex-col items-center hover:scale-110 active:scale-95 transition-transform">
              <div className="text-base animate-bounce">👗</div>
              <span className="text-[7px] bg-pink-600 text-white font-black px-1 rounded-full shadow-xs">
                WINDOW
              </span>
              <div className="absolute -top-1 -right-1 text-[10px] animate-ping">✨</div>
            </div>
          </div>

          {/* Right Storefront Showcase Bay (Interactive) */}
          <div
            onClick={() => {
              soundService.playClick();
              onOpenWindowShopping();
            }}
            className="absolute top-11 right-1.5 z-20 cursor-pointer cartoon-btn group"
            title="Tap to window shop!"
          >
            <div className="relative bg-slate-900/90 border-2 border-cyan-400 rounded-lg p-1 shadow-lg flex flex-col items-center hover:scale-110 active:scale-95 transition-transform">
              <div className="text-base animate-bounce">💎</div>
              <span className="text-[7px] bg-cyan-600 text-white font-black px-1 rounded-full shadow-xs">
                SHOWCASE
              </span>
              <div className="absolute -top-1 -left-1 text-[10px] animate-ping">⭐</div>
            </div>
          </div>

          {/* Monstera Plant at Upper Right Corner */}
          {state.decor?.decor_plant_monstera?.purchased && (
            <div className="absolute top-11 right-13 pointer-events-none z-15 flex flex-col items-center">
              <span className="text-lg">🌿</span>
            </div>
          )}

          {/* Automatic Entrance Sliding Glass Doors */}
          <div
            className="absolute bottom-1 left-2 w-16 h-10 border-2 border-sky-400 bg-sky-200/40 rounded-t-lg flex flex-col items-center justify-center shadow-md z-10"
            title="Customer Entrance"
          >
            <span className="text-[9px] font-black text-sky-800 uppercase tracking-tighter">ENTRANCE</span>
            <div className="flex gap-1 mt-0.5">
              <span className="text-xs animate-pulse">🚪</span>
            </div>
          </div>

          {/* Window Shopper Pedestrian Outside Looking At Glass Display */}
          <div
            onClick={() => {
              soundService.playClick();
              onOpenWindowShopping();
            }}
            className="absolute bottom-1 right-2 cursor-pointer z-20 flex flex-col items-center group cartoon-btn"
            title="Window Shopper admiring displays! Tap to play mini-game!"
          >
            <div className="px-1.5 py-0.5 bg-white/95 rounded-full shadow-md border border-slate-300 text-[8px] font-bold text-slate-800 flex items-center gap-0.5 animate-bounce mb-0.5">
              <span>👀</span>
              <span className="text-[7px]">So pretty!</span>
            </div>
            <div className="flex items-center text-sm group-hover:scale-125 transition-transform">
              <span>🚶‍♀️</span>
            </div>
            <span className="text-[6px] font-extrabold bg-gradient-to-r from-pink-500 to-purple-600 text-white px-1.5 py-0.2 rounded-full shadow-xs uppercase tracking-tight">
              TAP WINDOW
            </span>
          </div>

          {/* Velvet Welcome Mat */}
          {state.decor?.decor_fixture_mat?.purchased && (
            <div className="absolute bottom-1.5 left-2.5 w-15 h-3 rounded-sm bg-red-700 border border-yellow-400 shadow-md flex items-center justify-center pointer-events-none z-12">
              <span className="text-[6px] font-black text-amber-200 tracking-wider">WELCOME</span>
            </div>
          )}

          {/* Entrance Bonsai Tree */}
          {state.decor?.decor_plant_ficus?.purchased && (
            <div className="absolute bottom-1.5 left-19 pointer-events-none z-12 flex flex-col items-center">
              <span className="text-sm animate-pulse">🎋</span>
            </div>
          )}

          {/* Shelves Placement */}
          {Object.entries(SHELF_COORDINATES).map(([secId, coord]) => {
            const isUnlocked = currentStage.unlockedSections.includes(secId);
            const sectionProducts = (Object.values(state.products) as Product[]).filter((p) => p.sectionId === secId);
            const hasUnlockedProduct = sectionProducts.some((p) => p.unlocked);

            return (
              <div
                key={secId}
                onClick={() => isUnlocked && handleTapShelf(secId)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-105 active:scale-95 z-10 ${
                  isUnlocked ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'
                }`}
                style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              >
                {/* 2D Isometric Shelf Unit */}
                <div className="relative flex flex-col items-center">
                  {/* Shelf Canopy / Sign */}
                  <div className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[9px] font-extrabold flex items-center gap-1 shadow-sm border border-slate-700 whitespace-nowrap">
                    <span>{coord.icon}</span>
                    <span>{coord.label}</span>
                  </div>

                  {/* Physical Display Rack */}
                  <div className="w-16 h-10 mt-0.5 rounded-lg bg-amber-700 border-2 border-amber-900 shadow-md flex flex-col justify-between p-1 relative overflow-hidden">
                    {/* Top Tier Products */}
                    <div className="flex justify-around items-center h-4 bg-amber-800/80 rounded px-0.5">
                      {isUnlocked ? (
                        <>
                          <span className="text-xs drop-shadow-xs">{coord.icon}</span>
                          <span className="text-xs drop-shadow-xs">{coord.icon}</span>
                          <span className="text-xs drop-shadow-xs">{coord.icon}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-white font-bold">LOCKED</span>
                      )}
                    </div>
                    {/* Bottom Tier Stock Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: isUnlocked && hasUnlockedProduct ? '90%' : '15%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Interactive Checkout Counter & Cashier Station */}
          <div
            onClick={handleTapRegister}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform active:scale-95 z-15"
            style={{ left: `${CHECKOUT_POS.x}%`, top: `${CHECKOUT_POS.y}%` }}
          >
            <div className="relative flex items-center justify-center flex-col">
              {/* Cashier Staff Avatar if hired, or "TAP TO RING" helper */}
              <div className="relative mb-0.5">
                {state.staff.cashier?.hired ? (
                  <div className="flex flex-col items-center">
                    <span className="text-lg animate-bounce">👩‍💼</span>
                    <span className="text-[8px] bg-blue-600 text-white font-bold px-1 rounded-sm shadow-xs">
                      Cashier Lvl {state.staff.cashier.level}
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-sm animate-pulse flex items-center gap-0.5">
                    <span>⚡ TAP ME</span>
                  </div>
                )}
              </div>

              {/* Physical Register Counter with Conveyor */}
              <div className="w-24 h-9 bg-slate-800 border-2 border-slate-900 rounded-lg shadow-lg flex items-center justify-between px-2 text-white relative">
                {/* Counter Succulents Decor */}
                {state.decor?.decor_plant_succulent?.purchased && (
                  <div className="absolute -top-3.5 right-2 pointer-events-none text-xs" title="Counter Succulents">
                    🪴
                  </div>
                )}
                <div className="flex flex-col text-[8px] leading-tight">
                  <span className="font-extrabold text-amber-400">REGISTER</span>
                  <span className="text-slate-400 text-[7px]">Lane #1</span>
                </div>
                {/* Cash Register Screen & Scanner */}
                <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700">
                  <span className="text-xs">📠</span>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold animate-pulse">$</span>
                </div>
              </div>
            </div>
          </div>

          {/* Twin Golden Palms flanking checkout */}
          {state.decor?.decor_plant_palms?.purchased && (
            <>
              <div
                className="absolute pointer-events-none z-15 transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: '33%', top: '84%' }}
              >
                <span className="text-2xl animate-pulse">🌴</span>
              </div>
              <div
                className="absolute pointer-events-none z-15 transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: '67%', top: '84%' }}
              >
                <span className="text-2xl animate-pulse">🌴</span>
              </div>
            </>
          )}

          {/* Staff Avatars Walking Inside Shop */}
          {/* 1. Restocker */}
          {state.staff.restocker?.hired && (
            <div
              className="absolute pointer-events-none transition-all duration-200 z-12"
              style={{ left: `${restockerPos.x}%`, top: `${restockerPos.y}%` }}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center text-sm">
                  <span>👨‍🔧</span>
                  <span className="text-xs -ml-1">📦</span>
                </div>
                <span className="text-[7px] bg-amber-600 text-white font-bold px-1 rounded">Restocker</span>
              </div>
            </div>
          )}

          {/* 2. Cleaner */}
          {state.staff.cleaner?.hired && (
            <div
              className="absolute pointer-events-none transition-all duration-200 z-12"
              style={{ left: `${cleanerPos.x}%`, top: `${cleanerPos.y}%` }}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center text-sm">
                  <span>🧹</span>
                  <span>👨‍💼</span>
                </div>
                <span className="text-[7px] bg-emerald-600 text-white font-bold px-1 rounded">Cleaner</span>
              </div>
            </div>
          )}

          {/* 3. Greeter near entrance */}
          {state.staff.greeter?.hired && (
            <div
              className="absolute pointer-events-none z-12"
              style={{ left: `${ENTRANCE_POS.x + 8}%`, top: `${ENTRANCE_POS.y - 4}%` }}
            >
              <div className="flex flex-col items-center animate-pulse">
                <span className="text-base">💁‍♀️</span>
                <span className="text-[7px] bg-pink-600 text-white font-bold px-1 rounded shadow-xs">
                  Hi, Welcome!
                </span>
              </div>
            </div>
          )}

          {/* Floor Spills (Interactive) */}
          {spills.map((spill) => (
            <div
              key={spill.id}
              onClick={(e) => handleTapSpill(spill, e)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 animate-pulse hover:scale-125 transition-transform"
              style={{ left: `${spill.x}%`, top: `${spill.y}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg drop-shadow-md">
                  {spill.type === 'juice' ? '🧃' : spill.type === 'banana' ? '🍌' : '💨'}
                </span>
                <span className="text-[7px] bg-red-600 text-white font-black px-1 rounded-full shadow-xs">
                  TAP CLEAN!
                </span>
              </div>
            </div>
          ))}

          {/* Animated Customers */}
          {customers.map((c) => {
            const isFacingRight = c.facing === 'right';
            const bobOffset = Math.sin(c.bobPhase) * 2;

            return (
              <div
                key={c.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 z-20 pointer-events-none"
                style={{
                  left: `${c.x}%`,
                  top: `${c.y}%`,
                  transform: `translate(-50%, -50%) translateY(${bobOffset}px)`,
                }}
              >
                <div className="relative flex flex-col items-center">
                  {/* Thought Bubble when browsing or picking */}
                  {c.state === 'browsing' && c.targetProduct && (
                    <div className="absolute -top-7 px-1.5 py-0.5 bg-white/95 rounded-full shadow-md border border-slate-300 text-[10px] flex items-center gap-0.5 animate-bounce">
                      <span>💭</span>
                      <span>{c.targetProduct.icon}</span>
                    </div>
                  )}

                  {/* Customer Paying Coin Sparkle */}
                  {c.state === 'checkout' && (
                    <div className="absolute -top-6 text-xs animate-ping">
                      ✨
                    </div>
                  )}

                  {/* Customer Leaving Heart */}
                  {c.state === 'leaving' && (
                    <div className="absolute -top-6 text-xs animate-bounce">
                      💖
                    </div>
                  )}

                  {/* Customer Happiness Boost Glow/Heart */}
                  {isHappinessActive && c.state !== 'leaving' && (
                    <div className="absolute -top-6 text-[11px] animate-bounce">
                      🥰
                    </div>
                  )}

                  {/* Character Avatar Rendering */}
                  <div
                    className={`relative flex flex-col items-center transition-transform ${
                      isFacingRight ? 'scale-x-100' : '-scale-x-100'
                    }`}
                  >
                    {/* Head & Hair */}
                    <div
                      className="w-4 h-4 rounded-full border border-slate-700 relative flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: c.skinColor }}
                    >
                      {/* Hair styling */}
                      <div
                        className="absolute -top-1 w-4 h-2.5 rounded-t-full"
                        style={{ backgroundColor: c.hairColor }}
                      />
                      {/* Eyes */}
                      <div className="flex gap-1 z-1">
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                        <div className="w-0.5 h-0.5 bg-slate-900 rounded-full" />
                      </div>
                    </div>

                    {/* Torso / Outfit */}
                    <div
                      className="w-4 h-4 rounded-b-md border border-slate-800 -mt-0.5 relative flex items-center justify-center"
                      style={{ backgroundColor: c.outfitColor }}
                    >
                      {/* Shopping Basket if has product */}
                      {c.hasProduct && (
                        <div className="absolute -right-1.5 text-[9px] drop-shadow-xs">
                          🧺
                        </div>
                      )}
                    </div>

                    {/* Legs / Walking */}
                    <div className="flex gap-1 -mt-0.5">
                      <div className="w-1 h-2 bg-slate-800 rounded-full" />
                      <div className="w-1 h-2 bg-slate-800 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Floating Coin Text Notifications */}
          {floatingTexts.map((ft) => (
            <div
              key={ft.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 font-black text-sm drop-shadow-md pointer-events-none z-30 animate-out fade-out slide-out-to-top duration-1000"
              style={{
                left: `${ft.x}%`,
                top: `${ft.y}%`,
                color: ft.color,
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {ft.text}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Shop Quick Boost Bar */}
      <div className="w-full px-3 py-1 flex items-center justify-between z-20">
        {/* Ad Boost Button */}
        <button
          onClick={onOpenAdModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs shadow-md border border-yellow-200 cartoon-btn"
        >
          <Zap className="w-3.5 h-3.5 fill-yellow-200" />
          <span>BOOSTS & ADS</span>
        </button>

        {/* Quick Advice / Customer Counter */}
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Tap counter & shelves to speed up!</span>
        </div>
      </div>
    </div>
  );
};
