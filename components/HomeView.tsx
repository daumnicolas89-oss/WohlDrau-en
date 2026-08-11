"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Megaphone, SlidersHorizontal } from "lucide-react";
import { selectPlaces } from "@/lib/select";
import { formatDistance, haversine } from "@/lib/utils";
import type { PlaceStatusType } from "@/types";
import { FALLBACK_LABEL, useGeolocation } from "@/hooks/useGeolocation";
import { useNow } from "@/hooks/useNow";
import { radiusForDistance, usePlaces } from "@/hooks/usePlaces";
import { useStatuses } from "@/hooks/useStatuses";
import { useWeather } from "@/hooks/useWeather";
import { activeFilterChips, useFilters } from "@/store/useFilters";
import { FilterChips } from "./filters/FilterChips";
import { FilterSheet } from "./filters/FilterSheet";
import { MapControls } from "./map/MapControls";
import { PlaceCard } from "./place/PlaceCard";
import { ReportStatusModal } from "./status/ReportStatusModal";
import { Button } from "./ui/Button";
import { Sheet } from "./ui/Sheet";
import { WeatherHeader } from "./WeatherHeader";

const Map = dynamic(() => import("./map/Map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-[#eef1f2]" />,
});

export function HomeView() {
  const filters = useFilters();
  const { coords, status: geoStatus, locate } = useGeolocation();
  // Derselbe Radius wandert in die Detail-Links: die Detailseite trifft damit
  // exakt den Cache-Eintrag, den diese Liste schon geladen hat.
  const radius = radiusForDistance(filters.maxDistanceM);
  const places = usePlaces(coords, radius);
  const { weather } = useWeather(coords);
  const placeIds = useMemo(() => places.places.map((p) => p.id), [places.places]);
  const { statuses, report } = useStatuses(placeIds);
  const now = useNow();

  const [filterOpen, setFilterOpen] = useState(false);
  const [reportPickerOpen, setReportPickerOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(
    null,
  );

  const at = useMemo(
    () => new Date(now.getTime() + filters.timeOffsetMin * 60_000),
    [now, filters.timeOffsetMin],
  );

  const { visible, filteredOut } = useMemo(
    () =>
      selectPlaces({
        places: places.places,
        weather,
        statuses,
        filters,
        origin: coords,
        at,
        now: now.getTime(),
      }),
    [places.places, weather, statuses, filters, coords, at, now],
  );

  const nearest = useMemo(
    () =>
      places.places
        .map((place) => ({
          place,
          distance: haversine(coords.lat, coords.lng, place.lat, place.lng),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6),
    [places.places, coords.lat, coords.lng],
  );

  const filterCount = activeFilterChips(filters).length;
  const locationLabel =
    coords.source === "gps" ? "Orte in deiner Nähe" : FALLBACK_LABEL;
  const loading = places.loading || !weather;

  async function submitReport(type: PlaceStatusType, message: string) {
    if (!reportTarget) return;
    await report(reportTarget.id, type, message);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-background">
      <WeatherHeader
        weather={weather}
        at={at}
        locationLabel={locationLabel}
        geoStatus={geoStatus}
        onLocate={locate}
      />

      <MapControls />

      <main className="relative flex-1">
        {places.error && (
          <div className="m-4 rounded-card bg-warning-soft p-4">
            <p className="text-sm font-medium text-warning-ink">{places.error}</p>
            <Button
              variant="secondary"
              onClick={places.reload}
              className="mt-2 min-h-11"
            >
              Erneut versuchen
            </Button>
          </div>
        )}

        {loading && !places.error && (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-card bg-card shadow-card" />
            ))}
            <p className="text-center text-sm text-muted">
              Orte, Wetter und Sonnenstand werden geladen …
            </p>
          </div>
        )}

        {!loading && !places.error && filters.viewMode === "map" && (
          <div className="h-[calc(100dvh-16rem)] min-h-[22rem] w-full overflow-hidden">
            <Map places={visible} origin={coords} radius={radius} />
          </div>
        )}

        {!loading && !places.error && filters.viewMode === "list" && (
          <div className="space-y-3 p-4 pb-32">
            <FilterChips />

            {visible.length > 0 ? (
              <>
                <p className="text-sm text-muted">
                  {visible.length} passende Orte ·{" "}
                  {filters.timeOffsetMin === 0
                    ? "jetzt"
                    : `in ${filters.timeOffsetMin} Minuten`}
                </p>
                {visible.map((place, index) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    origin={coords}
                    radius={radius}
                    highlight={index === 0}
                  />
                ))}
              </>
            ) : (
              <div className="rounded-card bg-card p-6 text-center shadow-card">
                <p className="font-display font-semibold text-dark">
                  Keine Orte gefunden
                </p>
                <p className="mt-1 text-sm text-muted">
                  {filteredOut > 0
                    ? `${filteredOut} Orte in der Nähe passen nicht zu deinen Filtern – Filter lockern?`
                    : "In diesem Umkreis ist nichts erfasst. Größere Entfernung versuchen?"}
                </p>
                <Button onClick={filters.reset} className="mx-auto mt-4">
                  Filter zurücksetzen
                </Button>
              </div>
            )}

            {places.treeDataQuality === "low" && visible.length > 0 && (
              <p className="px-1 text-xs leading-relaxed text-muted">
                In dieser Gegend sind nur wenige Bäume in OpenStreetMap erfasst.
                Die Schattenangabe ist deshalb eine gröbere Schätzung.
              </p>
            )}
          </div>
        )}
      </main>

      <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[901] mx-auto flex max-w-lg justify-between gap-3 px-4">
        <button
          type="button"
          onClick={() => setReportPickerOpen(true)}
          className="pointer-events-auto flex min-h-13 items-center gap-2 rounded-full bg-card px-5 font-semibold text-dark shadow-float"
        >
          <Megaphone size={18} aria-hidden />
          Status melden
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="pointer-events-auto flex min-h-13 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-white shadow-float"
        >
          <SlidersHorizontal size={18} aria-hidden />
          Filter
          {filterCount > 0 && (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} />

      <Sheet
        open={reportPickerOpen}
        title="Wo bist du gerade?"
        onOpenChange={setReportPickerOpen}
      >
        <ul className="space-y-2">
          {nearest.map(({ place, distance }) => (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => {
                  setReportTarget({ id: place.id, name: place.name });
                  setReportPickerOpen(false);
                }}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 text-left active:bg-background"
              >
                <span className="font-medium text-dark">{place.name}</span>
                <span className="shrink-0 text-sm text-muted">
                  {formatDistance(distance)}
                </span>
              </button>
            </li>
          ))}
          {nearest.length === 0 && (
            <li className="text-sm text-muted">Keine Orte in der Nähe geladen.</li>
          )}
        </ul>
      </Sheet>

      {reportTarget && (
        <ReportStatusModal
          placeName={reportTarget.name}
          onClose={() => setReportTarget(null)}
          onSubmit={submitReport}
        />
      )}
    </div>
  );
}
