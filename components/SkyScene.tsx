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
export const SKY_GRADIENT: Record<SkyMood, string> = {
  sunny:
    "radial-gradient(125% 85% at 84% -18%, rgba(249,197,82,0.45), rgba(249,197,82,0) 54%), linear-gradient(176deg, #fde7c6 0%, #f4ecdd 40%, #eaf1ec 72%, var(--color-background) 100%)",
  dusk:
    "radial-gradient(120% 95% at 80% 34%, rgba(240,160,86,0.34), rgba(240,160,86,0) 60%), linear-gradient(176deg, #fbe2c2 0%, #f3e8d9 46%, #ecefe9 76%, var(--color-background) 100%)",
  cloudy:
    "linear-gradient(176deg, #e8ece8 0%, #edf0ec 52%, var(--color-background) 100%)",
  rainy:
    "linear-gradient(176deg, #dbe4e7 0%, #e6ecec 52%, var(--color-background) 100%)",
  night:
    "radial-gradient(120% 80% at 82% -16%, rgba(120,150,190,0.32), rgba(120,150,190,0) 54%), linear-gradient(176deg, #dce2eb 0%, #e7ebee 55%, var(--color-background) 100%)",
};

/** Die Himmels-Figur oben rechts im Kopf, Sonne, Wolke, Regen oder Mond. */
export function SkyScene({ mood }: { mood: SkyMood }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      /* Die Figur hing an der Kopfkante (-top-12). Auf einem iPhone mit
         Dynamic Island beginnt die dort erst nach der Statusleiste – die
         Sonne lag damit halb außerhalb des Bildschirms und der Rest hinter
         der Uhr. Jetzt hängt sie am sicheren Bereich und sitzt neben Logo
         und Ortszeile, wo Platz ist. */
      className="pointer-events-none absolute top-[calc(env(safe-area-inset-top)-0.75rem)] -right-5 h-32 w-32 opacity-85"
    >
      {mood === "sunny" && (
        <g>
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
        <g>
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
        <g>
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
        <g>
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
        <g>
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
