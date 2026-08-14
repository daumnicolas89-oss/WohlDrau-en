import { desiredShade } from "./scoring";

export type Regime = "night" | "hot" | "cold" | "mild";

/**
 * Das „Gesicht" der App folgt dem tatsächlichen Wetter, nicht dem Kalender:
 * nachts spielt die Sonne keine Rolle, bei Hitze/hohem UV zählt Schatten,
 * bei Kälte zählen Sonne und Windschutz, dazwischen ist fast überall okay.
 */
export function weatherRegime(
  apparentTemperature: number,
  uvIndex: number,
  isDay: boolean,
): Regime {
  if (!isDay) return "night";
  if (desiredShade(apparentTemperature, uvIndex) >= 0.5) return "hot";
  if (apparentTemperature < 10) return "cold";
  return "mild";
}
