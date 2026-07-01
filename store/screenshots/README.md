# App Store ekran görüntüleri

4 adet çerçeveli + başlıklı mağaza görseli (SVG, **1290×2796 = iPhone 6.7"**):

1. `01-home.svg` — Ana ekran (Oyna / Günlük / Günün Kelimesi / bölüm haritası)
2. `02-play.svg` — Oynanış (harf çarkı + crossword) — kahraman görsel
3. `03-daily.svg` — Günlük Bulmaca sonucu + seri + paylaşım
4. `04-themes.svg` — Temalar · 6 dil · erişilebilirlik · rozetler

## PNG'ye çevir (mağaza SVG kabul etmez)
Herhangi bir araçla SVG'yi PNG'ye ver (aynı boyut):
- Hızlı: bir SVG→PNG online aracı, ya da tarayıcıda aç → ekran görüntüsü.
- Toplu (Node + sharp):
  ```bash
  npm i -D sharp
  node -e "const s=require('sharp');['01-home','02-play','03-daily','04-themes'].forEach(f=>s('store/screenshots/'+f+'.svg').png().resize(1290,2796).toFile('store/screenshots/'+f+'.png'))"
  ```

## Boyutlar
- **6.7"** (zorunlu): 1290×2796 — bu dosyalar.
- **6.5"** (zorunlu): 1242×2688 — aynı SVG'leri bu boyuta ölçekle.
- iPad destekliyorsan ayrıca 12.9" (2048×2732).

> Not: Bunlar "çerçeveli + sloganlı" tasarım görsellerdir (App Store bunları kabul eder).
> İstersen gerçek cihaz ekran görüntüsü de eklenebilir (uygulamayı yükledikten sonra).
