import { NextResponse, after } from "next/server";
import { fetchPlaces, type FetchPlacesResult } from "@/lib/osm";
import { FRESH_MS, readCache, writeCache } from "@/lib/placesCache";
import { readTile, tileKey, writeTile } from "@/lib/tileStore";

export const runtime = "nodejs";
// Overpass kann im Worst Case (Retry über beide Spiegel) mehrere Minuten
// brauchen – ohne dieses Budget killt Vercel die Function vorher und der
// Stale-Fallback unten käme nie zum Zug.
export const maxDuration = 120;

// Die Schema-Version der Antwort steckt im Cache-Schlüssel (tileKey in
// lib/tileStore.ts): Bei jeder Formänderung der Orts-Daten dort hochzählen,
// dann laufen CDN, Disk, Datenbank und Service Worker automatisch ins Leere.

// Größter Filter (2,5 km) + bis zu ~650 m Raster-Versatz des Bbox-Zentrums:
// erst ab 3500 m ist der äußerste Ring garantiert abgedeckt.
const MAX_RADIUS_M = 3500;
const MAX_MEMORY_ENTRIES = 100;

const memory = new Map<string, { at: number; value: FetchPlacesResult }>();
const inFlight = new Map<string, Promise<FetchPlacesResult>>();
/** Läuft für diesen Schlüssel schon eine Hintergrund-Auffrischung? */
const refreshing = new Set<string>();

function respond(value: FetchPlacesResult, source: string, maxAgeS = 86_400) {
  return NextResponse.json(value, {
    headers: {
      "x-wd-cache": source,
      // Der teure Overpass-Abruf soll pro Gegend nur einmal am Tag passieren.
      // Das CDN hält die Antwort frisch und liefert danach bis zu einer Woche
      // sofort eine leicht veraltete Version, während im Hintergrund neu
      // geladen wird. Ortsdaten ändern sich kaum, der Schatten wird ohnehin
      // live im Browser gerechnet.
      "Cache-Control": `public, s-maxage=${maxAgeS}, stale-while-revalidate=604800`,
    },
  });
}

/**
 * Nach der Antwort (nie davor!) frisch bei Overpass holen und alle Ebenen
 * aktualisieren. Scheitert Overpass, bleibt der alte Stand einfach stehen –
 * kein Nutzer hat gewartet, keiner merkt etwas.
 */
function hintergrundAuffrischen(
  key: string,
  lat: number,
  lng: number,
  radius: number,
  fast: boolean,
) {
  if (refreshing.has(key)) return;
  refreshing.add(key);
  after(async () => {
    try {
      const value = await fetchPlaces(lat, lng, radius, fast);
      memory.set(key, { at: Date.now(), value });
      await writeCache(key, value);
      await writeTile(key, value);
    } catch (error) {
      console.error("[wohldraussen] tile-refresh:", error);
    } finally {
      refreshing.delete(key);
    }
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // Number(null) und Number("") sind 0 – ein nacktes /api/… liefe also mit
  // „gültigen" Koordinaten am Nullpunkt im Atlantik los und legte das
  // Ergebnis auch noch in den Cache. Erst prüfen, dass wirklich etwas kam.
  const latRaw = params.get("lat");
  const lngRaw = params.get("lng") ?? params.get("lon");
  if (!latRaw || !lngRaw) {
    return NextResponse.json(
      { error: "lat und lng sind erforderlich." },
      { status: 400 },
    );
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  const radius = Math.min(
    MAX_RADIUS_M,
    Math.max(500, Number(params.get("radius")) || 3000),
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat und lng sind erforderlich" },
      { status: 400 },
    );
  }

  // Schnellstart-Variante: nur Orte + Ausstattung, ohne Wälder/Bäume/Gebäude.
  // Eigener Cache-Schlüssel – die vorläufige Antwort darf NIE als volle
  // durchgehen (und umgekehrt ersetzt die volle sie einfach im Client).
  const fast = params.get("fast") === "1";
  const key = tileKey(lat, lng, radius, fast);

  const hot = memory.get(key);
  if (hot && Date.now() - hot.at < FRESH_MS) return respond(hot.value, "memory");

  // Überlebt den Serverneustart, Overpass kann sehr langsam sein.
  const stored = await readCache(key);
  if (stored && stored.ageMs < FRESH_MS) {
    memory.set(key, { at: Date.now() - stored.ageMs, value: stored.value });
    return respond(stored.value, "disk");
  }

  // Der dauerhafte Speicher: Jede Gegend, die je jemand geöffnet hat, kommt
  // ab hier SOFORT – egal wie es Overpass gerade geht, egal wie alt der
  // Eintrag ist. Ist er älter als einen Tag, wird nach der Antwort im
  // Hintergrund aufgefrischt; gewartet hat darauf niemand.
  const tile = await readTile(key);
  if (tile) {
    memory.set(key, { at: Date.now() - tile.ageMs, value: tile.value });
    if (tile.ageMs >= FRESH_MS) {
      hintergrundAuffrischen(key, lat, lng, radius, fast);
      // Kürzer am CDN halten, damit die Auffrischung bald sichtbar wird.
      return respond(tile.value, "tile-stale", 3_600);
    }
    return respond(tile.value, "tile");
  }

  try {
    // Parallele Anfragen aus derselben Gegend teilen sich einen Overpass-Call.
    let pending = inFlight.get(key);
    if (!pending) {
      pending = fetchPlaces(lat, lng, radius, fast);
      inFlight.set(key, pending);
      // .finally() erzeugt eine NEUE Promise-Kette – ohne .catch() würde ein
      // Overpass-Fehler hier als unhandled rejection den Prozess treffen,
      // ausgerechnet wenn unten der Stale-Fallback greifen soll.
      pending.finally(() => inFlight.delete(key)).catch(() => {});
    }
    const value = await pending;
    // Alte Einträge deckeln, sonst wächst der Prozess-Cache unbegrenzt.
    if (memory.size >= MAX_MEMORY_ENTRIES) {
      const oldest = memory.keys().next().value;
      if (oldest !== undefined) memory.delete(oldest);
    }
    memory.set(key, { at: Date.now(), value });
    void writeCache(key, value);
    // after(): Auf Vercel darf die Function nach der Antwort einfrieren –
    // so ist garantiert, dass der Speicher-Eintrag noch geschrieben wird.
    after(() => writeTile(key, value));
    return respond(value, "miss");
  } catch (error) {
    // Lieber veraltete Orte als eine leere Startseite: Ausstattung und Lage
    // ändern sich kaum, und der Schatten wird ohnehin live gerechnet.
    if (hot) return respond(hot.value, "stale-memory");
    if (stored) return respond(stored.value, "stale-disk");
    // Die technische Ursache bleibt im Log; die App zeigt einen brauchbaren Satz.
    console.error("[wohldraussen] places:", error);
    return NextResponse.json(
      {
        error:
          "OpenStreetMap antwortet gerade nicht. Das liegt meist an einer " +
          "kurzzeitigen Überlastung. In ein, zwei Minuten klappt es wieder.",
      },
      { status: 502 },
    );
  }
}
