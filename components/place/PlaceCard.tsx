import Link from "next/link";
import { AlertTriangle, ChevronRight, Footprints } from "lucide-react";
import { formatDistance } from "@/lib/utils";
import type { Place } from "@/types";
import { AttributeChips } from "./AttributeChips";
import { ShadeBadge } from "./StatusBadge";

export function PlaceCard({
  place,
  origin,
  radius,
  highlight = false,
}: {
  place: Place;
  origin: { lat: number; lng: number };
  /** Suchradius dieser Liste – die Detailseite nutzt dieselbe Abfrage. */
  radius: number;
  highlight?: boolean;
}) {
  // Der Link trägt beides: den Standort des Nutzers (für die Entfernung) und
  // den des Ortes (damit die Detailseite gezielt dort nachladen kann).
  const href =
    `/ort/${place.id}?lat=${origin.lat.toFixed(5)}&lng=${origin.lng.toFixed(5)}` +
    `&plat=${place.lat.toFixed(5)}&plng=${place.lng.toFixed(5)}&r=${radius}`;

  return (
    <Link
      href={href}
      className={`block rounded-card bg-card p-4 shadow-card transition active:scale-[0.99] ${
        highlight ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[17px] font-semibold text-dark">
            {place.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <Footprints size={14} aria-hidden />
            {formatDistance(place.distance ?? 0)}
            <span aria-hidden>·</span>
            {place.type === "park" ? "Grünfläche" : "Spielplatz"}
          </p>
        </div>
        <ShadeBadge state={place.shade.state} />
      </div>

      <div className="mt-3">
        <AttributeChips tags={place.tags} />
      </div>

      {place.reasons.length > 0 && (
        <p className="mt-3 text-sm text-muted">{place.reasons.join(" · ")}</p>
      )}

      {place.warnings.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-warning-ink">
          <AlertTriangle size={14} aria-hidden />
          {place.warnings[0]}
        </p>
      )}

      <span className="mt-3 flex items-center justify-end gap-0.5 text-sm font-semibold text-primary-dark">
        Details
        <ChevronRight size={16} aria-hidden />
      </span>
    </Link>
  );
}
