"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Layers, Megaphone, SlidersHorizontal } from "lucide-react";
import { selectPlaces } from "@/lib/select";
import { formatDistance, haversine } from "@/lib/utils";
import type { PlaceStatusType } from "@/types";
import { FALLBACK_LABEL, useGeolocation } from "@/hooks/useGeolocation";
import { useNow } from "@/hooks/useNow";
import { useOnline } from "@/hooks/useOnline";
import { radiusForDistance, usePlaces } from "@/hooks/usePlaces";
import { useStatuses } from "@/hooks/useStatuses";
import { useWeather } from "@/hooks/useWeather";
import { SCORE_ERKLAERUNG } from "@/lib/wording";
import { activeFilterChips, useFilters } from "@/store/useFilters";
import { useManualLocation } from "@/store/useLocation";
import { LocationSheet } from "./LocationSheet";
import { FilterChips } from "./filters/FilterChips";
import { FilterSheet } from "./filters/FilterSheet";
import { MapControls } from "./map/MapControls";
import { PlaceCard } from "./place/PlaceCard";
import { PlacesLoading } from "./place/PlacesLoading";
import { ReportStatusModal } from "./status/ReportStatusModal";
import { Button } from "./ui/Button";
import { InfoButton } from "./ui/InfoButton";
import { Sheet } from "./ui/Sheet";
import { WeatherHeader } from "./WeatherHeader";

const Map = dynamic(() => import("./map/Map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-[#eef1f2]" />,
});

export function HomeView() {
  const filters = useFilters();
  const geo = useGeolocation();
  const { manual, setManual } = useManualLocation();
  const geoStatus = geo.status;
  // Ein manuell gewählter Ort überstimmt GPS – so funktioniert die Suche und
  // der „Reise"-Blick, und ein blockierter Standort ist kein Sackgasse mehr.
  const coords = useMemo(
    () =>
      manual
        ? {
            lat: manual.lat,
            lng: manual.lng,
            accuracyM: null,
            source: "manual" as const,
          }
        : geo.coords,
    [manual, geo.coords],
  );
  // Derselbe Radius wandert in die Detail-Links: die Detailseite trifft damit
  // exakt den Cache-Eintrag, den diese Liste schon geladen hat.
  const radius = radiusForDistance(filters.maxDistanceM);
  const places = usePlaces(coords, radius);
  const wetter = useWeather(coords);
  const weather = wetter.weather;
  const placeIds = useMemo(() => places.places.map((p) => p.id), [places.places]);
  const { statuses, report } = useStatuses(placeIds);
  const now = useNow();
  const online = useOnline();

  const [filterOpen, setFilterOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
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

  // Wie viele Orte erfüllen ein Kriterium überhaupt? OSM kennt Zäune kaum –
  // das gehört im Filter sichtbar gemacht, nicht hinter einer leeren Liste.
  const inRange = useMemo(
    () =>
      places.places.filter(
        (place) =>
          haversine(coords.lat, coords.lng, place.lat, place.lng) <=
          filters.maxDistanceM,
      ),
    [places.places, coords.lat, coords.lng, filters.maxDistanceM],
  );

  const matchCounts = useMemo(
    () => ({
      total: inRange.length,
      toilet: inRange.filter((p) => p.tags.toilet === true).length,
      changingTable: inRange.filter((p) => p.tags.changing_table === true).length,
      fenced: inRange.filter((p) => p.tags.fenced === true).length,
      water: inRange.filter((p) => p.tags.water_play === true).length,
    }),
    [inRange],
  );

  const filterCount = activeFilterChips(filters).length;
  const locationLabel = manual
    ? manual.label
    : coords.source === "gps"
      ? "Orte in deiner Nähe"
      : FALLBACK_LABEL;
  // Ohne Wetter lässt sich kein Schatten bewerten – dann muss ein Fehler
  // sichtbar werden statt eines Ladezustands, der nie endet.
  const loading = places.loading || wetter.loading;
  const error = places.error ?? wetter.error;

  const reload = () => {
    places.reload();
    wetter.reload();
  };

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
        manualActive={!!manual}
        onOpenLocation={() => setLocationOpen(true)}
      />

      <MapControls />

      {!online && (
        <p className="mx-4 mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm leading-relaxed text-accent-ink">
          <span className="font-semibold">Du bist offline.</span> Wir zeigen die
          zuletzt geladenen Orte. Schatten und Sonnenstand stimmen weiterhin,
          neue Meldungen anderer Eltern fehlen.
        </p>
      )}

      <main className="relative flex-1">
        {!loading && error && (
          <div className="m-4 rounded-card bg-card p-6 text-center shadow-card">
            <p className="font-display text-lg font-semibold text-dark">
              {online ? "Die Orte kommen gerade nicht durch" : "Keine Verbindung"}
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
              {online
                ? error
                : "Ohne Netz können wir für diese Gegend nichts laden. Sobald du wieder Empfang hast, geht es weiter."}
            </p>
            <Button onClick={reload} className="mx-auto mt-5">
              Erneut versuchen
            </Button>
          </div>
        )}

        {loading && <PlacesLoading />}

        {!loading && !error && filters.viewMode === "map" && (
          <div className="relative h-[calc(100dvh-16rem)] min-h-[22rem] w-full overflow-hidden">
            <Map
              places={visible}
              origin={coords}
              radius={radius}
              style={filters.mapStyle}
            />
            <button
              type="button"
              onClick={() =>
                filters.setMapStyle(filters.mapStyle === "map" ? "satellite" : "map")
              }
              aria-label={
                filters.mapStyle === "map"
                  ? "Zur Satellitenansicht wechseln"
                  : "Zur Kartenansicht wechseln"
              }
              className="absolute top-3 right-3 z-[905] flex items-center gap-1.5 rounded-full bg-card/95 px-3.5 py-2 text-sm font-semibold text-dark shadow-card backdrop-blur transition active:scale-95"
            >
              <Layers size={16} aria-hidden />
              {filters.mapStyle === "map" ? "Satellit" : "Karte"}
            </button>
          </div>
        )}

        {!loading && !error && filters.viewMode === "list" && (
          <div className="space-y-4 p-4 pb-32">
            <FilterChips />

            {visible.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted">
                    {visible.length} Orte in der Nähe – oben steht, wo es{" "}
                    {filters.timeOffsetMin === 0
                      ? "gerade"
                      : `in ${filters.timeOffsetMin} Minuten`}{" "}
                    am angenehmsten ist.
                  </p>
                  <InfoButton
                    title="Wie wird sortiert?"
                    ariaLabel="Erklärung zur Sortierung"
                  >
                    <p>{SCORE_ERKLAERUNG}</p>
                    <p>
                      Der Wert steht als Ring auf jeder Karte. Je voller der
                      Ring, desto besser passt der Ort zu diesem Moment.
                    </p>
                  </InfoButton>
                </div>
                {visible.map((place, index) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    origin={coords}
                    radius={radius}
                    rank={index}
                    now={now.getTime()}
                  />
                ))}
              </>
            ) : (
              <div className="rounded-card bg-card p-6 text-center shadow-card">
                <p className="font-display text-lg font-semibold text-dark">
                  {filteredOut > 0 ? "Nichts passt zu deinen Filtern" : "Hier ist nichts erfasst"}
                </p>
                <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
                  {filteredOut > 0
                    ? `In der Nähe liegen ${filteredOut} Orte, die deine Filter gerade aussortieren. Ein Kriterium weniger bringt sie zurück.`
                    : "In diesem Umkreis kennt OpenStreetMap keinen Spielplatz und keine Grünfläche. Mit größerer Entfernung findet sich meist etwas."}
                </p>
                {/* Ohne aussortierte Orte hilft Zurücksetzen nicht – dann muss
                    der Umkreis größer werden. */}
                {filteredOut > 0 ? (
                  <Button onClick={filters.reset} className="mx-auto mt-4">
                    Filter zurücksetzen
                  </Button>
                ) : (
                  <Button onClick={() => setFilterOpen(true)} className="mx-auto mt-4">
                    Entfernung ändern
                  </Button>
                )}
              </div>
            )}

            {places.treeDataQuality === "low" && visible.length > 0 && (
              <p className="rounded-2xl bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
                In dieser Gegend sind nur wenige Bäume in OpenStreetMap erfasst.
                Die Schattenangaben sind hier gröber geschätzt als anderswo.
              </p>
            )}

            {visible.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-1 pt-2">
                <p className="text-xs leading-relaxed text-muted">
                  Orte und Ausstattung von OpenStreetMap, Wetter von Open-Meteo.
                </p>
                <InfoButton title="Woher kommen die Daten?">
                  <p>
                    Orte, Toiletten und Ausstattung stammen aus OpenStreetMap –
                    einer freien Karte, die Freiwillige pflegen. Sie ist gut,
                    aber lückenhaft: Zäune etwa sind kaum eingetragen.
                  </p>
                  <p>
                    Der Schatten ist <strong>gerechnet, nicht gemessen</strong>:
                    aus dem Sonnenstand, den erfassten Bäumen und den Gebäuden
                    ringsum. Er ist eine gute Schätzung, keine Garantie.
                  </p>
                  <p>
                    Wetter kommt von Open-Meteo. Meldungen stammen von anderen
                    Eltern und gelten drei Stunden.
                  </p>
                </InfoButton>
              </div>
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
          Rückmeldung geben
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="pointer-events-auto flex min-h-13 items-center gap-2 rounded-full bg-primary-dark px-5 font-semibold text-white shadow-float"
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

      <FilterSheet
        open={filterOpen}
        counts={matchCounts}
        onClose={() => setFilterOpen(false)}
      />

      <LocationSheet
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        geoStatus={geoStatus}
        onUseGps={geo.locate}
        manual={manual}
        onSetManual={setManual}
      />

      <Sheet
        open={reportPickerOpen}
        title="An welchem Ort bist du?"
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
