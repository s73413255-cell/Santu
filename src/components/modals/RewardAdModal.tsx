import React, { useState, useEffect } from 'react';
import { X, Video, Zap, Users, ArrowUpCircle, Play, CheckCircle } from 'lucide-react';
import { soundService } from '../../services/sound';
import { ADMOB_CONFIG } from '../../services/admob';
import confetti from 'canvas-confetti';

interface RewardAdModalProps {
  onTriggerFrenzy: () => void;
  onTriggerRush: () => void;
  onFreeUpgradeBoost: () => void;
  onClose: () => void;
}

export const RewardAdModal: React.FC<RewardAdModalProps> = ({
  onTriggerFrenzy,
  onTriggerRush,
  onFreeUpgradeBoost,
  onClose,
}) => {
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [currentRewardAction, setCurrentRewardAction] = useState<(() => void) | null>(null);
  const [adTitle, setAdTitle] = useState('');

  // Ad countdown loop
  useEffect(() => {
    let timer: number | undefined;
    if (isPlayingAd && adCountdown > 0) {
      timer = window.setInterval(() => {
        setAdCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isPlayingAd && adCountdown <= 0) {
      // Ad finished successfully!
      setIsPlayingAd(false);
      if (currentRewardAction) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
        soundService.playLevelUp();
        currentRewardAction();
        setCurrentRewardAction(null);
      }
      onClose();
    }
    return () => clearInterval(timer);
  }, [isPlayingAd, adCountdown, currentRewardAction, onClose]);

  const handleStartAd = (title: string, action: () => void) => {
    soundService.playClick();
    setAdTitle(title);
    setCurrentRewardAction(() => action);
    setAdCountdown(5);
    setIsPlayingAd(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      {/* If playing simulated ad */}
      {isPlayingAd ? (
        <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500 rounded-3xl p-5 text-white shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-150">
          {/* Ad Header with AdMob Badge */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800 pb-2">
            <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
              Google AdMob Test Ad
            </span>
            <span className="font-mono text-amber-300 font-bold">Reward in: {adCountdown}s</span>
          </div>

          {/* Ad Video Simulator Screen */}
          <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-slate-700 flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-3xl mb-2 animate-bounce">
              🎮
            </div>
            <h3 className="font-extrabold text-sm text-white">{adTitle}</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Sponsored Partner Preview • Thank you for supporting Small Shop Tycoon!
            </p>

            {/* Ad progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
              <div
                className="h-full bg-emerald-400 transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - adCountdown) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Ad status info */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-300 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Verifying reward... Please keep open</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1">
            Unit: {ADMOB_CONFIG.rewardedAdUnitId.slice(0, 24)}...
          </span>
        </div>
      ) : (
        /* Ad Offer Selection Menu */
        <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 text-white relative shadow-2xl animate-in zoom-in-95 duration-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-black text-white">Rewarded Boosts</h2>
              <p className="text-xs text-slate-400">Watch an optional short video for huge perks</p>
            </div>
          </div>

          {/* Boost Offer Cards */}
          <div className="space-y-2.5 my-4">
            {/* 1. Frenzy 2x coins */}
            <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-lg text-orange-400">
                  <Zap className="w-5 h-5 fill-orange-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">2× Coins Frenzy</h3>
                  <p className="text-[11px] text-slate-400">Double all checkout coins for 60s</p>
                </div>
              </div>
              <button
                onClick={() => handleStartAd('2× Coins Frenzy', onTriggerFrenzy)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md cartoon-btn"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>WATCH</span>
              </button>
            </div>

            {/* 2. Customer Rush */}
            <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">Free Customer Rush</h3>
                  <p className="text-[11px] text-slate-400">Floods the shop with 10 shoppers</p>
                </div>
              </div>
              <button
                onClick={() => handleStartAd('Customer Rush', onTriggerRush)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs flex items-center gap-1 shadow-md cartoon-btn"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>WATCH</span>
              </button>
            </div>

            {/* 3. Free Upgrade Boost */}
            <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg text-emerald-400">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-white">Free Upgrade Boost</h3>
                  <p className="text-[11px] text-slate-400">Instant +350 bonus coins grant</p>
                </div>
              </div>
              <button
                onClick={() => handleStartAd('Free Upgrade Boost', onFreeUpgradeBoost)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md cartoon-btn"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>WATCH</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center text-slate-500">
            Never forced • 100% player choice • AdMob Android ready
          </p>
        </div>
      )}
    </div>
  );
};
