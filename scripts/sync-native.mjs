// dist-native/index.html (tek dosyalik oyun) -> native/assets/game.html
// Kullanim: npm run native:sync   (once build:native calisir)
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "dist-native", "index.html");
const outDir = join(root, "native", "assets");
if (!existsSync(src)) {
  console.error("Once 'npm run build:native' calistir (dist-native/index.html yok).");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "game.html"));
console.log("OK: native/assets/game.html guncellendi");
