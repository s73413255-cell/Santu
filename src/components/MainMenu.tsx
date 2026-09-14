import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Smartphone, Sparkles, Trophy } from 'lucide-react';
import { GameState } from '../types/game';
import { SHOP_STAGES } from '../data/gameData';
import { formatCoins } from '../utils/formatters';
import { soundService } from '../services/sound';

interface MainMenuProps {
  state: GameState;
  onPlayGame: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  state,
  onPlayGame,
  onOpenSettings,
  onToggleSound,
}) => {
  const currentStage = SHOP_STAGES[state.currentStageId];

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-6 bg-gradient-to-b from-amber-500 via-orange-600 to-slate-950 text-white select-none overflow-hidden">
      {/* Background Cartoon Elements */}
      <div className="absolute inset-0 opacity-15 pointer-events-none flex flex-wrap gap-8 justify-around items-center">
        {['🍎', '🥕', '🥤', '🧀', '🥐', '🧼', '🎧', '🪙', '🛍️', '🏬'].map((emoji, idx) => (
          <span key={idx} className="text-5xl transform rotate-12 animate-pulse">
            {emoji}
          </span>
        ))}
      </div>

      {/* Top Header info */}
      <div className="w-full flex justify-between items-center z-10">
        <span className="text-xs bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 font-bold flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-amber-300" />
          <span>Android Portrait Edition</span>
        </span>

        <button
          onClick={onToggleSound}
          className="p-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/20 text-white cartoon-btn"
        >
          {state.settings.sfxEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Main Logo & Mascot Display */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        {/* Animated Storefront Badge */}
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-500 border-4 border-white shadow-2xl flex items-center justify-center text-5xl shadow-orange-900/50 transform hover:scale-105 transition-transform">
            🏪
          </div>
          <span className="absolute -top-2 -right-2 text-2xl animate-bounce">🪙</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] uppercase">
          Small Shop
        </h1>
        <div className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] uppercase tracking-wider -mt-1">
          Tycoon
        </div>

        <p className="text-xs text-amber-100 font-semibold mt-2 max-w-xs drop-shadow">
          Start with a humble corner stall and expand into the ultimate shopping mall empire!
        </p>

        {/* Current Progress Capsule */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-950/70 border border-amber-400/30 backdrop-blur-md flex items-center gap-4 text-left shadow-lg">
          <div className="text-2xl">{currentStage.icon}</div>
          <div>
            <div className="text-[10px] text-amber-400 font-extrabold uppercase">
              Current Franchise
            </div>
            <div className="text-sm font-black text-white">{currentStage.name}</div>
            <div className="text-[11px] text-slate-300 font-mono">
              Balance: {formatCoins(state.coins)} 🪙 • Served: {state.totalCustomersServed}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Launch Actions */}
      <div className="w-full max-w-xs flex flex-col gap-3 z-10 mb-2">
        <button
          onClick={() => {
            soundService.playClick();
            onPlayGame();
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 font-black text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 hover:brightness-110 cartoon-btn"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>PLAY NOW</span>
        </button>

        <button
          onClick={() => {
            soundService.playClick();
            onOpenSettings();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-white/20 text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 cartoon-btn"
        >
          <span>Settings & Options</span>
        </button>

        <span className="text-[10px] text-center text-slate-400 font-medium">
          v1.0.0 • Endless Tycoon Idle Simulation
        </span>
      </div>
    </div>
  );
};
