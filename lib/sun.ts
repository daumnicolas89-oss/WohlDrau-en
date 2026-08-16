import * as SunCalc from "suncalc";
import { clamp } from "./utils";
import { weatherAt } from "./weather";
import type { OsmPlace, ShadeResult, ShadeState, Weather } from "@/types";

/** Typische Breite einer Gebäudefront, der Schatten ist nicht nur ein Strich. */
const BUILDING_HALF_WIDTH_M = 11;
/** Unterhalb dieser Sonnenhöhe gibt es praktisch keine direkte Einstrahlung mehr. */
const MIN_ALTITUDE_DEG = 0.5;

const DEG = Math.PI / 180;

/**
 * Anteil der Fläche, der von umstehenden Gebäuden verschattet wird.
 * Modell: Jedes Gebäude wirft einen Schatten der Länge h / tan(Sonnenhöhe)
 * von der Sonne weg. Getroffen wird der Ort, wenn er in diesem Streifen liegt.
 */
function buildingShade(
  place: OsmPlace,
  altitudeDeg: number,
  azimuthDeg: number,
): number {
  const { buildings, areaM2 } = place.shadeInputs;
  if (buildings.length === 0) return 0;

  // Richtung zur Sonne als Einheitsvektor (Ost, Nord).
  // SunCalc 2.x misst das Azimut im Uhrzeigersinn ab Norden.
  const sx = Math.sin(azimuthDeg * DEG);
  const sy = Math.cos(azimuthDeg * DEG);
  // Bei sehr flacher Sonne würde der Schatten rechnerisch ins Unendliche laufen.
  const shadowFactor = Math.min(40, 1 / Math.tan(altitudeDeg * DEG));

  let open = 1;
  for (const b of buildings) {
    const along = b.dx * sx + b.dy * sy;
    if (along <= 0) continue; // Gebäude steht auf der sonnenabgewandten Seite
    const reach = b.h * shadowFactor;
    if (along > reach * 1.2) continue;
    const across = Math.abs(b.dx * sy - b.dy * sx);
    const lateral = Math.exp(-((across / BUILDING_HALF_WIDTH_M) ** 2));
    const depth =
      along <= reach * 0.8 ? 1 : clamp((reach * 1.2 - along) / (reach * 0.4));
    open *= 1 - clamp(lateral * depth) * 0.9;
  }

  // Ein einzelner Häuserschatten verdunkelt keinen ganzen Park.
  const extent = Math.sqrt(areaM2 ?? 3600);
  const damping = clamp(70 / Math.max(70, extent), 0.3, 1);
  return clamp((1 - open) * damping);
}

/**
 * Laubbäume sind im Winter kahl und werfen nur noch Ast-Schatten. Ohne diesen
 * Faktor gälte ein Buchenhain im Januar als „viel Schatten" – und würde bei
 * der Winter-Sonnensuche zu Unrecht abgewertet. Der Nadelwald-Anteil ist in
 * den Daten (noch) nicht unterscheidbar, darum ein vorsichtiger Mischwert.
 */
function leafFactor(date: Date, leaf?: "needle" | "broad" | "mixed"): number {
  if (leaf === "needle") return 1; // Nadelwald bleibt ganzjährig dicht
  const monat = date.getMonth(); // 0 = Januar
  if (monat >= 10 || monat <= 2) {
    // November bis März: Laub kahl, Mischwald halb, Unbekanntes vorsichtig.
    if (leaf === "broad") return 0.45;
    if (leaf === "mixed") return 0.75;
    return 0.55;
  }
  if (monat === 3 || monat === 9) return 0.8; // April und Oktober (Übergang)
  return 1;
}

/** Kronen schirmen am besten ab, wenn die Sonne hoch steht. */
function canopyShade(place: OsmPlace, altitudeDeg: number, date: Date): number {
  return clamp(
    place.shadeInputs.canopy *
      leafFactor(date, place.shadeInputs.canopyLeaf) *
      (0.45 + 0.55 * Math.sin(altitudeDeg * DEG)),
  );
}

export function shadeStateOf(index: number, hasSun: boolean): ShadeState {
  if (!hasSun) return "no-sun";
  if (index >= 0.68) return "shady";
  if (index >= 0.38) return "partial";
  return "sunny";
}

export function computeShade(
  place: OsmPlace,
  date: Date,
  cloudCoverPercent: number,
): ShadeResult {
  const pos = SunCalc.getPosition(date, place.lat, place.lng);
  const altitudeDeg = pos.altitude;

  if (altitudeDeg <= MIN_ALTITUDE_DEG) {
    return {
      index: 1,
      state: "no-sun",
      sunAltitudeDeg: altitudeDeg,
      fromCanopy: 0,
      fromBuildings: 0,
      fromClouds: 0,
    };
  }

  // Bergschatten: Steht die Sonne flacher als der Gelände-Horizont in ihrer
  // Richtung, liegt der Platz komplett im Schatten des Hügels – real z. B.
  // abends in Alpentälern, lange vor dem rechnerischen Sonnenuntergang.
  const horizon = place.shadeInputs.horizon;
  if (horizon && horizon.length === 8) {
    const oktant = Math.round((((pos.azimuth % 360) + 360) % 360) / 45) % 8;
    if (altitudeDeg < (horizon[oktant] ?? 0)) {
      return {
        index: 1,
        state: "shady",
        sunAltitudeDeg: altitudeDeg,
        fromCanopy: 0,
        fromBuildings: 0,
        fromClouds: clamp(cloudCoverPercent / 100) * 0.85,
        fromTerrain: 1,
      };
    }
  }

  const fromClouds = clamp(cloudCoverPercent / 100) * 0.85;
  const fromCanopy = canopyShade(place, altitudeDeg, date);
  const fromBuildings = buildingShade(place, altitudeDeg, pos.azimuth);

  const index = clamp(
    1 - (1 - fromClouds) * (1 - fromCanopy) * (1 - fromBuildings),
  );

  return {
    index,
    state: shadeStateOf(index, true),
    sunAltitudeDeg: altitudeDeg,
    fromCanopy,
    fromBuildings,
    fromClouds,
  };
}

export function sunTimes(lat: number, lng: number, date: Date) {
  const times = SunCalc.getTimes(date, lat, lng);
  return { sunrise: times.sunrise, sunset: times.sunset };
}

/**
 * Ist zum Zeitpunkt Tag (Sonne über dem Horizont)? Für die Zeit-Vorschau
 * („+1 Std") wichtig: `weather.isDay` gilt nur für JETZT – um Sonnenuntergang
 * widerspräche der Kopf sonst den Karten, die längst „keine Sonne" rechnen.
 */
export function isDaylight(lat: number, lng: number, date: Date): boolean {
  return SunCalc.getPosition(date, lat, lng).altitude > MIN_ALTITUDE_DEG;
}

/** Länge und Auflösung der Schatten-Vorschau, an einer Stelle, damit die
 *  Anzeige (Balken) und die Entscheidung „lohnt die Vorschau überhaupt?“
 *  nie unterschiedliche Fenster betrachten. */
export const SHADE_WINDOW_STEPS = 6;
export const SHADE_WINDOW_STEP_MINUTES = 60;

export interface ShadeStep {
  at: Date;
  shade: ShadeResult;
}

/** Der Schatten für die nächsten Stunden, Schritt für Schritt. */
export function shadeWindow(place: OsmPlace, weather: Weather, from: Date): ShadeStep[] {
  return Array.from({ length: SHADE_WINDOW_STEPS }, (_, index) => {
    const at = new Date(from.getTime() + index * SHADE_WINDOW_STEP_MINUTES * 60_000);
    return { at, shade: computeShade(place, at, weatherAt(weather, at).cloudCover) };
  });
}

/** Kommt in diesem Fenster überhaupt die Sonne vor? Nachts durchgehend „nein“,
 *  dann lohnt die Schatten-Vorschau nicht. */
export function windowHasSun(place: OsmPlace, weather: Weather, from: Date): boolean {
  return shadeWindow(place, weather, from).some((step) => step.shade.state !== "no-sun");
}
