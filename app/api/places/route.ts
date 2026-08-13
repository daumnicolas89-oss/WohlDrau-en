import { NextResponse } from "next/server";
import { fetchPlaces, type FetchPlacesResult } from "@/lib/osm";
import { FRESH_MS, readCache, writeCache } from "@/lib/placesCache";

export const runtime = "nodejs";

const MAX_RADIUS_M = 3000;

const memory = new Map<string, { at: number; value: FetchPlacesResult }>();
const inFlight = new Map<string, Promise<FetchPlacesResult>>();

/** Auf ~1 km Raster runden, damit sich Anfragen aus einer Gegend den Cache teilen. */
function cacheKey(lat: number, lng: number, radius: number) {
  return `${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
}

function respond(value: FetchPlacesResult, source: string) {
  return NextResponse.json(value, { headers: { "x-wd-cache": source } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng") ?? params.get("lon"));
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

  const key = cacheKey(lat, lng, radius);

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
      pending = fetchPlaces(lat, lng, radius);
      inFlight.set(key, pending);
      pending.finally(() => inFlight.delete(key));
    }
    const value = await pending;
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
          "kurzzeitigen Überlastung, in ein, zwei Minuten klappt es wieder.",
      },
      { status: 502 },
    );
  }
}
