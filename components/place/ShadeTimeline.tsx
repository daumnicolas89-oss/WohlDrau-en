"use client";

import { useMemo } from "react";
import { computeShade } from "@/lib/sun";
import { formatTime } from "@/lib/utils";
import { weatherAt } from "@/lib/weather";
import type { OsmPlace, ShadeState, Weather } from "@/types";
import { SHADE_VISUALS } from "./StatusBadge";

const STEP_MINUTES = 60;
const STEPS = 6;

const BAR_COLORS: Record<ShadeState, string> = {
  shady: "bg-primary",
  partial: "bg-accent",
  sunny: "bg-warning",
  "no-sun": "bg-dark",
};

/** Zeigt, wie lange der Schatten hält – die Frage nach „und in zwei Stunden?“. */
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
            <div className="flex h-16 items-end rounded-lg bg-background">
              <div
                className={`w-full rounded-lg ${BAR_COLORS[shade.state]}`}
                style={{ height: `${Math.max(8, shade.index * 100)}%` }}
                title={`${SHADE_VISUALS[shade.state].label} – ${Math.round(shade.index * 100)} % Schatten`}
              />
            </div>
            <p className="mt-1 text-center text-[11px] text-muted">
              {index === 0 ? "jetzt" : formatTime(at)}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Höhe = geschätzter Schattenanteil in den nächsten Stunden.
      </p>
    </div>
  );
}
