import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Die App-Store-Hülle: lädt die gebündelte Oberfläche aus out/
 * (erzeugt von `npm run build:app`) und holt die Daten per HTTPS von
 * platzda.app. Web-Auslieferung und Hülle teilen sich denselben Code.
 */
const config: CapacitorConfig = {
  appId: "app.platzda",
  appName: "PlatzDa",
  webDir: "out",
  ios: {
    // Heller Seitenhintergrund hinter der WebView, passend zum App-Design.
    backgroundColor: "#f6f4ee",
  },
};

export default config;
