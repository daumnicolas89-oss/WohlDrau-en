import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface NominatimResult {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

/** Aus dem langen Nominatim-Namen eine kurze, lesbare Bezeichnung machen. */
function shortLabel(r: NominatimResult): string {
  const parts = r.display_name.split(",").map((s) => s.trim());
  const first = r.name && r.name.length > 0 ? r.name : parts[0];
  // Name plus eine Ebene Kontext (Stadt/Kreis) – reicht zum Unterscheiden.
  const context = parts.find((p) => p && p !== first);
  return context ? `${first}, ${context}` : first;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({
        q,
        format: "jsonv2",
        limit: "6",
        addressdetails: "0",
        "accept-language": "de",
        countrycodes: "de,at,ch",
      });

    const res = await fetch(url, {
      headers: {
        // Nominatim verlangt eine aussagekräftige Kennung.
        "User-Agent": "WohlDraussen/0.1 (Standortsuche)",
        "Accept-Language": "de",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    const data = (await res.json()) as NominatimResult[];

    const results = data
      .map((r) => ({ label: shortLabel(r), lat: Number(r.lat), lng: Number(r.lon) }))
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[wohldraussen] geocode:", error);
    return NextResponse.json(
      { error: "Ortssuche gerade nicht möglich. Bitte kurz später erneut." },
      { status: 502 },
    );
  }
}
