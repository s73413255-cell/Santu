import React, { useState } from 'react';
import { GameState, DecorItem, DecorCategory } from '../../types/game';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { Sparkles, Check, CheckCircle2, TrendingUp, Palette, Eye } from 'lucide-react';

interface DecorDrawerProps {
  state: GameState;
  onBuyDecor: (decorId: string) => void;
  onEquipFloor: (floorId: string) => void;
}

export const DecorDrawer: React.FC<DecorDrawerProps> = ({
  state,
  onBuyDecor,
  onEquipFloor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DecorCategory | 'all'>('all');

  const decorList = Object.values(state.decor || {}) as DecorItem[];

  // Calculate total active decor bonus
  const purchasedItems = decorList.filter((d) => d.purchased);
  const totalMultiplierPercent = Math.round(
    purchasedItems.reduce((acc, item) => acc + item.multiplier, 0) * 100
  );

  const filteredItems = selectedCategory === 'all'
    ? decorList
    : decorList.filter((d) => d.category === selectedCategory);

  const categories: { id: DecorCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All Decor', icon: '✨' },
    { id: 'flooring', label: 'Flooring', icon: '🏁' },
    { id: 'plants', label: 'Plants', icon: '🪴' },
    { id: 'neon', label: 'Neon Signs', icon: '💡' },
    { id: 'fixtures', label: 'Fixtures', icon: '🏮' },
  ];

  const handlePurchase = (decor: DecorItem) => {
    soundService.playUpgrade();
    onBuyDecor(decor.id);
  };

  const handleEquip = (floorId: string) => {
    soundService.playClick();
    onEquipFloor(floorId);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900 text-white p-3 flex flex-col">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <Palette className="w-5 h-5 text-pink-400" />
            <span>Store Decor & Ambiance</span>
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-pink-300 border border-pink-500/30">
            {purchasedItems.length}/{decorList.length} Owned
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Purchase aesthetic improvements that grant permanent passive income multipliers!
        </p>
      </div>

      {/* Multiplier Showcase Banner */}
      <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-pink-900/60 border border-purple-500/40 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-2 opacity-15 pointer-events-none text-6xl">
          ✨
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Total Passive Multiplier
            </span>
            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-200 to-amber-400">
              +{totalMultiplierPercent}% Permanent Income
            </div>
            <p className="text-[11px] text-purple-200/80 mt-0.5">
              Multiplies all checkout sales and offline earnings automatically.
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-2xl shadow-inner">
            💎
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = cat.id === 'all'
            ? decorList.length
            : decorList.filter((d) => d.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                soundService.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cartoon-btn flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Decor Cards List */}
      <div className="flex flex-col gap-2.5 mt-1 pb-4">
        {filteredItems.map((item) => {
          const isPurchased = item.purchased;
          const canAfford = state.coins >= item.cost;
          const isFloor = item.category === 'flooring';
          const isEquipped = state.equippedFloorId === item.id;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all ${
                isPurchased
                  ? 'bg-slate-850 border-slate-700/80 shadow-md'
                  : 'bg-slate-850/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                {/* Visual Icon Swatch */}
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-2xl shadow-inner border relative overflow-hidden ${
                      item.category === 'neon'
                        ? 'bg-slate-950 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                    style={
                      isFloor && item.floorColor
                        ? { backgroundColor: item.floorColor, background: item.floorPattern || item.floorColor }
                        : undefined
                    }
                  >
                    <span className="drop-shadow-md z-10">{item.icon}</span>
                  </div>
                  {isPurchased && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-sm text-white truncate">{item.name}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    {item.description}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-pink-300/90 font-medium">
                      ✨ {item.visualDetail}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col items-end gap-1.5">
                  {!isPurchased ? (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={!canAfford}
                      className={`min-w-[84px] px-3 py-2 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md whitespace-nowrap ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span className="leading-tight flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> BUY
                      </span>
                      <span className="text-[10px] font-mono leading-tight mt-0.5">
                        {formatCoins(item.cost)} 🪙
                      </span>
                    </button>
                  ) : isFloor ? (
                    <button
                      onClick={() => handleEquip(item.id)}
                      className={`min-w-[84px] px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 cartoon-btn shadow-sm transition-all ${
                        isEquipped
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>EQUIPPED</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>USE TILE</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="min-w-[84px] py-1.5 px-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center flex flex-col items-center justify-center">
                      <span className="text-[11px] font-black leading-tight flex items-center gap-1">
                        <Check className="w-3 h-3" /> ACTIVE
                      </span>
                      <span className="text-[9px] opacity-75 font-semibold leading-tight">Permanent</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
