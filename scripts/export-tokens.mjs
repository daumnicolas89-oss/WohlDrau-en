/**
 * Exportiert das Design-System als Design Tokens (W3C-DTCG-Format), damit es
 * in Penpot & Co. importiert werden kann.
 *
 * Quelle ist der @theme-Block in app/globals.css – nicht eine gepflegte
 * Kopie. So kann die Datei nicht vom Code abweichen.
 *
 * Aufruf: npm run tokens
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "app/globals.css"), "utf8");

const theme = /@theme\s*\{([\s\S]*?)\n\}/.exec(css);
if (!theme) throw new Error("Kein @theme-Block in app/globals.css gefunden");

/** `--color-primary-dark: #1e766c;` → ["color", "primary-dark", "#1e766c"] */
const GRUPPEN = {
  color: { name: "color", type: "color" },
  radius: { name: "borderRadius", type: "dimension" },
  shadow: { name: "boxShadow", type: "shadow" },
  font: { name: "fontFamily", type: "fontFamily" },
};

const tokens = {};
for (const zeile of theme[1].split("\n")) {
  const treffer = /^\s*--([a-z]+)-([a-z0-9-]+):\s*(.+?);/.exec(zeile);
  if (!treffer) continue;
  const [, praefix, name, wert] = treffer;
  const gruppe = GRUPPEN[praefix];
  if (!gruppe) continue;
  // Tailwind-Variablen (var(--font-inter)) sagen einem Designtool nichts.
  if (wert.includes("var(")) continue;
  tokens[gruppe.name] ??= {};
  tokens[gruppe.name][name] = { $value: wert.trim(), $type: gruppe.type };
}

const ziel = join(root, "design/tokens.json");
mkdirSync(dirname(ziel), { recursive: true });
writeFileSync(ziel, JSON.stringify(tokens, null, 2) + "\n", "utf8");

const anzahl = Object.values(tokens).reduce((n, g) => n + Object.keys(g).length, 0);
console.log(`✓ design/tokens.json – ${anzahl} Tokens aus ${Object.keys(tokens).length} Gruppen`);
