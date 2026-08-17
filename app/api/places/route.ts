import { NextResponse } from "next/server";
import { fetchPlaces, type FetchPlacesResult } from "@/lib/osm";
import { FRESH_MS, readCache, writeCache } from "@/lib/placesCache";

export const runtime = "nodejs";
// Overpass kann im Worst Case (Retry über beide Spiegel) mehrere Minuten
// brauchen – ohne dieses Budget killt Vercel die Function vorher und der
// Stale-Fallback unten käme nie zum Zug.
export const maxDuration = 120;

/**
 * Version des Antwort-Schemas. Bei jeder Formänderung der Orts-Daten (neue
 * Pflichtfelder o. Ä.) hochzählen: neuer Key = CDN, Disk und Service Worker
 * liefern sofort frische Form statt tagelang alter Objekte an neuen Code.
 */
import { PLACES_SCHEMA_VERSION } from "@/lib/schemaVersion";

// Größter Filter (2,5 km) + bis zu ~650 m Raster-Versatz des Bbox-Zentrums:
// erst ab 3500 m ist der äußerste Ring garantiert abgedeckt.
const MAX_RADIUS_M = 3500;
const MAX_MEMORY_ENTRIES = 100;

const memory = new Map<string, { at: number; value: FetchPlacesResult }>();
const inFlight = new Map<string, Promise<FetchPlacesResult>>();

/** Auf ~1 km Raster runden, damit sich Anfragen aus einer Gegend den Cache teilen. */
function cacheKey(lat: number, lng: number, radius: number) {
  return `v${PLACES_SCHEMA_VERSION}:${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
}

function respond(value: FetchPlacesResult, source: string) {
  return NextResponse.json(value, {
    headers: {
      "x-wd-cache": source,
      // Der teure Overpass-Abruf soll pro Gegend nur einmal am Tag passieren.
      // Das CDN hält die Antwort einen Tag frisch und liefert danach bis zu
      // einer Woche sofort eine leicht veraltete Version, während im
      // Hintergrund neu geladen wird. Ortsdaten ändern sich kaum, der Schatten
      // wird ohnehin live im Browser gerechnet.
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
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
  const key = (fast ? "f:" : "") + cacheKey(lat, lng, radius);

  const hot = memory.get(key);
  if (hot && Date.now() - hot.at < FRESH_MS) return respond(hot.value, "memory");

  // Überlebt den Serverneustart, Overpass kann sehr langsam sein.
  const stored = await readCache(key);
  if (stored && stored.ageMs < FRESH_MS) {
    memory.set(key, { at: Date.now() - stored.ageMs, value: stored.value });
    return respond(stored.value, "disk");
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
