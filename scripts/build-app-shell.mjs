/**
 * Baut die App-Hülle für den App Store (statischer Export nach `out/`).
 *
 * Ein statischer Export verträgt keine Server-Teile. Darum werden
 * app/api (Server-Schnittstellen), app/ort (dynamische Pfad-Route) und
 * proxy.ts (CORS-Server-Logik) für die Dauer des Builds beiseitegelegt
 * und danach GARANTIERT zurückgelegt – auch wenn der Build scheitert.
 *
 * Die App-Hülle nutzt stattdessen /platz/?id=… (app/platz) und ruft die
 * Daten von https://platzda.app ab (Freigabe dafür macht proxy.ts im Web).
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const parkplatz = path.join(root, ".app-shell-beiseite");
const beiseite = [
  ["app/api", "api"],
  ["app/ort", "ort"],
  ["proxy.ts", "proxy.ts"],
];

const moved = [];

function wegraeumen() {
  mkdirSync(parkplatz, { recursive: true });
  for (const [von, nach] of beiseite) {
    const quelle = path.join(root, von);
    if (!existsSync(quelle)) continue;
    const ziel = path.join(parkplatz, nach);
    renameSync(quelle, ziel);
    moved.push([ziel, quelle]);
  }
}

function zurueckraeumen() {
  for (const [ziel, quelle] of moved.reverse()) {
    if (existsSync(ziel)) renameSync(ziel, quelle);
  }
  rmSync(parkplatz, { recursive: true, force: true });
}

console.log("App-Hülle: Server-Teile beiseitelegen …");
// Alte generierte Typen (z. B. vom Dev-Server) zeigen noch auf die
// beiseitegelegten Routen und ließen den Typcheck scheitern.
rmSync(path.join(root, ".next"), { recursive: true, force: true });
wegraeumen();
try {
  console.log("App-Hülle: statischer Export läuft …");
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_SHELL: "1",
      // Mit `www`: platzda.app leitet mit 308 dorthin um, und eine Umleitung
      // mitten im Datenabruf lässt CORS-Anfragen der App scheitern.
      // Für lokale Tests überschreibbar, z. B.
      // NEXT_PUBLIC_API_BASE=http://localhost:3000 npm run build:app
      NEXT_PUBLIC_API_BASE:
        process.env.NEXT_PUBLIC_API_BASE ?? "https://www.platzda.app",
    },
  });
  console.log("App-Hülle fertig: ./out");
} finally {
  zurueckraeumen();
  console.log("Server-Teile zurückgelegt.");
}
