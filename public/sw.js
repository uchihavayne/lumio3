// Harfika service worker — basit "stale-while-revalidate" önbellek.
// İlk ziyaretten sonra oyun çevrimdışı da açılır. Sürüm değişince eski cache silinir.
const CACHE = "harfika-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: false });
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      // Gezinti (sayfa) isteklerinde çevrimdışıysa ana sayfayı ver.
      if (req.mode === "navigate") {
        return (await network) || cached || cache.match("./index.html") || cache.match("./");
      }
      return cached || network;
    })()
  );
});
