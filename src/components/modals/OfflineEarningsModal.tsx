import React from 'react';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { Sparkles, Video, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OfflineEarningsModalProps {
  coinsEarned: number;
  formattedTime: string;
  onCollectNormal: () => void;
  onWatchAdDouble: () => void;
}

export const OfflineEarningsModal: React.FC<OfflineEarningsModalProps> = ({
  coinsEarned,
  formattedTime,
  onCollectNormal,
  onWatchAdDouble,
}) => {
  const doubleCoins = coinsEarned * 2;

  const handleNormalCollect = () => {
    soundService.playCoin();
    onCollectNormal();
  };

  const handleDoubleCollect = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onWatchAdDouble();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 text-center shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
        {/* Cute Mascot / Piggy Icon */}
        <div className="w-16 h-16 mx-auto -mt-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-slate-900 flex items-center justify-center text-3xl shadow-lg">
          💰
        </div>

        <h2 className="text-xl font-black text-white mt-3">Welcome Back!</h2>
        <p className="text-xs text-slate-300 mt-1">
          Your staff kept the shop humming while you were away for{' '}
          <span className="text-amber-300 font-bold">{formattedTime}</span>.
        </p>

        {/* Earning banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Offline Revenue Generated
          </span>
          <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">
            +{formatCoins(coinsEarned)} 🪙
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Rewarded Ad Double Button */}
          <button
            onClick={handleDoubleCollect}
            className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:brightness-110 cartoon-btn"
          >
            <Video className="w-4 h-4 fill-slate-950" />
            <span>WATCH AD → 2× DOUBLE ({formatCoins(doubleCoins)} 🪙)</span>
          </button>

          {/* Standard Collect Button */}
          <button
            onClick={handleNormalCollect}
            className="w-full py-2.5 rounded-2xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 cartoon-btn"
          >
            <Check className="w-4 h-4 text-slate-400" />
            <span>Collect Standard ({formatCoins(coinsEarned)} Coins)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
