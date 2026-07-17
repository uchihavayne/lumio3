// Lumio native kabi: oyunun tek dosyalik HTML derlemesini (assets/game.html)
// tam ekran WebView'de acar ve AdMob odullu reklam koprusunu saglar.
//
// Reklam akisi:
//   oyun (WebView) --postMessage{type:"showRewarded"}--> buradaki onMessage
//   -> AdMob odullu reklam gosterilir
//   -> sonuc injectJavaScript ile window.__lumioAdResult(true/false) olarak doner
//
// GIZLILIK: Uygulama kullaniciyi TAKIP ETMEZ. Yalnizca kisisellestirilmemis
// (non-personalized) odullu reklam gosterilir; IDFA/ATT kullanilmaz. Bu yuzden
// App Tracking Transparency izni istenmez ve App Privacy'de "tracking: No".
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import mobileAds, {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

// Gelistirmede otomatik TEST reklami, yayinda gercek birim.
// (Android yayina cikarken gercek Android birimi eklenecek.)
const REWARDED_AD_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      ios: "ca-app-pub-3323428505450637/8220031671",
      android: TestIds.REWARDED,
    });

export default function App() {
  const [uri, setUri] = useState(null);
  const webRef = useRef(null);
  const adRef = useRef(null);
  const adLoadedRef = useRef(false);

  // Oyuna reklam sonucunu bildir.
  const sendAdResult = (ok) => {
    webRef.current?.injectJavaScript(
      `window.__lumioAdResult && window.__lumioAdResult(${ok ? "true" : "false"}); true;`
    );
  };

  // Bir sonraki odullu reklami hazirla.
  const loadRewarded = () => {
    try {
      const ad = RewardedAd.createForAdRequest(REWARDED_AD_ID, {
        // Takip yok: yalnizca kisisellestirilmemis reklam iste (ATT gerekmez).
        requestNonPersonalizedAdsOnly: true,
      });
      adRef.current = ad;
      adLoadedRef.current = false;
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        adLoadedRef.current = true;
      });
      ad.load();
    } catch {
      adRef.current = null;
    }
  };

  useEffect(() => {
    (async () => {
      // Oyun HTML'ini yerel dosyaya cikar.
      const asset = Asset.fromModule(require("./assets/game.html"));
      await asset.downloadAsync();
      setUri(asset.localUri ?? asset.uri);
      // AdMob baslat -> ilk reklami yukle. (ATT izni YOK -> takip yok.)
      try {
        await mobileAds().initialize();
        loadRewarded();
      } catch {}
    })();
  }, []);

  const onMessage = (e) => {
    let msg = null;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg?.type !== "showRewarded") return;

    const ad = adRef.current;
    if (!ad || !adLoadedRef.current) {
      // Reklam hazir degil -> oyun hediye moduna duser.
      sendAdResult(false);
      loadRewarded();
      return;
    }
    let earned = false;
    const subs = [
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        subs.forEach((u) => u());
        sendAdResult(earned);
        loadRewarded();
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        subs.forEach((u) => u());
        sendAdResult(false);
        loadRewarded();
      }),
    ];
    try {
      ad.show();
    } catch {
      subs.forEach((u) => u());
      sendAdResult(false);
      loadRewarded();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      {uri && (
        <WebView
          ref={webRef}
          source={{ uri }}
          originWhitelist={["*"]}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowingReadAccessToURL={uri}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          domStorageEnabled
          javaScriptEnabled
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          contentInsetAdjustmentBehavior="never"
          onMessage={onMessage}
          style={styles.web}
          containerStyle={styles.web}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b1026" },
  web: { flex: 1, backgroundColor: "#0b1026" },
});
