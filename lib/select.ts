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
  "dirty_broken",
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
  /** Wie viele Orte die Filter herausgenommen haben, ehrlicher als eine leere Liste. */
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

  // Schnellstart-Liste: Schatten ist noch nicht berechnet – ein
  // Schatten-Filter würde auf Zufallswerten filtern, und die Sortierung
  // nach Bewertung wäre erfunden. Entfernung ist das Ehrlichste, was wir
  // in diesem Moment wissen.
  const vorlaeufig = places.length > 0 && places.every((p) => p.preliminary);

  const visible = scored.filter((place) => {
    if (!filters.types.includes(place.type)) return false;
    if (!vorlaeufig) {
      if (place.shade.index < SHADE_THRESHOLD[filters.shade]) return false;
      if (
        filters.hideReportedProblems &&
        place.lastStatuses.some((s) => PROBLEM_TYPES.has(s.type))
      )
        return false;
    }
    return true;
  });

  if (vorlaeufig) {
    visible.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return { visible, filteredOut: scored.length - visible.length };
  }

  // Weiche Prioritäten: gewünschte Ausstattung sortiert Orte nach oben, statt
  // sie zu verstecken, so führt dünne OSM-Datenlage nicht zur leeren Liste.
  const priorityScore = (place: Place) =>
    (filters.preferToilet && place.tags.toilet === true ? 1 : 0) +
    (filters.preferChangingTable && place.tags.changing_table === true ? 1 : 0) +
    (filters.preferFenced && place.tags.fenced === true ? 1 : 0) +
    (filters.preferWater && place.tags.water_play === true ? 1 : 0) +
    (filters.preferWheelchair && place.tags.wheelchair === true ? 1 : 0);

  visible.sort(
    (a, b) =>
      priorityScore(b) - priorityScore(a) ||
      b.pleasantScore - a.pleasantScore ||
      (a.distance ?? 0) - (b.distance ?? 0),
  );

  return { visible, filteredOut: scored.length - visible.length };
}
