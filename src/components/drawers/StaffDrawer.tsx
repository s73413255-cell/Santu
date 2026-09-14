import React from 'react';
import { GameState, StaffMember } from '../../types/game';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { UserPlus, ArrowUpCircle, Award } from 'lucide-react';

interface StaffDrawerProps {
  state: GameState;
  onHireStaff: (staffId: string) => void;
  onUpgradeStaff: (staffId: string) => void;
}

export const StaffDrawer: React.FC<StaffDrawerProps> = ({
  state,
  onHireStaff,
  onUpgradeStaff,
}) => {
  const staffList = Object.values(state.staff) as StaffMember[];

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900 text-white p-3 flex flex-col">
      {/* Header */}
      <div className="mb-2.5">
        <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
          <span>👷</span> Store Staff & Helpers
        </h2>
        <p className="text-xs text-slate-400">
          Hire dedicated crew members to automate checkout, restocking, and cleaning
        </p>
      </div>

      {/* Staff Cards */}
      <div className="flex flex-col gap-2.5">
        {staffList.map((worker) => {
          const isHired = worker.hired;
          const upgradeCost = Math.round(worker.upgradeCost * Math.pow(1.6, worker.level - 1));
          const canAffordHire = state.coins >= worker.hireCost;
          const canAffordUpgrade = state.coins >= upgradeCost && worker.level < worker.maxLevel;

          return (
            <div
              key={worker.id}
              className={`p-3 rounded-2xl border transition-all ${
                isHired
                  ? 'bg-slate-850 border-slate-700/80 shadow-md'
                  : 'bg-slate-850/50 border-slate-800 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Avatar & Info */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/20"
                    style={{ backgroundColor: worker.avatarColor }}
                  >
                    {worker.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">{worker.name}</h3>
                      {isHired ? (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                          Lvl {worker.level} / {worker.maxLevel}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-700 text-slate-400 font-bold px-1.5 py-0.2 rounded-full">
                          Available
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-amber-300 font-bold block">{worker.title}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 max-w-[210px] leading-tight">
                      {worker.description}
                    </p>
                  </div>
                </div>

                {/* Hire or Upgrade Button */}
                <div>
                  {!isHired ? (
                    <button
                      onClick={() => {
                        soundService.playUpgrade();
                        onHireStaff(worker.id);
                      }}
                      disabled={!canAffordHire}
                      className={`min-w-[84px] px-3 py-2 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md whitespace-nowrap ${
                        canAffordHire
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span className="leading-tight flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> HIRE
                      </span>
                      <span className="text-[10px] opacity-90 leading-tight font-mono mt-0.5">
                        {formatCoins(worker.hireCost)} 🪙
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        soundService.playUpgrade();
                        onUpgradeStaff(worker.id);
                      }}
                      disabled={!canAffordUpgrade || worker.level >= worker.maxLevel}
                      className={`min-w-[84px] px-3 py-2 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md whitespace-nowrap ${
                        worker.level >= worker.maxLevel
                          ? 'bg-slate-700 text-slate-400 cursor-default'
                          : canAffordUpgrade
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span className="leading-tight flex items-center gap-1">
                        <ArrowUpCircle className="w-3.5 h-3.5" /> UPGRADE
                      </span>
                      <span className="text-[10px] opacity-90 leading-tight font-mono mt-0.5">
                        {worker.level >= worker.maxLevel ? 'MAX' : `${formatCoins(upgradeCost)} 🪙`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bonus multipliers footer */}
              {isHired && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-700/60 pt-1.5">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Speed: +{Math.round((worker.speedMultiplier - 1) * 100 + (worker.level - 1) * 20)}%</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    Efficiency: +{Math.round((worker.efficiencyMultiplier - 1) * 100 + (worker.level - 1) * 15)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
