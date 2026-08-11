import * as SunCalc from "suncalc";
import { clamp } from "./utils";
import type { OsmPlace, ShadeResult, ShadeState } from "@/types";

/** Typische Breite einer Gebäudefront – der Schatten ist nicht nur ein Strich. */
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

/** Kronen schirmen am besten ab, wenn die Sonne hoch steht. */
function canopyShade(place: OsmPlace, altitudeDeg: number): number {
  return clamp(
    place.shadeInputs.canopy * (0.45 + 0.55 * Math.sin(altitudeDeg * DEG)),
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

  const fromClouds = clamp(cloudCoverPercent / 100) * 0.85;
  const fromCanopy = canopyShade(place, altitudeDeg);
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
