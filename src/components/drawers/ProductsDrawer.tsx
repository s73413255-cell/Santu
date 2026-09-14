import React, { useState } from 'react';
import { GameState, Product, SectionCategory } from '../../types/game';
import { SHOP_STAGES } from '../../data/gameData';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { Lock, ArrowUpCircle, Check } from 'lucide-react';

interface ProductsDrawerProps {
  state: GameState;
  onUnlockProduct: (productId: string) => void;
  onUpgradeProduct: (productId: string) => void;
}

const SECTION_TABS: Array<{ id: SectionCategory; label: string; icon: string }> = [
  { id: 'vegetables', label: 'Veg', icon: '🥕' },
  { id: 'fruits', label: 'Fruits', icon: '🍎' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
  { id: 'snacks', label: 'Snacks', icon: '🥔' },
  { id: 'dairy', label: 'Dairy', icon: '🧀' },
  { id: 'bakery', label: 'Bakery', icon: '🥐' },
  { id: 'household', label: 'House', icon: '🧼' },
  { id: 'electronics', label: 'Electro', icon: '🎧' },
];

export const ProductsDrawer: React.FC<ProductsDrawerProps> = ({
  state,
  onUnlockProduct,
  onUpgradeProduct,
}) => {
  const [selectedSection, setSelectedSection] = useState<SectionCategory>('vegetables');
  const currentStage = SHOP_STAGES[state.currentStageId];

  const filteredProducts = (Object.values(state.products) as Product[]).filter(
    (p) => p.sectionId === selectedSection
  );

  const isSectionUnlockedInStage = currentStage.unlockedSections.includes(selectedSection);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900 text-white p-3 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
            <span>🍎</span> Product Catalog
          </h2>
          <p className="text-xs text-slate-400">Unlock & level up goods to increase store profits</p>
        </div>
      </div>

      {/* Section Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
        {SECTION_TABS.map((tab) => {
          const isUnlocked = currentStage.unlockedSections.includes(tab.id);
          const isSelected = selectedSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundService.playClick();
                setSelectedSection(tab.id);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cartoon-btn ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : isUnlocked
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-850 text-slate-500 opacity-60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {!isUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
            </button>
          );
        })}
      </div>

      {/* Notice if section locked by stage */}
      {!isSectionUnlockedInStage && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 mb-3 text-center">
          <p className="text-xs text-amber-300 font-bold">
            🔒 This section unlocks when you expand to a larger shop stage!
          </p>
          <p className="text-[11px] text-amber-400/80 mt-0.5">
            Visit the "Expand" tab to see requirements for the next stage.
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredProducts.map((product) => {
          const upgradeCost = Math.round(product.basePrice * Math.pow(1.6, product.level));
          const canUnlock = state.coins >= product.unlockCost && state.shopLevel >= product.unlockShopLevel;
          const canUpgrade = state.coins >= upgradeCost;
          const currentIncome = Math.round(product.baseIncome * (1 + (product.level - 1) * 0.3));
          const nextIncome = Math.round(product.baseIncome * (1 + product.level * 0.3));

          return (
            <div
              key={product.id}
              className={`p-3 rounded-2xl border transition-all ${
                product.unlocked
                  ? 'bg-slate-800/90 border-slate-700/80 shadow-md'
                  : 'bg-slate-850/60 border-slate-800 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Product Icon & Name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-2xl shadow-inner">
                    {product.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-white">{product.name}</h3>
                      {product.unlocked && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                          Lvl {product.level}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                      <span>+{formatCoins(currentIncome)} coins / item</span>
                    </div>
                  </div>
                </div>

                {/* Action Button: Unlock or Upgrade */}
                <div>
                  {!product.unlocked ? (
                    <button
                      onClick={() => {
                        soundService.playClick();
                        onUnlockProduct(product.id);
                      }}
                      disabled={!canUnlock || !isSectionUnlockedInStage}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md ${
                        canUnlock && isSectionUnlockedInStage
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="leading-tight">UNLOCK</span>
                      <span className="text-[10px] opacity-90 leading-tight">
                        {product.unlockCost === 0 ? 'FREE' : `${formatCoins(product.unlockCost)} 🪙`}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        soundService.playClick();
                        onUpgradeProduct(product.id);
                      }}
                      disabled={!canUpgrade}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md ${
                        canUpgrade
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="leading-tight flex items-center gap-1">
                        <ArrowUpCircle className="w-3.5 h-3.5" /> UPGRADE
                      </span>
                      <span className="text-[10px] opacity-90 leading-tight">
                        {formatCoins(upgradeCost)} 🪙
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Requirement or stats preview footer */}
              {!product.unlocked && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-750 pt-1.5">
                  <span>Required: Shop Lvl {product.unlockShopLevel}</span>
                  {state.shopLevel < product.unlockShopLevel && (
                    <span className="text-rose-400 font-bold">Lvl too low</span>
                  )}
                </div>
              )}

              {product.unlocked && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-700/60 pt-1.5">
                  <span>Next: +{formatCoins(nextIncome)} coins</span>
                  <span className="text-emerald-400 font-bold">+30% value</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
