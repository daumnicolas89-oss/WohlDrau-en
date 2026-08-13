"use client";

import { ChevronDown } from "lucide-react";
import { breakdownRows, weatherFactorNote } from "@/lib/wording";
import type { Place, Weather } from "@/types";
import { TONE_COLORS, TONE_TEXT } from "@/components/ui/ScoreRing";

/**
 * Zugeklappt, weil die meisten nur wissen wollen, ob sie hingehen sollen.
 * Aufgeklappt beantwortet es die Nachfrage „warum eigentlich?“, jede Zahl
 * mit einem Satz daneben, der sagt, was sie bedeutet.
 */
export function ScoreBreakdown({
  place,
  weather,
  at,
  now,
}: {
  place: Place;
  weather: Weather;
  at: Date;
  now: number;
}) {
  const rows = breakdownRows(place, weather, at, now);
  const wetterHinweis = weatherFactorNote(place.breakdown.weatherFactor);

  return (
    <details className="group rounded-card bg-card shadow-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-display font-semibold text-dark [&::-webkit-details-marker]:hidden">
        Wie kommt dieser Wert zustande?
        <ChevronDown
          size={20}
          aria-hidden
          className="shrink-0 text-muted transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="space-y-4 border-t border-line px-4 pt-4 pb-4">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-medium text-dark">
                {row.label}
                <span className="ml-1.5 text-xs font-normal text-muted">
                  zählt {row.weightPercent} %
                </span>
              </span>
              <span className={`font-display font-bold ${TONE_TEXT[row.tone]}`}>
                {row.value}
              </span>
            </div>

            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(3, row.value)}%`,
                  background: TONE_COLORS[row.tone],
                }}
              />
            </div>

            <p className="mt-1.5 text-sm leading-snug text-muted">{row.sentence}</p>
          </div>
        ))}

        {wetterHinweis && (
          <p className="rounded-2xl bg-background p-3 text-sm leading-relaxed text-muted">
            {wetterHinweis}
          </p>
        )}

        <p className="text-xs leading-relaxed text-muted">
          Aus diesen vier Teilen entsteht der Gesamtwert von{" "}
          <span className="font-semibold text-dark">{place.pleasantScore}</span> von
          100.
        </p>
      </div>
    </details>
  );
}
