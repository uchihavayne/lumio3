import "./style.css";
import { Game } from "./game/engine";

const app = document.getElementById("app")!;
new Game(app);

// PWA: service worker yalnizca uretim derlemesinde kayit edilir
// (gelistirmede HMR'i bozmamak icin). Oyun ilk ziyaretten sonra cevrimdisi calisir.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* yok say */
    });
  });
}
