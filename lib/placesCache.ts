import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FetchPlacesResult } from "./osm";

/**
 * Overpass ist zeitweise sehr langsam – gemessen zwischen 3 und 68 Sekunden für
 * dieselbe Abfrage. Spielplätze wandern aber nicht, deshalb wird das Ergebnis
 * zusätzlich auf die Platte geschrieben: Ein Serverneustart soll den Preis
 * nicht erneut kosten, und bei einem Ausfall gibt es noch etwas zu zeigen.
 */
const CACHE_DIR = process.env.WD_CACHE_DIR ?? join(tmpdir(), "wohldraussen-places");

/** Frisch genug, um ohne Nachfrage ausgeliefert zu werden. */
export const FRESH_MS = 24 * 60 * 60 * 1000;
/** Alt, aber im Notfall besser als eine leere Seite. */
export const STALE_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry {
  savedAt: number;
  value: FetchPlacesResult;
}

function fileFor(key: string) {
  const hash = createHash("sha1").update(key).digest("hex");
  return join(CACHE_DIR, `${hash}.json`);
}

export async function readCache(
  key: string,
): Promise<{ value: FetchPlacesResult; ageMs: number } | null> {
  try {
    const raw = await readFile(fileFor(key), "utf8");
    const entry = JSON.parse(raw) as CacheEntry;
    const ageMs = Date.now() - entry.savedAt;
    if (ageMs > STALE_MS) return null;
    return { value: entry.value, ageMs };
  } catch {
    // Kein Eintrag, kaputte Datei, kein Schreibrecht – alles unkritisch.
    return null;
  }
}

export async function writeCache(key: string, value: FetchPlacesResult): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const target = fileFor(key);
    // Erst daneben schreiben, dann umbenennen: sonst liest ein paralleler
    // Request eine halb geschriebene Datei.
    const temporary = `${target}.${process.pid}.tmp`;
    const entry: CacheEntry = { savedAt: Date.now(), value };
    await writeFile(temporary, JSON.stringify(entry), "utf8");
    await rename(temporary, target);
  } catch {
    // Ein nicht beschreibbares Dateisystem darf die App nicht aufhalten.
  }
}
