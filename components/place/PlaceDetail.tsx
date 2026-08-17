"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CloudOff,
  ExternalLink,
  Info,
  Megaphone,
  Navigation,
  Flag,
  Star,
} from "lucide-react";
import { scorePlace } from "@/lib/scoring";
import { formatAge, statusOption } from "@/lib/status";
import { computeShade, windowHasSun } from "@/lib/sun";
import { hasInAppHistory, haversine } from "@/lib/utils";
import { weatherAt } from "@/lib/weather";
import {
  SCORE_ERKLAERUNG,
  distanceSentence,
  mainDriver,
  scoreWording,
  shadeOutlook,
  shadeReason,
  surfaceLabel,
} from "@/lib/wording";
import type { PlaceStatusType } from "@/types";
import { useFavorites } from "@/store/useFavorites";
import { useModeration } from "@/store/useModeration";
import { apiUrl } from "@/lib/appMode";
import { routeUrl, tick } from "@/lib/native";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNow } from "@/hooks/useNow";
import { useOnline } from "@/hooks/useOnline";
import { radiusForDistance, usePlaces } from "@/hooks/usePlaces";
import { useStatuses } from "@/hooks/useStatuses";
import { deriveWeatherState, useWeather } from "@/hooks/useWeather";
import { ReportStatusModal } from "@/components/status/ReportStatusModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoButton } from "@/components/ui/InfoButton";
import { ScoreRing, TONE_TEXT } from "@/components/ui/ScoreRing";
import { SkyScene, skyMood, SKY_GRADIENT } from "@/components/SkyScene";
import { AttributeList } from "./AttributeList";
import { PlaceKindTag } from "./PlaceKindTag";
import { PlacePhoto } from "./PlacePhoto";
import { PlacesLoading } from "./PlacesLoading";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { Hinweis } from "@/components/ui/Hinweis";
import { ShadeMeter } from "./ShadeMeter";
import { ShadeTimeline } from "./ShadeTimeline";

const VERLAESSLICHKEIT = {
  high: "Für diesen Ort sind genug Bäume und Gebäude erfasst, die Einschätzung ist also ziemlich verlässlich.",
  medium: "Die Einschätzung stützt sich auf teilweise erfasste Bäume und Gebäude.",
  low: "Für diesen Ort sind kaum Bäume erfasst. Es kann deutlich schattiger sein, als es hier aussieht, der Wert ist nur eine grobe Schätzung.",
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
  const router = useRouter();
  // Zurück heißt: an genau die Stelle der Liste, wo man war (Scroll bleibt
  // erhalten). Nur wer wirklich aus der App kommt, spult den Verlauf zurück,
  // ein Direkteinstieg (geteilter Link) folgt sicher dem href "/".
  function goBack(event: React.MouseEvent<HTMLAnchorElement>) {
    if (hasInAppHistory()) {
      event.preventDefault();
      router.back();
    }
  }

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
  // Ohne Orts-Hinweis (alter/gekürzter Link) suchen wir großräumig – aber
  // nur so weit, wie der Server wirklich liefert (MAX_RADIUS_M = 3500).
  // Vorher wünschte sich der Client 5000 m, bekam still 3500, und Orte in
  // der Differenzzone endeten fälschlich in „Diesen Platz finden wir nicht".
  const searchRadius = fromList ? radius : placeHint ? radiusForDistance(500) : 3500;
  const places = usePlaces(searchOrigin, searchRadius);
  const wetter = useWeather(searchOrigin);
  const weather = wetter.weather;
  // Fällt nur das Wetter aus, soll der Ort trotzdem erscheinen, mit neutralem
  // Ersatzwetter geordnet, statt die Detailseite ganz wegzublenden.
  const { scoringWeather, weatherMissing, weatherBlocksLoading } =
    deriveWeatherState(wetter);
  const { statuses, report } = useStatuses(useMemo(() => [placeId], [placeId]));
  const now = useNow();
  const online = useOnline();
  const favorites = useFavorites();
  const gemerkt = favorites.ids.includes(placeId);
  const [reportOpen, setReportOpen] = useState(false);
  const moderation = useModeration();

  /** Melden: sofort ausblenden, Verfasser blockieren, Server informieren. */
  function meldeBeitrag(status: { id: string; authorKey?: string }) {
    moderation.hide(status.id);
    if (status.authorKey) moderation.block(status.authorKey);
    void fetch(apiUrl("/api/status/report"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId: status.id }),
    }).catch(() => undefined);
  }

  const osmPlace = places.places.find((p) => p.id === placeId) ?? null;

  const place = useMemo(() => {
    if (!osmPlace) return null;
    return scorePlace(osmPlace, {
      weather: scoringWeather,
      at: now,
      distanceM: haversine(viewer.lat, viewer.lng, osmPlace.lat, osmPlace.lng),
      statuses: statuses.filter((s) => s.placeId === placeId),
      now: now.getTime(),
    });
  }, [osmPlace, scoringWeather, statuses, placeId, now, viewer.lat, viewer.lng]);

  // Was jemand gemeldet oder blockiert hat, sieht er nicht mehr – sofort,
  // ohne auf den Server zu warten.
  const sichtbareMeldungen = (place?.lastStatuses ?? []).filter(
    (s) => !moderation.isHidden(s.id, s.authorKey),
  );

  /** Wie sieht es in einer Stunde aus? Beantwortet „lohnt es sich später eher?“ */
  const ausblick = useMemo(() => {
    if (!place) return null;
    const spaeter = new Date(now.getTime() + 60 * 60_000);
    const dann = computeShade(
      place,
      spaeter,
      weatherAt(scoringWeather, spaeter).cloudCover,
    );
    return shadeOutlook(place.shade, dann);
  }, [place, scoringWeather, now]);

  /** Lohnt der Schatten-Verlauf? Nur wenn in den nächsten Stunden überhaupt
   *  die Sonne aufgeht, sonst zeigt er nachts sinnlose volle Balken. */
  const sonneImFenster = useMemo(
    () => (place ? windowHasSun(place, scoringWeather, now) : false),
    [place, scoringWeather, now],
  );

  async function submitReport(type: PlaceStatusType, message: string) {
    await report(placeId, type, message);
  }

  // Nur solange es wirklich nichts zu zeigen gibt. Vorher blieb `loading`
  // auch beim stillen Nachladen im Hintergrund wahr – dann rendere das
  // Skelett ÜBER der längst fertigen Detailseite, zwei Seiten übereinander.
  const loading = !place && (places.loading || weatherBlocksLoading);
  // Genauso beim Fehler: Steht der Ort schon da, soll ein misslungener
  // Hintergrund-Abruf ihn nicht durch einen Fehlerkasten verdrängen.
  const error = place ? null : places.error;
  const bewertung = place ? scoreWording(place.pleasantScore) : null;
  const heroW = weather ? weatherAt(weather, now) : null;
  const heroMood =
    weather && heroW
      ? skyMood(weather, heroW.cloudCover, heroW.precipitationProbability, heroW.uvIndex)
      : null;

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background pb-28">
      {!(place && bewertung) && (
        <div className="px-4 pt-[max(0.75rem,calc(env(safe-area-inset-top)+0.5rem))] pb-1">
          <Link
            href="/"
            onClick={goBack}
            aria-label="Zurück zur Übersicht"
            className="flex size-11 items-center justify-center rounded-full bg-card text-dark shadow-card transition hover:bg-background active:scale-95"
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
            Diesen Platz finden wir nicht
          </p>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
            Vielleicht liegt er außerhalb des geladenen Umkreises oder er wurde
            aus OpenStreetMap entfernt.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary-dark px-5 font-semibold text-white shadow-card transition hover:bg-primary-darker active:scale-[0.98]"
          >
            Zur Übersicht
          </Link>
        </div>
      )}

      {place && bewertung && (
        <>
          <header
            className="sky-hero relative overflow-hidden px-4 pt-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))] pb-6"
            style={heroMood ? { background: SKY_GRADIENT[heroMood] } : undefined}
          >
            {heroMood && <SkyScene mood={heroMood} />}

            <Link
              href="/"
              onClick={goBack}
              aria-label="Zurück zur Übersicht"
              className="absolute left-4 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] z-10 flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/60 text-dark shadow-card backdrop-blur transition hover:bg-white/80 active:scale-95"
            >
              <ArrowLeft size={20} />
            </Link>

            {/* Merken: macht diesen Ort zu einem „Meine Plätze"-Stammplatz,
                der auf der Startseite oben angepinnt wird. */}
            <button
              type="button"
              onClick={() => {
                tick();
                favorites.toggle(place.id);
              }}
              aria-pressed={gemerkt}
              // Label konstant, den Zustand trägt aria-pressed – wechselnde
              // Labels PLUS pressed lesen sich im Screenreader widersprüchlich.
              aria-label="Platz merken"
              className="absolute right-4 top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] z-10 flex size-11 items-center justify-center rounded-full border border-white/70 bg-white/60 text-dark shadow-card backdrop-blur transition hover:bg-white/80 active:scale-95"
            >
              <Star
                size={20}
                className={gemerkt ? "fill-accent text-accent" : undefined}
              />
            </button>

            <div className="relative">
              <h1 className="font-display text-2xl leading-tight font-bold text-balance text-dark">
              {place.name}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-sky-muted">
              {distanceSentence(place.distance ?? 0)}
              {/* Der Trenner war `text-line` – ein Rahmen-Token als Schrift,
                  1,04:1 auf dem Verlauf, also schlicht unsichtbar. */}
              <span aria-hidden className="text-sky-muted/50">
                ·
              </span>
              <PlaceKindTag kind={place.kind} className="font-medium" />
            </p>

            {/* Die Seite führt entlang der Eltern-Fragen. Die erste steht
                wörtlich da – und Ring plus Wort sind die Antwort. */}
            <div className="mt-5 flex items-center gap-4">
              <ScoreRing
                score={place.pleasantScore}
                tone={bewertung.tone}
                size={92}
                label={`Angenehm jetzt: ${place.pleasantScore} von 100, ${bewertung.label}.`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-[11px] font-semibold tracking-wide text-sky-muted uppercase">
                    Angenehm jetzt
                  </p>
                  <InfoButton
                    title="Wie kommt dieser Wert zustande?"
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
                <p className="mt-0.5 text-sm text-sky-muted">
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
            {weatherMissing && (
              <Hinweis Icon={CloudOff}>
                Das Wetter ist gerade nicht erreichbar. Schatten und Bewertung
                beruhen hier auf dem Sonnenstand und einer neutralen Annahme,
                nicht auf aktuellen Werten.
              </Hinweis>
            )}

            {place.tags.restrictedAccess && (
              <Hinweis ton="warnung" Icon={Info}>
                Der Zugang ist laut Karte eingeschränkt (z. B. ein Schulhof).
                Solche Plätze sind oft nur außerhalb der Schulzeit offen, schau
                am besten vorher nach, ob er gerade offen ist.
              </Hinweis>
            )}

            {/* Echtes Foto, wo OSM eines hat, sonst Luftbild von oben. */}
            <PlacePhoto
              imageUrl={place.imageUrl}
              lat={place.lat}
              lng={place.lng}
              name={place.name}
            />

            {/* Schatten: Aussage, Balken, Begründung, Ausblick. Wie es
                gerechnet wird, steht im Info-Knopf, nicht im Fließtext. */}
            <div className="rounded-card bg-card p-5 shadow-card">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-dark">
                  Wie sonnig ist es dort?
                </h2>
                <InfoButton title="Woher weiß die App das?">
                  <p>
                    Der Schatten wird aus dem Sonnenstand, den in OpenStreetMap
                    erfassten Bäumen, den Gebäuden ringsum und dem Gelände am
                    Horizont berechnet. Es ist eine Schätzung, keine Messung
                    vor Ort.
                  </p>
                  <p>
                    Je mehr Bäume in einer Gegend erfasst sind, desto genauer
                    wird sie. Von November bis März rechnen wir Baumkronen
                    lichter, weil Laubbäume dann kahl sind. Ein Blick aufs
                    Luftbild oben hilft im Zweifel.
                  </p>
                </InfoButton>
              </div>
              <ShadeMeter
                state={place.shade.state}
                shadeIndex={place.shade.index}
                size="lg"
                reason={shadeReason(place, now)}
              />
              {ausblick && (
                <p className="mt-2 text-sm font-medium text-primary-dark">{ausblick}</p>
              )}
              {/* Die Verlässlichkeit bezieht sich auf die Schatten-Schätzung,
                  nachts gibt es keine, also weglassen. */}
              {place.shade.state !== "no-sun" && (
                <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
                  {VERLAESSLICHKEIT[place.shadeInputs.confidence]}
                </p>
              )}
            </div>

            {sonneImFenster && (
              <div className="rounded-card bg-card p-5 shadow-card">
                <h2 className="mb-1 font-display text-lg font-semibold text-dark">
                  Wie lange hält der Schatten?
                </h2>
                <p className="mb-3 text-sm text-muted">
                  Geschätzt für die nächsten Stunden.
                </p>
                <ShadeTimeline place={place} weather={scoringWeather} from={now} />
              </div>
            )}

            <ScoreBreakdown
              place={place}
              weather={scoringWeather}
              at={now}
              now={now.getTime()}
            />

            <div className="rounded-card bg-card p-5 shadow-card">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-dark">
                  Was gibt es vor Ort?
                </h2>
                <InfoButton title="Woher kommen diese Angaben?">
                  <p>
                    Die Ausstattung stammt aus OpenStreetMap, einer freien Karte,
                    die Freiwillige pflegen. Vieles ist dort schlicht nicht
                    eingetragen, Zäune besonders selten.
                  </p>
                  <p>
                    Deshalb steht bei fehlenden Angaben „Keine Angabe“ und
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
                      <dd className="text-dark">{surfaceLabel(place.tags.surface)}</dd>
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
              <h2 className="mb-1 font-display text-lg font-semibold text-dark">
                Was sagen andere Eltern?
              </h2>
              <p className="mb-3 text-sm text-muted">
                Meldungen der letzten drei Stunden.
              </p>
              {sichtbareMeldungen.length > 0 ? (
                <ul className="space-y-3">
                  {sichtbareMeldungen.map((status) => {
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
                        <span className="min-w-0 flex-1 text-[15px]">
                          <span className="font-medium text-dark">{option.label}</span>
                          <span className="text-muted">
                            {" · "}
                            {formatAge(status.createdAt, now.getTime())}
                          </span>
                          {status.message && (
                            <span
                              data-selectable
                              className="mt-0.5 block text-sm text-muted"
                            >
                              „{status.message}“
                            </span>
                          )}
                        </span>
                        {/* Anstößiges lässt sich mit einem Tipp loswerden –
                            sofort für dich, ab zwei Meldungen für alle. */}
                        <button
                          type="button"
                          onClick={() => meldeBeitrag(status)}
                          aria-label="Diesen Beitrag melden"
                          className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition duration-200 active:scale-95"
                        >
                          <Flag size={16} aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  className="px-2 py-4"
                  Icon={Megaphone}
                  titel={online ? "Noch nichts gemeldet" : "Meldungen gerade nicht ladbar"}
                  text={
                    online
                      ? "Wenn du dort bist, hilft eine kurze Rückmeldung den nächsten Eltern."
                      : "Ohne Netz wissen wir nicht, ob andere Eltern etwas gemeldet haben."
                  }
                >
                  <Button onClick={() => setReportOpen(true)}>
                    Jetzt melden
                  </Button>
                </EmptyState>
              )}
            </div>

            <a
              href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-card text-sm font-semibold text-muted shadow-card"
            >
              Auf der Karte ansehen
              <ExternalLink size={16} aria-hidden />
            </a>
          </section>

          <div className="safe-bottom fixed inset-x-0 bottom-0 z-[901] mx-auto flex max-w-lg gap-3 px-4">
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              aria-label="Rückmeldung zu diesem Ort geben"
              className="flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-card px-5 font-semibold text-dark shadow-float transition hover:bg-background active:scale-95"
            >
              <Megaphone size={20} aria-hidden />
              Melden
            </button>
            <a
              href={routeUrl(place.lat, place.lng)}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-full bg-primary-dark font-semibold text-white shadow-float transition hover:bg-primary-darker active:bg-primary-darker"
            >
              <Navigation size={20} aria-hidden />
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
