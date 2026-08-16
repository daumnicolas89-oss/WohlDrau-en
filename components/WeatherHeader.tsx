"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  CloudOff,
  MapPin,
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
import { Logo } from "./Logo";
import { OutfitSheet } from "./OutfitSheet";
import { SkyScene, skyMood, SKY_GRADIENT } from "./SkyScene";

function Wert({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-[15px] font-semibold text-dark">{children}</dd>
    </div>
  );
}

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
  onOpenLocation,
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
  onOpenLocation: () => void;
}) {
  const [outfitOpen, setOutfitOpen] = useState(false);
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
          windSpeed: weather.windSpeed,
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

  return (
    <header
      className="sky-hero relative overflow-hidden px-5 pt-[max(1.15rem,env(safe-area-inset-top))] pb-6"
      style={mood ? { background: SKY_GRADIENT[mood] } : undefined}
    >
      {mood && <SkyScene mood={mood} />}

      <div className="relative pr-20">
        <Logo />
        {/* Die Ortszeile ist der Knopf zum Standort-Fenster, der Pfeil zeigt es an. */}
        <button
          type="button"
          onClick={onOpenLocation}
          aria-label="Standort ändern oder einen Ort suchen"
          className="mt-1.5 flex max-w-full items-center gap-1.5 text-[15px] font-medium text-muted transition active:opacity-70"
        >
          <MapPin
            size={14}
            aria-hidden
            className={`shrink-0 text-primary-dark ${geoStatus === "locating" ? "animate-pulse" : ""}`}
          />
          <span className="truncate">{locationLabel}</span>
          <ChevronDown size={15} aria-hidden className="shrink-0 text-muted" />
        </button>
      </div>

      {values && weather && uv && (
        <div className="relative mt-5">
          <div className="flex items-start gap-2">
            <span className="font-display text-[64px] leading-[0.9] font-bold tracking-tight text-dark tabular-nums">
              {Math.round(values.temperature)}
            </span>
            <span className="mt-1 font-display text-2xl font-semibold text-dark/70">
              °C
            </span>
            <span className="mt-auto pb-2 pl-1 text-sm text-muted">
              gefühlt {Math.round(values.apparentTemperature)}°
            </span>
          </div>

          {/* Der emotionale Kern: ein Satz, der sagt, worauf es jetzt ankommt –
              deshalb als Überschrift, nicht als Fußnote. */}
          <p className="mt-4 font-display text-[22px] leading-snug font-semibold text-dark">
            {weatherAdvice(
              values.apparentTemperature,
              values.uvIndex,
              values.precipitationProbability,
              dayAt,
            )}
          </p>

          {/* Sicherheits-Banner: Glätte, Schnee, Kälte – oder Hitze/UV im Sommer.
              Ruhig, aber deutlich. Er belegt den einzigen Hinweis-Platz des
              Kopfes (siehe unten). */}
          {alert && alertMeta && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-white/70 bg-white/70 p-3 text-sm leading-snug text-dark backdrop-blur">
              <alertMeta.Icon
                size={16}
                aria-hidden
                className={`mt-0.5 shrink-0 ${alertMeta.className}`}
              />
              <span>{alert.text}</span>
            </div>
          )}

          {/* Jede Zahl bekommt ihre Bezeichnung, „0 %“ allein ist ein Rätsel.
              Das Tageslicht gehört zu diesen Werten, nicht zum Anzieh-Knopf. */}
          <div className="mt-4 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 backdrop-blur">
            <dl className="flex gap-3">
              <Wert label="Sonne">
                {dayAt ? (
                  <>
                    <span className={TONE_TEXT[uv.tone]}>{uv.label}</span>{" "}
                    <span className="font-normal text-muted">
                      · UV {values.uvIndex.toFixed(1).replace(".", ",")}
                    </span>
                  </>
                ) : (
                  <>
                    keine{" "}
                    <span className="font-normal text-muted">
                      (UV {values.uvIndex.toFixed(1).replace(".", ",")})
                    </span>
                  </>
                )}
              </Wert>
              <span aria-hidden className="w-px self-stretch bg-line" />
              <Wert label="Regen">
                {Math.round(values.precipitationProbability)} %
              </Wert>
              <span aria-hidden className="w-px self-stretch bg-line" />
              <Wert label="Wind">
                <span className={regime === "cold" ? "text-accent-ink" : undefined}>
                  {Math.round(weather.windSpeed)} km/h
                </span>
              </Wert>
            </dl>
            {(tageslicht || besteZeit || regenRadar) && (
              <div className="mt-2 space-y-0.5 border-t border-line/60 pt-2 text-[13px] text-muted">
                {regenRadar && (
                  <p className="font-semibold text-accent-ink">{regenRadar}</p>
                )}
                {besteZeit && <p className="font-medium text-dark">{besteZeit}</p>}
                {tageslicht && <p>{tageslicht}</p>}
              </div>
            )}
          </div>

          {/* Der Absprung zum Anzieh-Fenster kommt zuletzt: erst die Lage,
              dann die Handlung. */}
          <button
            type="button"
            onClick={() => setOutfitOpen(true)}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2.5 text-[15px] font-semibold text-dark shadow-card backdrop-blur transition hover:bg-white/80 active:scale-95"
          >
            <Shirt size={16} aria-hidden className="text-primary-dark" />
            Was anziehen?
          </button>
        </div>
      )}

      {/* Ein Hinweis-Platz fürs WETTER: die Sicherheits-Warnung (oben im
          Werte-Block) schlägt den Wetter-Fehler – beides zugleich braucht
          niemand. Der STANDORT-Hinweis darunter meint etwas anderes und darf
          nicht wochenlang hinter einer Dauerfrost-Warnung verschwinden. */}
      {!alert && weatherError && (
        <p className="relative mt-3 flex items-start gap-2 rounded-2xl border border-accent/50 bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
          <CloudOff size={15} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            Das Wetter ist gerade nicht erreichbar. Die Orte sind trotzdem da,
            nach Schatten und Nähe geordnet, nur ohne aktuelle Grad- und
            Regenwerte. Meist ist es gleich wieder da.
          </span>
        </p>
      )}

      {!weatherError && geoStatus === "denied" && !manualActive && (
        <p className="relative mt-3 flex items-start gap-2 rounded-2xl border border-accent/50 bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
          <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            Ohne Standortfreigabe zeigen wir deinen zuletzt bekannten Ort oder
            eine Beispielstadt. Tippe oben auf den Ortsnamen, um deinen Standort
            freizugeben oder einen Ort zu suchen.
          </span>
        </p>
      )}

      {!weatherError && geoStatus === "unavailable" && !manualActive && (
        <p className="relative mt-3 flex items-start gap-2 rounded-2xl border border-accent/50 bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
          <MapPin size={15} aria-hidden className="mt-0.5 shrink-0" />
          <span>
            Der Standort lässt sich gerade nicht bestimmen. Im Gebäude oder ohne
            GPS-Empfang passiert das schnell. Angezeigt wird der zuletzt bekannte
            Ort; über den Ortsnamen oben kannst du es erneut versuchen.
          </span>
        </p>
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
