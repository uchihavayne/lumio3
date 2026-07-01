// Ödüllü reklam köprüsü.
//  - Native (iOS/Android) + AdMob eklentisi varsa: gerçek ödüllü reklam.
//  - Web/PWA veya eklenti yoksa: sessizce false döner (motor hediyeye düşer).
// Eklenti ismi bir DEĞİŞKENle dinamik import edilir; böylece eklenti kurulu
// olmasa da web derlemesi (tsc + vite) BOZULMAZ.

import { ADS_ENABLED, ADMOB } from "./config";

const PKG = "@capacitor-community/admob";
let inited = false;

function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
}

function platform(): string {
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() ?? "web";
}

/** İlk açılışta: AdMob'u başlat + rıza (UMP/GDPR) ve iOS izleme izni (ATT). */
export async function initAds(): Promise<void> {
  if (!ADS_ENABLED || !isNative() || inited) return;
  try {
    const mod = await import(/* @vite-ignore */ PKG);
    const AdMob = mod.AdMob;
    await AdMob.initialize({ initializeForTesting: ADMOB.testMode });
    // GDPR/AB rızası
    try {
      const info = await AdMob.requestConsentInfo();
      if (info?.isConsentFormAvailable && info?.status === "REQUIRED") {
        await AdMob.showConsentForm();
      }
    } catch {
      /* rıza yoksa devam */
    }
    // iOS App Tracking Transparency
    try {
      await AdMob.requestTrackingAuthorization();
    } catch {
      /* ATT yoksa devam */
    }
    inited = true;
  } catch {
    /* eklenti yok / web -> yok say */
  }
}

/** Bir ödüllü reklam gösterir. Ödül alındıysa true, aksi halde false. */
export async function showRewardedAd(): Promise<boolean> {
  if (!ADS_ENABLED || !isNative()) return false;
  try {
    const mod = await import(/* @vite-ignore */ PKG);
    const AdMob = mod.AdMob;
    const Events = mod.RewardAdPluginEvents;
    await initAds();
    const adId = platform() === "ios" ? ADMOB.rewardedIos : ADMOB.rewardedAndroid;
    await AdMob.prepareRewardVideoAd({ adId, isTesting: ADMOB.testMode });
    return await new Promise<boolean>((resolve) => {
      let rewarded = false;
      const onReward = AdMob.addListener(Events.Rewarded, () => {
        rewarded = true;
      });
      const onDismiss = AdMob.addListener(Events.Dismissed, () => {
        onReward?.remove?.();
        onDismiss?.remove?.();
        resolve(rewarded);
      });
      AdMob.showRewardVideoAd().catch(() => resolve(false));
    });
  } catch {
    return false;
  }
}
