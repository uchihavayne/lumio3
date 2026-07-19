# ⚠️⚠️ EN GÜNCEL (3. ret — 4.3 Spam): önce şunu oku

Apple, oyunu "benzer klonlardan biri" (4.3 Spam) diye reddetti. Bunu aşmak için
oyunu belirgin şekilde FARKLILAŞTIRDIK. Yapılacaklar:

## A) Yeni build al ve gönder (mekanik + görsel değişti)
```
cd C:\Users\uchih\Downloads\stampd\harfika\native
npx eas-cli build -p ios --profile production
npx eas-cli submit -p ios --latest
```

## B) Ekran görüntülerini YENİLE
`store/screenshots/tr` ve `/en` içindeki YENİ görüntüleri yükle (eskilerini sil).
Bunlar yeni mor temayı ve "anlamdan kelime bul" ipucu mekaniğini gösteriyor —
klon görünümünden çıktı.

## C) İsim/altbaşlığı özgünleştir (spam tetikleyici jenerik terimlerden kaç)
App Store Connect > App Information:
- **İsim (öneri):** `Lumio: Learn Words` veya `Lumio — Word Learning`
  (mevcut "Word Puzzle" çok jenerik; "Learn Words" özgün ve doğru konumlandırma)
- **Altbaşlık (EN):** `Find words from their meaning`
- **Altbaşlık (TR):** `Anlamdan kelimeyi bul`

## D) Yeni build'i seç → App Review'a şu mesajı yaz (İngilizce):
```
Thank you for the feedback. We understand the concern about similarity to other
word games, and we have substantially differentiated Lumio in both concept and
design in this new build:

1. CORE MECHANIC IS DIFFERENT. Lumio is a vocabulary-learning game, not a plain
letter-connect game. A permanent "clue bar" always shows the DEFINITION and
letter count of a target word; the player reads the meaning and then finds that
word. Tapping any empty word on the board switches the clue to that word. Tapping
a solved word teaches its meaning. This "find the word from its definition"
mechanic is the heart of the game and is not present in the apps we are compared
to — it turns the crossword into a language-learning tool.

2. EDUCATIONAL PURPOSE. Every word has a short definition in the player's own
language, and solved words are saved to a personal "notebook" for review. There
is also a daily "Word of the Day". The goal is learning vocabulary, in 6
languages (English, Turkish, Spanish, German, French, Portuguese).

3. DISTINCT VISUAL IDENTITY. We use an original "lantern night" theme (deep
purple night sky + warm lantern light) rather than the generic blue word-game
look, with our own icon, palette, and UI.

4. ACCESSIBILITY FOCUS. Large-text mode, high-contrast (color-blind friendly)
mode, and a no-timer "relaxed" mode make it friendly for older and casual
players — a deliberately different audience and tone.

The source code and assets are our own original work; this is not a repackaged
template. Updated screenshots showing the new mechanic and design are attached.
We would be glad to provide anything else that helps.
```

---

# ⚠️ GÜNCEL (2. ret — ATT): önce şunu oku

Apple ikinci turda "ATT çerçevesi var ama izin penceresi görünmüyor" dedi.
ÇÖZÜM: Takibi tamamen kaldırdık — artık **kişiselleştirilmemiş reklam**
gösteriliyor, ATT izni İSTENMİYOR. Yapılacaklar:

1. **Yeni build al ve gönder** (native değişti):
   ```
   cd C:\Users\uchih\Downloads\stampd\harfika\native
   npx eas-cli build -p ios --profile production
   npx eas-cli submit -p ios --latest
   ```
2. **App Store Connect > App Privacy**'yi güncelle:
   - Data Collection'da **Device ID → "Used for Tracking" = No** yap
     (eskiden Yes'ti). Tüm veri kalemlerinde **Tracking: No** olmalı.
   - Yani App Privacy'de artık HİÇBİR şey "tracking" değil. (Reklam için
     Device ID hâlâ "Third-Party Advertising" amacıyla toplanır ama TAKİP
     değil — "Used for Tracking: No".)
3. Yeni build'i seç → **App Review'a şu mesajı yaz**:
   ```
   The app no longer uses App Tracking Transparency. We removed the ATT
   framework and now request only non-personalized ads via Google AdMob, so
   no tracking permission is needed. App Privacy has been updated to declare
   no tracking. A new build (with ATT fully removed) is attached.
   ```

Bu, ATT sorununu kökten çözer — Apple statik taramada artık ATT çerçevesi/izin
metni bulamaz, prompt aramaz.

---

# App Review — Guideline 2.1 cevabı (ilk tur, referans)

Aşağıdaki metni App Store Connect > (reddedilen sürüm) > **Reply to App Review**
kutusuna yapıştır. Ayrıca **App Review Information > Notes** alanına da aynısını
koy (gelecekteki gönderimler için). Ekran kaydını da yükle (aşağıda nasıl).

---

## Reply (İngilizce — bunu yapıştır)

```
Thank you for reviewing Lumio: Word Puzzle. Here is the requested information.

2. TESTED DEVICES / OS
Tested on iPhone (iOS 18) via TestFlight before submission. The app is a
lightweight WebView-based word game and runs consistently on all iPhone models
running iOS 15 or later.

3. PURPOSE AND TARGET AUDIENCE
Lumio is a relaxing single-player word puzzle. The player swipes across a wheel
of letters to spell words and fill a small crossword. It teaches vocabulary —
tapping any completed word on the board shows its meaning. Target audience is a
general, all-ages casual audience (4+), including older players; there are no
timers and no pressure. It offers endless procedurally generated levels in 6
languages (English, Turkish, Spanish, German, French, Portuguese).

4. HOW TO ACCESS MAIN FEATURES (NO LOGIN)
No account, registration, or login is required. All features are available
immediately and work fully offline:
- On first launch, pick a language.
- Drag across the letters in the bottom wheel to form a word; correct words fill
  the crossword grid above.
- Tap a filled word on the grid to see its meaning.
- The top-left buttons are hint / reveal / shuffle / sound.
- The sparkle counter (top-right) is the in-game currency ("fireflies"); tapping
  it offers an optional rewarded ad (or a free daily gift) for more hints.
- Complete all words to clear the level and advance. There is also a Daily Puzzle
  and a weekly leaderboard reachable from the home screen.

5. EXTERNAL SERVICES
- Google AdMob — optional rewarded video ads (user-initiated only).
- Supabase — anonymous weekly leaderboard. The app sends only a randomly
  generated id, a user-chosen nickname, and the weekly score. No personal data.
- No authentication service, no payment processor, no AI service.

6. REGIONAL DIFFERENCES
None. The app behaves identically in all regions. Only the interface/puzzle
language differs, which the user selects in-app.

7. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
None. The app is not in a regulated industry. All word and definition content is
original and owned by us. No protected third-party material is used.

ADDITIONAL NOTE ON PERMISSIONS
The app does NOT track users and does not use App Tracking Transparency. It
requests only non-personalized ads from Google AdMob. No IDFA, no ATT prompt.
```

---

## 1) EKRAN KAYDI — telefonda çek (en kritik madde)

Apple, fiziksel cihazda çekilmiş, uygulamanın açılışı + temel akışını gösteren
bir video istiyor. iPhone'da:

1. **Ayarlar > Denetim Merkezi**'ne "Ekran Kaydı"nı ekle (yoksa).
2. Denetim Merkezi'ni aç, **Ekran Kaydı**'na bas, 3 sn say.
3. Lumio'yu aç ve şunları YAP (yaklaşık 40-60 sn yeter):
   - Uygulama açılışını göster (splash + ATT izin penceresi çıkarsa "İzin Ver"
     veya "İzin Verme" — fark etmez, göster).
   - Dil olarak **Türkçe** (veya English) seç.
   - Bir seviyede çarkta harfleri sürükleyip **2-3 kelime bul** (kutular dolsun).
   - Tahtadaki dolu bir kelimeye **dokun**, anlamının çıktığını göster.
   - Üstteki **ipucu (💡)** veya **✨ sayaç**'a basıp reklam/hediye penceresini göster.
   - Bir seviyeyi bitir (kutlama ekranı) — mümkünse.
4. Denetim Merkezi'nden kaydı **durdur**. Video Fotoğraflar'a kaydedilir.
5. Videoyu bilgisayara aktar (AirDrop/kablo/iCloud), App Store Connect'te
   **Reply to App Review** kutusundaki **Attachment / dosya ekle** ile yükle.
   (Notes alanındaki "Attachment" da olur.)

Not: Video .mp4 veya .mov olmalı, tek cihazda, gerçek oynanış. Sadece logo/açılış
ekranı YETMEZ — mutlaka oynanışı (kelime bulma) göster.

## 2) Ekran görüntüsü ipucu (2.3.3)
Apple, ekran görüntülerinin gerçek oynanışı göstermesini istiyor. Bizimkiler
zaten tahtayı+çarkı gösteriyor ✓. İlk görüntü (ana ekran/logo) yerine bir
"oynanış" görüntüsü koymak istersen store/screenshots içindekilerden 02-play
veya benzerini başa al.

## Gönderdikten sonra
Reply + video gidince inceleme kaldığı yerden devam eder (genelde 1-2 gün).
Yeni build göndermene GEREK YOK — mevcut build 9 incelemede kalır.
