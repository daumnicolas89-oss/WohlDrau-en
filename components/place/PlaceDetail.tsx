"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Megaphone, Navigation } from "lucide-react";
import { scorePlace } from "@/lib/scoring";
import { formatAge, statusOption } from "@/lib/status";
import { computeShade } from "@/lib/sun";
import { haversine } from "@/lib/utils";
import { weatherAt } from "@/lib/weather";
import {
  SCORE_ERKLAERUNG,
  distanceSentence,
  mainDriver,
  scoreWording,
  shadeOutlook,
  shadeReason,
} from "@/lib/wording";
import type { PlaceStatusType } from "@/types";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNow } from "@/hooks/useNow";
import { useOnline } from "@/hooks/useOnline";
import { radiusForDistance, usePlaces } from "@/hooks/usePlaces";
import { useStatuses } from "@/hooks/useStatuses";
import { useWeather } from "@/hooks/useWeather";
import { ReportStatusModal } from "@/components/status/ReportStatusModal";
import { Button } from "@/components/ui/Button";
import { InfoButton } from "@/components/ui/InfoButton";
import { ScoreRing, TONE_TEXT } from "@/components/ui/ScoreRing";
import { SkyScene, skyMood, SKY_GRADIENT } from "@/components/SkyScene";
import { AttributeList } from "./AttributeList";
import { PlacePhoto } from "./PlacePhoto";
import { PlacesLoading } from "./PlacesLoading";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { ShadeMeter } from "./ShadeMeter";
import { ShadeTimeline } from "./ShadeTimeline";

const VERLAESSLICHKEIT = {
  high: "Bäume und Gebäude sind für diese Gegend gut in der Karte erfasst, die Einschätzung ist also ziemlich verlässlich.",
  medium: "Die Einschätzung stützt sich auf teilweise erfasste Bäume und Gebäude.",
  low: "In dieser Gegend sind kaum Bäume erfasst. Der Schattenwert ist nur eine grobe Schätzung.",
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
  // Der Link von der Startseite bringt den Standort mit, so funktioniert die
  // Detailseite auch geteilt, ohne erneute Standortfreigabe.
  const viewer = origin ? { ...geo.coords, ...origin } : geo.coords;
  // Kam der Link aus der Liste, wird exakt deren Abfrage wiederholt, der
  // Server-Cache antwortet sofort. Sonst wird um den Ort herum gesucht, nicht
  // um den Nutzer: ein weiter entfernter Ort fiele sonst aus dem Umkreis.
  const fromList = origin !== null && radius !== null;
  const searchOrigin = fromList
    ? viewer
    : placeHint
      ? { ...geo.coords, ...placeHint }
      : viewer;
  const searchRadius = fromList ? radius : radiusForDistance(placeHint ? 500 : 4000);
  const places = usePlaces(searchOrigin, searchRadius);
  const wetter = useWeather(searchOrigin);
  const weather = wetter.weather;
  const { statuses, report } = useStatuses(useMemo(() => [placeId], [placeId]));
  const now = useNow();
  const online = useOnline();
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

  /** Wie sieht es in einer Stunde aus? Beantwortet „lohnt es sich später eher?“ */
  const ausblick = useMemo(() => {
    if (!place || !weather) return null;
    const spaeter = new Date(now.getTime() + 60 * 60_000);
    const dann = computeShade(place, spaeter, weatherAt(weather, spaeter).cloudCover);
    return shadeOutlook(place.shade.index, dann.index);
  }, [place, weather, now]);

  async function submitReport(type: PlaceStatusType, message: string) {
    await report(placeId, type, message);
  }

  const loading = places.loading || wetter.loading;
  const error = places.error ?? wetter.error;
  const bewertung = place ? scoreWording(place.pleasantScore) : null;
  const heroW = weather ? weatherAt(weather, now) : null;
  const heroMood =
    weather && heroW
      ? skyMood(weather, heroW.cloudCover, heroW.precipitationProbability)
      : null;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background pb-28">
      {!(place && bewertung && weather) && (
        <div className="px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
          <Link
            href="/"
            aria-label="Zurück zur Übersicht"
            className="flex size-11 items-center justify-center rounded-full bg-card text-dark shadow-card"
          >
            <ArrowLeft size={20} />
          </Link>
        </div>
      )}

      {loading && <PlacesLoading rows={2} />}

      {!loading && error && (
        <div className="m-4 rounded-card bg-card p-6 text-center shadow-card">
          <p className="font-display text-lg font-semibold text-dark">
            {online ? "Der Ort lässt sich gerade nicht laden" : "Keine Verbindung"}
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
            {online
              ? error
              : "Ohne Netz kommen wir an die Daten für diesen Ort nicht heran. Sobald du wieder Empfang hast, geht es weiter."}
          </p>
          <Button
            onClick={() => {
              places.reload();
              wetter.reload();
            }}
            className="mx-auto mt-5"
          >
            Erneut versuchen
          </Button>
        </div>
      )}

      {!loading && !error && !place && (
        <div className="m-4 rounded-card bg-card p-6 text-center shadow-card">
          <p className="font-display text-lg font-semibold text-dark">
            Diesen Ort finden wir nicht
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
            Vielleicht liegt er außerhalb des geladenen Umkreises oder er wurde
            aus OpenStreetMap entfernt.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary-dark px-4 font-semibold text-white"
          >
            Zur Übersicht
          </Link>
        </div>
      )}

      {place && bewertung && weather && (
        <>
          <header
            className="sky-hero relative overflow-hidden px-5 pt-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))] pb-6"
            style={heroMood ? { background: SKY_GRADIENT[heroMood] } : undefined}
          >
            {heroMood && <SkyScene mood={heroMood} />}

            <Link
              href="/"
              aria-label="Zurück zur Übersicht"
              className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/60 text-dark shadow-card backdrop-blur transition active:scale-95"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="relative">
              <h1 className="font-display text-[26px] leading-tight font-bold text-dark">
              {place.name}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {distanceSentence(place.distance ?? 0)} ·{" "}
              {place.type === "park" ? "Grünfläche" : "Spielplatz"}
            </p>

            {/* Die Antwort auf „soll ich hin?“, groß, in Worten, mit Zahl. */}
            <div className="mt-5 flex items-center gap-4">
              <ScoreRing
                score={place.pleasantScore}
                tone={bewertung.tone}
                size={92}
                label={`Angenehm jetzt: ${place.pleasantScore} von 100`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                    Angenehm jetzt
                  </p>
                  <InfoButton
                    title="Woher kommt dieser Wert?"
                    ariaLabel="Erklärung zum Wert „Angenehm jetzt“"
                  >
                    <p>{SCORE_ERKLAERUNG}</p>
                    <p>
                      Die Bewertung gilt für genau diesen Moment. Steht die
                      Sonne in einer Stunde anders, ändert sie sich mit.
                    </p>
                  </InfoButton>
                </div>
                <p
                  className={`font-display text-2xl leading-tight font-bold ${TONE_TEXT[bewertung.tone]}`}
                >
                  {bewertung.label}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {place.pleasantScore} von 100
                </p>
              </div>
            </div>

            {/* Der Grund gehört direkt an den Wert, sonst bleibt „70“ eine
                Behauptung. */}
            <p className="mt-4 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-[15px] leading-relaxed text-dark backdrop-blur">
              {mainDriver(place).text}
            </p>
            </div>
          </header>

          <section className="space-y-4 px-4 pt-4">
            {/* Echtes Foto, wo OSM eines hat, sonst Luftbild von oben. */}
            <PlacePhoto
              imageUrl={place.imageUrl}
              lat={place.lat}
              lng={place.lng}
              name={place.name}
            />

            {/* Schatten: Aussage, Balken, Begründung, Ausblick. */}
            <div className="rounded-card bg-card p-5 shadow-card">
              <h2 className="mb-3 font-display font-semibold text-dark">
                Sonne und Schatten
              </h2>
              <ShadeMeter
                state={place.shade.state}
                shadeIndex={place.shade.index}
                size="lg"
                reason={shadeReason(place, now)}
              />
              {ausblick && (
                <p className="mt-2 text-sm font-medium text-primary-dark">{ausblick}</p>
              )}
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
                {VERLAESSLICHKEIT[place.shadeInputs.confidence]}
              </p>
            </div>

            <div className="rounded-card bg-card p-5 shadow-card">
              <h2 className="mb-1 font-display font-semibold text-dark">
                Wie lange hält der Schatten?
              </h2>
              <p className="mb-3 text-sm text-muted">
                Geschätzt für die nächsten Stunden.
              </p>
              <ShadeTimeline place={place} weather={weather} from={now} />
            </div>

            <ScoreBreakdown
              place={place}
              weather={weather}
              at={now}
              now={now.getTime()}
            />

            <div className="rounded-card bg-card p-5 shadow-card">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="font-display font-semibold text-dark">Ausstattung</h2>
                <InfoButton title="Woher kommen diese Angaben?">
                  <p>
                    Die Ausstattung stammt aus OpenStreetMap, einer freien Karte,
                    die Freiwillige pflegen. Vieles ist dort schlicht nicht
                    eingetragen, Zäune besonders selten.
                  </p>
                  <p>
                    Deshalb steht bei fehlenden Angaben „Keine Information“ und
                    nicht „nicht vorhanden“. Im Zweifel lohnt der Blick vor Ort.
                  </p>
                </InfoButton>
              </div>
              <AttributeList place={place} />
              {(place.tags.age_group ||
                place.tags.surface ||
                place.shadeInputs.areaM2) && (
                <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-muted">
                  {place.tags.age_group && (
                    <div className="flex gap-2">
                      <dt>Für Kinder von:</dt>
                      <dd className="text-dark">{place.tags.age_group}</dd>
                    </div>
                  )}
                  {place.tags.surface && (
                    <div className="flex gap-2">
                      <dt>Untergrund:</dt>
                      <dd className="text-dark">{place.tags.surface}</dd>
                    </div>
                  )}
                  {place.shadeInputs.areaM2 && (
                    <div className="flex gap-2">
                      <dt>Größe:</dt>
                      <dd className="text-dark">
                        etwa {place.shadeInputs.areaM2.toLocaleString("de-DE")} m²
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>

            <div className="rounded-card bg-card p-5 shadow-card">
              <h2 className="mb-1 font-display font-semibold text-dark">
                Was andere Eltern melden
              </h2>
              <p className="mb-3 text-sm text-muted">
                Meldungen der letzten drei Stunden.
              </p>
              {place.lastStatuses.length > 0 ? (
                <ul className="space-y-3">
                  {place.lastStatuses.map((status) => {
                    const option = statusOption(status.type);
                    return (
                      <li key={status.id} className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                            option.tone === "good"
                              ? "bg-primary-dark"
                              : option.tone === "bad"
                                ? "bg-warning-ink"
                                : "bg-muted"
                          }`}
                        />
                        <span className="text-[15px]">
                          <span className="font-medium text-dark">{option.label}</span>
                          <span className="text-muted">
                            {" · "}
                            {formatAge(status.createdAt, now.getTime())}
                          </span>
                          {status.message && (
                            <span className="mt-0.5 block text-sm text-muted">
                              „{status.message}“
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[15px] text-muted">
                  Noch nichts gemeldet. Wenn du dort bist, hilft eine kurze
                  Rückmeldung den nächsten Eltern.
                </p>
              )}
            </div>

            <a
              href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-card text-sm font-semibold text-muted shadow-card"
            >
              Auf der Karte ansehen
              <ExternalLink size={15} aria-hidden />
            </a>
          </section>

          <div className="safe-bottom fixed inset-x-0 bottom-0 z-[901] mx-auto flex max-w-lg gap-3 px-4">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              aria-label="Rückmeldung zu diesem Ort geben"
              className="flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-card px-5 font-semibold text-dark shadow-float transition hover:bg-background active:scale-95"
            >
              <Megaphone size={18} aria-hidden />
              Melden
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=walking`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full bg-primary-dark font-semibold text-white shadow-float transition hover:bg-primary-darker active:bg-[#175c54]"
            >
              <Navigation size={18} aria-hidden />
              Route dorthin
            </a>
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
