import { GameState, ShopStageId, Product, DecorItem } from '../types/game';
import { DEFAULT_INITIAL_STATE, INITIAL_PRODUCTS, INITIAL_STAFF, INITIAL_DECOR } from '../data/gameData';

const STORAGE_KEY = 'small_shop_tycoon_save_v1';

export interface OfflineEarningsResult {
  hasEarnings: boolean;
  coinsEarned: number;
  secondsOffline: number;
  formattedTime: string;
}

export function saveGameState(state: GameState): void {
  try {
    const dataToSave = {
      ...state,
      lastSavedTimestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.error('Failed to save game state to localStorage', err);
  }
}

export function loadGameState(): { state: GameState; offlineResult: OfflineEarningsResult | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: DEFAULT_INITIAL_STATE, offlineResult: null };
    }

    const parsed = JSON.parse(raw);
    const now = Date.now();
    const lastSaved = typeof parsed.lastSavedTimestamp === 'number' ? parsed.lastSavedTimestamp : now;
    const elapsedSeconds = Math.floor((now - lastSaved) / 1000);

    // Merge with default initial state to guarantee newly added fields exist
    const mergedState: GameState = {
      ...DEFAULT_INITIAL_STATE,
      ...parsed,
      products: {
        ...INITIAL_PRODUCTS,
        ...(parsed.products || {}),
      },
      decor: {
        ...INITIAL_DECOR,
        ...(parsed.decor || {}),
      },
      staff: {
        ...INITIAL_STAFF,
        ...(parsed.staff || {}),
      },
      upgrades: {
        ...DEFAULT_INITIAL_STATE.upgrades,
        ...(parsed.upgrades || {}),
      },
      settings: {
        ...DEFAULT_INITIAL_STATE.settings,
        ...(parsed.settings || {}),
      },
      stats: {
        ...DEFAULT_INITIAL_STATE.stats,
        ...(parsed.stats || {}),
      },
      lastSavedTimestamp: now,
    };

    let offlineResult: OfflineEarningsResult | null = null;

    // Minimum 45 seconds away to trigger Welcome Back offline earnings (capped at 10 hours)
    if (elapsedSeconds >= 45) {
      const cappedSeconds = Math.min(elapsedSeconds, 10 * 3600);

      // Passive rate calculation based on unlocked products and staff
      let baseItemValue = 0;
      (Object.values(mergedState.products) as Product[]).forEach((p) => {
        if (p.unlocked) {
          baseItemValue += p.baseIncome * (1 + (p.level - 1) * 0.25);
        }
      });

      // Staff multipliers
      let staffMultiplier = 0.5; // Base passive customer stream
      if (mergedState.staff.cashier?.hired) staffMultiplier += 0.5 + mergedState.staff.cashier.level * 0.15;
      if (mergedState.staff.restocker?.hired) staffMultiplier += 0.4 + mergedState.staff.restocker.level * 0.12;
      if (mergedState.staff.cleaner?.hired) staffMultiplier += 0.3 + mergedState.staff.cleaner.level * 0.1;
      if (mergedState.staff.greeter?.hired) staffMultiplier += 0.4 + mergedState.staff.greeter.level * 0.15;

      const shopStageBonus = (mergedState.currentStageId as ShopStageId) * 0.3;
      const priceUpgradeBonus = 1 + (mergedState.upgrades.productPrice - 1) * 0.2;

      // Decor permanent passive multiplier
      const decorItems = (Object.values(mergedState.decor || {}) as DecorItem[]);
      const decorMultiplier = 1 + decorItems.filter((d) => d.purchased).reduce((sum, d) => sum + d.multiplier, 0);

      // Rate per second
      const coinsPerSecond = Math.max(0.5, (baseItemValue * 0.12 * staffMultiplier * (1 + shopStageBonus) * priceUpgradeBonus * decorMultiplier));
      const totalOfflineCoins = Math.floor(coinsPerSecond * cappedSeconds);

      if (totalOfflineCoins > 5) {
        const hours = Math.floor(cappedSeconds / 3600);
        const mins = Math.floor((cappedSeconds % 3600) / 60);
        const formattedTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        offlineResult = {
          hasEarnings: true,
          coinsEarned: totalOfflineCoins,
          secondsOffline: cappedSeconds,
          formattedTime,
        };
      }
    }

    return { state: mergedState, offlineResult };
  } catch (err) {
    console.error('Error loading game state:', err);
    return { state: DEFAULT_INITIAL_STATE, offlineResult: null };
  }
}

export function clearGameSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing save', err);
  }
}
