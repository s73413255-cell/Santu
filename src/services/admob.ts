/**
 * Google AdMob Integration & Rewarded Ad System
 * Prepared for Android AAB export with Capacitor / Cordova / Native Webview bindings
 * Includes standard Google AdMob Test Ad Units and non-intrusive rewarded flows.
 */

export const ADMOB_CONFIG = {
  // Official Google AdMob Test Ad Unit IDs for Android
  appId: 'ca-app-pub-3940256099942544~3347511713',
  rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',
  interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
  bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
  isTesting: true,
};

export type AdRewardType = 'double_offline' | 'frenzy_2x' | 'customer_rush' | 'free_upgrade';

export interface AdRewardRequest {
  type: AdRewardType;
  title: string;
  description: string;
  onReward: () => void;
}

export class AdMobManager {
  private isAdShowing = false;

  public isAvailable(): boolean {
    // In real Android wrapper (e.g. @capacitor-community/admob), checks window.AdMob
    return true;
  }

  public showRewardedAd(
    rewardRequest: AdRewardRequest,
    onStart: () => void,
    onComplete: () => void,
    onFailed: (err: string) => void
  ) {
    if (this.isAdShowing) {
      onFailed('An advertisement is already displaying.');
      return;
    }

    this.isAdShowing = true;
    onStart();

    // Check if running inside native Android bridge
    const win = window as unknown as {
      AdMob?: {
        showRewardVideoAd: (opts: { adId: string }, cb: (res: { reward: boolean }) => void) => void;
      };
    };

    if (win.AdMob && typeof win.AdMob.showRewardVideoAd === 'function') {
      win.AdMob.showRewardVideoAd({ adId: ADMOB_CONFIG.rewardedAdUnitId }, (res) => {
        this.isAdShowing = false;
        if (res && res.reward) {
          rewardRequest.onReward();
          onComplete();
        } else {
          onFailed('Ad closed before completion.');
        }
      });
      return;
    }

    // Fallback: Handled by custom RewardedAdModal in React UI with 5-second simulated video
  }

  public setAdShowing(state: boolean) {
    this.isAdShowing = state;
  }
}

export const admobService = new AdMobManager();
