/**
 * Winter-Sicherheit: ein kurzer, ehrlicher Hinweis, wenn es glatt, verschneit
 * oder frostig ist. Rein aus den echten Wetterwerten abgeleitet (WMO-Wettercode
 * von Open-Meteo), keine Schätzung aus der Temperatur allein.
 */

export type WinterTone = "ice" | "snow" | "frost";

export interface WinterWarning {
  tone: WinterTone;
  text: string;
}

// WMO-Wettercodes (Open-Meteo).
const FREEZING = new Set([56, 57, 66, 67]); // gefrierender Sprühregen / Regen
const RIME_FOG = 48; // Reifnebel – legt eine glatte Schicht an
const SNOW = new Set([71, 73, 75, 77, 85, 86]);

/**
 * Liefert höchstens einen Hinweis – den dringendsten zuerst (Blitzeis vor
 * Schnee vor Reif vor Frost). Kein Hinweis bei mildem oder trockenem Wetter.
 */
export function winterWarning(params: {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  snowfall: number;
  precipitation: number;
}): WinterWarning | null {
  const { temperature, apparentTemperature, weatherCode, snowfall, precipitation } = params;

  // 1. Gefrierender Regen – am gefährlichsten (Blitzeis).
  if (FREEZING.has(weatherCode)) {
    return {
      tone: "ice",
      text: "Gefrierender Regen: Es kann spiegelglatt sein.",
    };
  }
  // 2. Schnee.
  if (SNOW.has(weatherCode) || snowfall > 0) {
    return {
      tone: "snow",
      text: "Es schneit. Warm einpacken und auf rutschige Wege achten.",
    };
  }
  // 3. Reifnebel.
  if (weatherCode === RIME_FOG) {
    return {
      tone: "ice",
      text: "Reifnebel: Auf überfrorene, glatte Stellen achten.",
    };
  }
  // 4. Strenge Kälte (gefühlt, inkl. Wind): mit kleinen Kindern nur kurz raus.
  if (apparentTemperature <= -10) {
    return {
      tone: "frost",
      text: "Strenge Kälte: Mit kleinen Kindern nur kurz raus und gut einpacken.",
    };
  }
  // 5. Frost: wo es nass war, kann es glatt sein.
  if (temperature <= 0) {
    return {
      tone: "frost",
      text:
        precipitation > 0
          ? "Frost bei Nässe: Gut möglich, dass Wege glatt sind."
          : "Frost: Auf glatte Stellen achten, vor allem im Schatten.",
    };
  }
  return null;
}
