// Lumio native kabi: oyunun tek dosyalik HTML derlemesini (assets/game.html)
// tam ekran WebView'de acar. Oyun tamamen cevrimdisi calisir; kayit
// localStorage'da tutulur (WKWebView/Chromium kalici depolama).
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";

export default function App() {
  const [uri, setUri] = useState(null);

  useEffect(() => {
    (async () => {
      const asset = Asset.fromModule(require("./assets/game.html"));
      await asset.downloadAsync();
      setUri(asset.localUri ?? asset.uri);
    })();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      {uri && (
        <WebView
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
