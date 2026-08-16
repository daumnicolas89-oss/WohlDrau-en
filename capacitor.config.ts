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
};

export default config;
