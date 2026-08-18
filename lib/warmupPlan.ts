/**
 * Die Planung des nächtlichen Vorwärmens, als pure Funktion – getestet in
 * tests/warmup-plan.test.ts. Die erste Fassung nahm stur die Listen-
 * Reihenfolge: Nach fünf Nächten waren die Großstädte vorn wieder
 * „abgestanden" und belegten erneut alle Slots – Städte ab Position 16
 * (ausgerechnet die Tester-Gegenden am Ende) kamen NIE an die Reihe.
 * Deshalb jetzt: Wer am längsten nicht gewärmt wurde, kommt zuerst.
 */

/** Der Radius der Standard-Anfrage der App: Default-Filter 1,5 km →
 *  radiusForDistance(1500) = 2500. (NICHT „2 km" – das ergäbe 3000.) */
export const WARMUP_RADIUS_M = 2500;

/** Jünger als das? Dann braucht die Stadt diese Nacht nichts. */
export const FRISCH_GENUG_MS = 5 * 24 * 60 * 60 * 1000;

/** Stadtzentren, absteigend nach Einwohnerzahl – plus die Test-Gegenden. */
export const STAEDTE: [string, number, number][] = [
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

export interface WarmupKandidat {
  stadt: string;
  lat: number;
  lng: number;
}

/**
 * Wählt bis zu `max` Städte: nur abgestandene (oder nie geholte), und davon
 * die ÄLTESTEN zuerst. `alterMs` fehlt für nie geholte Städte – die zählen
 * als unendlich alt und kommen ganz nach vorn.
 */
export function planeWarmup(
  alterMs: Map<string, number>,
  max: number,
  frischGenugMs: number = FRISCH_GENUG_MS,
): WarmupKandidat[] {
  return STAEDTE.map(([stadt, lat, lng]) => ({
    stadt,
    lat,
    lng,
    alter: alterMs.get(stadt) ?? Number.POSITIVE_INFINITY,
  }))
    .filter((k) => k.alter >= frischGenugMs)
    .sort((a, b) => b.alter - a.alter)
    .slice(0, max)
    .map(({ stadt, lat, lng }) => ({ stadt, lat, lng }));
}
