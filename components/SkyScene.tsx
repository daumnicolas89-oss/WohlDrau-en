import type { Weather } from "@/types";

export type SkyMood = "sunny" | "cloudy" | "rainy" | "night";

/** Ehrlich: keine strahlende Sonne bei Regen oder nachts. */
export function skyMood(
  weather: Weather,
  cloudCover: number,
  precipProbability: number,
): SkyMood {
  if (!weather.isDay) return "night";
  if (precipProbability >= 50 || weather.precipitation > 0.1) return "rainy";
  if (cloudCover >= 70) return "cloudy";
  return "sunny";
}

/** Passender Himmel-Verlauf für den Kopf – immer hell genug für dunkle Schrift. */
export const SKY_GRADIENT: Record<SkyMood, string> = {
  sunny:
    "radial-gradient(125% 85% at 84% -18%, rgba(249,197,82,0.45), rgba(249,197,82,0) 54%), linear-gradient(176deg, #fde7c6 0%, #f4ecdd 40%, #eaf1ec 72%, var(--color-background) 100%)",
  cloudy:
    "linear-gradient(176deg, #e8ece8 0%, #edf0ec 52%, var(--color-background) 100%)",
  rainy:
    "linear-gradient(176deg, #dbe4e7 0%, #e6ecec 52%, var(--color-background) 100%)",
  night:
    "radial-gradient(120% 80% at 82% -16%, rgba(120,150,190,0.32), rgba(120,150,190,0) 54%), linear-gradient(176deg, #dce2eb 0%, #e7ebee 55%, var(--color-background) 100%)",
};

/** Die Himmels-Figur oben rechts im Kopf – Sonne, Wolke, Regen oder Mond. */
export function SkyScene({ mood }: { mood: SkyMood }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className="pointer-events-none absolute -top-12 -right-5 h-36 w-36 opacity-85"
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
