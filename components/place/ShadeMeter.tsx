import { CloudSun, Moon, Sun, TreePine } from "lucide-react";
import { shadeWording, type Tone } from "@/lib/wording";
import type { ShadeState } from "@/types";
import { TONE_COLORS, TONE_TEXT } from "@/components/ui/ScoreRing";

const ICONS: Record<ShadeState, typeof Sun> = {
  shady: TreePine,
  partial: CloudSun,
  sunny: Sun,
  "no-sun": Moon,
};

/**
 * Schatten als Balken statt als nackte Prozentzahl: Der Füllgrad sagt in
 * einem Blick, wie viel Schutz es gerade gibt. Die Farbe wiederholt die
 * Aussage – grün gut beschattet, gelb mittel, rot ungeschützt.
 */
export function ShadeMeter({
  state,
  shadeIndex,
  size = "sm",
  reason,
  estimateHint = false,
}: {
  state: ShadeState;
  /** 0..1 */
  shadeIndex: number;
  size?: "sm" | "lg";
  reason?: string;
  /** Kennzeichnet den Wert als Schätzung – auf der Karte, wo der Platz fehlt. */
  estimateHint?: boolean;
}) {
  const wording = shadeWording(state);
  const Icon = ICONS[state];
  const tone: Tone = wording.tone;
  const prozent = Math.round(shadeIndex * 100);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon
          size={size === "lg" ? 22 : 18}
          strokeWidth={2.2}
          aria-hidden
          className={TONE_TEXT[tone]}
        />
        <span
          className={`font-semibold ${TONE_TEXT[tone]} ${size === "lg" ? "text-lg" : "text-[15px]"}`}
        >
          {wording.label}
        </span>
        {estimateHint && (
          <span className="ml-auto text-xs text-muted">geschätzt</span>
        )}
      </div>

      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`Geschätzt ${prozent} Prozent der Fläche liegen im Schatten`}
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${Math.max(3, prozent)}%`, background: TONE_COLORS[tone] }}
        />
      </div>

      {size === "lg" && (
        <p className="mt-1.5 text-xs text-muted">
          Geschätzt {prozent} % der Fläche liegen im Schatten – berechnet aus
          Sonnenstand, erfassten Bäumen und Gebäuden, keine Messung vor Ort.
        </p>
      )}

      {reason && (
        <p className="mt-2 text-sm leading-relaxed text-dark">{reason}</p>
      )}
    </div>
  );
}
