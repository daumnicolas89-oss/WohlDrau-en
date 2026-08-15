import { formatTime } from "./utils";

/** Altersgruppen der Zielgruppe – von Säugling bis Grundschule. */
export type AgeGroup = "baby" | "toddler" | "kita" | "school";

/** Individuelles Wärmeempfinden des Kindes (Eltern wissen das am besten). */
export type WarmthSensitivity = "chilly" | "neutral" | "warm";

/**
 * Kleine Kinder regulieren ihre Temperatur schlechter und bewegen sich weniger,
 * darum die Faustregel „eine Schicht mehr". Wir verschieben dafür die gefühlte
 * Temperatur nach unten – ein Baby braucht bei denselben Werten wärmere Sachen
 * als ein Schulkind (das sich oft überhitzt).
 */
const AGE_TEMP_OFFSET: Record<AgeGroup, number> = {
  baby: 4,
  toddler: 2,
  kita: 0,
  school: -1,
};

/**
 * Feinjustierung nach dem eigenen Kind: friert es leicht, rechnen wir kühler
 * (mehr an), schwitzt es leicht, wärmer (weniger an).
 */
const SENSITIVITY_OFFSET: Record<WarmthSensitivity, number> = {
  chilly: 2,
  neutral: 0,
  warm: -2,
};

/** Die für dieses Kind maßgebliche gefühlte Temperatur. */
function felt(
  apparentTemperature: number,
  age: AgeGroup,
  sensitivity: WarmthSensitivity,
): number {
  return apparentTemperature - AGE_TEMP_OFFSET[age] - SENSITIVITY_OFFSET[sensitivity];
}

/** Verbindet Stichpunkte zu einer natürlichen Aufzählung: „a, b und c". */
function verbinde(teile: string[]): string {
  if (teile.length <= 1) return teile[0] ?? "";
  return `${teile.slice(0, -1).join(", ")} und ${teile[teile.length - 1]}`;
}

/**
 * Kurze, ganze Sätze zum aktuellen Wetter – passend zum Alter des Kindes.
 * Rein aus den echten Werten abgeleitet, keine Schätzung. Spiegelt bewusst die
 * gleiche Logik wie `outfitFor`, damit Zusammenfassung und Liste zusammenpassen.
 */
export function clothingAdvice(
  params: {
    apparentTemperature: number;
    uvIndex: number;
    precipitationProbability: number;
    windSpeed: number;
  },
  age: AgeGroup = "kita",
  sensitivity: WarmthSensitivity = "neutral",
): string {
  const { apparentTemperature, uvIndex, precipitationProbability, windSpeed } = params;
  const t = felt(apparentTemperature, age, sensitivity);
  const little = age === "baby" || age === "toddler";

  // Ein ganzer Einstiegssatz zur Temperatur – kein Stichwort-Stakkato.
  let lead: string;
  if (t >= 22) lead = "Bei den warmen Temperaturen reichen leichte Sachen.";
  else if (t >= 15)
    lead = "Bei den milden Temperaturen genügen ein Langarm-Shirt und eine leichte Jacke.";
  else if (t >= 8) lead = "Es ist kühl. Ein Pullover und eine Jacke sind jetzt richtig.";
  else lead = "Bei der Kälte heißt es dick einpacken, am besten mit Mütze.";

  // Die wichtigsten Zusätze – als natürlicher zweiter Satz.
  const hinweise: string[] = [];
  if (age === "baby" && uvIndex >= 3) {
    hinweise.push("mit dem Baby im Schatten bleiben");
  } else {
    const hatThreshold = little ? 3 : 5;
    if (uvIndex >= hatThreshold) hinweise.push("einen Sonnenhut aufsetzen");
    if (uvIndex >= 5 && age !== "baby") hinweise.push("gut eincremen");
  }
  if (precipitationProbability >= 60) hinweise.push("Regensachen einpacken");
  if (windSpeed >= 25) hinweise.push("etwas Winddichtes anziehen");
  if (apparentTemperature >= 25) hinweise.push("genug zu trinken mitnehmen");

  if (hinweise.length === 0) return lead;
  return `${lead} Am besten ${verbinde(hinweise)}.`;
}

export interface OutfitItem {
  icon: string;
  label: string;
}

export interface Outfit {
  /** Was man anzieht. */
  wear: OutfitItem[];
  /** Was man einpackt/mitnimmt (Schutz, Wasser). */
  bring: OutfitItem[];
  /** Optionaler Alters-Hinweis (nur wenn wirklich relevant). */
  note?: string;
}

/**
 * Konkrete Anziehsachen als Liste (Icon + Text), aus den echten Wetterwerten
 * und passend zum Alter des Kindes. Bewusst kompakt: die wichtigsten Teile,
 * nicht jede Socke.
 */
export function outfitFor(
  params: {
    apparentTemperature: number;
    uvIndex: number;
    precipitationProbability: number;
    windSpeed: number;
  },
  age: AgeGroup = "kita",
  sensitivity: WarmthSensitivity = "neutral",
): Outfit {
  const { apparentTemperature, uvIndex, precipitationProbability, windSpeed } = params;
  const t = felt(apparentTemperature, age, sensitivity); // gefühlt für dieses Kind
  const little = age === "baby" || age === "toddler";
  const wear: OutfitItem[] = [];
  const bring: OutfitItem[] = [];
  let note: string | undefined;

  if (t >= 27) {
    wear.push({ icon: "👕", label: "Leichtes T-Shirt" });
    wear.push({ icon: "🩳", label: "Kurze Hose" });
  } else if (t >= 22) {
    wear.push({ icon: "👕", label: "T-Shirt" });
    wear.push({ icon: "👖", label: "Leichte Hose" });
  } else if (t >= 15) {
    wear.push({ icon: "👕", label: "Langarm-Shirt" });
    wear.push({ icon: "👖", label: "Lange Hose" });
    wear.push({ icon: "🧥", label: windSpeed >= 25 ? "Winddichte Jacke" : "Leichte Jacke" });
  } else if (t >= 8) {
    wear.push({ icon: "🧶", label: "Pullover" });
    wear.push({ icon: "👖", label: "Lange Hose" });
    wear.push({ icon: "🧥", label: windSpeed >= 25 ? "Winddichte Jacke" : "Jacke" });
  } else {
    wear.push({ icon: "🧥", label: "Dicke Jacke" });
    wear.push({ icon: "🧢", label: "Mütze" });
    wear.push({ icon: "🧣", label: "Schal" });
    wear.push({ icon: "🧤", label: "Handschuhe" });
    wear.push({ icon: "👖", label: "Warme Hose" });
  }

  // Sonnenschutz – bei kleinen Kindern früher, weil die Haut empfindlicher ist.
  const hatThreshold = little ? 3 : 5;
  // 👒 statt 🧢: die Mütze im Kälte-Zweig nutzt 🧢 – zwei gleiche Icons mit
  // verschiedenen Labels im selben Raster wirken wie ein Fehler.
  if (uvIndex >= hatThreshold) wear.push({ icon: "👒", label: "Sonnenhut" });
  // Sonnencreme erst ab Kleinkind – Babys gehören in den Schatten, nicht in die Creme.
  if (uvIndex >= 5 && age !== "baby") bring.push({ icon: "🧴", label: "Sonnencreme" });

  if (precipitationProbability >= 50) {
    bring.push({ icon: "🌧️", label: "Regenjacke" });
    bring.push({ icon: "👢", label: "Gummistiefel" });
  }
  // Trinken hängt an der echten Hitze, nicht an der alters-verschobenen.
  if (apparentTemperature >= 25) bring.push({ icon: "💧", label: "Wasser" });

  // Das Wärmeempfinden soll immer sichtbar etwas bewirken – nicht nur, wenn
  // die ±2° zufällig eine Temperaturgrenze überqueren. Ein verfrorenes Kind
  // bekommt eine Reserve-Schicht eingepackt, ein verschwitztes ein trockenes
  // Shirt zum Wechseln.
  // 👚 statt 🧥: die Jacken-Zweige nutzen 🧥 – gleiche Icons mit
  // verschiedenen Labels im selben Fenster wirken wie ein Fehler.
  if (sensitivity === "chilly") bring.push({ icon: "👚", label: "Extraschicht" });
  if (sensitivity === "warm") bring.push({ icon: "🎽", label: "Wechselshirt" });

  // Höchstens ein Hinweis – der dringendste zuerst. Kurze Sätze, keine
  // verschachtelten Gedankenstrich-Ketten.
  if (age === "baby" && uvIndex >= 3) {
    note =
      "Unter einem Jahr gehört ein Baby nicht in die pralle Sonne. Am besten schützen Schatten und leichte, lange Kleidung. Sonnencreme nur sparsam auf kleine freie Stellen.";
  } else if (age === "baby" && t < 8) {
    note =
      "Babys bewegen sich wenig und kühlen schnell aus. Im Buggy hilft eine Decke zusätzlich.";
  } else if (little && t < 8) {
    note = "Kleine Kinder frieren schneller. Lieber eine Schicht mehr einpacken.";
  }

  return { wear, bring, note };
}

/**
 * Bei kurzen Tagen relevant: wie lange lohnt sich Rausgehen noch? Nur unter
 * drei Stunden Restlicht, sonst kein Hinweis (dann ist genug Tag übrig).
 */
export function daylightHint(now: Date, sunset: Date): string | null {
  if (Number.isNaN(sunset.getTime())) return null;
  const msLeft = sunset.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  const hoursLeft = msLeft / 3_600_000;
  if (hoursLeft > 3) return null;
  if (hoursLeft < 1) {
    return `Nur noch weniger als eine Stunde Tageslicht (bis ${formatTime(sunset)} Uhr).`;
  }
  const rund = Math.round(hoursLeft);
  if (rund === 1) {
    return `Noch rund eine Stunde Tageslicht (bis ${formatTime(sunset)} Uhr).`;
  }
  return `Noch rund ${rund} Stunden Tageslicht (bis ${formatTime(sunset)} Uhr).`;
}
