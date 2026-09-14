import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameState, Product, ShopStageId, DecorItem } from './types/game';
import { DEFAULT_INITIAL_STATE, SHOP_STAGES } from './data/gameData';
import { loadGameState, saveGameState, clearGameSave, OfflineEarningsResult } from './services/storage';
import { soundService } from './services/sound';
import { TopBar } from './components/TopBar';
import { BottomNav, TabType } from './components/BottomNav';
import { ShopCanvas } from './components/ShopCanvas';
import { ProductsDrawer } from './components/drawers/ProductsDrawer';
import { UpgradesDrawer } from './components/drawers/UpgradesDrawer';
import { StaffDrawer } from './components/drawers/StaffDrawer';
import { MissionsDrawer } from './components/drawers/MissionsDrawer';
import { ExpansionDrawer } from './components/drawers/ExpansionDrawer';
import { DecorDrawer } from './components/drawers/DecorDrawer';
import { MainMenu } from './components/MainMenu';
import { OfflineEarningsModal } from './components/modals/OfflineEarningsModal';
import { DailyRewardModal } from './components/modals/DailyRewardModal';
import { RewardAdModal } from './components/modals/RewardAdModal';
import { TutorialModal } from './components/modals/TutorialModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { WindowShoppingModal } from './components/modals/WindowShoppingModal';

export default function App() {
  // Game State
  const [state, setState] = useState<GameState>(DEFAULT_INITIAL_STATE);
  const [viewMode, setViewMode] = useState<'menu' | 'game'>('game');
  const [activeTab, setActiveTab] = useState<TabType>('shop');

  // Modals state
  const [offlineData, setOfflineData] = useState<OfflineEarningsResult | null>(null);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWindowShoppingModal, setShowWindowShoppingModal] = useState(false);

  // Runtime metrics
  const [recentCoinsEarned, setRecentCoinsEarned] = useState<number[]>([]);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const { state: loadedState, offlineResult } = loadGameState();
    setState(loadedState);

    // If offline earnings occurred, open Welcome Back modal
    if (offlineResult && offlineResult.hasEarnings) {
      setOfflineData(offlineResult);
    }

    // Check first-time tutorial
    if (!loadedState.tutorialCompleted && loadedState.totalCustomersServed === 0) {
      setShowTutorialModal(true);
    }
  }, []);

  // 2. Periodic Auto-Save
  useEffect(() => {
    const saveTimer = window.setInterval(() => {
      saveGameState(state);
    }, 4000);
    return () => clearInterval(saveTimer);
  }, [state]);

  // 3. Coins/sec rate estimation
  const coinsPerSec = useMemo(() => {
    let base = 0;
    (Object.values(state.products) as Product[]).forEach((p) => {
      if (p.unlocked) {
        base += p.baseIncome * (1 + (p.level - 1) * 0.3);
      }
    });

    let staffBonus = 0.5;
    if (state.staff.cashier?.hired) staffBonus += 0.6 + state.staff.cashier.level * 0.2;
    if (state.staff.restocker?.hired) staffBonus += 0.4 + state.staff.restocker.level * 0.15;
    if (state.staff.cleaner?.hired) staffBonus += 0.3 + state.staff.cleaner.level * 0.1;
    if (state.staff.greeter?.hired) staffBonus += 0.5 + state.staff.greeter.level * 0.2;

    const priceMultiplier = 1 + (state.upgrades.productPrice - 1) * 0.15;
    const isFrenzy = state.activeFrenzyEndTime > Date.now();
    const isHappiness = (state.activeHappinessEndTime || 0) > Date.now();

    // Permanent decor passive multiplier
    const decorItems = (Object.values(state.decor || {}) as DecorItem[]);
    const decorMultiplier = 1 + decorItems.filter((d) => d.purchased).reduce((sum, d) => sum + d.multiplier, 0);

    const rate = Math.round(base * 0.15 * staffBonus * priceMultiplier * decorMultiplier * (isFrenzy ? 2 : 1) * (isHappiness ? 1.5 : 1));
    return Math.max(1, rate);
  }, [state.products, state.staff, state.upgrades.productPrice, state.decor, state.activeFrenzyEndTime, state.activeHappinessEndTime]);

  // Haptic feedback helper
  const triggerHaptic = (ms = 20) => {
    if (state.settings.hapticsEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Safe catch
      }
    }
  };

  // Check Missions & Achievements helper
  const checkMissionsAndAchievements = (
    newState: GameState,
    event: { type: string; amount?: number; product?: Product }
  ): GameState => {
    let updatedMissions = newState.missions.map((m) => {
      if (m.completed) return m;
      let newCurrent = m.current;

      if (m.type === 'serve_customers' && event.type === 'serve') {
        newCurrent += event.amount || 1;
      } else if (m.type === 'earn_coins' && event.type === 'coins') {
        newCurrent = newState.totalCoinsEarned;
      } else if (m.type === 'upgrade_shop' && event.type === 'upgrade') {
        newCurrent = newState.totalUpgradesPurchased;
      } else if (m.type === 'sell_drinks' && event.type === 'serve' && event.product?.sectionId === 'drinks') {
        newCurrent = (newState.stats.drinksSold || 0) + 1;
      } else if (m.type === 'hire_worker' && event.type === 'hire') {
        newCurrent = Object.values(newState.staff).filter((s) => s.hired).length;
      } else if (m.type === 'reach_level') {
        newCurrent = newState.shopLevel;
      } else if (m.type === 'buy_decor' && event.type === 'decor') {
        newCurrent = (Object.values(newState.decor || {}) as DecorItem[]).filter((d) => d.purchased).length;
      } else if (m.type === 'window_shop' && event.type === 'window_shop') {
        newCurrent = newState.stats?.windowShopsCompleted || 0;
      }

      const completed = newCurrent >= m.target;
      return { ...m, current: newCurrent, completed };
    });

    let updatedAchievements = newState.achievements.map((ach) => {
      if (ach.unlocked) return ach;
      let prog = ach.progress;
      let unlocked = false;

      if (ach.id === 'ach_first_customer' && newState.totalCustomersServed >= 1) {
        prog = 1;
        unlocked = true;
      } else if (ach.id === 'ach_first_upgrade' && newState.totalUpgradesPurchased >= 1) {
        prog = 1;
        unlocked = true;
      } else if (ach.id === 'ach_100_customers') {
        prog = newState.totalCustomersServed;
        if (prog >= 100) unlocked = true;
      } else if (ach.id === 'ach_10k_coins') {
        prog = newState.totalCoinsEarned;
        if (prog >= 10000) unlocked = true;
      } else if (ach.id === 'ach_first_supermarket' && newState.currentStageId >= ShopStageId.SUPERMARKET) {
        prog = 1;
        unlocked = true;
      } else if (ach.id === 'ach_first_million') {
        prog = newState.totalCoinsEarned;
        if (prog >= 1000000) unlocked = true;
      } else if (ach.id === 'ach_mall_owner' && newState.currentStageId >= ShopStageId.SHOPPING_MALL) {
        prog = 1;
        unlocked = true;
      } else if (ach.id === 'ach_window_stylist') {
        prog = newState.stats?.windowShopsCompleted || 0;
        if (prog >= ach.maxProgress) unlocked = true;
      }

      return { ...ach, progress: prog, unlocked };
    });

    return {
      ...newState,
      missions: updatedMissions,
      achievements: updatedAchievements,
    };
  };

  // Customer Checkout event
  const handleCustomerCheckout = (coinsEarned: number, product: Product) => {
    triggerHaptic(25);
    setState((prev) => {
      const decorItems = (Object.values(prev.decor || {}) as DecorItem[]);
      const decorMultiplier = 1 + decorItems.filter((d) => d.purchased).reduce((sum, d) => sum + d.multiplier, 0);
      const isHappinessActive = (prev.activeHappinessEndTime || 0) > Date.now();
      const happinessMultiplier = isHappinessActive ? 1.5 : 1;
      const effectiveCoinsEarned = Math.round(coinsEarned * decorMultiplier * happinessMultiplier);

      const newCoins = prev.coins + effectiveCoinsEarned;
      const newTotalCoins = prev.totalCoinsEarned + effectiveCoinsEarned;
      const newServed = prev.totalCustomersServed + 1;
      const isDrink = product.sectionId === 'drinks';

      let nextState: GameState = {
        ...prev,
        coins: newCoins,
        totalCoinsEarned: newTotalCoins,
        totalCustomersServed: newServed,
        stats: {
          ...prev.stats,
          drinksSold: isDrink ? prev.stats.drinksSold + 1 : prev.stats.drinksSold,
        },
      };

      nextState = checkMissionsAndAchievements(nextState, {
        type: 'serve',
        amount: 1,
        product,
      });
      nextState = checkMissionsAndAchievements(nextState, {
        type: 'coins',
        amount: effectiveCoinsEarned,
      });

      return nextState;
    });
  };

  // Window Shopping Mini-game Reward Handler
  const handleWindowShoppingReward = (bonusCoins: number, happinessDurationSeconds: number) => {
    triggerHaptic(40);
    setState((prev) => {
      const newCoins = prev.coins + bonusCoins;
      const newTotalCoins = prev.totalCoinsEarned + bonusCoins;
      const newWindowShops = (prev.stats?.windowShopsCompleted || 0) + 1;
      const now = Date.now();
      const remainingHappiness = Math.max(0, (prev.activeHappinessEndTime || 0) - now);
      const newHappinessEndTime = now + remainingHappiness + happinessDurationSeconds * 1000;

      let nextState: GameState = {
        ...prev,
        coins: newCoins,
        totalCoinsEarned: newTotalCoins,
        activeHappinessEndTime: newHappinessEndTime,
        stats: {
          ...prev.stats,
          windowShopsCompleted: newWindowShops,
        },
      };

      nextState = checkMissionsAndAchievements(nextState, {
        type: 'window_shop',
      });
      nextState = checkMissionsAndAchievements(nextState, {
        type: 'coins',
        amount: bonusCoins,
      });

      return nextState;
    });
  };

  // Floor Spill Cleaned event
  const handleCleanSpill = (bonusCoins: number) => {
    triggerHaptic(15);
    setState((prev) => {
      const nextState: GameState = {
        ...prev,
        coins: prev.coins + bonusCoins,
        totalCoinsEarned: prev.totalCoinsEarned + bonusCoins,
        stats: {
          ...prev.stats,
          spillsCleaned: prev.stats.spillsCleaned + 1,
        },
      };
      return checkMissionsAndAchievements(nextState, { type: 'coins', amount: bonusCoins });
    });
  };

  // Quick Restock shelf tap
  const handleQuickRestock = (_sectionId: string) => {
    triggerHaptic(10);
  };

  // Purchase store upgrade
  const handlePurchaseUpgrade = (key: keyof GameState['upgrades']) => {
    triggerHaptic(35);
    setState((prev) => {
      const currentLevel = prev.upgrades[key];
      // Cost formula
      const baseCosts: Record<keyof GameState['upgrades'], number> = {
        storeSize: 80,
        productStock: 60,
        customerCapacity: 100,
        checkoutSpeed: 75,
        staffSpeed: 120,
        productPrice: 150,
        customerWalkSpeed: 90,
      };
      const multipliers: Record<keyof GameState['upgrades'], number> = {
        storeSize: 1.8,
        productStock: 1.6,
        customerCapacity: 1.9,
        checkoutSpeed: 1.7,
        staffSpeed: 1.75,
        productPrice: 1.85,
        customerWalkSpeed: 1.65,
      };

      const cost = Math.round(baseCosts[key] * Math.pow(multipliers[key], currentLevel - 1));
      if (prev.coins < cost) return prev;

      let nextState: GameState = {
        ...prev,
        coins: prev.coins - cost,
        totalUpgradesPurchased: prev.totalUpgradesPurchased + 1,
        upgrades: {
          ...prev.upgrades,
          [key]: currentLevel + 1,
        },
      };

      nextState = checkMissionsAndAchievements(nextState, { type: 'upgrade', amount: 1 });
      return nextState;
    });
  };

  // Unlock product
  const handleUnlockProduct = (productId: string) => {
    triggerHaptic(30);
    setState((prev) => {
      const target = prev.products[productId];
      if (!target || prev.coins < target.unlockCost) return prev;

      return {
        ...prev,
        coins: prev.coins - target.unlockCost,
        products: {
          ...prev.products,
          [productId]: {
            ...target,
            unlocked: true,
          },
        },
      };
    });
  };

  // Upgrade product level
  const handleUpgradeProduct = (productId: string) => {
    triggerHaptic(20);
    setState((prev) => {
      const target = prev.products[productId];
      if (!target) return prev;
      const upgradeCost = Math.round(target.basePrice * Math.pow(1.6, target.level));
      if (prev.coins < upgradeCost) return prev;

      return {
        ...prev,
        coins: prev.coins - upgradeCost,
        products: {
          ...prev.products,
          [productId]: {
            ...target,
            level: target.level + 1,
          },
        },
      };
    });
  };

  // Hire staff
  const handleHireStaff = (staffId: string) => {
    triggerHaptic(40);
    setState((prev) => {
      const worker = prev.staff[staffId];
      if (!worker || prev.coins < worker.hireCost) return prev;

      let nextState: GameState = {
        ...prev,
        coins: prev.coins - worker.hireCost,
        staff: {
          ...prev.staff,
          [staffId]: {
            ...worker,
            hired: true,
          },
        },
      };

      nextState = checkMissionsAndAchievements(nextState, { type: 'hire' });
      return nextState;
    });
  };

  // Upgrade staff level
  const handleUpgradeStaff = (staffId: string) => {
    triggerHaptic(25);
    setState((prev) => {
      const worker = prev.staff[staffId];
      if (!worker || worker.level >= worker.maxLevel) return prev;
      const upgradeCost = Math.round(worker.upgradeCost * Math.pow(1.6, worker.level - 1));
      if (prev.coins < upgradeCost) return prev;

      return {
        ...prev,
        coins: prev.coins - upgradeCost,
        staff: {
          ...prev.staff,
          [staffId]: {
            ...worker,
            level: worker.level + 1,
          },
        },
      };
    });
  };

  // Claim Mission
  const handleClaimMission = (missionId: string) => {
    triggerHaptic(30);
    setState((prev) => {
      const target = prev.missions.find((m) => m.id === missionId);
      if (!target || !target.completed || target.claimed) return prev;

      return {
        ...prev,
        coins: prev.coins + target.rewardCoins,
        totalCoinsEarned: prev.totalCoinsEarned + target.rewardCoins,
        missions: prev.missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
      };
    });
  };

  // Claim Achievement
  const handleClaimAchievement = (achId: string) => {
    triggerHaptic(30);
    setState((prev) => {
      const target = prev.achievements.find((a) => a.id === achId);
      if (!target || !target.unlocked || target.rewardCoins === 0) return prev;

      const reward = target.rewardCoins;
      return {
        ...prev,
        coins: prev.coins + reward,
        totalCoinsEarned: prev.totalCoinsEarned + reward,
        achievements: prev.achievements.map((a) =>
          a.id === achId ? { ...a, rewardCoins: 0 } : a
        ),
      };
    });
  };

  // Buy Decor Item
  const handleBuyDecor = (decorId: string) => {
    triggerHaptic(35);
    setState((prev) => {
      const decorItem = prev.decor[decorId];
      if (!decorItem || decorItem.purchased || prev.coins < decorItem.cost) return prev;

      const isFloor = decorItem.category === 'flooring';
      let nextState: GameState = {
        ...prev,
        coins: prev.coins - decorItem.cost,
        equippedFloorId: isFloor ? decorId : prev.equippedFloorId,
        decor: {
          ...prev.decor,
          [decorId]: {
            ...decorItem,
            purchased: true,
            equipped: isFloor ? true : decorItem.equipped,
          },
        },
      };

      nextState = checkMissionsAndAchievements(nextState, { type: 'decor' });
      return nextState;
    });
  };

  // Equip Floor Tile
  const handleEquipFloor = (floorId: string) => {
    triggerHaptic(20);
    setState((prev) => {
      const floorItem = prev.decor[floorId];
      if (!floorItem || !floorItem.purchased) return prev;

      return {
        ...prev,
        equippedFloorId: floorId,
      };
    });
  };

  // Expand to next stage
  const handleExpandToNextStage = () => {
    triggerHaptic(60);
    setState((prev) => {
      const nextStageId = (prev.currentStageId + 1) as ShopStageId;
      const nextStage = SHOP_STAGES[nextStageId];
      if (!nextStage || prev.coins < nextStage.requiredCoins) return prev;

      let nextState: GameState = {
        ...prev,
        coins: prev.coins - nextStage.requiredCoins,
        currentStageId: nextStageId,
        shopLevel: prev.shopLevel + 1,
      };

      nextState = checkMissionsAndAchievements(nextState, { type: 'expand' });
      return nextState;
    });
  };

  // Shop Level Up
  const handleLevelUpShop = () => {
    triggerHaptic(40);
    setState((prev) => {
      const cost = Math.round(50 * Math.pow(1.5, prev.shopLevel - 1));
      if (prev.coins < cost) return prev;

      let nextState: GameState = {
        ...prev,
        coins: prev.coins - cost,
        shopLevel: prev.shopLevel + 1,
      };
      nextState = checkMissionsAndAchievements(nextState, { type: 'level' });
      return nextState;
    });
  };

  // Daily reward claim
  const handleClaimDailyDay = (day: number) => {
    triggerHaptic(40);
    const todayStr = new Date().toISOString().slice(0, 10);
    setState((prev) => {
      const reward = prev.dailyLogin.rewards.find((r) => r.day === day);
      if (!reward) return prev;

      const updatedRewards = prev.dailyLogin.rewards.map((r) =>
        r.day === day ? { ...r, claimed: true } : r
      );

      return {
        ...prev,
        coins: prev.coins + reward.coins,
        totalCoinsEarned: prev.totalCoinsEarned + reward.coins,
        dailyLogin: {
          ...prev.dailyLogin,
          lastClaimDate: todayStr,
          currentDay: Math.min(7, prev.dailyLogin.currentDay + 1),
          rewards: updatedRewards,
        },
      };
    });
  };

  // Rewarded Ad boosts
  const handleTriggerFrenzy = () => {
    setState((prev) => ({
      ...prev,
      activeFrenzyEndTime: Date.now() + 60000, // 60s frenzy
      stats: {
        ...prev.stats,
        adsWatched: prev.stats.adsWatched + 1,
      },
    }));
  };

  const handleTriggerRush = () => {
    setState((prev) => ({
      ...prev,
      activeRushEndTime: Date.now() + 30000, // 30s rush
      stats: {
        ...prev.stats,
        adsWatched: prev.stats.adsWatched + 1,
      },
    }));
  };

  const handleFreeUpgradeBoost = () => {
    setState((prev) => ({
      ...prev,
      coins: prev.coins + 350,
      totalCoinsEarned: prev.totalCoinsEarned + 350,
      stats: {
        ...prev.stats,
        adsWatched: prev.stats.adsWatched + 1,
      },
    }));
  };

  // Sound toggle
  const handleToggleSound = () => {
    const next = !state.settings.sfxEnabled;
    soundService.setSfxVolume(next);
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        sfxEnabled: next,
      },
    }));
  };

  // Reset save
  const handleResetGame = () => {
    clearGameSave();
    setState(DEFAULT_INITIAL_STATE);
  };

  // Count badges
  const unclaimedMissionsCount = state.missions.filter((m) => m.completed && !m.claimed).length;
  const canAffordDecor = (Object.values(state.decor || {}) as DecorItem[]).some(
    (d) => !d.purchased && state.coins >= d.cost
  );
  const currentStage = SHOP_STAGES[state.currentStageId];
  const nextStage = SHOP_STAGES[(state.currentStageId + 1) as ShopStageId];
  const canExpandShop =
    Boolean(nextStage) &&
    state.coins >= nextStage.requiredCoins &&
    state.totalCustomersServed >= nextStage.requiredServed &&
    state.shopLevel >= nextStage.minShopLevel;

  const todayStr = new Date().toISOString().slice(0, 10);
  const hasDailyReward = state.dailyLogin.lastClaimDate !== todayStr;

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center font-sans">
      {/* Mobile Portrait Frame Container */}
      <div className="relative w-full h-full max-w-md sm:h-[95vh] sm:rounded-3xl sm:border-4 sm:border-slate-800 shadow-2xl flex flex-col bg-slate-900 overflow-hidden">
        {/* Main Menu View or Active Game View */}
        {viewMode === 'menu' ? (
          <MainMenu
            state={state}
            onPlayGame={() => setViewMode('game')}
            onOpenSettings={() => setShowSettingsModal(true)}
            onToggleSound={handleToggleSound}
          />
        ) : (
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
            {/* Top Bar with Coins Balance & Status */}
            <TopBar
              state={state}
              coinsPerSec={coinsPerSec}
              customerCount={0}
              maxCustomers={currentStage.baseCustomerCap + (state.upgrades.customerCapacity - 1) * 2}
              hasDailyReward={hasDailyReward}
              onOpenDaily={() => setShowDailyModal(true)}
              onOpenSettings={() => setShowSettingsModal(true)}
              onOpenExpansion={() => setActiveTab('expansion')}
              onToggleSound={handleToggleSound}
            />

            {/* Main Interactive Screen / Drawers based on active tab */}
            <main className="relative flex-1 w-full overflow-hidden flex flex-col">
              {activeTab === 'shop' && (
                <ShopCanvas
                  state={state}
                  onCustomerCheckout={handleCustomerCheckout}
                  onCleanSpill={handleCleanSpill}
                  onOpenAdModal={() => setShowAdModal(true)}
                  onQuickRestock={handleQuickRestock}
                  onTriggerCustomerRush={() => handleTriggerRush()}
                  onOpenWindowShopping={() => setShowWindowShoppingModal(true)}
                />
              )}

              {activeTab === 'products' && (
                <ProductsDrawer
                  state={state}
                  onUnlockProduct={handleUnlockProduct}
                  onUpgradeProduct={handleUpgradeProduct}
                />
              )}

              {activeTab === 'upgrade' && (
                <UpgradesDrawer
                  state={state}
                  onPurchaseUpgrade={handlePurchaseUpgrade}
                />
              )}

              {activeTab === 'staff' && (
                <StaffDrawer
                  state={state}
                  onHireStaff={handleHireStaff}
                  onUpgradeStaff={handleUpgradeStaff}
                />
              )}

              {activeTab === 'missions' && (
                <MissionsDrawer
                  state={state}
                  onClaimMission={handleClaimMission}
                  onClaimAchievement={handleClaimAchievement}
                />
              )}

              {activeTab === 'decor' && (
                <DecorDrawer
                  state={state}
                  onBuyDecor={handleBuyDecor}
                  onEquipFloor={handleEquipFloor}
                />
              )}

              {activeTab === 'expansion' && (
                <ExpansionDrawer
                  state={state}
                  onExpandToNextStage={handleExpandToNextStage}
                  onLevelUpShop={handleLevelUpShop}
                />
              )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav
              activeTab={activeTab}
              onSelectTab={(tab) => {
                soundService.playClick();
                setActiveTab(tab);
              }}
              unclaimedMissionsCount={unclaimedMissionsCount}
              availableUpgradesCount={0}
              canExpandShop={canExpandShop}
              canAffordDecor={canAffordDecor}
            />
          </div>
        )}

        {/* Welcome Back Offline Earnings Modal */}
        {offlineData && (
          <OfflineEarningsModal
            coinsEarned={offlineData.coinsEarned}
            formattedTime={offlineData.formattedTime}
            onCollectNormal={() => {
              setState((prev) => ({
                ...prev,
                coins: prev.coins + offlineData.coinsEarned,
                totalCoinsEarned: prev.totalCoinsEarned + offlineData.coinsEarned,
              }));
              setOfflineData(null);
            }}
            onWatchAdDouble={() => {
              const doubleAmount = offlineData.coinsEarned * 2;
              setState((prev) => ({
                ...prev,
                coins: prev.coins + doubleAmount,
                totalCoinsEarned: prev.totalCoinsEarned + doubleAmount,
                stats: {
                  ...prev.stats,
                  adsWatched: prev.stats.adsWatched + 1,
                },
              }));
              setOfflineData(null);
            }}
          />
        )}

        {/* 7-Day Login Rewards Modal */}
        {showDailyModal && (
          <DailyRewardModal
            state={state}
            onClaimDay={handleClaimDailyDay}
            onClose={() => setShowDailyModal(false)}
          />
        )}

        {/* Rewarded Ads Modal */}
        {showAdModal && (
          <RewardAdModal
            onTriggerFrenzy={handleTriggerFrenzy}
            onTriggerRush={handleTriggerRush}
            onFreeUpgradeBoost={handleFreeUpgradeBoost}
            onClose={() => setShowAdModal(false)}
          />
        )}

        {/* Tutorial Modal */}
        {showTutorialModal && (
          <TutorialModal
            currentStep={state.tutorialStep}
            onNextStep={() =>
              setState((prev) => ({
                ...prev,
                tutorialStep: Math.min(5, prev.tutorialStep + 1),
              }))
            }
            onClose={() => {
              setState((prev) => ({
                ...prev,
                tutorialCompleted: true,
              }));
              setShowTutorialModal(false);
            }}
          />
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <SettingsModal
            settings={state.settings}
            onUpdateSettings={(newSettings) =>
              setState((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  ...newSettings,
                },
              }))
            }
            onResetGame={handleResetGame}
            onReplayTutorial={() => {
              setState((prev) => ({ ...prev, tutorialStep: 1 }));
              setShowTutorialModal(true);
            }}
            onClose={() => setShowSettingsModal(false)}
          />
        )}

        {/* Window Shopping Mini-Game Modal */}
        {showWindowShoppingModal && (
          <WindowShoppingModal
            state={state}
            onClose={() => setShowWindowShoppingModal(false)}
            onReward={handleWindowShoppingReward}
          />
        )}
      </div>
    </div>
  );
}
