import React from 'react';
import { GameState, DailyReward } from '../../types/game';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { X, Check, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyRewardModalProps {
  state: GameState;
  onClaimDay: (day: number) => void;
  onClose: () => void;
}

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  state,
  onClaimDay,
  onClose,
}) => {
  const currentDay = state.dailyLogin.currentDay;
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const alreadyClaimedToday = state.dailyLogin.lastClaimDate === todayDateStr;

  const handleClaim = (day: number) => {
    confetti({
      particleCount: 100,
      spread: 75,
      origin: { y: 0.6 },
    });
    soundService.playLevelUp();
    onClaimDay(day);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-yellow-500/50 rounded-3xl p-5 text-white relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
            🎁
          </div>
          <div>
            <h2 className="text-base font-black text-white">7-Day Login Rewards</h2>
            <p className="text-xs text-slate-400">Log in daily to claim bigger coin rewards!</p>
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-3 gap-2 my-4">
          {state.dailyLogin.rewards.map((reward) => {
            const isPast = reward.day < currentDay || reward.claimed;
            const isToday = reward.day === currentDay;
            const isFuture = reward.day > currentDay;
            const canClaim = isToday && !alreadyClaimedToday && !reward.claimed;

            return (
              <div
                key={reward.day}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center relative ${
                  reward.day === 7 ? 'col-span-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-400' : ''
                } ${
                  isToday
                    ? 'bg-slate-800 border-amber-400 shadow-md shadow-amber-500/10'
                    : isPast
                    ? 'bg-slate-850/50 border-slate-800 opacity-60'
                    : 'bg-slate-850 border-slate-800'
                }`}
              >
                <span className="text-[10px] font-bold text-slate-400">Day {reward.day}</span>
                <span className="text-2xl my-1">
                  {reward.type === 'special' ? '👑' : reward.type === 'ticket' ? '🎟️' : '🪙'}
                </span>
                <span className="text-xs font-black text-amber-400 font-mono">
                  {reward.type === 'ticket' ? 'Free Boost' : reward.type === 'special' ? 'Gold + 10K' : `+${formatCoins(reward.coins)}`}
                </span>

                {isPast && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                )}

                {canClaim && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Button */}
        <div>
          {!alreadyClaimedToday ? (
            <button
              onClick={() => handleClaim(currentDay)}
              className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg hover:brightness-110 flex items-center justify-center gap-1.5 cartoon-btn"
            >
              <Gift className="w-4 h-4" />
              <span>CLAIM DAY {currentDay} REWARD!</span>
            </button>
          ) : (
            <div className="w-full py-2.5 bg-slate-800 text-slate-400 rounded-2xl font-bold text-xs text-center border border-slate-700">
              Already claimed today. Come back tomorrow!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
