import type { OsmPlace } from "@/types";

/**
 * Hügelschatten: In Tälern verschwindet die Sonne hinter dem Berg, lange bevor
 * sie rechnerisch untergeht. Je Ort entsteht ein Horizont-Winkel in 8
 * Himmelsrichtungen (Geländehöhe in 2 km Entfernung, Open-Meteo Elevation,
 * ~90 m Raster). Steht die Sonne flacher, liegt der Platz im Bergschatten.
 *
 * Sparsam aus zwei Gründen: Die API zählt jede Koordinate gegen ein
 * Minuten-Budget, und im Flachland ist der Horizont ohnehin ~0. Darum:
 * 1. EIN Abruf für die Höhen aller Orte. Liegt alles binnen 40 m, ist die
 *    Gegend flach und es passiert nichts weiter (Hamburg, München, Berlin …).
 * 2. Im Hügelland teilen sich Orte einer ~550-m-Zelle die Ring-Messung –
 *    der Horizont ändert sich auf 500 m kaum, die Koordinaten-Zahl schon.
 */

const ELEVATION_ENDPOINT = "https://api.open-meteo.com/v1/elevation";
/** Abstand der Horizont-Messpunkte vom Ort. */
const RING_M = 2_000;
/** Unter diesem Höhenunterschied zwischen den Orten gilt die Gegend als flach. */
const FLAT_SPREAD_M = 40;
/** Unter diesem Winkel lohnt kein Eintrag – das ist Flachland-Rauschen. */
const MIN_HORIZON_DEG = 1.5;
/** Zellgröße fürs Teilen der Ring-Messungen (~550 m). */
const CELL_DEG = 0.005;
/** Obergrenze an Zellen, damit das Minuten-Budget der API sicher hält. */
const MAX_CELLS = 35;
/** Open-Meteo erlaubt bis zu 100 Koordinaten pro Aufruf. */
const BATCH = 100;

const DEG = Math.PI / 180;

function ringPoint(lat: number, lng: number, azimuthDeg: number) {
  const dLat = (RING_M * Math.cos(azimuthDeg * DEG)) / 110_574;
  const dLng =
    (RING_M * Math.sin(azimuthDeg * DEG)) / (111_320 * Math.cos(lat * DEG));
  return { lat: lat + dLat, lng: lng + dLng };
}

async function fetchElevations(points: { lat: number; lng: number }[]): Promise<number[]> {
  const out: number[] = [];
  for (let i = 0; i < points.length; i += BATCH) {
    const chunk = points.slice(i, i + BATCH);
    const url =
      `${ELEVATION_ENDPOINT}?latitude=${chunk.map((p) => p.lat.toFixed(4)).join(",")}` +
      `&longitude=${chunk.map((p) => p.lng.toFixed(4)).join(",")}`;
    const res = await fetch(url, {
      next: { revalidate: 7 * 86_400 }, // Berge bewegen sich nicht
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Elevation → HTTP ${res.status}`);
    const data = (await res.json()) as { elevation?: number[] };
    if (!data.elevation || data.elevation.length !== chunk.length) {
      throw new Error("Elevation → unerwartete Antwort");
    }
    out.push(...data.elevation);
  }
  return out;
}

/**
 * Hängt an Orte im Hügelland `shadeInputs.horizon` (8 Winkel, ab Nord im
 * Uhrzeigersinn). Fehler lassen die Orte unverändert – dann gibt es eben
 * keinen Bergschatten, wie bisher.
 */
export async function attachHorizons(places: OsmPlace[]): Promise<void> {
  if (places.length === 0) return;
  try {
    // Schritt 1: Höhen aller Orte – ein günstiger Abruf, meist der einzige.
    const baseElevations = await fetchElevations(
      places.map((p) => ({ lat: p.lat, lng: p.lng })),
    );
    const spread =
      Math.max(...baseElevations) - Math.min(...baseElevations);
    if (spread < FLAT_SPREAD_M) return; // Flachland: fertig.

    // Schritt 2: Orte zu Zellen bündeln; große Gegenden gröber rastern,
    // damit die Koordinaten-Zahl gedeckelt bleibt.
    let cellDeg = CELL_DEG;
    let cells = new Map<string, { lat: number; lng: number }>();
    for (let round = 0; round < 3; round++) {
      cells = new Map();
      for (const p of places) {
        const key = `${Math.round(p.lat / cellDeg)}:${Math.round(p.lng / cellDeg)}`;
        if (!cells.has(key)) {
          cells.set(key, {
            lat: Math.round(p.lat / cellDeg) * cellDeg,
            lng: Math.round(p.lng / cellDeg) * cellDeg,
          });
        }
      }
      if (cells.size <= MAX_CELLS) break;
      cellDeg *= 2;
    }

    // Schritt 3: Ring-Höhen je Zelle abfragen.
    const cellKeys = [...cells.keys()];
    const ringCoords: { lat: number; lng: number }[] = [];
    for (const key of cellKeys) {
      const c = cells.get(key)!;
      for (let dir = 0; dir < 8; dir++) {
        ringCoords.push(ringPoint(c.lat, c.lng, dir * 45));
      }
    }
    const ringElevations = await fetchElevations(ringCoords);
    const ringsByCell = new Map<string, number[]>();
    cellKeys.forEach((key, i) => {
      ringsByCell.set(key, ringElevations.slice(i * 8, i * 8 + 8));
    });

    // Schritt 4: Horizont je Ort aus Zell-Ring und eigener Ortshöhe.
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const key = `${Math.round(p.lat / cellDeg)}:${Math.round(p.lng / cellDeg)}`;
      const rims = ringsByCell.get(key);
      if (!rims) continue;
      const base = baseElevations[i];
      const horizon: number[] = [];
      let relevant = false;
      for (let dir = 0; dir < 8; dir++) {
        const winkel = Math.atan2(rims[dir] - base, RING_M) / DEG;
        const deg = winkel >= MIN_HORIZON_DEG ? Number(winkel.toFixed(1)) : 0;
        if (deg > 0) relevant = true;
        horizon.push(deg);
      }
      if (relevant) p.shadeInputs.horizon = horizon;
    }
  } catch {
    // Ohne Höhendaten rechnet die App wie bisher – lieber pünktlich als perfekt.
  }
}
