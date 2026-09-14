import React, { useState } from 'react';
import { GameState, Mission, Achievement } from '../../types/game';
import { formatCoins } from '../../utils/formatters';
import { soundService } from '../../services/sound';
import { CheckSquare, Trophy, Check, Gift } from 'lucide-react';

interface MissionsDrawerProps {
  state: GameState;
  onClaimMission: (missionId: string) => void;
  onClaimAchievement: (achievementId: string) => void;
}

export const MissionsDrawer: React.FC<MissionsDrawerProps> = ({
  state,
  onClaimMission,
  onClaimAchievement,
}) => {
  const [subTab, setSubTab] = useState<'missions' | 'achievements'>('missions');

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900 text-white p-3 flex flex-col">
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-3 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => {
            soundService.playClick();
            setSubTab('missions');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cartoon-btn ${
            subTab === 'missions'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Active Missions</span>
          {state.missions.filter((m) => m.completed && !m.claimed).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => {
            soundService.playClick();
            setSubTab('achievements');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cartoon-btn ${
            subTab === 'achievements'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Trophies & Badges</span>
          {state.achievements.filter((a) => a.unlocked && a.rewardCoins > 0).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Sub-tab: Missions */}
      {subTab === 'missions' && (
        <div className="flex flex-col gap-2.5">
          {state.missions.map((mission) => {
            const isDone = mission.completed;
            const isClaimed = mission.claimed;
            const progressPct = Math.min(100, Math.round((mission.current / mission.target) * 100));

            return (
              <div
                key={mission.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isClaimed
                    ? 'bg-slate-850/40 border-slate-800 opacity-60'
                    : isDone
                    ? 'bg-slate-850 border-amber-500/60 shadow-md shadow-amber-500/10'
                    : 'bg-slate-850 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-white">{mission.title}</h3>
                      {isClaimed && (
                        <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.2 rounded-full font-bold">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mission.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 whitespace-nowrap">
                        {Math.min(mission.target, mission.current)} / {mission.target}
                      </span>
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div>
                    {isClaimed ? (
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-500" />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          soundService.playCoin();
                          onClaimMission(mission.id);
                        }}
                        disabled={!isDone}
                        className={`px-3 py-2 rounded-xl font-black text-xs flex flex-col items-center justify-center cartoon-btn shadow-md whitespace-nowrap ${
                          isDone
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 animate-bounce'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" /> CLAIM
                        </span>
                        <span className="text-[10px] font-mono opacity-90 mt-0.5">
                          +{formatCoins(mission.rewardCoins)} 🪙
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-tab: Achievements */}
      {subTab === 'achievements' && (
        <div className="flex flex-col gap-2.5">
          {state.achievements.map((ach) => {
            const isUnlocked = ach.unlocked;
            const progressPct = Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100));

            return (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isUnlocked
                    ? 'bg-slate-850 border-amber-400/40 shadow-md'
                    : 'bg-slate-850/50 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border shadow-inner ${
                      isUnlocked
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {ach.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-white">{ach.title}</h3>
                      {isUnlocked && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.min(ach.progress, ach.maxProgress)} / {ach.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reward display */}
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400 font-mono block">
                    +{formatCoins(ach.rewardCoins)} 🪙
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isUnlocked ? 'Completed' : 'Reward'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
