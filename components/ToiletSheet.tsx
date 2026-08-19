"use client";

import { Toilet as ToiletIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

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
        <EmptyState
          Icon={ToiletIcon}
          titel="Keine Toilette in der Nähe erfasst"
          text="In OpenStreetMap ist hier gerade keine eingetragen. Vor Ort gibt es oft trotzdem eine, viele sind schlicht nicht erfasst."
        />
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
                        <Accessibility size={14} aria-hidden /> barrierefrei
                      </span>
                    )}
                    {toilet.changingTable && (
                      <span className="flex items-center gap-1">
                        <Baby size={14} aria-hidden /> Wickeltisch
                      </span>
                    )}
                    {toilet.fee && (
                      <span className="flex items-center gap-1">
                        <Euro size={14} aria-hidden /> kostenpflichtig
                      </span>
                    )}
                  </div>
                )}
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${toilet.lat},${toilet.lng}&travelmode=walking`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary-dark px-3.5 text-sm font-semibold text-white transition hover:bg-primary-darker active:bg-primary-darker"
              >
                <Navigation size={16} aria-hidden />
                Route
              </a>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
