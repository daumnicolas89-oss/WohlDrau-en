import { NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather";
import type { Weather } from "@/types";

export const runtime = "nodejs";

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: Weather }>();

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
    return NextResponse.json(hit.value);
  }

  try {
    const value = await fetchWeather(lat, lng);
    cache.set(key, { at: Date.now(), value });
    return NextResponse.json(value);
  } catch (error) {
    if (hit) return NextResponse.json(hit.value);
    console.error("[wohldraussen] weather:", error);
    return NextResponse.json(
      { error: "Die Wetterdaten sind gerade nicht erreichbar." },
      { status: 502 },
    );
  }
}
