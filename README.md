# 🏮 Lumio — Kelime Macerası

Words of Wonders mantığında (harf çarkı + crossword) ama **kendine özgü tarz ve mekaniğe** sahip bir mobil kelime oyunu. Web teknolojisiyle yazıldı; **PWA** olarak telefona kurulur ve çevrimdışı çalışır, Android/iOS'a **Capacitor** ile native paketlenir, geliştirme sırasında **localhost**'ta çalışır.

> **İsim:** Oyun global bir marka olarak **Lumio** adıyla yayınlanır (ışık/fener temasına uygun, her dilde kolay). Proje klasörü `harfika/` olarak kaldı.

## 📱 Final / mobil cila

- **Telefon-öncelikli arayüz (v2):** Sade üst bar — geri (‹) · seviye adı + **ilerleme çubuğu** (bulunan/toplam kelime) · ateşböceği sayacı. Daha büyük harf çarkı ve dokunma alanları, geniş ekranda "telefon kabı" görünümü.
- **PWA:** `manifest.webmanifest` + `public/sw.js` (service worker) + `public/icon.svg`. Tarayıcıdan "Ana ekrana ekle" ile kurulur, ilk açılıştan sonra **çevrimdışı** oynanır, tam ekran (standalone) açılır. SW yalnızca üretim derlemesinde kayıt olur (HMR'i bozmaz).
- **Ana ekran (hub):** Logolu, animasyonlu giriş — ▶ Oyna, 🏆 Lider Tablosu, 📊 İstatistik, ⚙️ Ayarlar + son seviyeleri tekrar oynama.
- **Ayarlar:** dil, ses, oyuncu adı, nasıl oynanır, ilerlemeyi sıfırla (onaylı), sürüm.
- **İlk açılış öğreticisi:** 3 adımlı, dile göre.
- **İstatistik & rekorlar:** bulunan kelime, geçilen seviye, bonus, en iyi günlük seri, en iyi hafta puanı.
- **Mobil:** `100dvh` yükseklik (tarayıcı çubuğuna uyumlu), `overscroll-behavior:none` (pull-to-refresh kapalı), safe-area, dokunsal titreşim, büyük dokunma alanları.

## ✨ Tarz & farklılaşan mekanik

- **Tema:** Gece / fener / aurora atmosferi — cam efektli (glassmorphism), sıcak altın tonları. WOW'un seyahat temasından bilinçli olarak ayrışır.
- **Ateşböceği ekonomisi:** Bulunan her kelime kavanoza uçan ateşböcekleri salar. **Bonus kelimeler** (bulmacaya girmeyen ekstra kelimeler) kavanozu doldurur → **ipucu** için harcanır. (WOW'daki coin yerine.)
- **Combo / aurora serisi:** Hatasız ve hızlı kelime bulunca arka plandaki aurora yoğunlaşır ve "🔥 Nx seri" göstergesi belirir.
- **Sınırlı ipucu + ödüllü reklam:** İpucu 1 ateşböceği harcar; bittiğinde **reklam izleyip +3** kazanılır (kavanoza tıkla veya boşken ipucu butonuna bas).
- **Günlük ödül serisi:** Her gün ilk girişte artan ödül (seri korunur, 7 günlük göstergeyle). Ardışık günlerde miktar büyür (3→8 🪲).
- **Ses:** Web Audio ile sentezlenmiş efektler (harf adımları pentatonik tırmanır, bulma/bonus/hata/kazanma sesleri). 🔊/🔇 ile aç-kapa, tercih kaydedilir. Harici ses dosyası yok.
- **VFX:** Titreşen yıldız alanı, izli ateşböcekleri, 3B harf açılışı + parıltı, parlayan çark bağlantısı, uçan kelime metni, seviye sonu konfeti.

## ♾️ Sonsuz seviyeler + çeşitlilik

Sabit seviye yok — her seviye **sözlük bankasından prosedürel** üretilir (`src/game/generator.ts`). Bir "tohum" kelime seçilir, harfleri çarkı oluşturur, o harflerden türetilebilen tüm banka kelimeleri seviyenin kelimeleri olur. Crossword otomatik kurulur.

- **Tekrarsızlık:** Tohumlar uzunluğa göre **oyuncuya özel bir `salt`** ile karıştırılıp tek kademeli diziye konur; tüm katalog tükenmeden hiçbir seviye tekrar etmez, anagram havuzları (GATO/TOGA) tekilleştirilir. Her oyuncunun yolculuğu farklı → gerçekten sonsuz hissettirir.
- **Kademeli zorluk:** Uzunluk programı 4→7 harf, karışık ama yukarı yönlü. Erken seviyeler kolay (yaşlı dostu), sonra açılır. Her seviye en az 4 kelime üretir.

## 📖 Kelime anlamları (öğretici)

Bulunan her kelime, tahtanın altında **dokunulabilir bir hap** olarak çıkar. Üstüne dokununca anlamı bir kartta açılır (ör. "PAK → temiz, lekesiz"). Veri `src/game/dictionary.ts` (kelime → anlam). **TR ve EN zengin**, diğer 4 dil orta boy. Üretilen tüm kelimelerin bir anlamı vardır (test edildi).

## 🎯 İpucu puan cezası

İpucu artık sadece ateşböceği harcamıyor — alınan **her ipucu harfi** o kelimeden kazanılacak puanı **%25 azaltır** (alt sınır: harf×2). Kelime tamamen ipucuyla açılırsa puan minimuma iner. Bulunca kazanılan puan uçan metinde gösterilir (cezalıysa turuncu "⬇").

## 🎨 Temalar

5 renk teması: **night** (varsayılan), sunset, forest, ocean, berry. Ayarlar'dan renk dairesine dokununca anında uygulanır (arka plan + aurora + vurgu renkleri CSS değişkenleriyle değişir). Tercih kaydedilir. Yeni tema: `src/game/extras.ts` `THEMES` + `style.css` `body[data-theme="..."]` bloğu.

## 🌍 Dünya temaları · 🔇 Sessiz mod

- **Dünya temaları:** Her bölüm (10 seviye) bir "dünya" emojisiyle işaretlenir (🏮🌊🌲🏔️🏜️🌸🌌🎡, döner); tahta arkasında soluk filigran + bölüm etiketi/seviye adı. Sadece görsel çeşitlilik — mekanik ve kullanıcı teması değişmez (`extras.ts WORLDS`).
- **Sessiz mod otomasyonu:** Uygulama arka plana alınınca (sekme gizli) ses+müzik otomatik susar, geri gelince açılır (`sound.setActive`, `visibilitychange`). Tarayıcı OS "rahatsız etme"yi doğrudan sunmadığından en güvenilir yaklaşım budur.

## 🌿 Rahat mod · ♿ Erişilebilirlik · 🔥 Seri

- **Rahat mod** (Ayarlar): **ipucu ücretsiz** + joker 3 yerine **1 ateşböceği** — yaşlı/sıradan oyuncu için stressiz.
- **Yüksek kontrast** (renk körü dostu): bulundu = **mavi**, hata = **turuncu** (ayırt edilebilir çift) + açılan hücrelerde kalın kenar. Büyük yazı seçeneğini tamamlar.
- **Otomatik anlam flaşı**: kelime bulununca anlamı kısa süre kendiliğinden belirir — dokunmadan öğrenme (opsiyonel).
- **Seri alevi**: ana ekranda günlük seri (🔥 N gün) — push olmadan geri gelme motivasyonu.
- **+4 rozet** (12 toplam): Pangram, Günlük Çözücü, 250 Kelime, 100 Seviye.

## 🗓️ Günlük Bulmaca · Paylaşım · Günün Kelimesi

- **Günlük Bulmaca:** Ana ekrandan oynanır; **tarihe göre deterministik** (`makeDailyLevel`) — aynı gün herkese *aynı* bulmaca, oyuncu salt'ından bağımsız. Ayrı ödül (+3 🪲), normal seviye ilerlemesini etkilemez; günde bir kez, sonra kart "Bugün tamam ✓". `save.dailyDone`.
- **Sonuç paylaşımı:** Kazanma ve günlük sonuç ekranında **📤 Paylaş** — Web Share API (`navigator.share`), yoksa panoya kopyalar. Ör. "Lumio · Günlük Bulmaca 🗓️ 11/11 ✓".
- **Günün Kelimesi:** Ana ekranda tarihe+dile göre seçilen bir kelime + anlamı (öğretici mikro-içerik); dokununca tam anlam kartı.

## 🗺️ Bölüm haritası & pangram & joker & erişilebilirlik

- **Bölüm/ilerleme haritası:** Ana ekranda içinde bulunulan **10'luk bölümün** 10 seviyesi yolculuk şeridi olarak — tamamlanan (yeşil), güncel (altın, nabız), kilitli. Tamamlananlara dokununca tekrar oynanır. Mekaniği değiştirmez, ilerleme duygusunu güçlendirir.
- **Pangram bonusu:** Çarkın **tüm harflerini** kullanan kelimeyi (ipucusuz) bulana ekstra puan + konfeti + "✨ PANGRAM!" (harf sayısı × 5).
- **"Kelimeyi aç" jokeri:** Çark kontrollerinde 🔓 — **3 ateşböceği** karşılığında rastgele bir kelimeyi tamamen açar (minimum puan; güç değil, yardım). Ateşböceği yoksa reklam teklif edilir.
- **Erişilebilirlik:** Ayarlar'da **🔠 Büyük yazı** — harf/çark/panel yazılarını büyütür (yaşlı dostu amacına uygun). Tercih kaydedilir.

## 📖 Kelime defteri (öğretici)

Bulunan tüm kelimeler dile göre kalıcı bir **defterde** toplanır (ana ekran → 📖). Kelimeye dokununca anlamı çıkar — öğretici amaca doğrudan hizmet eder. Veri `save.learned[lang]`. Ayrıca **haptik geri bildirim**: kelime bulununca yumuşak çift titreşim, hata yapınca kısa titreşim (`navigator.vibrate`).

## 🏅 Başarımlar

8 rozet (`src/game/extras.ts` `ACHIEVEMENTS`): İlk Kelime, 100/500 Kelime, 10/50 Seviye, 7 Gün Seri, 50 Bonus, 5× Combo. Koşul sağlanınca otomatik açılır → kutlama + ses + bildirim. İstatistik ekranında galeri (kilitli/açık + ilerleme). İstatistik `save.stats`'tan beslenir.

## 🎵 Ses & müzik

Web Audio ile sentezlenmiş efektler + isteğe bağlı **arka plan müziği** (yumuşak pentatonik arpej döngüsü, ayrı kanal — SFX susturma müziği etkilemez). Ayarlar'dan 🔊 ses ve 🎵 müzik ayrı ayrı açılır; tercih kaydedilir.

## 🏆 Haftalık lider tablosu (online / Supabase)

Her hafta sıfırlanan sıralama (`src/game/leaderboard.ts`). Kelime/bonus/seviye başına **puan** toplanır; oyuncu sıralanır, kendi satırı vurgulanır. Hafta kimliği (ISO `YYYY-Www`) değişince yenilenir.

- **Şu an** Supabase ayarsızsa **yerel + bot** (backend'siz çalışır).
- **Gerçek küresel sıralama için:**
  1. [supabase.com](https://supabase.com)'da ücretsiz proje aç.
  2. `supabase/schema.sql`'i Supabase SQL Editor'de çalıştır (tablo + RLS politikaları).
  3. Proje URL'si + "anon public" anahtarını `src/game/config.ts`'e yapıştır.
- Kod hazır: `getBoard()` online ise skoru yazar (upsert) ve haftanın ilk 50'sini çeker; hata olursa sessizce yerele düşer. SDK gerekmez (REST/PostgREST + `fetch`).

## 🌍 Çok dil (global)

6 dil tam destekli: **İngilizce (varsayılan), Türkçe, İspanyolca, Almanca, Fransızca, Portekizce**. Cihaz diline göre otomatik seçilir, menüdeki 🌐 ile değiştirilebilir. Her dilin **kendi sözlüğü** ve ilerlemesi vardır (arayüz metinleri `src/game/i18n.ts`).

Yeni dil eklemek: `i18n.ts` içine dil + metinler, `dictionary.ts` içine o dilin kelime+anlam bankası, `LANGUAGES` listesine bir satır. Seviyeler otomatik üretilir.

## 📺 Gerçek reklam entegrasyonu (AdMob)

Şu an reklam **simülasyonu** var (4 sn'lik sahte reklam → +3 ödül). Gerçek yayında:

```bash
npm i @capacitor-community/admob
```

`engine.ts` içindeki `playAd()` metodunda işaretli yeri AdMob ödüllü reklamıyla değiştir; `adReward()` aynı şekilde ödülü verir.

## 🎮 Oynanış

1. Menüden bir seviye seç (ilerledikçe yenileri açılır).
2. Harf çarkında harfleri **sürükleyerek** kelime oluştur.
3. Geçerli kelimeler crossword'de açılır; ekstra kelimeler bonus olur.
4. Bulmacadaki tüm kelimeleri bul → seviye tamam.

İlerleme `localStorage`'a kaydedilir.

## 🚀 Çalıştırma (localhost)

```bash
npm install
npm run dev      # http://localhost:5173
```

Üretim derlemesi:

```bash
npm run build && npm run preview
```

## 📱 Android & iOS (Capacitor)

```bash
# Tek seferlik kurulum
npm i -D @capacitor/cli
npm i @capacitor/core @capacitor/android @capacitor/ios
npx cap init Lumio com.lumio.game --web-dir dist

# Platform ekle
npx cap add android
npx cap add ios

# Derle + senkronize et + IDE'de aç
npm run cap:android   # Android Studio
npm run cap:ios       # Xcode (macOS gerekir)
```

`capacitor.config.ts` hazırdır (appId, appName, arka plan rengi).

## 🧩 İçerik ekleme (yeni kelime = yeni seviye)

Seviyeler artık elle değil; **sözlüğe kelime ekledikçe** otomatik çeşitlenir. `src/game/dictionary.ts` içinde ilgili dile kelime + anlam ekle:

```ts
const TR = {
  // ...
  ŞEHİR: "insanların toplu yaşadığı büyük yerleşim",
};
```

Üretici bu kelimeyi hem tohum hem alt-kelime olarak kullanır; anlamı "kelimeye dokun" özelliğinde çıkar. Banka büyüdükçe sonsuz mod daha zengin hissettirir.

## 🗂️ Yapı

```
src/
  main.ts            # giriş
  style.css          # tüm tema / animasyonlar / VFX
  game/
    i18n.ts          # çok dilli arayüz metinleri + dil yönetimi
    dictionary.ts    # kelime + anlam bankası (TR/EN zengin) — üretim kaynağı
    generator.ts     # sonsuz mod: prosedürel seviye üreteci (tekrarsız, kademeli)
    crossword.ts     # otomatik bulmaca üreteci
    leaderboard.ts   # haftalık lider tablosu (Supabase online + yerel bot yedek)
    config.ts        # Supabase URL + anon anahtarı (boşsa yerel bot)
    extras.ts        # tema ve başarım tanımları
    wheel.ts         # harf çarkı (sürükle-bağla, parlayan bağlantı)
    fx.ts            # yıldız + ateşböceği + konfeti (canvas VFX)
    sound.ts         # Web Audio ile sentezlenmiş ses efektleri
    engine.ts        # motor / UI / hub / ayarlar / öğretici / istatistik / skor
    storage.ts       # dil + ilerleme + ses + günlük ödül + skor + salt + istatistik
public/
  manifest.webmanifest  # PWA manifesti
  sw.js                 # service worker (çevrimdışı önbellek)
  icon.svg              # uygulama ikonu
supabase/
  schema.sql         # online lider tablosu tablosu + RLS (bir kez çalıştır)
scripts/
  check.mjs          # üretici kalite kontrolü (node scripts/check.mjs)
```
