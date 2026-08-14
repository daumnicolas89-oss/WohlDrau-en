export type TreeCoverKind = "dense" | "medium";

/** Eine Baum-Fläche aus OpenStreetMap: Wald/Forst/`landcover=trees` sind dicht,
 *  Gebüsch (`natural=scrub`) ist mittel. `rings` ist der Umriss als eine oder
 *  mehrere Linien, weil große Wälder als Relation (Multipolygon) aus mehreren
 *  Randstücken bestehen. */
export interface TreeCover {
  kind: TreeCoverKind;
  rings: { lat: number; lng: number }[][];
}

export const DENSE_CANOPY = 0.85;
const MEDIUM_CANOPY = 0.5;

/**
 * Ray-Casting über alle Kanten aller Umriss-Linien, ohne die einzelnen Linien
 * künstlich zu schließen. So funktioniert es für eine geschlossene Fläche (ein
 * Way, dessen erster und letzter Punkt gleich sind) genauso wie für ein
 * Multipolygon aus mehreren Rand-Segmenten, die zusammen den Rand bilden.
 */
function insideRings(lat: number, lng: number, rings: { lat: number; lng: number }[][]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1];
      const b = ring[i];
      const crosses =
        a.lat > lat !== b.lat > lat &&
        lng < ((b.lng - a.lng) * (lat - a.lat)) / (b.lat - a.lat) + a.lng;
      if (crosses) inside = !inside;
    }
  }
  return inside;
}

/**
 * Kronendeckung (0..1) aus echten Baum-Flächen: Liegt der Ort in einem Wald
 * (dicht) oder Gebüsch (mittel)? 0, wenn in keiner. Der stärkste Treffer zählt.
 * Das ist der Kern der genauen Schatten-Einschätzung: Ein Waldspielplatz liegt
 * in der Wald-Fläche und bekommt so hohe Deckung, auch ohne einzeln getaggte
 * Bäume.
 */
export function coverCanopyAt(
  lat: number,
  lng: number,
  covers: TreeCover[],
): number {
  let best = 0;
  for (const cover of covers) {
    if (insideRings(lat, lng, cover.rings)) {
      best = Math.max(best, cover.kind === "dense" ? DENSE_CANOPY : MEDIUM_CANOPY);
    }
  }
  return best;
}
