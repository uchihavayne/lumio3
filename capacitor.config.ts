import type { CapacitorConfig } from "@capacitor/cli";

// Android + iOS paketleme yapilandirmasi.
// Native build icin: npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android @capacitor/ios
// Ardindan: npm run cap:android  /  npm run cap:ios
const config: CapacitorConfig = {
  appId: "com.lumio.game",
  appName: "Lumio",
  webDir: "dist",
  backgroundColor: "#0b1026",
  android: {
    backgroundColor: "#0b1026",
  },
  ios: {
    backgroundColor: "#0b1026",
    contentInset: "always",
  },
};

export default config;
