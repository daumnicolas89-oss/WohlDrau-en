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
    // Exakt --color-background aus globals.css: ein Ton daneben wäre beim
    // Start als kurzer Farbsprung sichtbar.
    backgroundColor: "#f6f3ec",
    // Langdrücken auf einen Link soll keine Safari-Vorschau öffnen.
    allowsLinkPreview: false,
  },
  plugins: {
    // Die Tastatur soll die WebView verkleinern, sonst verdeckt sie das
    // Suchfeld im Standort-Fenster statt es hochzuschieben.
    Keyboard: { resize: "native", resizeOnFullScreen: true },
    // Der Marken-Start bleibt stehen, bis die Oberfläche wirklich da ist.
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#f6f3ec",
      showSpinner: false,
    },
  },
};

export default config;
