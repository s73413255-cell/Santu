import React from 'react';
import { Store, Apple, ArrowUpCircle, Users, CheckSquare, Sparkles, Palette } from 'lucide-react';

export type TabType = 'shop' | 'products' | 'upgrade' | 'decor' | 'staff' | 'missions' | 'expansion';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unclaimedMissionsCount: number;
  availableUpgradesCount: number;
  canExpandShop: boolean;
  canAffordDecor?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  unclaimedMissionsCount,
  availableUpgradesCount,
  canExpandShop,
  canAffordDecor,
}) => {
  const tabs = [
    { id: 'shop' as TabType, label: 'Shop', icon: Store, color: 'text-amber-400' },
    { id: 'products' as TabType, label: 'Products', icon: Apple, color: 'text-emerald-400' },
    {
      id: 'upgrade' as TabType,
      label: 'Upgrade',
      icon: ArrowUpCircle,
      color: 'text-blue-400',
      badge: availableUpgradesCount > 0 ? availableUpgradesCount : undefined,
    },
    {
      id: 'decor' as TabType,
      label: 'Decor',
      icon: Palette,
      color: 'text-pink-400',
      highlight: canAffordDecor,
    },
    { id: 'staff' as TabType, label: 'Staff', icon: Users, color: 'text-purple-400' },
    {
      id: 'missions' as TabType,
      label: 'Missions',
      icon: CheckSquare,
      color: 'text-orange-400',
      badge: unclaimedMissionsCount > 0 ? unclaimedMissionsCount : undefined,
    },
    {
      id: 'expansion' as TabType,
      label: 'Expand',
      icon: Sparkles,
      color: 'text-rose-400',
      highlight: canExpandShop,
    },
  ];

  return (
    <nav className="w-full bg-slate-900 border-t border-slate-800 px-0.5 py-1 flex items-center justify-around z-30 select-none pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cartoon-btn flex-1 max-w-[58px] ${
              isActive
                ? 'bg-slate-800 text-white font-bold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-4.5 h-4.5 transition-transform ${isActive ? 'scale-110 ' + tab.color : ''} ${
                  tab.highlight ? 'animate-bounce text-pink-300' : ''
                }`}
              />
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-1 ring-slate-900">
                  {tab.badge}
                </span>
              )}
              {tab.highlight && !tab.badge && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-pink-400 ring-1 ring-slate-900 animate-ping" />
              )}
            </div>
            <span
              className={`text-[9px] mt-0.5 whitespace-nowrap leading-none ${
                isActive ? 'font-extrabold text-white' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
