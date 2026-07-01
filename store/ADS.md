# Lumio — AdMob (reklam) kurulumu

Kod HAZIR: `src/game/ads.ts` + `src/game/config.ts` (`ADS_ENABLED = true`).
Şu an **Google TEST** reklam kimlikleri kullanılıyor (`ADMOB.testMode = true`).
Yayına çıkmadan aşağıyı yapın.

## 1) AdMob hesabı & birimler
1. https://admob.google.com → uygulamanı ekle (iOS ve Android ayrı kayıt).
2. Her platform için bir **Rewarded (ödüllü)** reklam birimi oluştur.
3. `src/game/config.ts > ADMOB` içine gerçek değerleri yaz ve `testMode: false` yap:
   - `appIdIos`, `appIdAndroid` (App ID: `ca-app-pub-XXX~XXX`)
   - `rewardedIos`, `rewardedAndroid` (Ad unit: `ca-app-pub-XXX/XXX`)

## 2) Eklenti (native, CI'da otomatik)
```bash
npm i @capacitor-community/admob
npx cap sync
```
(Codemagic `codemagic.yaml` içinde `cap sync` çalıştırır; eklentiyi
package.json'a eklersen CI de kurar.)

## 3) iOS — Info.plist (Capacitor `ios/App/App/Info.plist`)
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXX~XXX</string>          <!-- appIdIos -->
<key>NSUserTrackingUsageDescription</key>
<string>Bu izin, sana daha uygun reklamlar göstermek için kullanılır.</string>
<!-- SKAdNetwork kimlikleri (AdMob dokümanındaki listeyi ekleyin) -->
```

## 4) Android — `android/app/src/main/AndroidManifest.xml`
```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-XXX~XXX"/>       <!-- appIdAndroid -->
```

## 5) Rıza / gizlilik
- `ads.ts > initAds()` ilk açılışta **UMP rızası** ve iOS'ta **ATT** ister.
- Gizlilik politikasında reklam açıklaması var (`store/PRIVACY.md`) — App Privacy /
  Data safety etiketlerini "reklam/tanımlayıcı" olarak doldur.

## Davranış
- **Native + eklenti:** kullanıcı ateşböceği isteyince gerçek ödüllü reklam;
  izlenirse +3, izlenmezse hediye yok.
- **Web/PWA veya reklam yüklenemedi:** otomatik olarak **hediye** (+3) verilir
  (kullanıcı çıkmaza girmez, sahte reklam gösterilmez).
