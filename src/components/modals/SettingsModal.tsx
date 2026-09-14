import React, { useState } from 'react';
import { X, Volume2, VolumeX, Music, RotateCcw, HelpCircle, Smartphone, Check } from 'lucide-react';
import { GameSettings } from '../../types/game';
import { soundService } from '../../services/sound';
import { ADMOB_CONFIG } from '../../services/admob';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetGame: () => void;
  onReplayTutorial: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetGame,
  onReplayTutorial,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAndroidInfo, setShowAndroidInfo] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 text-white relative shadow-2xl animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-base font-black text-white mb-1">Game Settings</h2>
        <p className="text-xs text-slate-400 mb-4">Customize sound, controls, and Android preferences</p>

        <div className="space-y-3">
          {/* Sound Effects toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                {settings.sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Sound Effects</h3>
                <p className="text-[11px] text-slate-400">Cash register, coins, and clicks</p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.sfxEnabled;
                soundService.setSfxVolume(next);
                onUpdateSettings({ sfxEnabled: next });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cartoon-btn ${
                settings.sfxEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  settings.sfxEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Happy Background Music toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-yellow-400">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Happy BGM Music</h3>
                <p className="text-[11px] text-slate-400">Cheerful procedural music loop</p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.musicEnabled;
                soundService.setMusicVolume(next);
                onUpdateSettings({ musicEnabled: next });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cartoon-btn ${
                settings.musicEnabled ? 'bg-yellow-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  settings.musicEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Replay Tutorial Button */}
          <button
            onClick={() => {
              soundService.playClick();
              onReplayTutorial();
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold cartoon-btn"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span>How to Play (Replay Tutorial)</span>
            </div>
            <span className="text-slate-500">➔</span>
          </button>

          {/* Android AAB & AdMob Info Accordion */}
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800 text-xs">
            <div
              onClick={() => setShowAndroidInfo(!showAndroidInfo)}
              className="flex items-center justify-between cursor-pointer font-bold"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span>Android AAB & AdMob Export</span>
              </div>
              <span className="text-slate-500">{showAndroidInfo ? '▲' : '▼'}</span>
            </div>

            {showAndroidInfo && (
              <div className="mt-2.5 pt-2 border-t border-slate-750 text-[11px] text-slate-300 space-y-1">
                <p>
                  <strong>AdMob App ID:</strong> <code className="text-amber-300">{ADMOB_CONFIG.appId}</code>
                </p>
                <p>
                  <strong>Rewarded Unit:</strong> <code className="text-amber-300">{ADMOB_CONFIG.rewardedAdUnitId}</code>
                </p>
                <p className="text-slate-400 mt-1">
                  Ready to package into Android Android Studio / Capacitor AAB for Google Play Store deployment.
                </p>
              </div>
            )}
          </div>

          {/* Reset Save Data */}
          <div className="pt-2">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Save Data</span>
              </button>
            ) : (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center justify-between">
                <span className="text-xs text-red-300 font-bold">Wipe all progress?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onResetGame();
                      onClose();
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-black"
                  >
                    YES, RESET
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
