import { gunzipSync, gzipSync } from "node:zlib";
import { supabase } from "./supabase";
import { PLACES_SCHEMA_VERSION } from "./schemaVersion";
import type { FetchPlacesResult } from "./osm";

/**
 * Der dauerhafte Orte-Speicher: jede einmal bei Overpass geholte Gegend wird
 * hier abgelegt und ab dann SOFORT ausgeliefert – für alle Nutzer, über
 * Deploys und Tage hinweg. Overpass (ehrenamtlich betrieben, oft überlastet,
 * gemessen 3–68 s pro Abfrage) läuft danach nur noch im Hintergrund.
 *
 * Warum Supabase: haben wir schon, kostet nichts, überlebt alles. Die
 * Antworten werden gepackt gespeichert (~240 KB → ~35 KB pro Gegend), damit
 * der Free-Tier-Speicher für tausende Gegenden reicht.
 *
 * Schreiben braucht den SUPABASE_SERVICE_ROLE_KEY (nur auf dem Server, nie
 * im Browser) – die Tabelle ist für den öffentlichen Schlüssel nur lesbar,
 * sonst könnte jeder mit dem öffentlichen Schlüssel falsche Orte für alle
 * hinterlegen. Fehlt der Schlüssel oder die Tabelle, arbeitet die App exakt
 * wie bisher, nur ohne den Dauer-Speicher.
 */
const TABLE = "places_tiles";

/** Ab diesem Alter wird nach dem Ausliefern im Hintergrund aufgefrischt. */
export const TILE_REFRESH_MS = 24 * 60 * 60 * 1000;

/**
 * Derselbe Schlüssel wie im Prozess-Cache der Route: ~1-km-Raster plus
 * Schema-Version, Schnellstart-Antworten getrennt („f:“) – eine vorläufige
 * Antwort darf nie als volle durchgehen.
 */
export function tileKey(
  lat: number,
  lng: number,
  radius: number,
  fast: boolean,
): string {
  const basis = `v${PLACES_SCHEMA_VERSION}:${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
  return (fast ? "f:" : "") + basis;
}

/** Antwort → gepackter Text für die Datenbank. Exportiert für den Test. */
export function packTile(value: FetchPlacesResult): string {
  return gzipSync(Buffer.from(JSON.stringify(value), "utf8")).toString("base64");
}

/** Gepackter Text → Antwort. Wirft bei kaputten Daten, Aufrufer fängt. */
export function unpackTile(payload: string): FetchPlacesResult {
  return JSON.parse(
    gunzipSync(Buffer.from(payload, "base64")).toString("utf8"),
  ) as FetchPlacesResult;
}

export async function readTile(
  key: string,
): Promise<{ value: FetchPlacesResult; ageMs: number } | null> {
  const client = supabase();
  if (!client) return null;
  try {
    const { data } = await client
      .from(TABLE)
      .select("payload, saved_at")
      .eq("key", key)
      .maybeSingle();
    if (!data?.payload) return null;
    const ageMs = Date.now() - new Date(data.saved_at).getTime();
    // Ein kaputter Zeitstempel (NaN) bestünde jeden Vergleich – der Eintrag
    // gälte für immer als frisch und würde nie aufgefrischt.
    if (!Number.isFinite(ageMs)) return null;
    return { value: unpackTile(data.payload), ageMs: Math.max(0, ageMs) };
  } catch {
    // Tabelle fehlt noch, Netzproblem, kaputter Eintrag: alles unkritisch,
    // dann greift wie bisher der Overpass-Weg.
    return null;
  }
}

/**
 * Schreibt einen Eintrag und sagt EHRLICH, ob es geklappt hat. supabase-js
 * wirft nämlich nicht: RLS-Verbote und fehlende Tabellen kommen als
 * `{ error }` zurück – wer den ignoriert, betreibt das Feature blind
 * (und der Vorwärmer holte jede Nacht dieselben Städte umsonst).
 */
export async function writeTile(
  key: string,
  value: FetchPlacesResult,
): Promise<boolean> {
  const client = supabase();
  if (!client) return false;
  try {
    const { error } = await client.from(TABLE).upsert({
      key,
      payload: packTile(value),
      saved_at: new Date().toISOString(),
    });
    if (error) {
      console.error(
        `[wohldraussen] tile-write ${key}: ${error.message} – fehlt der SUPABASE_SERVICE_ROLE_KEY oder die Tabelle ${TABLE}?`,
      );
      return false;
    }
    return true;
  } catch (fehler) {
    console.error(`[wohldraussen] tile-write ${key}:`, fehler);
    return false;
  }
}

/** Alter (ms) je Schlüssel für den Vorwärmer – EIN Abruf statt 39. Fehlende
 *  Schlüssel fehlen in der Map. */
export async function readTileAges(
  keys: string[],
): Promise<Map<string, number>> {
  const alter = new Map<string, number>();
  const client = supabase();
  if (!client || keys.length === 0) return alter;
  try {
    const { data } = await client
      .from(TABLE)
      .select("key, saved_at")
      .in("key", keys);
    for (const zeile of data ?? []) {
      const ageMs = Date.now() - new Date(zeile.saved_at).getTime();
      if (Number.isFinite(ageMs)) alter.set(zeile.key, Math.max(0, ageMs));
    }
  } catch {
    // Ohne Antwort gelten alle als „nie geholt" – der Vorwärmer arbeitet
    // dann einfach die Liste ab.
  }
  return alter;
}

/**
 * Aufräumen: Zeilen fremder Schema-Versionen (nach einem v-Wechsel toter
 * Ballast) und sehr alte Einträge löschen. Läuft im nächtlichen Vorwärmer –
 * so bleibt der Free-Tier-Speicher (~14 000 Zeilen) dauerhaft weit weg.
 */
export async function pruneTiles(maxAgeMs: number): Promise<void> {
  const client = supabase();
  if (!client) return;
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
  try {
    await client
      .from(TABLE)
      .delete()
      .not("key", "like", `v${PLACES_SCHEMA_VERSION}:%`)
      .not("key", "like", `f:v${PLACES_SCHEMA_VERSION}:%`);
    await client.from(TABLE).delete().lt("saved_at", cutoff);
  } catch {
    // Aufräumen ist Kür – scheitert es, räumt die nächste Nacht auf.
  }
}
