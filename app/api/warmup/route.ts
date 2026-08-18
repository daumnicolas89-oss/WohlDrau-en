import { NextResponse } from "next/server";
import { fetchPlaces } from "@/lib/osm";
import { readTile, tileKey, writeTile } from "@/lib/tileStore";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Nächtliches Vorwärmen des dauerhaften Orte-Speichers: Wer morgens in einer
 * dieser Städte die App öffnet, bekommt die Liste sofort, statt als erster
 * Besucher des Tages auf Overpass zu warten.
 *
 * Bewusst höflich zu Overpass (ehrenamtlich betrieben): pro Nacht höchstens
 * DREI Städte, nacheinander, mit Pausen. Der Speicher füllt sich über die
 * ersten Nächte und wird danach nur noch turnusmäßig aufgefrischt.
 */

/** Der Standard-Radius der App-Anfragen (Filter 2 km → Raster 2500 m). */
const RADIUS_M = 2500;
/** Jünger als das? Dann braucht die Stadt diese Nacht nichts. */
const FRISCH_GENUG_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_STAEDTE_PRO_LAUF = 3;
const ZEITBUDGET_MS = 100_000;
const PAUSE_MS = 2_000;

/** Stadtzentren, absteigend nach Einwohnerzahl – plus die Test-Gegenden. */
const STAEDTE: [string, number, number][] = [
  ["Berlin", 52.52, 13.405],
  ["Hamburg", 53.551, 9.994],
  ["München", 48.137, 11.575],
  ["Köln", 50.937, 6.96],
  ["Frankfurt", 50.11, 8.682],
  ["Stuttgart", 48.776, 9.183],
  ["Düsseldorf", 51.228, 6.773],
  ["Leipzig", 51.34, 12.375],
  ["Dortmund", 51.514, 7.466],
  ["Essen", 51.456, 7.012],
  ["Bremen", 53.079, 8.802],
  ["Dresden", 51.05, 13.738],
  ["Hannover", 52.376, 9.741],
  ["Nürnberg", 49.454, 11.077],
  ["Duisburg", 51.435, 6.762],
  ["Bochum", 51.482, 7.216],
  ["Wuppertal", 51.256, 7.15],
  ["Bielefeld", 52.03, 8.532],
  ["Bonn", 50.735, 7.101],
  ["Münster", 51.961, 7.628],
  ["Karlsruhe", 49.007, 8.404],
  ["Mannheim", 49.489, 8.467],
  ["Augsburg", 48.371, 10.898],
  ["Wiesbaden", 50.082, 8.24],
  ["Mönchengladbach", 51.185, 6.442],
  ["Braunschweig", 52.269, 10.521],
  ["Kiel", 54.323, 10.14],
  ["Aachen", 50.776, 6.084],
  ["Magdeburg", 52.131, 11.639],
  ["Freiburg", 47.995, 7.85],
  ["Lübeck", 53.866, 10.687],
  ["Erfurt", 50.978, 11.029],
  ["Rostock", 54.092, 12.099],
  ["Mainz", 49.999, 8.273],
  ["Kassel", 51.316, 9.498],
  // Die Gegenden der ersten Tester-Familien.
  ["Hamburg-Harburg", 53.461, 9.982],
  ["Rosengarten", 53.39, 9.93],
  ["Buchholz", 53.326, 9.868],
];

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nicht öfter als einmal pro Stunde je Instanz – falls jemand die URL rät. */
let letzterLauf = 0;

export async function GET(request: Request) {
  // Vercel-Cron schickt den Secret-Header automatisch mit, sobald CRON_SECRET
  // als Umgebungsvariable existiert. Ohne Secret bleibt die Drossel unten.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "nicht erlaubt" }, { status: 401 });
    }
  } else if (Date.now() - letzterLauf < 60 * 60 * 1000) {
    return NextResponse.json({ ok: true, note: "gerade erst gelaufen" });
  }
  letzterLauf = Date.now();

  const start = Date.now();
  const ergebnis: { stadt: string; status: string }[] = [];
  let aufgefrischt = 0;

  for (const [stadt, lat, lng] of STAEDTE) {
    if (aufgefrischt >= MAX_STAEDTE_PRO_LAUF) break;
    if (Date.now() - start > ZEITBUDGET_MS) break;

    const kegel = tileKey(lat, lng, RADIUS_M, false);
    const tile = await readTile(kegel);
    if (tile && tile.ageMs < FRISCH_GENUG_MS) continue;

    try {
      const voll = await fetchPlaces(lat, lng, RADIUS_M, false);
      await writeTile(kegel, voll);
      const schnell = await fetchPlaces(lat, lng, RADIUS_M, true);
      await writeTile(tileKey(lat, lng, RADIUS_M, true), schnell);
      aufgefrischt += 1;
      ergebnis.push({ stadt, status: `ok (${voll.places.length} Orte)` });
    } catch {
      // Overpass hat gerade keine Kapazität: nächste Nacht wieder.
      ergebnis.push({ stadt, status: "overpass nicht erreichbar" });
      break;
    }
    await pause(PAUSE_MS);
  }

  return NextResponse.json({
    ok: true,
    aufgefrischt,
    dauerMs: Date.now() - start,
    ergebnis,
  });
}
