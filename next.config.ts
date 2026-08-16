import type { NextConfig } from "next";

/**
 * Zwei Auslieferungen aus einem Code:
 * - Web (Standard): platzda.app auf Vercel, mit Server-Schnittstellen.
 * - App-Hülle (`npm run build:app`): statischer Export für Capacitor/App Store.
 *   Die Oberfläche liegt dann gebündelt in der App, Daten kommen per HTTPS
 *   von platzda.app. Server-Teile werden vom Build-Skript beiseitegelegt.
 */
const isAppShell = process.env.NEXT_PUBLIC_APP_SHELL === "1";

const nextConfig: NextConfig = isAppShell
  ? {
      output: "export",
      // /platz/ → platz/index.html: so findet der App-interne Webserver
      // jede Seite als Datei, ohne Server-Routing.
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
