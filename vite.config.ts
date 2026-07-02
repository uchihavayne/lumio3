import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// --mode native: tum JS/CSS tek index.html icine gomulur (iOS/Android WebView
// kabina asset olarak konur). Normal build web/PWA icindir.
export default defineConfig(({ mode }) => ({
  base: "./",
  server: {
    port: 5173,
    host: true,
  },
  plugins: mode === "native" ? [viteSingleFile()] : [],
  build: {
    outDir: mode === "native" ? "dist-native" : "dist",
    target: "es2020",
  },
}));
