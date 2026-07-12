# Lumio — App Store (iOS) çıkış rehberi

iOS önce, Android sonra. Aşağıdaki metinleri App Store Connect'e yapıştırın.

## 1) İsim / ASO (App Store Connect)

- **App Name (max 30):** `Lumio: Word Puzzle`
- **Subtitle (max 30):** `Connect letters & crossword`
  - TR alternatif: `Kelime bağla & bulmaca`
- **Promotional Text (max 170, sürüm gerektirmeden değişir):**
  - EN: `Relax with endless word puzzles — swipe to connect letters, fill the crossword, and learn a new word every day. 6 languages, offline, no timers.`
  - TR: `Sonsuz kelime bulmacalarıyla rahatla — harfleri kaydır, crossword'ü doldur, her gün yeni bir kelime öğren. 6 dil, çevrimdışı, süre baskısı yok.`
- **Keywords (max 100, virgülle, boşluksuz):**
  `word,connect,crossword,letters,vocabulary,brain,anagram,puzzle,search,daily,offline,relax,spelling`
- **Bundle ID:** `com.lumio.game`
- **Category:** Games → **Word** (İkincil: Puzzle)

> Not: "Word Connect" tek başına başka bir popüler oyunun adı — **başlık** olarak
> birebir kullanma; keyword alanında geçmesi sorun değil. "Lumio: Word Puzzle" güvenli.

## 2) Açıklama (Description — EN)

```
Lumio is a calm, beautiful word puzzle. Swipe to connect letters, fill the
crossword, and light up new words — with a cozy lantern-and-fireflies vibe.

• Endless levels — never run out
• 6 languages: English, Türkçe, Español, Deutsch, Français, Português
• Learn as you play: tap any word to see its meaning + your word notebook
• Daily Puzzle everyone shares, and a Word of the Day
• Relaxed mode, large text & high-contrast options — friendly for everyone
• Hints, a reveal-a-word joker, streaks, achievements and color themes
• Weekly leaderboard, offline play, no account needed

No pressure, no timers — just you, the letters, and a quiet glow.
```

## 3) Açıklama (Türkçe)

```
Lumio sakin ve şık bir kelime bulmacası. Harfleri kaydırarak birleştir,
crossword'ü doldur, yeni kelimeleri ışıklandır — fener ve ateşböceği atmosferiyle.

• Sonsuz seviye — asla tükenmez
• 6 dil: Türkçe, İngilizce, İspanyolca, Almanca, Fransızca, Portekizce
• Oynarken öğren: kelimeye dokun, anlamını gör + kelime defteri
• Herkese aynı Günlük Bulmaca ve Günün Kelimesi
• Rahat mod, büyük yazı ve yüksek kontrast — herkes için dostça
• İpucu, "kelimeyi aç" jokeri, seriler, başarımlar ve renk temaları
• Haftalık lider tablosu, çevrimdışı oyun, hesap gerekmez

Baskı yok, süre yok — sadece sen, harfler ve sakin bir ışıltı.
```

## 4) Zorunlu alanlar
- **Privacy Policy URL:** `store/privacy.html`'i bir yere yükle (GitHub Pages / Netlify /
  Vercel), URL'yi ver. (E-posta: 12hrsofficial@gmail.com — dolduruldu.)
- **Support URL** ve **Marketing URL** (basit bir site/landing yeter).
- **App Privacy (nutrition label):** GÜNCEL DURUM: **reklam AÇIK**
  (AdMob, RN köprüsüyle — ödüllü reklam) + **online lider tablosu AÇIK**. İşaretle:
  - **Identifiers → Device ID**: reklam için — "Third-Party Advertising",
    Tracking: **Yes** (ATT izni uygulama açılışında isteniyor).
  - **Identifiers → User ID**: rastgele oyuncu kimliği (lider tablosu) —
    "App Functionality", Linked: No, Tracking: No.
  - **Usage Data → Product Interaction**: reklam ölçümü — Third-Party Advertising.
  - **User Content → Other**: oyuncunun seçtiği takma ad (lider tablosu).
- **Age rating:** Anket → şiddet yok, **reklam VAR** kutusunu işaretle → genelde **4+**.
- **Encryption:** `ITSAppUsesNonExemptEncryption = NO` (özel şifreleme yok).

## 5) Görsel varlıklar
- **App icon:** 1024×1024 PNG (marketing) + tüm boyutlar. (SVG'den üretilecek — bkz. `store/ICONS.md`.)
- **Screenshots:** 6.7" ve 6.5" iPhone zorunlu (iPad destekliyorsan onlar da).
  En az 3-4: ana ekran, bir seviye (çark+crossword), günlük bulmaca, ayarlar/temalar.
- **App Preview** (video) opsiyonel.

## 6) Derleme — Mac YOKSA (bulut CI, önerilen)
`codemagic.yaml` hazır. https://codemagic.io → repoyu bağla → `ios-appstore`
workflow'unu çalıştır. Codemagic'in **macOS makinesinde** derlenir; senin Mac'in
gerekmez. Bağlaman gerekenler:
- **App Store Connect API Key** (Issuer ID + Key ID + .p8) → otomatik imzalama.
- App Store Connect'te `com.lumio.game` bundle ile uygulama kaydı.
Sonuç: TestFlight'a otomatik yükler (`submit_to_testflight: true`).

**Mac VARSA (alternatif):**
```bash
npm i @capacitor/core @capacitor/ios @capacitor-community/admob
npm run build && npx cap add ios && npx cap sync ios && npx cap open ios
```
Xcode'da: Signing + AdMob Info.plist (bkz. `store/ADS.md`) → Archive → Distribute.

## 7) Gerekli hesaplar/araçlar
- **Apple Developer Program** — yıllık 99$ (VAR).
- **Mac YOK** → Codemagic (yukarıda) veya Ionic Appflow / GitHub Actions macOS runner.
- (Android sonra) Google Play Console — tek sefer 25$.

## ⚠️ Yayın öncesi durum
- **Reklam AÇIK** (`config.ts ADS_ENABLED=true`, `store/ADS.md`): native'de gerçek
  AdMob ödüllü reklam, web'de hediye. Şu an **TEST** kimlikleri — yayından önce
  gerçek AdMob kimliklerini gir ve `testMode:false` yap.
- **Online lider tablosu AÇIK istendi** ama **Supabase anahtarları gerekli**:
  `supabase/schema.sql`'i çalıştır, URL + anon anahtarı `src/game/config.ts`'e yapıştır.
  (Anahtarları ver, ben yapıştırıp doğrularım.)
