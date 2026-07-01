# Lumio — İkon & Splash üretimi

Mağazalar **PNG** ikon setleri ister (SVG kabul edilmez). Kaynak olarak
`public/icon.svg` var. İki pratik yol:

## Yol A — Capacitor Assets (önerilen, ikon + splash birden)
1. 1024×1024 bir **PNG** kaynak hazırla: `resources/icon.png`
   (SVG'yi bir editörde/online araçta 1024 PNG olarak dışa aktar — ör.
   `public/icon.svg` dosyasını Figma/Inkscape/[svg→png] ile.)
   Splash için opsiyonel: `resources/splash.png` (2732×2732, ortada logo).
2. Kur ve üret:
```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --ios     # (Android için: --android)
```
Bu; iOS AppIcon setini ve LaunchScreen görsellerini otomatik üretip
`ios/App/App/Assets.xcassets` içine koyar.

## Yol B — Manuel
- App Store marketing icon: **1024×1024 PNG** (şeffaf değil, köşeleri düz —
  Apple otomatik yuvarlar). Xcode > Assets > AppIcon'a sürükle.
- Gerekli tüm boyutları bir "app icon generator" ile üret.

## Tasarım notu
Mevcut ikon: koyu gece arka planı + altın **H** + ateşböceği. Marka **Lumio**
olduğundan, istersen **H yerine "L"** veya bir fener/ışık simgesine geçebiliriz.
Söyle, `public/icon.svg`'yi güncelleyeyim (L'li versiyon).
