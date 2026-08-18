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
    return {
      value: unpackTile(data.payload),
      ageMs: Math.max(0, Date.now() - new Date(data.saved_at).getTime()),
    };
  } catch {
    // Tabelle fehlt noch, Netzproblem, kaputter Eintrag: alles unkritisch,
    // dann greift wie bisher der Overpass-Weg.
    return null;
  }
}

export async function writeTile(
  key: string,
  value: FetchPlacesResult,
): Promise<void> {
  const client = supabase();
  if (!client) return;
  try {
    await client.from(TABLE).upsert({
      key,
      payload: packTile(value),
      saved_at: new Date().toISOString(),
    });
  } catch {
    // Ohne Schreibrecht (nur anon-Schlüssel) scheitert das leise – die
    // Antwort an den Nutzer ist da längst raus.
  }
}
