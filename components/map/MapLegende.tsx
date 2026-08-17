import type { Tone } from "@/lib/wording";
import { TONE_COLORS } from "@/components/ui/ScoreRing";

/**
 * Ohne Legende bedeutete auf der Karte niemand etwas: Die Zahl war der
 * Listenplatz, die Farbe unerklärt. Diese vier Zeilen sagen, was man sieht.
 */
export function MapLegende() {
  const punkte: { tone: Tone; text: string }[] = [
    { tone: "good", text: "Angenehm" },
    { tone: "medium", text: "Geht so" },
    { tone: "bad", text: "Ungünstig" },
  ];
  return (
    <div className="pointer-events-none absolute top-3 left-3 z-[905] rounded-2xl bg-card/95 px-3 py-1.5 shadow-card backdrop-blur">
      <p className="text-[11px] leading-snug font-semibold text-dark">
        Zahl = wie angenehm es dort gerade ist
      </p>
      <ul className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
        {punkte.map((p) => (
          <li key={p.tone} className="flex items-center gap-1 text-[11px] text-muted">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: TONE_COLORS[p.tone] }}
            />
            {p.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
