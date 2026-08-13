"use client";

import { useMemo } from "react";
import { computeShade } from "@/lib/sun";
import { formatTime } from "@/lib/utils";
import { weatherAt } from "@/lib/weather";
import { shadeShort, type Tone } from "@/lib/wording";
import type { OsmPlace, ShadeState, Weather } from "@/types";
import { TONE_COLORS } from "@/components/ui/ScoreRing";

const STEP_MINUTES = 60;
const STEPS = 6;

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
    () =>
      Array.from({ length: STEPS }, (_, index) => {
        const at = new Date(from.getTime() + index * STEP_MINUTES * 60_000);
        const shade = computeShade(place, at, weatherAt(weather, at).cloudCover);
        return { at, shade };
      }),
    [place, weather, from],
  );

  return (
    <div>
      <div className="flex gap-1.5">
        {steps.map(({ at, shade }, index) => (
          <div key={index} className="flex-1">
            <div
              className="flex h-20 items-end rounded-lg bg-background"
              title={`${index === 0 ? "Jetzt" : formatTime(at)}: ${shadeShort(shade.state)}`}
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
              {index === 0 ? "jetzt" : formatTime(at)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
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

      <p className="mt-2 text-xs leading-relaxed text-muted">
        Je höher der Balken, desto mehr Fläche liegt zu dieser Stunde im Schatten.
      </p>
    </div>
  );
}
