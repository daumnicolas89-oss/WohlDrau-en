import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  postcode?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  addresstype?: string;
  address?: NominatimAddress;
}

/**
 * Aus dem langen Nominatim-Namen eine kurze, lesbare Bezeichnung machen.
 * - Postleitzahl: „35037 Marburg" statt eines einzelnen Stadtteils.
 * - Sonst: Name plus die erste übergeordnete Ebene, die sich vom Namen
 *   unterscheidet (Stadt/Kreis/Land), damit gleichnamige Orte unterscheidbar
 *   bleiben („Rosengarten, Landkreis Harburg").
 */
function shortLabel(r: NominatimResult): string {
  const a = r.address ?? {};

  if (r.addresstype === "postcode") {
    const plz = a.postcode || r.name || "";
    const stadt = a.city || a.town || a.village || a.municipality || a.county;
    return stadt ? `${plz} ${stadt}`.trim() : plz || r.display_name;
  }

  const name =
    r.name && r.name.length > 0 ? r.name : r.display_name.split(",")[0].trim();
  const kontext = [
    a.city,
    a.town,
    a.village,
    a.municipality,
    a.county,
    a.state,
  ].find((value) => value && value !== name);
  return kontext ? `${name}, ${kontext}` : name;
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
        addressdetails: "1",
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
