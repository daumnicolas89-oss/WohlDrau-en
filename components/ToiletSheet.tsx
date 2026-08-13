"use client";

import { Accessibility, Baby, Euro, Navigation } from "lucide-react";
import { formatDistance, walkingMinutes } from "@/lib/utils";
import type { Toilet } from "@/types";
import { Sheet } from "./ui/Sheet";

/**
 * Öffentliche Toiletten in der Nähe, nach Entfernung sortiert, für den Moment,
 * in dem es dringend ist (Schwangere, Kind, das muss). Route führt direkt hin.
 */
export function ToiletSheet({
  open,
  onClose,
  toilets,
}: {
  open: boolean;
  onClose: () => void;
  toilets: { toilet: Toilet; distance: number }[];
}) {
  return (
    <Sheet
      open={open}
      title="Toiletten in der Nähe"
      description="Öffentliche Toiletten aus OpenStreetMap, nach Entfernung. Nicht jede ist dort erfasst."
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {toilets.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-muted">
          In der Nähe ist gerade keine öffentliche Toilette in OpenStreetMap
          erfasst. Leider sind viele schlicht nicht eingetragen.
        </p>
      ) : (
        <ul className="space-y-2">
          {toilets.map(({ toilet, distance }) => (
            <li
              key={toilet.id}
              className="flex items-center gap-3 rounded-2xl border border-line p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-dark">
                  {walkingMinutes(distance)} Min zu Fuß{" "}
                  <span className="font-normal text-muted">
                    · {formatDistance(distance)}
                  </span>
                </p>
                {(toilet.wheelchair || toilet.changingTable || toilet.fee) && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    {toilet.wheelchair && (
                      <span className="flex items-center gap-1">
                        <Accessibility size={13} aria-hidden /> barrierefrei
                      </span>
                    )}
                    {toilet.changingTable && (
                      <span className="flex items-center gap-1">
                        <Baby size={13} aria-hidden /> Wickeltisch
                      </span>
                    )}
                    {toilet.fee && (
                      <span className="flex items-center gap-1">
                        <Euro size={13} aria-hidden /> kostenpflichtig
                      </span>
                    )}
                  </div>
                )}
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${toilet.lat},${toilet.lng}&travelmode=walking`}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-dark px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary-darker active:bg-primary-darker"
              >
                <Navigation size={15} aria-hidden />
                Route
              </a>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
