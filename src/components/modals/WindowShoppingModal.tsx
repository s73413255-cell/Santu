import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../../types/game';
import { soundService } from '../../services/sound';
import { formatCoins } from '../../utils/formatters';
import { X, Sparkles, Heart, Trophy, Timer, Zap, Gift, Eye } from 'lucide-react';

interface WindowShoppingModalProps {
  state: GameState;
  onClose: () => void;
  onReward: (bonusCoins: number, happinessDurationSeconds: number) => void;
}

interface SparkleItem {
  id: number;
  icon: string;
  label: string;
  points: number;
  x: number;
  y: number;
  scale: number;
  isSpecial?: boolean;
}

const DISPLAY_POOL = [
  { icon: '💎', label: 'Diamond Ring', points: 30 },
  { icon: '👑', label: 'Imperial Crown', points: 50, special: true },
  { icon: '🍰', label: 'Velvet Gateau', points: 20 },
  { icon: '🧸', label: 'Boutique Teddy', points: 25 },
  { icon: '🕶️', label: 'Gold Aviators', points: 20 },
  { icon: '⭐', label: 'Lucky Star', points: 60, special: true },
  { icon: '🎮', label: 'Neon Console', points: 35 },
  { icon: '🍓', label: 'Ruby Strawberry', points: 20 },
  { icon: '🎁', label: 'Surprise Hamper', points: 40, special: true },
];

const PEDESTAL_REWARDS = [
  { icon: '👑', name: 'Imperial Crown', coinsMultiplier: 1.5, text: 'Legendary Find!' },
  { icon: '💎', name: 'Royal Sapphire', coinsMultiplier: 1.3, text: 'Rare Jewel!' },
  { icon: '🏆', name: 'Golden Trophy', coinsMultiplier: 1.6, text: 'Jackpot Masterpiece!' },
  { icon: '🎁', name: 'Luxury Hamper', coinsMultiplier: 1.2, text: 'Boutique Treat!' },
  { icon: '⭐', name: 'Starlight Gem', coinsMultiplier: 1.4, text: 'Dazzling Sparkle!' },
];

export const WindowShoppingModal: React.FC<WindowShoppingModalProps> = ({
  state,
  onClose,
  onReward,
}) => {
  const [activeGame, setActiveGame] = useState<'catch' | 'pedestals'>('catch');

  // --- Catch Game State ---
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended'>('intro');
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [activeItems, setActiveItems] = useState<SparkleItem[]>([]);
  const [tapEffects, setTapEffects] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const nextItemId = useRef(1);

  // --- Pedestal Game State ---
  const [pedestals, setPedestals] = useState<
    { revealed: boolean; reward: (typeof PEDESTAL_REWARDS)[0] }[]
  >([]);
  const [pedestalsRevealedCount, setPedestalsRevealedCount] = useState(0);
  const [pedestalGameEnded, setPedestalGameEnded] = useState(false);

  // Initialize pedestals
  useEffect(() => {
    const shuffled = [...PEDESTAL_REWARDS].sort(() => Math.random() - 0.5);
    setPedestals([
      { revealed: false, reward: shuffled[0] },
      { revealed: false, reward: shuffled[1] },
      { revealed: false, reward: shuffled[2] },
    ]);
  }, []);

  // --- Catch Game Timer Loop ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Spawn items periodically
    const spawnTimer = window.setInterval(() => {
      setActiveItems((prev) => {
        if (prev.length >= 5) return prev;
        const template = DISPLAY_POOL[Math.floor(Math.random() * DISPLAY_POOL.length)];
        const newItem: SparkleItem = {
          id: nextItemId.current++,
          icon: template.icon,
          label: template.label,
          points: template.points,
          x: 10 + Math.random() * 80,
          y: 12 + Math.random() * 70,
          scale: template.special ? 1.25 : 1,
          isSpecial: template.special,
        };
        return [...prev, newItem];
      });
    }, 600);

    // Countdown clock
    const clockTimer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('ended');
          soundService.playFanfare();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawnTimer);
      clearInterval(clockTimer);
    };
  }, [gameState]);

  // Clean tap effects
  useEffect(() => {
    const cleanup = window.setInterval(() => {
      setTapEffects((prev) => prev.slice(-4));
    }, 800);
    return () => clearInterval(cleanup);
  }, []);

  // Start Catch Game
  const startCatchGame = () => {
    soundService.playClick();
    setScore(0);
    setCombo(0);
    setTimeLeft(10);
    setActiveItems([]);
    setTapEffects([]);
    setGameState('playing');
  };

  // Handle item tap
  const handleItemTap = (item: SparkleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playSparkle();

    const addedPoints = item.points + combo * 5;
    setScore((s) => s + addedPoints);
    setCombo((c) => c + 1);

    // Add floating feedback
    const effectId = Date.now() + Math.random();
    setTapEffects((prev) => [
      ...prev,
      { id: effectId, text: `+${addedPoints} pts!`, x: item.x, y: item.y },
    ]);

    // Remove tapped item
    setActiveItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  // Claim Catch Game Rewards
  const claimCatchReward = () => {
    soundService.playCashRegister();
    soundService.playCoin();
    // Calculate coins: Base amount proportional to score and shop level
    const baseReward = Math.max(120, Math.round((score * 2.5) * (1 + (state.shopLevel - 1) * 0.25)));
    const happinessDuration = 45; // 45 seconds happiness boost
    onReward(baseReward, happinessDuration);
    onClose();
  };

  // Reveal Pedestal
  const handleRevealPedestal = (index: number) => {
    if (pedestals[index].revealed || pedestalGameEnded) return;

    soundService.playSparkle();
    const updated = [...pedestals];
    updated[index].revealed = true;
    setPedestals(updated);

    const newCount = pedestalsRevealedCount + 1;
    setPedestalsRevealedCount(newCount);

    if (newCount >= 3) {
      setPedestalGameEnded(true);
      soundService.playFanfare();
    }
  };

  // Claim Pedestal Reward
  const claimPedestalReward = () => {
    soundService.playCashRegister();
    soundService.playCoin();
    // Sum multipliers
    const totalMult = pedestals.reduce((sum, p) => sum + (p.revealed ? p.reward.coinsMultiplier : 1), 0);
    const rewardCoins = Math.round(150 * totalMult * (1 + (state.shopLevel - 1) * 0.3));
    const happinessDuration = 45;
    onReward(rewardCoins, happinessDuration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-pink-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Marquee */}
        <div className="relative bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 p-3.5 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
              🪟
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-wide leading-none">
                  Window Shopping
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-yellow-300 text-slate-950 shadow-xs">
                  Mini-Game
                </span>
              </div>
              <p className="text-[11px] text-pink-100 font-medium leading-none mt-1">
                Showcase deluxe items to boost customer excitement & tips!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundService.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 text-white/80 hover:text-white flex items-center justify-center transition-colors cartoon-btn"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950/60 p-1.5 border-b border-slate-800 gap-1.5">
          <button
            onClick={() => {
              soundService.playClick();
              setActiveGame('catch');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cartoon-btn flex items-center justify-center gap-1.5 ${
              activeGame === 'catch'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Showcase Sparkles</span>
          </button>
          <button
            onClick={() => {
              soundService.playClick();
              setActiveGame('pedestals');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition-all cartoon-btn flex items-center justify-center gap-1.5 ${
              activeGame === 'pedestals'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Velvet Pedestals</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-3.5 overflow-y-auto flex-1 flex flex-col">
          {/* ================= MODE 1: CATCH THE SPARKLES ================= */}
          {activeGame === 'catch' && (
            <div className="flex flex-col flex-1">
              {gameState === 'intro' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg border-2 border-pink-300/40 animate-bounce">
                      ✨
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-2xl">🛍️</span>
                  </div>

                  <h3 className="text-lg font-black text-white">
                    Showcase Sparkle Rush!
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                    Tap sparkling luxury goods in the shop window before they vanish!
                    Build combos to supercharge your rewards.
                  </p>

                  {/* Rewards Preview Badge */}
                  <div className="mt-3 w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2.5 flex items-center justify-around">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-amber-300 font-bold uppercase flex items-center gap-1">
                        🪙 Bonus Coins
                      </span>
                      <span className="text-sm font-black text-white">Up to 1,500+</span>
                    </div>
                    <div className="w-px h-8 bg-slate-700" />
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-pink-300 font-bold uppercase flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-pink-400 text-pink-400" /> Happiness
                      </span>
                      <span className="text-sm font-black text-pink-200">+45s Boost</span>
                    </div>
                  </div>

                  <button
                    onClick={startCatchGame}
                    className="mt-4 w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500 text-white shadow-xl hover:brightness-110 active:scale-95 cartoon-btn flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>START 10-SECOND RUSH!</span>
                  </button>
                </div>
              )}

              {gameState === 'playing' && (
                <div className="flex-1 flex flex-col">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700">
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono font-black text-sm text-amber-300">
                        {timeLeft}s
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700">
                      <span className="text-xs text-slate-400 font-bold">SCORE:</span>
                      <span className="font-mono font-black text-sm text-yellow-300">
                        {score}
                      </span>
                    </div>
                    {combo > 1 && (
                      <div className="px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-300 text-xs font-black border border-pink-500/40 animate-pulse">
                        {combo}x COMBO!
                      </div>
                    )}
                  </div>

                  {/* Window Display Glass Container */}
                  <div className="relative flex-1 min-h-[260px] w-full rounded-2xl border-4 border-slate-750 bg-gradient-to-b from-sky-950/60 via-slate-900 to-indigo-950 overflow-hidden shadow-inner cursor-crosshair">
                    {/* Storefront Glass Glare / Spotlight Lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-100 via-transparent to-transparent" />
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Window Frame Label */}
                    <div className="absolute top-1.5 left-2 pointer-events-none flex items-center gap-1 opacity-60">
                      <Eye className="w-3 h-3 text-cyan-300" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">
                        Boutique Showcase Window
                      </span>
                    </div>

                    {/* Interactive Sparkle Items */}
                    {activeItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={(e) => handleItemTap(item, e)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl flex flex-col items-center justify-center transition-transform hover:scale-125 active:scale-90 cartoon-btn ${
                          item.isSpecial
                            ? 'bg-gradient-to-b from-yellow-300/30 to-amber-500/40 border-2 border-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse'
                            : 'bg-white/15 border border-white/30 backdrop-blur-xs shadow-md'
                        }`}
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          transform: `translate(-50%, -50%) scale(${item.scale})`,
                        }}
                      >
                        <span className="text-3xl drop-shadow-md">{item.icon}</span>
                        <span className="text-[9px] font-black text-white whitespace-nowrap drop-shadow mt-0.5">
                          +{item.points}
                        </span>
                      </button>
                    ))}

                    {/* Floating Tap Point Effects */}
                    {tapEffects.map((eff) => (
                      <div
                        key={eff.id}
                        className="absolute pointer-events-none text-xs font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce transform -translate-x-1/2 -translate-y-1/2 z-30"
                        style={{ left: `${eff.x}%`, top: `${eff.y}%` }}
                      >
                        {eff.text}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Quickly tap any luxury product appearing inside the display!
                  </p>
                </div>
              )}

              {gameState === 'ended' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-xl border-2 border-white/40 mb-2">
                    🏆
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Showcase Complete!
                  </h3>
                  <div className="flex items-center gap-1 text-amber-400 my-1">
                    {'⭐️⭐️⭐️'}
                  </div>
                  <p className="text-xs text-slate-300">
                    Your captivating window display drew enormous crowds!
                  </p>

                  <div className="my-3 w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Total Score:</span>
                      <span className="text-sm font-black text-yellow-300 font-mono">
                        {score} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Bonus Reward:</span>
                      <span className="text-base font-black text-amber-400 font-mono">
                        +{formatCoins(Math.max(120, Math.round((score * 2.5) * (1 + (state.shopLevel - 1) * 0.25))))} 🪙
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-700/80 pt-2">
                      <span className="text-xs text-pink-300 flex items-center gap-1 font-bold">
                        <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" /> Customer Happiness:
                      </span>
                      <span className="text-xs font-black text-pink-200">
                        +45s Euphoria Surge (+50% Tips!)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={startCatchGame}
                      className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cartoon-btn"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={claimCatchReward}
                      className="flex-1 py-2.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:brightness-110 active:scale-95 cartoon-btn flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-4 h-4" />
                      <span>CLAIM REWARDS</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= MODE 2: VELVET PEDESTAL REVEAL ================= */}
          {activeGame === 'pedestals' && (
            <div className="flex-1 flex flex-col items-center justify-between">
              <div className="text-center mb-2">
                <h3 className="text-base font-black text-white flex items-center justify-center gap-1.5">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span>Velvet Showcase Pedestals</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tap all 3 pedestals to reveal prestigious luxury display items!
                </p>
              </div>

              {/* 3 Illuminated Pedestals */}
              <div className="grid grid-cols-3 gap-2.5 w-full my-2">
                {pedestals.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleRevealPedestal(idx)}
                    className={`relative rounded-2xl border-2 p-3 flex flex-col items-center justify-center transition-all cursor-pointer cartoon-btn min-h-[140px] ${
                      item.revealed
                        ? 'bg-gradient-to-b from-purple-900/50 to-indigo-950/80 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                        : 'bg-slate-800/80 border-slate-700 hover:border-pink-400 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {/* Cloche / Display Dome */}
                    {item.revealed ? (
                      <div className="flex flex-col items-center text-center animate-fade-in">
                        <span className="text-4xl drop-shadow-lg mb-1 animate-bounce">
                          {item.reward.icon}
                        </span>
                        <span className="text-[10px] font-extrabold text-white leading-tight">
                          {item.reward.name}
                        </span>
                        <span className="text-[9px] font-bold text-amber-300 mt-1 bg-amber-500/20 px-1.5 py-0.5 rounded-md">
                          {item.reward.coinsMultiplier}x Bonus
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-700/80 flex items-center justify-center text-2xl border border-slate-600 shadow-inner mb-1 animate-pulse">
                          🎁
                        </div>
                        <span className="text-[10px] font-black text-pink-300 uppercase tracking-wider">
                          TAP PEEK
                        </span>
                        <span className="text-[8px] text-slate-400 mt-0.5">Pedestal #{idx + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pedestal Progress / Rewards */}
              <div className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-3 my-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Items Revealed:</span>
                  <span className="font-extrabold text-white">{pedestalsRevealedCount} / 3</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-pink-300 flex items-center gap-1 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" /> Customer Happiness:
                  </span>
                  <span className="font-extrabold text-pink-200">+45s Euphoria Boost</span>
                </div>
              </div>

              {pedestalGameEnded ? (
                <button
                  onClick={claimPedestalReward}
                  className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl hover:brightness-110 active:scale-95 cartoon-btn flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  <span>CLAIM SHOWCASE BOUNTY</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-400 text-center py-1">
                  Tap all remaining pedestals to claim your showcase rewards!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
