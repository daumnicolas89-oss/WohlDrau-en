import { scorePlace } from "./scoring";
import { haversine } from "./utils";
import type { OsmPlace, Place, PlaceStatus, Weather } from "@/types";
import type { FilterState } from "@/store/useFilters";

const SHADE_THRESHOLD: Record<FilterState["shade"], number> = {
  any: 0,
  partial: 0.38,
  shady: 0.68,
};

const PROBLEM_TYPES = new Set<PlaceStatus["type"]>([
  "too_sunny",
  "too_crowded",
  "toilet_closed",
  "wet",
]);

export interface SelectInput {
  places: OsmPlace[];
  weather: Weather | null;
  statuses: PlaceStatus[];
  filters: FilterState;
  origin: { lat: number; lng: number };
  at: Date;
  now?: number;
}

export interface SelectResult {
  visible: Place[];
  /** Wie viele Orte die Filter herausgenommen haben – ehrlicher als eine leere Liste. */
  filteredOut: number;
}

export function selectPlaces({
  places,
  weather,
  statuses,
  filters,
  origin,
  at,
  now = Date.now(),
}: SelectInput): SelectResult {
  if (!weather) return { visible: [], filteredOut: 0 };

  const byPlace = new Map<string, PlaceStatus[]>();
  for (const status of statuses) {
    const bucket = byPlace.get(status.placeId);
    if (bucket) bucket.push(status);
    else byPlace.set(status.placeId, [status]);
  }

  const scored: Place[] = [];
  for (const place of places) {
    const distanceM = haversine(origin.lat, origin.lng, place.lat, place.lng);
    if (distanceM > filters.maxDistanceM) continue;
    scored.push(
      scorePlace(place, {
        weather,
        at,
        distanceM,
        statuses: byPlace.get(place.id) ?? [],
        now,
      }),
    );
  }

  const visible = scored.filter((place) => {
    if (!filters.types.includes(place.type)) return false;
    if (filters.requireToilet && place.tags.toilet !== true) return false;
    if (filters.requireChangingTable && place.tags.changing_table !== true)
      return false;
    if (filters.requireFenced && place.tags.fenced !== true) return false;
    if (place.shade.index < SHADE_THRESHOLD[filters.shade]) return false;
    if (
      filters.hideReportedProblems &&
      place.lastStatuses.some((s) => PROBLEM_TYPES.has(s.type))
    )
      return false;
    return true;
  });

  visible.sort(
    (a, b) =>
      b.pleasantScore - a.pleasantScore || (a.distance ?? 0) - (b.distance ?? 0),
  );

  return { visible, filteredOut: scored.length - visible.length };
}
