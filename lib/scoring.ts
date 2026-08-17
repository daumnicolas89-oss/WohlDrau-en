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

  // Bergschatten ist ortsgebunden wie ein Gebäude: Das Tal hinterm Hügel ist
  // bei 5 °C wirklich kälter als die besonnte Wiese nebenan. Nur Wolken
  // bleiben draußen – die treffen alle Orte gleich.
  const avoidable = clamp(
    1 -
      (1 - shade.fromCanopy) *
        (1 - shade.fromBuildings) *
        (1 - (shade.fromTerrain ?? 0)),
  );

  const roh =
    shade.index < want
      ? 100 * (1 - clamp((want - shade.index) * 1.4))
      : 100 * (1 - clamp(Math.max(0, avoidable - want) * coldPenalty));

  // Dämmerungs-Blende: Unter ~6° Sonnenhöhe blendet real nichts mehr, aber
  // der Sentinel bei Sonnenuntergang sprang von „zu sonnig" (48) hart auf
  // 100 – ein 15-Punkte-Sprung in drei Minuten, quer über zwei Wortbänder.
  // Deshalb gleitet der Malus in der letzten Stunde weich aus.
  const daemmerung = clamp(shade.sunAltitudeDeg / 6);
  return 100 - (100 - roh) * daemmerung;
}

/** Toilette, Zaun und Wickeltisch entscheiden den Ausflug mit Kleinkind. */
function amenityScoreOf(place: OsmPlace): number {
  const t = place.tags;
  return Math.min(
    100,
    25 +
      (t.toilet === true ? 30 : 0) +
      (t.fenced === true ? 20 : 0) +
      (t.water_play === true ? 20 : 0) +
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
  dirty_broken: -35,
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
function weatherFactorOf(
  precipitationProbability: number,
  windSpeed: number,
): { factor: number; driver: "rain" | "wind" | null } {
  const rain = clamp(precipitationProbability / 100) * 0.5;
  const wind = clamp((windSpeed - 18) / 30) * 0.15;
  const factor = clamp(1 - rain - wind, 0.4, 1);
  const driver = factor >= 0.97 ? null : rain >= wind ? "rain" : "wind";
  return { factor, driver };
}

export interface ScoreContext {
  weather: Weather;
  /** Zeitpunkt der Bewertung, jetzt, +30 Min oder +1 Std. */
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

  // Wie sehr entscheidet Schatten bei diesem Wetter überhaupt? Bei Hitze/Sonne
  // stark, an milden Tagen kaum. Ist er egal, würde ein festes Schatten-Gewicht
  // alle Orte gleich hoch bewerten, dann sollen Ausstattung und Nähe den
  // Ausschlag geben. Das frei werdende Gewicht wandert dorthin (60 % / 40 %).
  // Nachts sagt Schatten nichts aus – in einer warmen Nacht würde die
  // Temperatur sonst Gewicht ZUM (bedeutungslosen) Schatten schieben und
  // die echten Unterschiede (Ausstattung, Nähe) verdünnen.
  const shadeRelevance =
    shade.state === "no-sun" ? 0 : desiredShade(w.apparentTemperature, w.uvIndex);
  const shadeW = 0.15 + (WEIGHTS.shade - 0.15) * shadeRelevance;
  const freed = WEIGHTS.shade - shadeW;
  const weights: { shade: number; amenity: number; status: number; distance: number } = {
    shade: shadeW,
    amenity: WEIGHTS.amenity + freed * 0.6,
    status: WEIGHTS.status,
    distance: WEIGHTS.distance + freed * 0.4,
  };

  // Ohne Meldungen ist der Meldungs-Teil ein fixer 50er-Anker, der mit
  // 20 % Gewicht JEDEN Wert zur Mitte staucht – deshalb drängte sich in
  // München alles bei 42–54. Gibt es nichts zu melden, zählt der Teil
  // nichts, und die drei echten Teile teilen sich sein Gewicht.
  // Nur Meldungen mit echter Aussage zählen für die Gewichtsentscheidung:
  // Eine neutrale „Sonstiges"-Meldung würde sonst den 50er-Anker aktivieren
  // und den Platz 5 Punkte unter den identischen Nachbarn drücken.
  const wirksameMeldungen = fresh.filter((s) => STATUS_IMPACT[s.type] !== 0);
  if (wirksameMeldungen.length === 0) {
    const f = 1 / (1 - weights.status);
    weights.shade *= f;
    weights.amenity *= f;
    weights.distance *= f;
    weights.status = 0;
  }

  const breakdown: ScoreBreakdown = {
    shadeScore: shadeScoreOf(shade, w.apparentTemperature, w.uvIndex),
    amenityScore: amenityScoreOf(place),
    statusScore: statusScoreOf(fresh, now),
    distanceScore: distanceScoreOf(distanceM),
    ...(() => {
      const wetter = weatherFactorOf(w.precipitationProbability, w.windSpeed);
      return { weatherFactor: wetter.factor, weatherDriver: wetter.driver };
    })(),
    weights,
    shelterBonus: 0,
    accessMalus: 0,
  };

  // Ein Unterstand zählt das ganze Jahr, nur aus verschiedenen Gründen:
  // bei Regen als Dach, bei praller Hitze als Schattenplatz zum Durchatmen,
  // bei Kälte als Windschutz für die Pause. Wenn das Wetter egal ist, ist er
  // nur ein normales Ausstattungsmerkmal (steckt schon im amenityScore).
  // Rampen statt Schaltern: Die alten harten Schwellen (Regen ≥ 50 %,
  // ≥ 28°, ≤ 4°) ließen den Wert bei 49 → 50 % Regen um zehn Punkte
  // SPRINGEN – mehr Regen machte den Platz schlagartig besser. Jetzt wächst
  // der Bonus stetig mit dem Bedarf.
  const hatUnterstand = place.tags.shelter === true;
  // Flache Rampe (voll erst bei 80 %): Steiler würde der Bonus die
  // Regen-Dämpfung überholen, und mehr Regen machte den Platz wieder besser.
  const regenBedarf = clamp((w.precipitationProbability - 40) / 40);
  const hitzeBedarf = clamp((w.apparentTemperature - 26) / 4);
  const kaelteBedarf = clamp((6 - w.apparentTemperature) / 4);
  const bedarf = hatUnterstand
    ? Math.max(regenBedarf, hitzeBedarf, kaelteBedarf)
    : 0;
  const shelterGrund =
    bedarf < 0.5
      ? null
      : regenBedarf >= hitzeBedarf && regenBedarf >= kaelteBedarf
        ? "Unterstand für Regenpausen"
        : hitzeBedarf >= kaelteBedarf
          ? "Unterstand für eine Pause im Schatten"
          : "Unterstand als Windschutz für die Pause";
  const shelterBonus = Math.round(10 * bedarf);

  // Eingeschränkter Zugang (Schulhof, Kita): bewusst gelistet, aber ein
  // öffentlicher Platz nebenan soll bei Gleichstand immer vorne stehen –
  // meistens kommt man auf den privaten schlicht nicht drauf.
  const accessMalus = place.tags.restrictedAccess === true ? 5 : 0;

  // Bonus und Malus stehen NACH dem Wetterfaktor (siehe pleasantScore):
  // Vorher dämpfte der Regen den Unterstand-Bonus auf +5 herunter –
  // ausgerechnet dann, wenn das Dach am wichtigsten ist.
  const base =
    breakdown.shadeScore * weights.shade +
    breakdown.amenityScore * weights.amenity +
    breakdown.statusScore * weights.status +
    breakdown.distanceScore * weights.distance;

  breakdown.shelterBonus = shelterBonus;
  breakdown.accessMalus = accessMalus;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (shelterGrund) reasons.push(shelterGrund);

  // Schatten nur dann als Pluspunkt nennen, wenn er gerade etwas wert ist –
  // bei 5 °C Wintersonne ist „Viel Schatten" kein Lob, sondern ein Problem.
  if (shade.state === "shady" && shadeRelevance > 0.25) reasons.push("Viel Schatten");
  else if (shade.state === "partial" && shadeRelevance > 0.25)
    reasons.push("Teils schattig");
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
    pleasantScore: Math.round(
      clamp(base * breakdown.weatherFactor + shelterBonus - accessMalus, 0, 100),
    ),
    lastStatuses: fresh,
    shade,
    breakdown,
    reasons: reasons.slice(0, 3),
    warnings: warnings.slice(0, 2),
  };
}
