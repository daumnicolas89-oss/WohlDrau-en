import { NextResponse } from "next/server";
import { fetchPlaces, type FetchPlacesResult } from "@/lib/osm";

export const runtime = "nodejs";

/** Spielplätze wandern nicht. Ein Tag Cache spart sehr viele Overpass-Anfragen. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RADIUS_M = 3000;

const cache = new Map<string, { at: number; value: FetchPlacesResult }>();
const inFlight = new Map<string, Promise<FetchPlacesResult>>();

/** Auf ~1 km Raster runden, damit sich Anfragen aus einer Gegend den Cache teilen. */
function cacheKey(lat: number, lng: number, radius: number) {
  return `${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
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
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.value, { headers: { "x-wd-cache": "hit" } });
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
    cache.set(key, { at: Date.now(), value });
    return NextResponse.json(value, { headers: { "x-wd-cache": "miss" } });
  } catch (error) {
    if (hit) {
      // Lieber leicht veraltete Orte als eine leere Startseite.
      return NextResponse.json(hit.value, { headers: { "x-wd-cache": "stale" } });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Orte konnten nicht geladen werden",
      },
      { status: 502 },
    );
  }
}
