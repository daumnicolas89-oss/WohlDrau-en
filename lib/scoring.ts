import { formatDistance, clamp, walkingMinutes } from "./utils";
import { freshness, statusOption } from "./status";
import { computeShade } from "./sun";
import { weatherAt } from "./weather";
import type {
  OsmPlace,
  Place,
  PlaceStatus,
  ScoreBreakdown,
  ShadeResult,
  Weather,
} from "@/types";

/**
 * Gewichte des „Angenehm jetzt“-Scores. Bewusst flach und erklärbar:
 * Schatten entscheidet, Ausstattung und frische Meldungen korrigieren,
 * Entfernung stupst nur.
 */
export const WEIGHTS = {
  shade: 0.45,
  amenity: 0.25,
  status: 0.2,
  distance: 0.1,
} as const;

/** Ab dieser Entfernung fällt der Distanzwert spürbar ab (e-Funktion). */
const DISTANCE_FALLOFF_M = 2200;

/**
 * Wie viel Schatten will man bei diesem Wetter? Bei 30 °C und UV 8 sehr viel,
 * bei 8 °C im Herbst möglichst wenig.
 */
export function desiredShade(apparentTemperature: number, uvIndex: number): number {
  const fromHeat = clamp((apparentTemperature - 19) / 11);
  const fromUv = clamp((uvIndex - 3) / 5);
  return clamp(Math.max(fromHeat, fromUv * 0.9));
}

/**
 * Passt der aktuelle Schatten zu dem, was das Wetter verlangt?
 *
 * Zu wenig Schatten stört immer. Zu viel Schatten stört nur, wenn es kühl ist –
 * und auch dann nur, soweit er vermeidbar ist: Unter einer geschlossenen
 * Wolkendecke ist kein Ort sonniger als der andere, ein Malus dafür würde
 * lediglich alle Orte gleichmäßig abwerten und die Reihenfolge verrauschen.
 */
function shadeScoreOf(
  shade: ShadeResult,
  apparentTemperature: number,
  uvIndex: number,
): number {
  const want = desiredShade(apparentTemperature, uvIndex);
  const coldPenalty = clamp((16 - apparentTemperature) / 10);

  if (shade.index < want) return 100 * (1 - clamp((want - shade.index) * 1.4));

  const avoidable = clamp(1 - (1 - shade.fromCanopy) * (1 - shade.fromBuildings));
  const surplus = Math.max(0, avoidable - want);
  return 100 * (1 - clamp(surplus * coldPenalty));
}

/** Toilette, Zaun und Wickeltisch entscheiden den Ausflug mit Kleinkind. */
function amenityScoreOf(place: OsmPlace): number {
  const t = place.tags;
  return Math.min(
    100,
    25 +
      (t.toilet === true ? 30 : 0) +
      (t.fenced === true ? 20 : 0) +
      (t.changing_table === true ? 15 : 0) +
      (t.drinking_water === true ? 5 : 0) +
      (t.shelter === true ? 5 : 0),
  );
}

/** Wie stark eine frische Meldung den Score verschiebt (ausgehend von 50). */
const STATUS_IMPACT: Record<PlaceStatus["type"], number> = {
  great: 45,
  too_sunny: -40,
  wet: -35,
  too_crowded: -30,
  toilet_closed: -20,
  other: 0,
};

function statusScoreOf(statuses: PlaceStatus[], now: number): number {
  let score = 50;
  for (const status of statuses) {
    score += STATUS_IMPACT[status.type] * freshness(status, now);
  }
  return clamp(score, 0, 100);
}

function distanceScoreOf(distanceM: number): number {
  return 100 * Math.exp(-distanceM / DISTANCE_FALLOFF_M);
}

/** Regen und starker Wind machen jeden Ort schlechter, nicht nur einen. */
function weatherFactorOf(precipitationProbability: number, windSpeed: number): number {
  const rain = clamp(precipitationProbability / 100) * 0.5;
  const wind = clamp((windSpeed - 18) / 30) * 0.15;
  return clamp(1 - rain - wind, 0.4, 1);
}

export interface ScoreContext {
  weather: Weather;
  /** Zeitpunkt der Bewertung – jetzt, +30 Min oder +1 Std. */
  at: Date;
  statuses: PlaceStatus[];
  distanceM: number;
  now?: number;
}

export function scorePlace(place: OsmPlace, ctx: ScoreContext): Place {
  const { weather, at, distanceM, now = Date.now() } = ctx;
  const w = weatherAt(weather, at);
  const shade = computeShade(place, at, w.cloudCover);
  const fresh = ctx.statuses.filter((s) => freshness(s, now) > 0);

  const breakdown: ScoreBreakdown = {
    shadeScore: shadeScoreOf(shade, w.apparentTemperature, w.uvIndex),
    amenityScore: amenityScoreOf(place),
    statusScore: statusScoreOf(fresh, now),
    distanceScore: distanceScoreOf(distanceM),
    weatherFactor: weatherFactorOf(w.precipitationProbability, weather.windSpeed),
  };

  const base =
    breakdown.shadeScore * WEIGHTS.shade +
    breakdown.amenityScore * WEIGHTS.amenity +
    breakdown.statusScore * WEIGHTS.status +
    breakdown.distanceScore * WEIGHTS.distance;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (shade.state === "shady") reasons.push("Viel Schatten");
  else if (shade.state === "partial") reasons.push("Teils schattig");
  else if (shade.state === "no-sun") reasons.push("Keine direkte Sonne");

  if (distanceM > 0) reasons.push(`${walkingMinutes(distanceM)} Min zu Fuß`);
  if (place.tags.toilet === true) {
    reasons.push(
      place.toiletDistance !== null && place.toiletDistance > 25
        ? `Toilette ${formatDistance(place.toiletDistance)}`
        : "Toilette",
    );
  }
  if (place.tags.fenced === true) reasons.push("Eingezäunt");

  for (const status of fresh) {
    const option = statusOption(status.type);
    if (option.tone === "bad") warnings.push(`Gemeldet: ${option.label}`);
  }
  if (w.precipitationProbability >= 50) {
    warnings.push(`${Math.round(w.precipitationProbability)} % Regenrisiko`);
  }
  if (shade.state === "sunny" && desiredShade(w.apparentTemperature, w.uvIndex) > 0.55) {
    warnings.push("Wenig Schatten bei starker Sonne");
  }

  return {
    ...place,
    distance: distanceM,
    currentShadeScore: Math.round(shade.index * 100),
    pleasantScore: Math.round(clamp(base * breakdown.weatherFactor, 0, 100)),
    lastStatuses: fresh,
    shade,
    breakdown,
    reasons: reasons.slice(0, 3),
    warnings: warnings.slice(0, 2),
  };
}
