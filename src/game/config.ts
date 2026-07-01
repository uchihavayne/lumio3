// Online lider tablosu yapilandirmasi (Supabase).
//
// Gercek kuresel siralama icin:
//   1) supabase.com'da ucretsiz bir proje ac.
//   2) supabase/schema.sql dosyasindaki SQL'i SQL Editor'de calistir (tablo + RLS).
//   3) Proje ayarlarindan URL ve "anon public" anahtari al, asagiya yapistir.
// Bos birakilirsa oyun otomatik olarak YEREL + BOT lider tablosuna duser.
//
// Not: anon anahtari herkese acik (RLS ile guvenlik saglanir) — gizli degildir.

export const SUPABASE_URL = "https://txafbaltlcejemiivcov.supabase.co";
// "publishable" (istemci-güvenli) anahtar. Gizli "secret" anahtarı ASLA buraya
// koymayın — o yalnızca sunucu tarafı içindir.
export const SUPABASE_ANON_KEY = "sb_publishable_s1TOhWe4BtEtLLxai_A9hw_G89maKk5";

export function isOnlineLeaderboard(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

// Reklam: AÇIK. Native'de (iOS/Android) gerçek AdMob ödüllü reklam gösterilir;
// web/PWA'da veya reklam yüklenemezse doğrudan hediye verilir (sahte reklam yok).
export const ADS_ENABLED = true;

// AdMob kimlikleri — AdMob konsolundan alıp DEĞİŞTİRİN. (Aşağıdakiler Google'ın
// resmî TEST kimlikleridir; yayına çıkmadan gerçekleriyle değiştirin ve
// testMode'u false yapın. App ID'yi ayrıca iOS Info.plist / Android manifest'e
// eklemeniz gerekir — bkz. store/ADS.md)
export const ADMOB = {
  testMode: true,
  // Ödüllü reklam birimi (platforma göre)
  rewardedIos: "ca-app-pub-3940256099942544/1712485313", // TEST
  rewardedAndroid: "ca-app-pub-3940256099942544/5224354917", // TEST
  // App ID (Info.plist/manifest içine de gider)
  appIdIos: "ca-app-pub-3940256099942544~1458002511", // TEST
  appIdAndroid: "ca-app-pub-3940256099942544~3347511713", // TEST
};
