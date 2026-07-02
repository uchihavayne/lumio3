# Lumio — App Store Reklam & Tanıtım Planı

> Önkoşul: Apple Search Ads yalnızca **yayında olan** uygulamalar için çalışır.
> Önce uygulama App Store'da onaylanıp canlıya çıkmalı; reklamlar ondan sonra açılır.

## 1) Apple Search Ads (App Store içi reklam)

App Store'da arama sonuçlarının en üstünde "Ad" rozetiyle çıkmak. İki katman var:

### Basic (önerilen başlangıç — 5 dk kurulum)
- **ads.apple.com** → geliştirici Apple hesabınla (12hrsofficial@gmail.com) gir.
- "Search Ads Basic" seç → uygulama olarak **Lumio: Word Puzzle**'ı seç.
- Ülke: önce **Türkiye + ABD** (TR ucuz kurulum maliyeti, US hacim).
- **Yükleme başına maksimum ödeme (CPI hedefi):** kelime oyunlarında makul
  başlangıç: TR için $0.30–0.60, US için $1.00–2.00.
- Aylık bütçe: küçük başla — **$100/ay** test bütçesi. Basic'te anahtar kelime
  seçilmez; Apple otomatik eşleştirir. Kredi kartı ekle, yayına al.
- 2 hafta sonra bak: yükleme maliyeti hedefin altındaysa bütçeyi artır.

### Advanced (kontrol isteyince — anahtar kelime bazlı)
Kampanya yapısı (klasik 4'lü):
1. **Brand** — "lumio" (kendi adını koruma, ucuz)
2. **Exact/Generic** — birebir anahtar kelimeler (aşağıdaki listeler)
3. **Discovery/Broad** — geniş eşleme + Search Match AÇIK (yeni kelime keşfi)
4. **Competitor** — rakip oyun adları (word connect, words of wonders, wow...)

Discovery'de dönüşüm getiren kelimeleri düzenli olarak Exact kampanyasına taşı,
Exact'te CPT (tıklama başı) teklifini kâr edene göre ayarla.

**Anahtar kelime listeleri (Exact grubuna):**
- TR: `kelime oyunu, kelime bulmaca, kelime bağlama, bulmaca oyunu, kelime avı,
  çengel bulmaca, sözcük oyunu, kelime birleştirme, zeka oyunu, offline oyun`
- EN: `word puzzle, word connect, word game, crossword puzzle, word search,
  anagram game, vocabulary game, brain game, offline word game, daily puzzle`
- ES: `juego de palabras, sopa de letras, crucigrama, conectar letras`
- DE: `wortspiel, kreuzworträtsel, wörter verbinden, buchstaben spiel`
- FR: `jeu de mots, mots croisés, relier les lettres, jeu de lettres`
- PT: `jogo de palavras, caça palavras, palavras cruzadas, ligar letras`

**Bütçe önerisi (Advanced):** günlük $5–10 ile başla; ilk hafta sadece TR+US;
CPI < $1 tutturursan ülke ekle (UK, DE, FR, ES, BR, MX).

### Ölçüm
- App Store Connect → **Analytics**: izlenim → ürün sayfası → yükleme dönüşümü.
- Search Ads panelinde "Installs (Tap-Through)" ana metrik.
- İyi işaret: arama sonucu dönüşüm oranı (CR) > %30; kötüyse ekran
  görüntülerini/ilk 3 saniyeyi değiştir (ASO bölümü).

## 2) Ücretsiz / organik kanallar (önce bunlar)

1. **ASO** (mağaza optimizasyonu — en yüksek getiri):
   - Başlık + alt başlık anahtar kelimeleri zaten APP_STORE.md'de.
   - 6 dil için **yerelleştirilmiş mağaza sayfası** aç (App Store Connect →
     dil ekle; açıklamalar APP_STORE.md'de EN+TR hazır, diğerlerini iste benden).
   - Ekran görüntülerine kısa metin bindir: "Sonsuz seviye", "6 dil",
     "Anlamını öğren", "Çevrimdışı".
2. **Günlük bulmaca paylaşımı**: oyuncular sonucu paylaştıkça (Wordle etkisi)
   organik kurulum gelir — paylaşım metnine App Store linki eklenecek (yayın
   sonrası link belli olunca).
3. **TikTok/Reels/Shorts**: 15–30 sn "çarkla kelime bağlama" videoları; kelime
   oyunu kitlesi bu formatta çok ucuz erişiliyor. Haftada 2–3 video yeter.
4. **Promo kodlar**: App Store Connect her sürümde 100 promo kod verir —
   inceleme/oyun gruplarına dağıt.
5. **Product Page Optimization (A/B)**: canlıya çıkınca ikon ve ilk ekran
   görüntüsü için Apple'ın kendi A/B testi (ücretsiz).

## 3) Zaman çizelgesi

| Hafta | İş |
|---|---|
| 0 | TestFlight test → Review'a gönder |
| 1 | Onay + canlı. Pages linkleri güncelle. Promo kod dağıt. |
| 1-2 | Search Ads **Basic** aç ($100/ay, TR+US). TikTok'a ilk 3 video. |
| 3-4 | Analytics'e bak: CR düşükse görselleri değiştir; CPI iyiyse bütçe artır. |
| 5+ | Advanced'e geç (anahtar kelime kontrolü), ülke genişlet. |

## 4) Gelir notu (v1 reklamsız!)

Şu anki iOS sürümü Expo/WebView kabında olduğundan **AdMob çalışmıyor** —
oyun tamamen reklamsız ve TAKİPSİZ (App Privacy basit, ATT yok, inceleme kolay).
Kavanoz butonu reklam yerine küçük ücretsiz hediye veriyor.
Gelir için v1.1 seçenekleri (öncelik sırasıyla):
1. **IAP**: "Ateşböceği paketi" (99₺/199₺) + "Destekçi paketi" — en kolay, ATT gerektirmez.
2. **react-native-google-mobile-ads** köprüsü ile gerçek ödüllü reklam (WebView
   ↔ native mesajlaşma; 1-2 saatlik iş, istersen ben kurarım).
