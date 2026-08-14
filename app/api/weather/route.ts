import { NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather";
import type { Weather } from "@/types";

export const runtime = "nodejs";

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: Weather }>();

/** Wetter ändert sich langsam: das CDN darf es 10 Minuten frisch halten und
 *  danach kurz veraltet ausliefern, während neu geladen wird. */
const CACHE_HEADER = "public, s-maxage=600, stale-while-revalidate=1800";

function ok(value: Weather) {
  return NextResponse.json(value, { headers: { "Cache-Control": CACHE_HEADER } });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng") ?? params.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat und lng sind erforderlich" },
      { status: 400 },
    );
  }

  const key = `${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return ok(hit.value);
  }

  try {
    const value = await fetchWeather(lat, lng);
    cache.set(key, { at: Date.now(), value });
    return ok(value);
  } catch (error) {
    if (hit) return ok(hit.value);
    console.error("[wohldraussen] weather:", error);
    return NextResponse.json(
      { error: "Die Wetterdaten sind gerade nicht erreichbar." },
      { status: 502 },
    );
  }
}
