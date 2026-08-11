"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CloudSun,
  ExternalLink,
  Footprints,
  Megaphone,
  TreePine,
} from "lucide-react";
import { scorePlace } from "@/lib/scoring";
import { formatAge, statusOption } from "@/lib/status";
import { formatDistance, haversine, walkingMinutes } from "@/lib/utils";
import type { PlaceStatusType } from "@/types";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNow } from "@/hooks/useNow";
import { radiusForDistance, usePlaces } from "@/hooks/usePlaces";
import { useStatuses } from "@/hooks/useStatuses";
import { useWeather } from "@/hooks/useWeather";
import { ReportStatusModal } from "@/components/status/ReportStatusModal";
import { Button } from "@/components/ui/Button";
import { AttributeChips } from "./AttributeChips";
import { ShadeBadge } from "./StatusBadge";
import { PlacesLoading } from "./PlacesLoading";
import { ShadeTimeline } from "./ShadeTimeline";

const CONFIDENCE_LABEL = {
  high: "gute Datenlage",
  medium: "mittlere Datenlage",
  low: "grobe Schätzung",
} as const;

export function PlaceDetail({
  placeId,
  origin,
  placeHint,
  radius,
}: {
  placeId: string;
  origin: { lat: number; lng: number } | null;
  placeHint: { lat: number; lng: number } | null;
  /** Suchradius der Liste, aus der dieser Link kam. */
  radius: number | null;
}) {
  const geo = useGeolocation();
  // Der Link von der Startseite bringt den Standort mit – so funktioniert die
  // Detailseite auch geteilt, ohne erneute Standortfreigabe.
  const viewer = origin ? { ...geo.coords, ...origin } : geo.coords;
  // Kam der Link aus der Liste, wird exakt deren Abfrage wiederholt – der
  // Server-Cache antwortet sofort. Sonst wird um den Ort herum gesucht, nicht
  // um den Nutzer: ein weiter entfernter Ort fiele sonst aus dem Umkreis.
  const fromList = origin !== null && radius !== null;
  const searchOrigin = fromList
    ? viewer
    : placeHint
      ? { ...geo.coords, ...placeHint }
      : viewer;
  const searchRadius = fromList
    ? radius
    : radiusForDistance(placeHint ? 500 : 4000);
  const places = usePlaces(searchOrigin, searchRadius);
  const { weather } = useWeather(searchOrigin);
  const { statuses, report } = useStatuses(useMemo(() => [placeId], [placeId]));
  const now = useNow();
  const [reportOpen, setReportOpen] = useState(false);

  const osmPlace = places.places.find((p) => p.id === placeId) ?? null;

  const place = useMemo(() => {
    if (!osmPlace || !weather) return null;
    return scorePlace(osmPlace, {
      weather,
      at: now,
      distanceM: haversine(viewer.lat, viewer.lng, osmPlace.lat, osmPlace.lng),
      statuses: statuses.filter((s) => s.placeId === placeId),
      now: now.getTime(),
    });
  }, [osmPlace, weather, statuses, placeId, now, viewer.lat, viewer.lng]);

  async function submitReport(type: PlaceStatusType, message: string) {
    await report(placeId, type, message);
  }

  const loading = places.loading || !weather;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background pb-28">
      <div className="sticky top-0 z-[900] flex items-center gap-2 bg-background/95 px-3 py-2 backdrop-blur">
        <Link
          href="/"
          aria-label="Zurück"
          className="flex size-11 items-center justify-center rounded-full bg-card text-dark shadow-card"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>

      {loading && <PlacesLoading rows={2} />}

      {!loading && places.error && (
        <div className="m-4 rounded-card bg-warning-soft p-4">
          <p className="text-sm font-medium text-warning-ink">
            Die Ortsdaten sind gerade nicht erreichbar.
          </p>
          <p className="mt-1 text-xs text-warning-ink/80">{places.error}</p>
          <Button variant="secondary" onClick={places.reload} className="mt-3 min-h-11">
            Erneut versuchen
          </Button>
        </div>
      )}

      {!loading && !places.error && !place && (
        <div className="m-4 rounded-card bg-card p-6 text-center shadow-card">
          <p className="font-display font-semibold text-dark">Ort nicht gefunden</p>
          <p className="mt-1 text-sm text-muted">
            Vielleicht liegt er außerhalb des geladenen Bereichs.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary-dark px-4 font-semibold text-white"
          >
            Zur Übersicht
          </Link>
        </div>
      )}

      {place && weather && (
        <>
          <section className="px-4">
            <h1 className="font-display text-2xl leading-tight font-bold text-dark">
              {place.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Footprints size={15} aria-hidden />
              {formatDistance(place.distance ?? 0)} ·{" "}
              {walkingMinutes(place.distance ?? 0)} Min zu Fuß
              <span aria-hidden>·</span>
              {place.type === "park" ? "Grünfläche" : "Spielplatz"}
            </p>

            <div className="mt-4 rounded-card bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <ShadeBadge state={place.shade.state} size="lg" />
                <span className="text-sm text-muted">
                  {place.currentShadeScore} % Schatten
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <TreePine size={15} aria-hidden className="text-primary" />
                  Bäume: {Math.round(place.shade.fromCanopy * 100)} %
                  {place.shadeInputs.treeCount > 0 &&
                    ` (${place.shadeInputs.treeCount} erfasst)`}
                </li>
                <li className="flex items-center gap-2">
                  <Building2 size={15} aria-hidden className="text-dark" />
                  Gebäudeschatten: {Math.round(place.shade.fromBuildings * 100)} %
                </li>
                <li className="flex items-center gap-2">
                  <CloudSun size={15} aria-hidden className="text-accent" />
                  Bewölkung: {Math.round(place.shade.fromClouds * 100)} %
                </li>
              </ul>

              <p className="mt-3 text-xs text-muted">
                Sonnenstand {Math.round(place.shade.sunAltitudeDeg)}° ·{" "}
                {CONFIDENCE_LABEL[place.shadeInputs.confidence]} · Angenehm-Wert{" "}
                {place.pleasantScore}/100
              </p>
            </div>

            <div className="mt-3 rounded-card bg-card p-4 shadow-card">
              <h2 className="mb-3 font-display font-semibold text-dark">
                Schatten im Tagesverlauf
              </h2>
              <ShadeTimeline place={place} weather={weather} from={now} />
            </div>

            <div className="mt-3 rounded-card bg-card p-4 shadow-card">
              <h2 className="mb-3 font-display font-semibold text-dark">Ausstattung</h2>
              <AttributeChips tags={place.tags} showUnknown />
              <dl className="mt-3 space-y-1 text-sm text-muted">
                {place.toiletDistance !== null && (
                  <div className="flex gap-2">
                    <dt>Toilette:</dt>
                    <dd>{formatDistance(place.toiletDistance)} entfernt</dd>
                  </div>
                )}
                {place.tags.age_group && (
                  <div className="flex gap-2">
                    <dt>Alter:</dt>
                    <dd>{place.tags.age_group}</dd>
                  </div>
                )}
                {place.tags.surface && (
                  <div className="flex gap-2">
                    <dt>Untergrund:</dt>
                    <dd>{place.tags.surface}</dd>
                  </div>
                )}
                {place.shadeInputs.areaM2 && (
                  <div className="flex gap-2">
                    <dt>Fläche:</dt>
                    <dd>ca. {place.shadeInputs.areaM2.toLocaleString("de-DE")} m²</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-3 rounded-card bg-card p-4 shadow-card">
              <h2 className="mb-3 font-display font-semibold text-dark">
                Aktuelle Meldungen
              </h2>
              {place.lastStatuses.length > 0 ? (
                <ul className="space-y-2">
                  {place.lastStatuses.map((status) => {
                    const option = statusOption(status.type);
                    return (
                      <li key={status.id} className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${
                            option.tone === "good"
                              ? "bg-primary"
                              : option.tone === "bad"
                                ? "bg-warning"
                                : "bg-muted"
                          }`}
                        />
                        <span className="text-sm">
                          <span className="font-medium text-dark">{option.label}</span>{" "}
                          <span className="text-muted">
                            · {formatAge(status.createdAt, now.getTime())}
                          </span>
                          {status.message && (
                            <span className="block text-muted">{status.message}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  Noch keine Meldungen in den letzten Stunden.
                </p>
              )}
            </div>

            <a
              href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-card bg-card text-sm font-semibold text-muted shadow-card"
            >
              Auf der Karte ansehen
              <ExternalLink size={15} aria-hidden />
            </a>
          </section>

          <div className="safe-bottom fixed inset-x-0 bottom-0 z-[901] mx-auto max-w-lg px-4">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-primary-dark font-semibold text-white shadow-float"
            >
              <Megaphone size={18} aria-hidden />
              Status melden
            </button>
          </div>

          {reportOpen && (
            <ReportStatusModal
              placeName={place.name}
              onClose={() => setReportOpen(false)}
              onSubmit={submitReport}
            />
          )}
        </>
      )}
    </div>
  );
}
