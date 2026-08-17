"use client";

import { Fragment, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  MapPinOff,
  Megaphone,
  SlidersHorizontal,
  Star,
  Toilet,
  ToyBrick,
  WifiOff,
} from "lucide-react";
import { selectPlaces } from "@/lib/select";
import { formatDistance, haversine } from "@/lib/utils";
import type { OsmPlace, PlaceStatusType } from "@/types";
import { FALLBACK_LABEL, useGeolocation } from "@/hooks/useGeolocation";
import { useNow } from "@/hooks/useNow";
import { useOnline } from "@/hooks/useOnline";
import { radiusForDistance, usePlaces } from "@/hooks/usePlaces";
import { useStatuses } from "@/hooks/useStatuses";
import { deriveWeatherState, useWeather } from "@/hooks/useWeather";
import { SCORE_ERKLAERUNG } from "@/lib/wording";
import { bestTimeHint, bestTimeToday } from "@/lib/bestTime";
import { rainNowcast } from "@/lib/rainNowcast";
import { placeHref } from "@/lib/appMode";
import { activeFilterChips, useFilters } from "@/store/useFilters";
import { useFavorites } from "@/store/useFavorites";
import { useManualLocation } from "@/store/useLocation";
import { LocationSheet } from "./LocationSheet";
import { ToiletSheet } from "./ToiletSheet";
import { Welcome } from "./Welcome";
import { EmptyState } from "./ui/EmptyState";
import { FilterChips } from "./filters/FilterChips";
import { FilterSheet } from "./filters/FilterSheet";
import { MapControls } from "./map/MapControls";
import { MapLegende } from "./map/MapLegende";
import { Hinweis } from "./ui/Hinweis";
import Link from "next/link";
import { PlaceCard } from "./place/PlaceCard";
import { PlacesLoading } from "./place/PlacesLoading";
import { ReportStatusModal } from "./status/ReportStatusModal";
import { Button } from "./ui/Button";
import { InfoButton } from "./ui/InfoButton";
import { Sheet } from "./ui/Sheet";
import { WeatherHeader } from "./WeatherHeader";

/** Erst zehn Orte, dann auf Wunsch mehr – eine endlose Liste hilft niemandem. */
const LISTE_SCHRITT = 10;

const Map = dynamic(() => import("./map/Map"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-info-soft" />,
});

/** Ein Knopf, zwei Plätze: oben in der Karte, unten in der Liste. */
function ToiletButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-card text-sm font-semibold text-dark shadow-card transition duration-200 active:scale-[0.98] ${className}`}
    >
      <Toilet size={16} aria-hidden className="text-primary-dark" />
      Öffentliche Toilette suchen
    </button>
  );
}

export function HomeView() {
  const filters = useFilters();
  // Beim allerersten Öffnen erklärt ein Willkommens-Bildschirm die App – und
  // überbrückt damit unbemerkt genau die Sekunden, in denen im Hintergrund
  // schon geladen wird. Wiederkehrer sehen ihn nie.
  const [welcomed, setWelcomed] = useState(() => {
    try {
      return localStorage.getItem("platzda:welcomed") === "1";
    } catch {
      return true;
    }
  });

  // Der Standort wird erst nach „Los geht's" erfragt: Auf dem iPhone ist das
  // ein Systemdialog, der sonst über dem Erklärtext liegt und ihn verdeckt.
  const geo = useGeolocation(welcomed);

  const startApp = () => {
    setWelcomed(true);
    try {
      localStorage.setItem("platzda:welcomed", "1");
    } catch {
      // Lässt sich das Flag nicht speichern (strenger Privatmodus), erscheint
      // das Willkommen beim nächsten Öffnen erneut – der kleinere Übel.
    }
  };
  const { manual, setManual } = useManualLocation();
  const geoStatus = geo.status;
  // Ein manuell gewählter Ort überstimmt GPS, so funktioniert die Suche und
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
  const { scoringWeather, weatherMissing, weatherBlocksLoading } =
    deriveWeatherState(wetter);
  const placeIds = useMemo(() => places.places.map((p) => p.id), [places.places]);
  const { statuses, report } = useStatuses(placeIds);
  const now = useNow();
  const online = useOnline();

  const [filterOpen, setFilterOpen] = useState(false);
  const [sichtbar, setSichtbar] = useState(LISTE_SCHRITT);
  // Neuer Ort oder anderer Umkreis: wieder oben mit zehn anfangen, sonst
  // bleibt eine weit ausgeklappte Liste aus der alten Gegend stehen.
  const listenKontext = `${coords.lat.toFixed(2)}:${coords.lng.toFixed(2)}:${filters.maxDistanceM}`;
  const [letzterKontext, setLetzterKontext] = useState(listenKontext);
  if (letzterKontext !== listenKontext) {
    setLetzterKontext(listenKontext);
    setSichtbar(LISTE_SCHRITT);
  }
  const [locationOpen, setLocationOpen] = useState(false);
  const [toiletOpen, setToiletOpen] = useState(false);
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
        weather: scoringWeather,
        statuses,
        filters,
        origin: coords,
        at,
        now: now.getTime(),
      }),
    [places.places, scoringWeather, statuses, filters, coords, at, now],
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

  const favorites = useFavorites();
  // Gemerkte Plätze zuerst: die zwei, drei Stammplätze einer Familie gehören
  // nach oben, mit ihrem aktuellen Wert – der Rest sortiert sich wie gehabt.
  const { meinePlaetze, uebrige } = useMemo(() => {
    const meine = visible.filter((p) => favorites.ids.includes(p.id));
    return {
      meinePlaetze: meine,
      uebrige: meine.length > 0
        ? visible.filter((p) => !favorites.ids.includes(p.id))
        : visible,
    };
  }, [visible, favorites.ids]);

  /**
   * „Wir kennen hier kaum Bäume" ist eine wichtige Ehrlichkeit – aber wenn
   * der Satz auf zehn Karten hintereinander steht, liest ihn niemand mehr.
   * Betrifft er die Mehrheit, steht er einmal über der Liste; betrifft er
   * einzelne Plätze, bleibt er dort, wo er unterscheidet.
   */
  const vieleUnsicher = useMemo(() => {
    // Gezählt wird, was gerade wirklich auf dem Bildschirm steht – nicht alle
    // 95 Orte im Umkreis. Wiederholung stört dort, wo man sie sieht.
    const gezeigt = uebrige.slice(0, sichtbar);
    const unsicher = gezeigt.filter(
      (p) => p.shadeInputs.confidence === "low" && p.shadeInputs.inGreen,
    ).length;
    return unsicher >= 3;
  }, [uebrige, sichtbar]);

  // „Heute am angenehmsten: 16–18 Uhr" – aus der Stunden-Vorhersage, nur wenn
  // der Tag wirklich eine bessere Zeit hat (sonst wäre es Rauschen).
  const besteZeit = useMemo(
    () => bestTimeHint(weather ? bestTimeToday(weather, coords, now) : null),
    [weather, coords, now],
  );

  // Das Regen-Radar-Gefühl: „zieht auf" / „hört auf" für die nächsten 90 Min.
  const regenRadar = useMemo(
    () => (weather ? rainNowcast(weather, now) : null),
    [weather, now],
  );

  // Der „ich will nur kurz raus"-Moment: der nächstgelegene Spielplatz,
  // unabhängig davon, wie er gerade bewertet ist. Wer auf dem Schulhof um die
  // Ecke steht, soll ihn hier finden, nicht auf Platz 40 der Liste.
  const nearestPlayground = useMemo(() => {
    let best: { place: OsmPlace; distance: number } | null = null;
    for (const p of places.places) {
      if (p.type !== "playground") continue;
      const d = haversine(coords.lat, coords.lng, p.lat, p.lng);
      if (!best || d < best.distance) best = { place: p, distance: d };
    }
    return best;
  }, [places.places, coords.lat, coords.lng]);

  const nearestToilets = useMemo(
    () =>
      places.toilets
        .map((toilet) => ({
          toilet,
          distance: haversine(coords.lat, coords.lng, toilet.lat, toilet.lng),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8),
    [places.toilets, coords.lat, coords.lng],
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
      wheelchair: inRange.filter((p) => p.tags.wheelchair === true).length,
    }),
    [inRange],
  );

  const filterCount = activeFilterChips(filters).length;
  const locationLabel = manual
    ? manual.label
    : coords.source === "gps"
      ? "Orte in deiner Nähe"
      : coords.source === "last-known"
        ? "Zuletzt bekannter Ort"
        : FALLBACK_LABEL;
  // Die Orte tragen die Seite. Geblockt wird nur, wenn wirklich NICHTS da ist –
  // liegt der Stand vom letzten Besuch vor, zeigt die Seite ihn sofort und
  // aktualisiert still im Hintergrund.
  const loading =
    (places.loading && places.places.length === 0) || weatherBlocksLoading;
  const error = places.places.length === 0 ? places.error : null;
  // Frisch wird noch geladen, aber es gibt schon etwas zu sehen.
  const refreshing = places.loading && places.places.length > 0;

  const reload = () => {
    places.reload();
    wetter.reload();
  };

  async function submitReport(type: PlaceStatusType, message: string) {
    if (!reportTarget) return;
    await report(reportTarget.id, type, message);
  }

  const istKarte = !loading && !error && filters.viewMode === "map";

  if (!welcomed) return <Welcome onStart={startApp} />;

  return (
    <div
      className={`mx-auto flex max-w-lg flex-col bg-background ${
        // Im Kartenmodus füllt die Karte den Rest des Bildschirms – dafür
        // braucht die Kette eine feste Höhe, und die Seite selbst scrollt
        // nicht (gescrollt wird in der Karte).
        istKarte ? "h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
      <WeatherHeader
        weather={weather}
        weatherError={weatherMissing}
        at={at}
        origin={coords}
        locationLabel={locationLabel}
        geoStatus={geoStatus}
        manualActive={!!manual}
        besteZeit={besteZeit}
        kompakt={istKarte}
        regenRadar={regenRadar}
        onOpenLocation={() => setLocationOpen(true)}
      />

      <MapControls
        onRefresh={reload}
        refreshing={places.loading || wetter.loading}
      />

      {/* Es gibt schon etwas zu sehen, frisch kommt gleich – leise sagen.
          Offline übernimmt der Offline-Banner allein, sonst widersprechen
          sich zwei Hinweise. */}
      {online && refreshing && (
        <p className="mx-4 mt-2 text-center text-xs text-muted" role="status">
          Wird gerade aktualisiert …
        </p>
      )}
      {online && !refreshing && places.error && places.places.length > 0 && (
        <Hinweis className="mx-4 mt-2">
          Gerade keine frischen Daten. Du siehst den Stand von deinem letzten
          Besuch.
        </Hinweis>
      )}

      {/* In der Kartenansicht bleibt der Knopf oben – dort ist die Karte
          selbst die Antwort. In der Liste stand er zwischen Wetter und
          erstem Platz und schob genau das nach unten, weswegen man die App
          öffnet; dort steht er jetzt am Ende. */}
      {!loading && !error && filters.viewMode === "map" && (
        <ToiletButton onClick={() => setToiletOpen(true)} className="mx-4 mt-3" />
      )}

      {!online && (
        <Hinweis Icon={WifiOff} className="mx-4 mt-3">
          <span className="font-semibold">Du bist offline.</span> Wir zeigen die
          zuletzt geladenen Orte. Schatten und Sonnenstand stimmen weiterhin,
          neue Meldungen anderer Eltern fehlen.
        </Hinweis>
      )}

      <main className="relative flex flex-1 flex-col">
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

        {loading && <PlacesLoading hero />}

        {!loading && !error && filters.viewMode === "map" && (
          <div className="relative min-h-[26rem] w-full flex-1 overflow-hidden">
            <Map
              places={visible}
              origin={coords}
              radius={radius}
              style={filters.mapStyle}
            />
            {visible.length > 0 && <MapLegende />}
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
              className="absolute top-3 right-3 z-[905] flex min-h-11 items-center gap-1.5 rounded-full bg-card/95 px-3.5 text-sm font-semibold text-dark shadow-card backdrop-blur transition active:scale-95"
            >
              <Layers size={16} aria-hidden />
              {filters.mapStyle === "map" ? "Satellit" : "Karte"}
            </button>

            {/* Auch die Karte braucht eine Antwort, wenn nichts übrig bleibt,
                sonst steht der Nutzer vor einer leeren Karte mit nur dem
                eigenen Punkt. */}
            {visible.length === 0 && (
              <div className="pointer-events-none absolute inset-x-4 top-16 z-[905]">
                <div className="pointer-events-auto mx-auto max-w-sm rounded-card bg-card/95 shadow-float backdrop-blur">
                  <EmptyState
                    className="px-5 py-6"
                    Icon={filteredOut > 0 ? SlidersHorizontal : MapPinOff}
                    titel={
                      filteredOut > 0
                        ? "Nichts passt zu deinen Filtern"
                        : "Hier ist nichts erfasst"
                    }
                    text={
                      filteredOut > 0
                        ? "Lockere einen Filter, dann tauchen Plätze wieder auf."
                        : "In diesem Umkreis kennt OpenStreetMap nichts. Mit größerer Entfernung findet sich meist etwas."
                    }
                  >
                    {filteredOut > 0 ? (
                      <Button onClick={filters.reset}>Filter zurücksetzen</Button>
                    ) : (
                      <Button onClick={() => setFilterOpen(true)}>
                        Entfernung ändern
                      </Button>
                    )}
                  </EmptyState>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && filters.viewMode === "list" && (
          <div className="animate-fade-in space-y-4 p-4 pb-32">
            <FilterChips />

            {visible.length > 0 ? (
              <>
                {/* Gemerkt, aber gerade nicht sichtbar (Entfernung/Filter):
                    lieber ehrlich sagen als die Sektion wortlos verschwinden
                    lassen – sonst wirkt das Merken kaputt. */}
                {favorites.ids.length > 0 && meinePlaetze.length === 0 && (
                  <p className="px-1 text-xs leading-relaxed text-muted">
                    Deine gemerkten Plätze liegen außerhalb der eingestellten
                    Entfernung oder passen nicht zu den Filtern.
                  </p>
                )}

                {/* Die Stammplätze der Familie zuerst, mit aktuellem Wert. */}
                {meinePlaetze.length > 0 && (
                  <section aria-label="Meine gemerkten Plätze" className="space-y-3">
                    <h2 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                      <Star size={14} aria-hidden className="fill-accent text-accent" />
                      Meine Plätze
                    </h2>
                    {meinePlaetze.map((place) => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        origin={coords}
                        radius={radius}
                        rank={1}
                        now={now.getTime()}
                        favorite
                        areaTreeHint={vieleUnsicher}
                      />
                    ))}
                  </section>
                )}

                {/* Die Antwort steht ganz oben. Alles Erklärende –
                    Alternative, Anzahl, Sortier-Erklärung – kommt erst
                    danach: Wer die App öffnet, will den Platz sehen, nicht
                    die Begründung. */}
                {uebrige.slice(0, sichtbar).map((place, index) => (
                  <Fragment key={place.id}>
                    <PlaceCard
                      place={place}
                      origin={coords}
                      radius={radius}
                      // „Beste Wahl gerade" nur, wenn der Ort wirklich der
                      // Spitzenreiter der GESAMT-Sortierung ist. Ist der ein
                      // gemerkter Platz, führt er oben die „Meine Plätze"-Sektion
                      // an – dann trägt hier niemand fälschlich das Banner.
                      rank={place.id === visible[0]?.id ? 0 : index + 1}
                      now={now.getTime()}
                      areaTreeHint={vieleUnsicher}
                    />
                    {index === 0 && (
                      <>
                    {/* Direkt zum nächsten Spielplatz – egal wie er bewertet ist.
                        Entfällt, wenn er sowieso als beste Wahl ganz oben steht. */}
                    {nearestPlayground &&
                      visible[0]?.id !== nearestPlayground.place.id &&
                      !favorites.ids.includes(nearestPlayground.place.id) && (
                      <Link
                        href={placeHref(
                          nearestPlayground.place.id,
                          `lat=${coords.lat.toFixed(5)}&lng=${coords.lng.toFixed(5)}` +
                            `&plat=${nearestPlayground.place.lat.toFixed(5)}` +
                            `&plng=${nearestPlayground.place.lng.toFixed(5)}&r=${radius}`,
                        )}
                        className="flex items-center gap-3 rounded-card border border-line bg-card px-4 py-3 shadow-card transition active:scale-[0.99]"
                      >
                        <ToyBrick size={20} aria-hidden className="shrink-0 text-primary-dark" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                            Nächster Spielplatz
                          </span>
                          <span className="flex items-baseline gap-1.5 text-sm font-medium text-dark">
                            <span className="truncate">{nearestPlayground.place.name}</span>
                            <span className="shrink-0 text-muted">
                              · {formatDistance(nearestPlayground.distance)}
                            </span>
                          </span>
                        </span>
                        <ChevronRight size={16} aria-hidden className="shrink-0 text-muted" />
                      </Link>
                    )}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <p className="text-sm text-muted">
                            {uebrige.length - 1 === 1
                              ? "Ein weiterer Platz"
                              : `${uebrige.length - 1} weitere Plätze`}{" "}
                            in der Nähe, geordnet nach „Angenehm jetzt“.
                          </p>
                          <InfoButton
                            title="Wie wird sortiert?"
                            ariaLabel="Erklärung zur Sortierung"
                          >
                            <p>{SCORE_ERKLAERUNG}</p>
                            <p>
                              Der Wert steht als Ring auf jeder Karte. Je voller
                              der Ring, desto besser passt der Ort zu diesem
                              Moment.
                            </p>
                          </InfoButton>
                        </div>

                        {/* Einmal für die ganze Liste statt auf jeder Zeile. */}
                        {(vieleUnsicher || places.treeDataQuality === "low") && (
                          <Hinweis>
                            Bei den meisten Plätzen hier sind kaum Bäume in
                            OpenStreetMap erfasst. Vor Ort kann es also
                            schattiger sein, als wir zeigen – umgekehrt kaum.
                          </Hinweis>
                        )}
                      </>
                    )}
                  </Fragment>
                ))}

                {/* Eine endlose Liste erschlägt. Die ersten zehn beantworten
                    die Frage fast immer; der Rest kommt auf Wunsch. */}
                {uebrige.length > sichtbar && (
                  <button
                    type="button"
                    onClick={() => setSichtbar((n) => n + LISTE_SCHRITT)}
                    className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-card border border-line bg-card text-sm font-semibold text-primary-dark shadow-card transition active:scale-[0.99]"
                  >
                    Weitere {Math.min(LISTE_SCHRITT, uebrige.length - sichtbar)} Plätze
                    anzeigen
                    <ChevronDown size={16} aria-hidden />
                  </button>
                )}
              </>
            ) : (
              <div className="rounded-card bg-card shadow-card">
                <EmptyState
                  Icon={filteredOut > 0 ? SlidersHorizontal : MapPinOff}
                  titel={
                    filteredOut > 0
                      ? "Nichts passt zu deinen Filtern"
                      : "Hier ist nichts erfasst"
                  }
                  text={
                    filteredOut > 0
                      ? filteredOut === 1
                        ? "In der Nähe liegt 1 Ort, den deine Filter gerade aussortieren. Ein Kriterium weniger bringt ihn zurück."
                        : `In der Nähe liegen ${filteredOut} Orte, die deine Filter gerade aussortieren. Ein Kriterium weniger bringt sie zurück.`
                      : "In diesem Umkreis kennt OpenStreetMap keinen Spielplatz und keine Grünfläche. Mit größerer Entfernung findet sich meist etwas."
                  }
                >
                {/* Ohne aussortierte Orte hilft Zurücksetzen nicht, dann muss
                    der Umkreis größer werden. */}
                {filteredOut > 0 ? (
                  <Button onClick={filters.reset}>
                    Filter zurücksetzen
                  </Button>
                ) : (
                  <Button onClick={() => setFilterOpen(true)}>
                    Entfernung ändern
                  </Button>
                )}
                </EmptyState>
              </div>
            )}

            {!loading && !error && (
              <ToiletButton onClick={() => setToiletOpen(true)} className="w-full" />
            )}

            {visible.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-1 pt-2">
                <p className="text-xs leading-relaxed text-muted">
                  Orte und Ausstattung von OpenStreetMap, Wetter von Open-Meteo.
                </p>
                <InfoButton title="Woher kommen die Daten?">
                  <p>
                    Orte, Toiletten und Ausstattung stammen aus OpenStreetMap,
                    einer freien Karte, die Freiwillige pflegen. Sie ist gut,
                    aber lückenhaft: Zäune etwa sind kaum eingetragen.
                  </p>
                  <p>
                    Der Schatten ist <strong>gerechnet, nicht gemessen</strong>:
                    aus dem Sonnenstand, den erfassten Bäumen, den Gebäuden
                    ringsum und dem Gelände am Horizont. Er ist eine gute Schätzung, keine Garantie.
                  </p>
                  <p>
                    Wetter kommt von Open-Meteo. Meldungen stammen von anderen
                    Eltern und gelten drei Stunden.
                  </p>
                </InfoButton>
              </div>
            )}

            <footer className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-3 pb-1 text-xs text-muted">
              <Link href="/so-funktionierts" className="underline underline-offset-2">
                So funktioniert&apos;s
              </Link>
              <Link href="/impressum" className="underline underline-offset-2">
                Impressum
              </Link>
              <Link href="/datenschutz" className="underline underline-offset-2">
                Datenschutz
              </Link>
            </footer>
          </div>
        )}
      </main>

      <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[901] mx-auto flex max-w-lg justify-between gap-3 px-4">
        <button
          type="button"
          onClick={() => setReportPickerOpen(true)}
          className="pointer-events-auto flex min-h-13 items-center gap-2 rounded-full bg-card px-5 font-semibold text-dark shadow-float transition duration-200 active:scale-95"
        >
          <Megaphone size={20} aria-hidden />
          Melden
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="pointer-events-auto flex min-h-13 items-center gap-2 rounded-full bg-primary-dark px-5 font-semibold text-white shadow-float transition duration-200 active:scale-95"
        >
          <SlidersHorizontal size={20} aria-hidden />
          Filter
          {filterCount > 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-primary-dark">
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

      <ToiletSheet
        open={toiletOpen}
        onClose={() => setToiletOpen(false)}
        toilets={nearestToilets}
      />

      <Sheet
        open={reportPickerOpen}
        title="An welchem Platz bist du?"
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
            <li className="text-sm text-muted">Keine Plätze in der Nähe geladen.</li>
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
