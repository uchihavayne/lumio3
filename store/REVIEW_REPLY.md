# App Review — Guideline 2.1 cevabı

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
On launch the app shows the App Tracking Transparency (ATT) prompt because it
displays AdMob ads. Regardless of the user's choice, the game is fully playable.
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
