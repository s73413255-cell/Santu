import React from 'react';
import { GameState } from '../../types/game';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { ArrowUpCircle, Maximize2, Layers, Users, Zap, UserCheck, DollarSign, Activity } from 'lucide-react';

interface UpgradesDrawerProps {
  state: GameState;
  onPurchaseUpgrade: (upgradeKey: keyof GameState['upgrades']) => void;
}

interface UpgradeDef {
  key: keyof GameState['upgrades'];
  title: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  getValue: (lvl: number) => string;
  getNextValue: (lvl: number) => string;
}

export const UPGRADE_DEFINITIONS: UpgradeDef[] = [
  {
    key: 'storeSize',
    title: 'Store Size',
    description: 'Expands aisles and room floor space for more display racks.',
    baseCost: 80,
    costMultiplier: 1.8,
    icon: Maximize2,
    color: 'from-blue-500 to-indigo-600',
    getValue: (lvl) => `${lvl * 25} sq meters`,
    getNextValue: (lvl) => `${(lvl + 1) * 25} sq meters`,
  },
  {
    key: 'productStock',
    title: 'Product Stock',
    description: 'Enlarges shelf capacity so goods take longer to deplete.',
    baseCost: 60,
    costMultiplier: 1.6,
    icon: Layers,
    color: 'from-emerald-500 to-teal-600',
    getValue: (lvl) => `${lvl * 10} items / shelf`,
    getNextValue: (lvl) => `${(lvl + 1) * 10} items / shelf`,
  },
  {
    key: 'customerCapacity',
    title: 'Customer Capacity',
    description: 'Allows more shoppers to be inside your shop at the same time.',
    baseCost: 100,
    costMultiplier: 1.9,
    icon: Users,
    color: 'from-amber-500 to-orange-600',
    getValue: (lvl) => `${3 + (lvl - 1) * 2} max shoppers`,
    getNextValue: (lvl) => `${3 + lvl * 2} max shoppers`,
  },
  {
    key: 'checkoutSpeed',
    title: 'Checkout Speed',
    description: 'Faster registers and barcode scanning to clear queues quickly.',
    baseCost: 75,
    costMultiplier: 1.7,
    icon: Zap,
    color: 'from-yellow-400 to-amber-500',
    getValue: (lvl) => `+${(lvl - 1) * 25}% scan speed`,
    getNextValue: (lvl) => `+${lvl * 25}% scan speed`,
  },
  {
    key: 'staffSpeed',
    title: 'Staff Speed',
    description: 'Motivates workers to restock and clean faster across the store.',
    baseCost: 120,
    costMultiplier: 1.75,
    icon: UserCheck,
    color: 'from-purple-500 to-pink-600',
    getValue: (lvl) => `+${(lvl - 1) * 20}% efficiency`,
    getNextValue: (lvl) => `+${lvl * 20}% efficiency`,
  },
  {
    key: 'productPrice',
    title: 'Product Price',
    description: 'Improves marketing margins, increasing coins earned on every sale.',
    baseCost: 150,
    costMultiplier: 1.85,
    icon: DollarSign,
    color: 'from-rose-500 to-red-600',
    getValue: (lvl) => `+${(lvl - 1) * 15}% sale margin`,
    getNextValue: (lvl) => `+${lvl * 15}% sale margin`,
  },
  {
    key: 'customerWalkSpeed',
    title: 'Customer Walk Speed',
    description: 'Shoppers navigate aisles briskly and finish shopping sooner.',
    baseCost: 90,
    costMultiplier: 1.65,
    icon: Activity,
    color: 'from-cyan-500 to-blue-600',
    getValue: (lvl) => `+${(lvl - 1) * 20}% walk pace`,
    getNextValue: (lvl) => `+${lvl * 20}% walk pace`,
  },
];

export const UpgradesDrawer: React.FC<UpgradesDrawerProps> = ({
  state,
  onPurchaseUpgrade,
}) => {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900 text-white p-3 flex flex-col">
      {/* Header */}
      <div className="mb-2.5">
        <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
          <span>⚡</span> Store Upgrades
        </h2>
        <p className="text-xs text-slate-400">
          Boost customer traffic, register throughput, and profit margins
        </p>
      </div>

      {/* Upgrades List */}
      <div className="flex flex-col gap-2.5">
        {UPGRADE_DEFINITIONS.map((def) => {
          const currentLevel = state.upgrades[def.key];
          const cost = Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLevel - 1));
          const canAfford = state.coins >= cost;
          const Icon = def.icon;

          return (
            <div
              key={def.key}
              className="p-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between shadow-md"
            >
              {/* Icon & Details */}
              <div className="flex items-center gap-3 pr-2">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${def.color} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white">{def.title}</h3>
                    <span className="text-[10px] bg-slate-700 text-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                      Lvl {currentLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {def.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px]">
                    <span className="text-slate-300 font-semibold">{def.getValue(currentLevel)}</span>
                    <span className="text-slate-500">➔</span>
                    <span className="text-emerald-400 font-bold">{def.getNextValue(currentLevel)}</span>
                  </div>
                </div>
              </div>

              {/* Upgrade Button */}
              <button
                onClick={() => {
                  soundService.playUpgrade();
                  onPurchaseUpgrade(def.key);
                }}
                disabled={!canAfford}
                className={`min-w-[84px] px-3 py-2 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md whitespace-nowrap ${
                  canAfford
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span className="leading-tight flex items-center gap-1">
                  <ArrowUpCircle className="w-3.5 h-3.5" /> UPGRADE
                </span>
                <span className="text-[10px] opacity-90 leading-tight font-mono mt-0.5">
                  {formatCoins(cost)} 🪙
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
