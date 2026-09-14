export enum ShopStageId {
  SMALL_STREET_SHOP = 1,
  BETTER_GROCERY_SHOP = 2,
  MODERN_GROCERY_STORE = 3,
  SUPERMARKET = 4,
  MEGA_SUPERMARKET = 5,
  SHOPPING_MALL = 6,
}

export interface ShopStageInfo {
  id: ShopStageId;
  name: string;
  subtitle: string;
  requiredCoins: number;
  requiredServed: number;
  minShopLevel: number;
  baseCustomerCap: number;
  unlockedSections: string[];
  themeColor: string;
  wallColor: string;
  floorPattern: string;
  signText: string;
  icon: string;
}

export type SectionCategory =
  | 'vegetables'
  | 'fruits'
  | 'drinks'
  | 'snacks'
  | 'dairy'
  | 'bakery'
  | 'household'
  | 'electronics';

export interface Product {
  id: string;
  name: string;
  sectionId: SectionCategory;
  sectionName: string;
  basePrice: number;
  baseIncome: number;
  unlockShopLevel: number;
  unlockCost: number;
  unlocked: boolean;
  level: number;
  icon: string;
  color: string;
}

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  icon: string;
  currentValueDisplay: string;
  nextValueDisplay: string;
}

export type StaffRole = 'cashier' | 'restocker' | 'cleaner' | 'greeter';

export interface StaffMember {
  id: string;
  role: StaffRole;
  name: string;
  title: string;
  description: string;
  hired: boolean;
  hireCost: number;
  level: number;
  maxLevel: number;
  upgradeCost: number;
  speedMultiplier: number;
  efficiencyMultiplier: number;
  icon: string;
  avatarColor: string;
}

export type CustomerState =
  | 'entering'
  | 'browsing'
  | 'picking'
  | 'queueing'
  | 'checkout'
  | 'paying'
  | 'leaving';

export interface Customer {
  id: string;
  name: string;
  outfitColor: string;
  hairColor: string;
  skinColor: string;
  type: 'kid' | 'teen' | 'adult' | 'senior' | 'hipster' | 'business';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  state: CustomerState;
  stateTimer: number;
  targetProduct?: Product;
  hasProduct: boolean;
  facing: 'left' | 'right';
  basket: Product[];
  totalBill: number;
  bobPhase: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
}

export interface FloorSpill {
  id: string;
  x: number;
  y: number;
  type: 'juice' | 'dust' | 'banana';
  bonusCoins: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  type: 'serve_customers' | 'earn_coins' | 'upgrade_shop' | 'sell_drinks' | 'hire_worker' | 'reach_level' | 'buy_decor' | 'window_shop';
  completed: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface DailyReward {
  day: number;
  rewardText: string;
  coins: number;
  type: 'coins' | 'ticket' | 'special';
  claimed: boolean;
}

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  hapticsEnabled: boolean;
}

export type DecorCategory = 'flooring' | 'plants' | 'neon' | 'fixtures';

export interface DecorItem {
  id: string;
  name: string;
  category: DecorCategory;
  description: string;
  cost: number;
  multiplier: number; // e.g., 0.05 for +5% passive income
  purchased: boolean;
  equipped?: boolean;
  icon: string;
  badge: string;
  visualDetail: string;
  floorColor?: string;
  floorPattern?: string;
}

export interface GameState {
  version: number;
  coins: number;
  totalCoinsEarned: number;
  totalCustomersServed: number;
  totalUpgradesPurchased: number;
  shopLevel: number;
  currentStageId: ShopStageId;
  products: Record<string, Product>;
  decor: Record<string, DecorItem>;
  equippedFloorId?: string;
  upgrades: {
    storeSize: number;
    productStock: number;
    customerCapacity: number;
    checkoutSpeed: number;
    staffSpeed: number;
    productPrice: number;
    customerWalkSpeed: number;
  };
  staff: Record<string, StaffMember>;
  missions: Mission[];
  achievements: Achievement[];
  dailyLogin: {
    lastClaimDate: string | null;
    currentDay: number;
    rewards: DailyReward[];
  };
  lastSavedTimestamp: number;
  tutorialCompleted: boolean;
  tutorialStep: number;
  settings: GameSettings;
  activeFrenzyEndTime: number; // 2x coins timestamp
  activeRushEndTime: number;   // Customer rush timestamp
  activeHappinessEndTime: number; // Customer happiness surge timestamp (boosts speed & tips)
  stats: {
    drinksSold: number;
    spillsCleaned: number;
    adsWatched: number;
    windowShopsCompleted: number;
  };
}
