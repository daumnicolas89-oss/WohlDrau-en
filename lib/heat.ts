/**
 * Sommer-Gegenstück zur Winter-Warnung: ein kurzer, ruhiger Hinweis bei großer
 * Hitze oder sehr hoher UV-Strahlung. Für kleine Kinder relevant (Überhitzung,
 * Sonnenbrand). Rein aus den echten Werten abgeleitet.
 */

export type HeatTone = "heat" | "uv";

export interface HeatWarning {
  tone: HeatTone;
  text: string;
}

/**
 * Höchstens ein Hinweis, das Dringendste zuerst (extreme Hitze vor großer Hitze
 * vor sehr hohem UV). Nur am Tag – nachts spielt weder Hitze noch UV die Rolle.
 */
export function heatWarning(params: {
  apparentTemperature: number;
  uvIndex: number;
  isDay: boolean;
}): HeatWarning | null {
  const { apparentTemperature, uvIndex, isDay } = params;
  if (!isDay) return null;

  if (apparentTemperature >= 35) {
    return {
      tone: "heat",
      text: "Extreme Hitze: Mit kleinen Kindern möglichst im Schatten bleiben und viel trinken.",
    };
  }
  if (apparentTemperature >= 31) {
    return {
      tone: "heat",
      text: "Große Hitze: Die pralle Mittagssonne meiden, Schatten suchen und viel trinken.",
    };
  }
  if (uvIndex >= 8) {
    return {
      tone: "uv",
      text: "Sehr hohe UV-Strahlung: Sonnenhut auf, gut eincremen und in den Schatten.",
    };
  }
  return null;
}
