import type { Weather } from "@/types";

export type SkyMood = "sunny" | "dusk" | "cloudy" | "rainy" | "night";

/** Ehrlich: keine strahlende Sonne bei Regen, nachts, oder wenn die Sonne
 *  tief steht und kaum noch wärmt. Niedriger UV heißt schwache Sonne, das gilt
 *  abends wie im Winter. */
export function skyMood(
  weather: Weather,
  cloudCover: number,
  precipProbability: number,
  uvIndex: number,
): SkyMood {
  if (!weather.isDay) return "night";
  if (precipProbability >= 50 || weather.precipitation > 0.1) return "rainy";
  if (cloudCover >= 70) return "cloudy";
  if (uvIndex < 2) return "dusk";
  return "sunny";
}

/** Passender Himmel-Verlauf für den Kopf, immer hell genug für dunkle Schrift. */
/**
 * Der Kopf trägt das Wetter – aber nur oben rechts, wo die Figur sitzt.
 * Die Tönung einmal über die ganze Fläche zu legen war ein Fehler: Der
 * Nebentext links fiel dadurch auf 2,99:1 (Regen), weit unter die Grenze
 * von 4,5:1. Die Grundfläche bleibt deshalb hell, gefärbt wird im Radial.
 */
export const SKY_GRADIENT: Record<SkyMood, string> = {
  sunny:
    "radial-gradient(110% 78% at 86% 6%, rgba(249,197,82,0.52), rgba(249,197,82,0) 58%), linear-gradient(176deg, #fde7c6 0%, #f4ecdd 40%, #eaf1ec 72%, var(--color-background) 100%)",
  dusk:
    "radial-gradient(110% 82% at 86% 12%, rgba(240,160,86,0.42), rgba(240,160,86,0) 60%), linear-gradient(176deg, #fbe2c2 0%, #f3e8d9 46%, #ecefe9 76%, var(--color-background) 100%)",
  cloudy:
    "radial-gradient(105% 75% at 86% 6%, rgba(150,166,168,0.38), rgba(150,166,168,0) 58%), linear-gradient(176deg, #e8ece8 0%, #edf0ec 52%, var(--color-background) 100%)",
  rainy:
    "radial-gradient(105% 75% at 86% 6%, rgba(122,150,164,0.40), rgba(122,150,164,0) 58%), linear-gradient(176deg, #dbe4e7 0%, #e6ecec 52%, var(--color-background) 100%)",
  night:
    "radial-gradient(110% 78% at 86% 6%, rgba(120,150,190,0.40), rgba(120,150,190,0) 56%), linear-gradient(176deg, #dce2eb 0%, #e7ebee 55%, var(--color-background) 100%)",
};

/** Der weiche Lichtschein hinter der Figur, damit sie im Himmel steht
 *  statt darauf zu kleben. */
const GLOW: Record<SkyMood, string> = {
  sunny: "#f7c65a",
  dusk: "#eda765",
  cloudy: "#b8c4c2",
  rainy: "#9ab4c0",
  night: "#a8b9d2",
};

/** Die Himmels-Figur oben rechts im Kopf, Sonne, Wolke, Regen oder Mond. */
export function SkyScene({ mood }: { mood: SkyMood }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      /* Zweimal geschrumpft, mit Grund: Erst hing die Figur riesig an der
         Kopfkante (halb hinter der Dynamic Island), dann war sie mit 4,75rem
         immer noch das größte, satteste Farbobjekt der Seite – die Blickpfad-
         Analyse zeigte: Das Auge sprang ZUERST zur Deko-Sonne, die null
         Information trägt. Jetzt ist sie ein leises Wetter-Glyph; die
         Stimmung transportiert der Verlauf dahinter. */
      className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)+0.35rem)] right-3 h-12 w-12 opacity-80"
    >
      {/* Lichtschein in der Farbe des Wetters – er verbindet die Figur mit
          dem Verlauf des Kopfes, statt sie davor zu setzen. */}
      <defs>
        <radialGradient id={`wd-glow-${mood}`}>
          <stop offset="0%" stopColor={GLOW[mood]} stopOpacity="0.5" />
          <stop offset="65%" stopColor={GLOW[mood]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="62" cy="58" r="60" fill={`url(#wd-glow-${mood})`} />

      {mood === "sunny" && (
        <g opacity="0.9">
          <circle cx="60" cy="60" r="23" fill="#f2ac33" />
          <g stroke="#f2ac33" strokeWidth="6.5" strokeLinecap="round">
            <line x1="60" y1="11" x2="60" y2="25" />
            <line x1="60" y1="95" x2="60" y2="109" />
            <line x1="11" y1="60" x2="25" y2="60" />
            <line x1="95" y1="60" x2="109" y2="60" />
            <line x1="26" y1="26" x2="36" y2="36" />
            <line x1="84" y1="84" x2="94" y2="94" />
            <line x1="94" y1="26" x2="84" y2="36" />
            <line x1="36" y1="84" x2="26" y2="94" />
          </g>
        </g>
      )}

      {mood === "dusk" && (
        // Tiefe, weiche Sonne: sitzt tiefer, wärmer, nur kurze obere Strahlen,
        // damit klar ist, dass sie nicht mehr knallt.
        <g opacity="0.9">
          <circle cx="66" cy="76" r="20" fill="#e79a48" opacity="0.92" />
          <g stroke="#e79a48" strokeWidth="5" strokeLinecap="round" opacity="0.65">
            <line x1="66" y1="42" x2="66" y2="52" />
            <line x1="38" y1="76" x2="48" y2="76" />
            <line x1="84" y1="76" x2="94" y2="76" />
            <line x1="45" y1="55" x2="52" y2="62" />
            <line x1="87" y1="55" x2="80" y2="62" />
          </g>
        </g>
      )}

      {mood === "cloudy" && (
        <g opacity="0.82">
          <circle cx="74" cy="44" r="16" fill="#f2ac33" opacity="0.6" />
          <g fill="#c6d0cd">
            <circle cx="46" cy="72" r="14" />
            <circle cx="66" cy="64" r="19" />
            <circle cx="86" cy="73" r="13" />
            <rect x="42" y="70" width="48" height="18" rx="9" />
          </g>
        </g>
      )}

      {mood === "rainy" && (
        <g opacity="0.82">
          <g fill="#a7bac2">
            <circle cx="46" cy="58" r="15" />
            <circle cx="67" cy="50" r="20" />
            <circle cx="88" cy="60" r="14" />
            <rect x="42" y="56" width="50" height="18" rx="9" />
          </g>
          <g stroke="#89a6b1" strokeWidth="4.5" strokeLinecap="round">
            <line x1="54" y1="82" x2="50" y2="96" />
            <line x1="69" y1="84" x2="65" y2="98" />
            <line x1="84" y1="82" x2="80" y2="96" />
          </g>
        </g>
      )}

      {mood === "night" && (
        <g opacity="0.85">
          <mask id="wd-moon">
            <rect width="120" height="120" fill="white" />
            <circle cx="88" cy="42" r="21" fill="black" />
          </mask>
          <circle cx="72" cy="52" r="23" fill="#9fb0c6" mask="url(#wd-moon)" />
          <circle cx="44" cy="34" r="2.4" fill="#b3c0d2" />
          <circle cx="58" cy="23" r="1.8" fill="#b3c0d2" />
          <circle cx="34" cy="52" r="1.6" fill="#b3c0d2" />
        </g>
      )}
    </svg>
  );
}
