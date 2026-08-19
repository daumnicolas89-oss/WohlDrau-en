import { Cloudy, CloudSun, Moon, Sun, TreePine } from "lucide-react";
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
 * Aussage, grün gut beschattet, gelb mittel, rot ungeschützt.
 */
export function ShadeMeter({
  state,
  shadeIndex,
  size = "sm",
  reason,
  estimateHint = false,
  balken = true,
  spaeter = false,
  bedeckt = false,
}: {
  state: ShadeState;
  /** 0..1 */
  shadeIndex: number;
  size?: "sm" | "lg";
  reason?: string;
  /** Kennzeichnet den Wert als Schätzung, auf der Karte, wo der Platz fehlt. */
  estimateHint?: boolean;
  /** Auf der Beste-Wahl-Karte nur die Wort-Zeile: Ring und Wort tragen das
   *  Urteil schon, der Balken wäre die dritte Codierung derselben Aussage.
   *  Auf der Detailseite bleibt er – dort erklärt er. */
  balken?: boolean;
  /** Zeitvorschau: Beschriftung in Zukunftsform. */
  spaeter?: boolean;
  /**
   * Dichte Wolken: „Aktuell viel Schatten, 91 %" wäre rechnerisch wahr,
   * klingt aber nach Bäumen. Dann sagt der Balken ehrlich „bedeckt" und
   * die Prozentzahl entfällt – sie würde nur in die Irre führen.
   */
  bedeckt?: boolean;
}) {
  const wording = bedeckt
    ? { label: spaeter ? "Dann bedeckt, kaum Sonne" : "Bedeckt, kaum direkte Sonne", tone: "neutral" as Tone }
    : shadeWording(state, shadeIndex, spaeter);
  const Icon = bedeckt ? Cloudy : ICONS[state];
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

      {/* Ohne Sonne ist ein Schatten-Prozentwert sinnlos (rechnerisch 100 %,
          würde aber wie „dicht beschattet durch Bäume" wirken). Dann sagt nur
          der Grund-Satz darunter, was Sache ist. */}
      {balken && state !== "no-sun" && !bedeckt && (
        <>
          {/* Die Prozentzahl samt Herkunft steht im Info-Knopf der Karte und
              im Vorlese-Text hier – als dritter Satz unter Wort und Balken
              codierte sie dieselbe Aussage nur noch einmal. */}
          <div
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-line"
            role="img"
            aria-label={`Sonnenschutz gerade: geschätzt ${prozent} Prozent`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(3, prozent)}%`, background: TONE_COLORS[tone] }}
            />
          </div>
        </>
      )}

      {reason && (
        <p className="mt-2 text-sm leading-relaxed text-dark">{reason}</p>
      )}
    </div>
  );
}
