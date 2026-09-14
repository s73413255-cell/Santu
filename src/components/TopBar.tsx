import React from 'react';
import { Volume2, VolumeX, Settings, Gift, Zap, Users } from 'lucide-react';
import { GameState } from '../types/game';
import { SHOP_STAGES } from '../data/gameData';
import { formatCoins } from '../utils/formatters';

interface TopBarProps {
  state: GameState;
  coinsPerSec: number;
  customerCount: number;
  maxCustomers: number;
  hasDailyReward: boolean;
  onOpenDaily: () => void;
  onOpenSettings: () => void;
  onOpenExpansion: () => void;
  onToggleSound: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  coinsPerSec,
  customerCount,
  maxCustomers,
  hasDailyReward,
  onOpenDaily,
  onOpenSettings,
  onOpenExpansion,
  onToggleSound,
}) => {
  const currentStage = SHOP_STAGES[state.currentStageId];
  const isFrenzy = state.activeFrenzyEndTime > Date.now();
  const frenzyRemaining = Math.max(0, Math.ceil((state.activeFrenzyEndTime - Date.now()) / 1000));
  const isRush = state.activeRushEndTime > Date.now();
  const rushRemaining = Math.max(0, Math.ceil((state.activeRushEndTime - Date.now()) / 1000));

  return (
    <header className="w-full bg-slate-900/90 text-white backdrop-blur-md border-b border-slate-700/50 px-3 py-2 select-none z-30 shadow-md">
      {/* Top row: Stage badge, Quick action icons */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        {/* Stage Badge button */}
        <button
          onClick={onOpenExpansion}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300 transition-all cartoon-btn"
          title="Click to view shop progression"
        >
          <span className="text-sm">{currentStage.icon}</span>
          <span className="truncate max-w-[130px] sm:max-w-[180px]">
            Lvl {state.shopLevel} • {currentStage.name}
          </span>
          <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full">
            EXPAND
          </span>
        </button>

        {/* Right utility buttons */}
        <div className="flex items-center gap-1.5">
          {/* Daily reward notification */}
          <button
            onClick={onOpenDaily}
            className="relative p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-yellow-400 cartoon-btn"
            title="Daily Rewards"
          >
            <Gift className="w-4 h-4 animate-bounce" />
            {hasDailyReward && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900 animate-ping" />
            )}
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 cartoon-btn"
            title="Toggle Sound"
          >
            {state.settings.sfxEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 cartoon-btn"
            title="Settings & Save"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Economy Banner: Coins balance, rate, shoppers count */}
      <div className="flex items-center justify-between bg-slate-950/70 rounded-xl px-3 py-1.5 border border-slate-800">
        {/* Coin Balance */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/30 text-base font-black text-amber-950">
            🪙
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight drop-shadow-sm font-mono">
                {formatCoins(state.coins)}
              </span>
              <span className="text-[11px] font-bold text-amber-200/70">Coins</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span>+{formatCoins(coinsPerSec)}/s</span>
              {isFrenzy && <span className="text-orange-400 font-extrabold">(2x BOOST)</span>}
            </div>
          </div>
        </div>

        {/* Shoppers count badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono">{customerCount}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 font-mono">{maxCustomers}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Capacity</span>
        </div>
      </div>

      {/* Active Boost Banners if any */}
      {(isFrenzy || isRush) && (
        <div className="flex items-center gap-2 mt-1.5 overflow-x-auto text-xs py-0.5">
          {isFrenzy && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse whitespace-nowrap">
              <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
              <span>2× COINS: {frenzyRemaining}s</span>
            </div>
          )}
          {isRush && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse whitespace-nowrap">
              <Users className="w-3 h-3 text-cyan-300" />
              <span>CUSTOMER RUSH: {rushRemaining}s</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
