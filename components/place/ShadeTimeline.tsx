"use client";

import { useMemo } from "react";
import { shadeWindow } from "@/lib/sun";
import { shadeShort, type Tone } from "@/lib/wording";
import type { OsmPlace, ShadeState, Weather } from "@/types";
import { TONE_COLORS } from "@/components/ui/ScoreRing";

const TONE_FOR_STATE: Record<ShadeState, Tone> = {
  shady: "good",
  partial: "medium",
  sunny: "bad",
  "no-sun": "neutral",
};

/**
 * Beantwortet „und wie ist es, wenn wir ankommen?“, ein Balken je Stunde,
 * Höhe und Farbe zeigen zusammen, wie viel Schutz es dann gibt.
 */
export function ShadeTimeline({
  place,
  weather,
  from,
}: {
  place: OsmPlace;
  weather: Weather;
  from: Date;
}) {
  const steps = useMemo(
    () => shadeWindow(place, weather, from),
    [place, weather, from],
  );

  return (
    <div>
      <div className="flex gap-1.5">
        {steps.map(({ at, shade }, index) => (
          <div key={index} className="flex-1">
            <div
              className="flex h-20 items-end rounded-lg bg-background"
              role="img"
              // title erreicht nur die Maus – das aria-label auch Touch-Reader.
              aria-label={`${index === 0 ? "Jetzt" : `${at.getHours()} Uhr`}: ${shadeShort(shade.state, shade.index)}`}
              title={`${index === 0 ? "Jetzt" : `${at.getHours()} Uhr`}: ${shadeShort(shade.state, shade.index)}`}
            >
              <div
                className="w-full rounded-lg"
                style={{
                  height: `${Math.max(8, shade.index * 100)}%`,
                  background: TONE_COLORS[TONE_FOR_STATE[shade.state]],
                }}
              />
            </div>
            <p className="mt-1.5 text-center text-[11px] font-medium text-muted">
              {index === 0 ? "jetzt" : `${at.getHours()} Uhr`}
            </p>
          </div>
        ))}
      </div>

      {/* EINE Lesehilfe statt zwei: Legende und Erklärsatz beschrieben
          dieselbe Grafik doppelt (Farbe und Höhe codieren dasselbe). */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>Höhe = Schutz vor Sonne:</span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: TONE_COLORS.good }}
            aria-hidden
          />
          viel Schatten
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: TONE_COLORS.medium }}
            aria-hidden
          />
          teils sonnig
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ background: TONE_COLORS.bad }}
            aria-hidden
          />
          volle Sonne
        </span>
      </div>
    </div>
  );
}
