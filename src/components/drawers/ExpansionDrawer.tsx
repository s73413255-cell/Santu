import React from 'react';
import { GameState, ShopStageId } from '../../types/game';
import { SHOP_STAGES } from '../../data/gameData';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExpansionDrawerProps {
  state: GameState;
  onExpandToNextStage: () => void;
  onLevelUpShop: () => void;
}

export const ExpansionDrawer: React.FC<ExpansionDrawerProps> = ({
  state,
  onExpandToNextStage,
  onLevelUpShop,
}) => {
  const currentStage = SHOP_STAGES[state.currentStageId];
  const nextStageId = (state.currentStageId + 1) as ShopStageId;
  const nextStage = SHOP_STAGES[nextStageId];

  // Requirements for next stage
  const hasNextStage = Boolean(nextStage);
  const coinsNeeded = nextStage?.requiredCoins || 0;
  const servedNeeded = nextStage?.requiredServed || 0;
  const levelNeeded = nextStage?.minShopLevel || 1;

  const hasEnoughCoins = state.coins >= coinsNeeded;
  const hasEnoughServed = state.totalCustomersServed >= servedNeeded;
  const hasEnoughLevel = state.shopLevel >= levelNeeded;
  const canExpand = hasNextStage && hasEnoughCoins && hasEnoughServed && hasEnoughLevel;

  // Regular Shop Level Up
  const shopLevelUpCost = Math.round(50 * Math.pow(1.5, state.shopLevel - 1));
  const canLevelUp = state.coins >= shopLevelUpCost;

  const handleExpandClick = () => {
    if (!canExpand) return;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
    soundService.playLevelUp();
    onExpandToNextStage();
  };

  const handleLevelUpClick = () => {
    if (!canLevelUp) return;
    soundService.playLevelUp();
    onLevelUpShop();
  };

  const stagesList = Object.values(SHOP_STAGES);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900 text-white p-3 flex flex-col">
      {/* Header */}
      <div className="mb-2.5">
        <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
          <span>🚀</span> Business Expansion & Stages
        </h2>
        <p className="text-xs text-slate-400">
          Grow from a small street corner stall all the way to an empire Shopping Mall!
        </p>
      </div>

      {/* Quick Shop Level Up Card */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 mb-3 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-300 font-extrabold tracking-wider uppercase">
              Current Status
            </span>
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-black text-white">Shop Level {state.shopLevel}</h3>
              <span className="text-xs text-amber-400 font-bold">
                {currentStage.name}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Leveling up increases base prices and unlocks advanced inventory.
            </p>
          </div>

          <button
            onClick={handleLevelUpClick}
            disabled={!canLevelUp}
            className={`px-3.5 py-2 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md whitespace-nowrap ${
              canLevelUp
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> LEVEL UP
            </span>
            <span className="text-[10px] opacity-90 font-mono mt-0.5">
              {formatCoins(shopLevelUpCost)} 🪙
            </span>
          </button>
        </div>
      </div>

      {/* Next Stage Expansion Hero Card if available */}
      {hasNextStage ? (
        <div className="p-3.5 rounded-2xl bg-slate-850 border-2 border-indigo-500/50 mb-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{nextStage.icon}</span>
            <div>
              <span className="text-[10px] text-indigo-400 font-extrabold tracking-wider uppercase">
                Next Stage Evolution
              </span>
              <h3 className="text-base font-black text-white leading-tight">{nextStage.name}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 mb-3">{nextStage.subtitle}</p>

          {/* Checklist Requirements */}
          <div className="space-y-1.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs mb-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                {hasEnoughLevel ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-slate-500" />}
                Shop Level {levelNeeded}
              </span>
              <span className={`font-mono font-bold ${hasEnoughLevel ? 'text-emerald-400' : 'text-slate-400'}`}>
                {state.shopLevel} / {levelNeeded}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                {hasEnoughServed ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-slate-500" />}
                Customers Served ({servedNeeded})
              </span>
              <span className={`font-mono font-bold ${hasEnoughServed ? 'text-emerald-400' : 'text-slate-400'}`}>
                {state.totalCustomersServed} / {servedNeeded}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                {hasEnoughCoins ? <Check className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-slate-500" />}
                Coins Cost ({formatCoins(coinsNeeded)} 🪙)
              </span>
              <span className={`font-mono font-bold ${hasEnoughCoins ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCoins(state.coins)} / {formatCoins(coinsNeeded)}
              </span>
            </div>
          </div>

          {/* Unlocked sections preview in next stage */}
          <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
            <span className="font-semibold text-slate-300">Unlocks:</span>
            <span className="text-emerald-400 font-bold">
              {nextStage.unlockedSections
                .filter((sec) => !currentStage.unlockedSections.includes(sec))
                .join(', ') || 'Expanded Capacity & Higher Foot Traffic'}
            </span>
          </div>

          <button
            onClick={handleExpandClick}
            disabled={!canExpand}
            className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cartoon-btn shadow-lg transition-all ${
              canExpand
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>EXPAND TO {nextStage.name.toUpperCase()}!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/40 text-center mb-3">
          <span className="text-3xl">👑</span>
          <h3 className="text-base font-black text-yellow-400 mt-1">Maximum Stage Reached!</h3>
          <p className="text-xs text-slate-300 mt-1">
            You are the proud owner of the grand Royal Empire Shopping Mall! Continue leveling up your shop and products to build endless wealth.
          </p>
        </div>
      )}

      {/* Progression Roadmap */}
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Full Career Progression
      </h4>
      <div className="flex flex-col gap-2">
        {stagesList.map((st) => {
          const isCurrent = state.currentStageId === st.id;
          const isCompleted = state.currentStageId > st.id;

          return (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                isCurrent
                  ? 'bg-amber-500/15 border-amber-500/50'
                  : isCompleted
                  ? 'bg-slate-850/40 border-slate-800 text-slate-400'
                  : 'bg-slate-850 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{st.icon}</span>
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-white">
                    <span>{st.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded-sm font-black">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Cap: {st.baseCustomerCap} shoppers • {st.unlockedSections.length} sections
                  </span>
                </div>
              </div>

              {isCompleted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Passed
                </span>
              ) : isCurrent ? (
                <span className="text-amber-400 font-bold">In Progress</span>
              ) : (
                <span className="text-slate-500 font-mono">
                  Req: {formatCoins(st.requiredCoins)} 🪙
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
