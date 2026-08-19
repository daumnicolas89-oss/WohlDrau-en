"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CloudOff,
  MapPin,
  RefreshCw,
  Shirt,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { daylightHint } from "@/lib/outdoorTips";
import { weatherRegime } from "@/lib/regime";
import { heatWarning } from "@/lib/heat";
import { winterWarning } from "@/lib/winter";

/** Icon + Farbe je Warn-Ton, für den einen Sicherheits-Banner im Kopf. */
const ALERT_ICON: Record<string, { Icon: LucideIcon; className: string }> = {
  ice: { Icon: AlertTriangle, className: "text-accent-ink" },
  heat: { Icon: AlertTriangle, className: "text-accent-ink" },
  uv: { Icon: Sun, className: "text-accent-ink" },
  snow: { Icon: Snowflake, className: "text-primary-dark" },
  frost: { Icon: Snowflake, className: "text-primary-dark" },
};
import { isDaylight, sunTimes } from "@/lib/sun";
import { uvWording, weatherAdvice } from "@/lib/wording";
import { weatherAt } from "@/lib/weather";
import type { Weather } from "@/types";
import type { GeoStatus } from "@/hooks/useGeolocation";
import { TONE_TEXT } from "@/components/ui/ScoreRing";
import { OutfitSheet } from "./OutfitSheet";
import { SkyScene, skyMood, SKY_GRADIENT } from "./SkyScene";
import { Hinweis } from "./ui/Hinweis";

export function WeatherHeader({
  weather,
  weatherError = false,
  at,
  origin,
  locationLabel,
  geoStatus,
  manualActive = false,
  besteZeit = null,
  regenRadar = null,
  kompakt = false,
  onOpenLocation,
  onRefresh,
  refreshing = false,
}: {
  weather: Weather | null;
  /** Wetter gerade nicht erreichbar, die Orte werden ohne aktuelle Werte geordnet. */
  weatherError?: boolean;
  at: Date;
  /** Anzeige-Ort, für den Tageslicht-Hinweis (Sonnenuntergang). */
  origin?: { lat: number; lng: number };
  locationLabel: string;
  geoStatus: GeoStatus;
  /** Ein Ort wurde manuell gewählt, dann sind die GPS-Hinweise unpassend. */
  manualActive?: boolean;
  /** „Heute am angenehmsten: 16–18 Uhr" – berechnet die Startseite. */
  besteZeit?: string | null;
  /** „Regen zieht auf …" aus dem 15-Minuten-Radar, berechnet die Startseite. */
  regenRadar?: string | null;
  /**
   * Kartenansicht: nur Logo, Ort und eine Zeile Wetter. Eine Karte, die erst
   * nach einer halben Bildschirmhöhe anfängt, ist keine Karte.
   */
  kompakt?: boolean;
  onOpenLocation: () => void;
  /** Neu laden gehört semantisch zum Ort („wo bin ich, was gibt es hier") –
   *  darum als stilles Icon in der Ortszeile statt als dritter lauter
   *  Rundknopf neben dem Zeit-Umschalter. */
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const [outfitOpen, setOutfitOpen] = useState(false);
  /**
   * Stammnutzer-Modus: Wer die App zum zwanzigsten Mal öffnet, kennt die
   * Wetterlage nach einem Blick auf Temperatur und Rat-Satz – die Details
   * (gefühlt, Chips) klappen auf Wunsch weg und bleiben einen Tipp entfernt.
   * Die Wahl merkt sich das Gerät. Sicherheits-Banner und Regen-Radar
   * bleiben IMMER sichtbar – Warnungen klappen nie weg.
   */
  const [wetterZu, setWetterZu] = useState(() => {
    try {
      return localStorage.getItem("platzda:wetterZu") === "1";
    } catch {
      return false;
    }
  });
  const wetterKlappen = () => {
    setWetterZu((offen) => {
      const neu = !offen;
      try {
        localStorage.setItem("platzda:wetterZu", neu ? "1" : "0");
      } catch {
        // Privater Modus: Zustand gilt dann nur für diese Sitzung.
      }
      return neu;
    });
  };
  const values = weather ? weatherAt(weather, at) : null;
  const uv = values ? uvWording(values.uvIndex) : null;
  // `weather.isDay` gilt nur für JETZT. Bei „+30 Min/+1 Std" um den
  // Sonnenuntergang würde der Kopf sonst den Karten widersprechen, die für
  // die gewählte Zeit längst „keine Sonne" rechnen – darum Tag/Nacht aus dem
  // Sonnenstand zur gewählten Zeit ableiten.
  const dayAt = weather
    ? origin
      ? isDaylight(origin.lat, origin.lng, at)
      : weather.isDay
    : false;
  /** Der eine Rat-Satz – gebraucht in Kartenzeile, Kompakt- und Vollansicht. */
  const rat = values
    ? weatherAdvice(
        values.apparentTemperature,
        values.uvIndex,
        values.precipitationProbability,
        dayAt,
      )
    : null;
  const mood =
    weather && values
      ? skyMood(
          { ...weather, isDay: dayAt },
          values.cloudCover,
          values.precipitationProbability,
          values.uvIndex,
        )
      : null;
  const regime =
    weather && values
      ? weatherRegime(values.apparentTemperature, values.uvIndex, dayAt)
      : null;
  const outfitParams =
    weather && values
      ? {
          apparentTemperature: values.apparentTemperature,
          uvIndex: values.uvIndex,
          precipitationProbability: values.precipitationProbability,
          windSpeed: values.windSpeed,
        }
      : null;
  const sunset = origin && dayAt ? sunTimes(origin.lat, origin.lng, at).sunset : null;
  const tageslicht = sunset ? daylightHint(at, sunset) : null;
  // Sicherheits-Banner aus den aktuellen Werten (nicht der Zeit-Vorschau):
  // im Winter Glätte/Schnee/Kälte, im Sommer Hitze/UV. Winter hat Vorrang –
  // beides zugleich gibt es ohnehin nicht.
  const winter = weather
    ? winterWarning({
        temperature: weather.temperature,
        apparentTemperature: weather.apparentTemperature,
        weatherCode: weather.weatherCode,
        snowfall: weather.snowfall,
        precipitation: weather.precipitation,
      })
    : null;
  const heat = weather
    ? heatWarning({
        apparentTemperature: weather.apparentTemperature,
        uvIndex: weather.uvIndex,
        isDay: weather.isDay,
      })
    : null;
  const alert = winter ?? heat;
  const alertMeta = alert ? ALERT_ICON[alert.tone] : null;

  // „Heute draußen am angenehmsten: 17–19 Uhr." reiht sich als vierter Chip
  // in die Werte-Leiste ein, statt als frei schwebende Textzeile eine eigene
  // Kopf-Etage zu belegen – auch Regen und Wind sind Planungsinfo. Der volle
  // Satz bleibt als Fallback, falls das Format mal nicht passt.
  const besteZeitChip = besteZeit
    ? besteZeit.startsWith("Jetzt")
      ? "jetzt"
      : (besteZeit.match(/(\d{1,2}–\d{1,2})\s*Uhr/)?.[1] ?? null)
    : null;

  return (
    <header
      className={`sky-hero relative overflow-hidden px-4 pt-[max(1.15rem,calc(env(safe-area-inset-top)+0.75rem))] ${kompakt ? "pb-3" : "pb-4"}`}
      style={mood ? { background: SKY_GRADIENT[mood] } : undefined}
    >
      {mood && <SkyScene mood={mood} />}

      {/* Der Ort IST der Titel (natives Muster: Kontext statt Marke – das
          Logo lebt im App-Icon, im Ladebildschirm und auf der Landing).
          Vorher stapelten sich hier Logo-Zeile, Ortszeile und Temperatur-
          Zeile mit je eigener Logik – Nicolas: „zu durcheinander". */}
      <div className="relative flex items-center gap-1 pr-12 min-[360px]:pr-14">
        <button
          type="button"
          onClick={onOpenLocation}
          aria-label="Standort ändern oder einen Ort suchen"
          className="flex min-w-0 items-center gap-1.5 text-left transition active:opacity-70"
        >
          <MapPin
            size={17}
            aria-hidden
            className={`shrink-0 text-primary-dark ${geoStatus === "locating" ? "animate-pulse" : ""}`}
          />
          {/* Auf 320-px-Geräten (SE, Zoom-Modus) eine Stufe kleiner, sonst
              wird „Orte in deiner Nähe" abgeschnitten. */}
          <span className="truncate font-display text-base leading-tight font-bold text-dark min-[360px]:text-[21px]">
            {locationLabel}
          </span>
          <ChevronDown
            size={18}
            aria-hidden
            className="mt-0.5 shrink-0 text-sky-muted"
          />
        </button>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Neu laden"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-sky-muted transition active:scale-95 active:bg-white/50 disabled:opacity-60 disabled:active:scale-100 min-[360px]:size-9"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : undefined}
            />
          </button>
        )}
      </div>

      {kompakt && values && (
        <p className="relative mt-2 flex items-baseline gap-2 text-sm text-dark">
          <span className="font-display text-xl font-bold tabular-nums">
            {Math.round(values.temperature)}°
          </span>
          <span className="truncate text-sky-muted">{rat}</span>
        </p>
      )}

      {/* Eingeklappt: eine Zeile Wetter, Anziehen und Aufklappen daneben.
          Warnungen (Sicherheits-Banner, Regen-Radar) bleiben trotzdem da. */}
      {!kompakt && values && weather && uv && wetterZu && (
        <div className="relative mt-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl leading-none font-bold tabular-nums text-dark">
              {Math.round(values.temperature)}°
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-sky-muted">
              {rat}
            </span>
            <button
              type="button"
              onClick={() => setOutfitOpen(true)}
              aria-label="Was anziehen?"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/60 text-primary-dark backdrop-blur transition hover:bg-white/80 active:scale-95"
            >
              <Shirt size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={wetterKlappen}
              aria-expanded={false}
              aria-label="Wetter-Details anzeigen"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-sky-muted transition active:scale-95 active:bg-white/50"
            >
              <ChevronDown size={18} aria-hidden />
            </button>
          </div>
          {alert && alertMeta && (
            <div className="mt-2.5 flex items-start gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 text-sm leading-snug text-dark backdrop-blur">
              <alertMeta.Icon
                size={16}
                aria-hidden
                className={`mt-0.5 shrink-0 ${alertMeta.className}`}
              />
              <span>{alert.text}</span>
            </div>
          )}
          {regenRadar && (
            <p className="mt-2 inline-flex items-start gap-1.5 rounded-2xl border border-white/80 bg-white/85 px-3 py-2 text-[13px] leading-snug font-semibold text-accent-ink backdrop-blur">
              {regenRadar}
            </p>
          )}
        </div>
      )}

      {!kompakt && values && weather && uv && !wetterZu && (
        <div className="relative mt-4">
          {/* Grad, Gefühlt und der Anzieh-Knopf teilen sich eine Zeile. Vorher
              standen sie untereinander – zusammen mit dem Werte-Kasten begann
              der erste Platz erst nach einer halben Bildschirmhöhe. Die App
              stellte damit ihre Begründung vor ihre Antwort. */}
          {/* Nur Zahl, Gefühlt und der Klapp-Pfeil – der Anzieh-Knopf wohnt
              jetzt UNTER dem Werte-Raster. Als weiße Pille neben der
              44-px-Zahl war er der Haupt-Störer des Kopfes: zwei laute
              Elemente auf einer Zeile, und auf schmalen Geräten drückte er
              alles ins Gequetschte. */}
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-end gap-1.5">
              <span className="font-display text-[44px] leading-[0.85] font-bold tracking-tight text-dark tabular-nums">
                {Math.round(values.temperature)}
              </span>
              <span className="font-display text-xl leading-none font-semibold text-dark/70">
                °C
              </span>
              <span className="pb-0.5 pl-1 text-[13px] leading-none whitespace-nowrap text-sky-muted">
                gefühlt {Math.round(values.apparentTemperature)}°
              </span>
            </div>
            <button
              type="button"
              onClick={wetterKlappen}
              aria-expanded={true}
              aria-label="Wetter-Details einklappen"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-sky-muted transition active:scale-95 active:bg-white/50"
            >
              <ChevronUp size={18} aria-hidden />
            </button>
          </div>

          {/* Der eine Satz, der sagt, worauf es jetzt ankommt – allein in
              seiner Zeile, ruhig. */}
          <p className="mt-1.5 text-[15px] leading-snug font-medium text-balance text-sky-muted">
            {rat}
          </p>

          {/* Sicherheits-Banner: Glätte, Schnee, Kälte – oder Hitze/UV im
              Sommer. Ruhig, aber deutlich, und immer sichtbar. */}
          {alert && alertMeta && (
            <div className="mt-2.5 flex items-start gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 text-sm leading-snug text-dark backdrop-blur">
              <alertMeta.Icon
                size={16}
                aria-hidden
                className={`mt-0.5 shrink-0 ${alertMeta.className}`}
              />
              <span>{alert.text}</span>
            </div>
          )}

          {/* Eine Zeile statt eines Kastens – jede Zahl behält ihre
              Bezeichnung, „10 %" allein bliebe ein Rätsel. */}
          {/* Drei Werte: eine Zeile, wie gewohnt. VIER Werte: ein ordentliches
              2-Spalten-Raster statt eines zufälligen Umbruchs – der erste
              Wurf ließ „Beste Zeit" einfach in die zweite Zeile fallen, was
              auf Nicolas' iPhone gequetscht und unordentlich aussah. */}
          <dl
            className={
              besteZeitChip
                ? "mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-2xl border border-white/70 bg-white/55 px-3.5 py-2.5 text-xs backdrop-blur"
                : "mt-2.5 flex items-center gap-1.5 overflow-hidden rounded-full border border-white/70 bg-white/55 px-2.5 py-2 text-xs backdrop-blur min-[360px]:gap-2 min-[360px]:px-3"
            }
          >
            {/* „Sonne sehr hoch · UV 9,2" sprengte die Zeile und kürzte
                ausgerechnet an Hitzetagen das Wort weg. Kurzform: Zahl wie bei
                Regen und Wind, das einordnende Wort dahinter. */}
            <div className="flex min-w-0 items-baseline gap-1">
              <dt className="shrink-0 text-muted">UV</dt>
              <dd className="flex min-w-0 items-baseline gap-1">
                <span className="shrink-0 font-semibold text-dark">
                  {values.uvIndex.toFixed(1).replace(".", ",")}
                </span>
                {dayAt && (
                  <span className={`truncate font-semibold ${TONE_TEXT[uv.tone]}`}>
                    {uv.label}
                  </span>
                )}
              </dd>
            </div>
            {!besteZeitChip && (
              <span aria-hidden className="h-3.5 w-px shrink-0 bg-dark/12" />
            )}
            <div className="flex shrink-0 items-baseline gap-1">
              <dt className="text-muted">Regen</dt>
              <dd className="font-semibold text-dark">
                {Math.round(values.precipitationProbability)} %
              </dd>
            </div>
            {!besteZeitChip && (
              <span aria-hidden className="h-3.5 w-px shrink-0 bg-dark/12" />
            )}
            <div className="flex shrink-0 items-baseline gap-1">
              <dt className="text-muted">Wind</dt>
              {/* Dass der Wind bei Kälte zusätzlich zählt, stand vorher nur in
                  der Farbe – für Rot-Grün-Blinde und in der Sonne verloren. */}
              <dd
                className={`font-semibold ${regime === "cold" ? "text-accent-ink" : "text-dark"}`}
              >
                {Math.round(values.windSpeed)} km/h
                {regime === "cold" && <span className="font-normal"> (kalt)</span>}
              </dd>
            </div>
            {besteZeitChip && (
              <div className="flex items-baseline gap-1">
                <dt className="shrink-0 text-muted">Beste Zeit</dt>
                <dd className="font-semibold whitespace-nowrap text-dark">
                  {besteZeitChip} Uhr
                </dd>
              </div>
            )}
          </dl>

          {/* Aufziehender Regen ist dringend und bleibt eigenständig. Beste
              Zeit und Sonnenuntergang sind Beiwerk und teilen sich eine Zeile. */}
          {regenRadar && (
            <p className="mt-2 inline-flex items-start gap-1.5 rounded-2xl border border-white/80 bg-white/85 px-3 py-2 text-[13px] leading-snug font-semibold text-accent-ink backdrop-blur">
              {regenRadar}
            </p>
          )}
          {((besteZeit && !besteZeitChip) || tageslicht) && (
            <p className="mt-1.5 text-[13px] leading-snug text-sky-muted">
              {besteZeit && !besteZeitChip && (
                <span className="font-medium text-dark">{besteZeit}</span>
              )}
              {besteZeit && !besteZeitChip && tageslicht && " · "}
              {tageslicht}
            </p>
          )}

          {/* Das eine Feature, das PlatzDa besonders macht – als ruhige,
              volle Zeile am Fuß des Wetterblocks statt als weißer Fleck
              neben der Temperatur. */}
          <button
            type="button"
            onClick={() => setOutfitOpen(true)}
            className="mt-2.5 flex min-h-11 w-full items-center justify-between rounded-2xl border border-white/70 bg-white/60 px-3.5 text-[15px] font-semibold text-dark backdrop-blur transition hover:bg-white/80 active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <Shirt size={16} aria-hidden className="text-primary-dark" />
              Was anziehen?
            </span>
            <ChevronRight size={16} aria-hidden className="text-sky-muted" />
          </button>
        </div>
      )}

      {/* Ein Hinweis-Platz fürs WETTER: die Sicherheits-Warnung (oben im
          Werte-Block) schlägt den Wetter-Fehler – beides zugleich braucht
          niemand. Der STANDORT-Hinweis darunter meint etwas anderes und darf
          nicht wochenlang hinter einer Dauerfrost-Warnung verschwinden. */}
      {!kompakt && !alert && weatherError && (
        <Hinweis ton="info" aufHimmel Icon={CloudOff} className="relative mt-3">
          Das Wetter ist gerade nicht erreichbar. Die Orte sind trotzdem da,
          nach Schatten und Nähe geordnet, nur ohne aktuelle Grad- und
          Regenwerte. Meist ist es gleich wieder da.
        </Hinweis>
      )}

      {!kompakt && !weatherError && geoStatus === "denied" && !manualActive && (
        <Hinweis ton="info" aufHimmel Icon={MapPin} className="relative mt-3">
          Ohne Standortfreigabe zeigen wir deinen zuletzt bekannten Ort oder
          eine Beispielstadt. Tippe oben auf den Ortsnamen, um deinen Standort
          freizugeben oder einen Ort zu suchen.
        </Hinweis>
      )}

      {!kompakt && !weatherError && geoStatus === "unavailable" && !manualActive && (
        <Hinweis ton="info" aufHimmel Icon={MapPin} className="relative mt-3">
          Der Standort lässt sich gerade nicht bestimmen. Im Gebäude oder ohne
          GPS-Empfang passiert das schnell. Angezeigt wird der zuletzt bekannte
          Ort oder eine Beispielstadt; über den Ortsnamen oben kannst du es
          erneut versuchen.
        </Hinweis>
      )}

      {outfitParams && (
        <OutfitSheet
          open={outfitOpen}
          onClose={() => setOutfitOpen(false)}
          params={outfitParams}
        />
      )}
    </header>
  );
}
