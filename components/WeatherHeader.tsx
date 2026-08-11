"use client";

import { Crosshair, MapPin } from "lucide-react";
import { desiredShade } from "@/lib/scoring";
import { uvWording } from "@/lib/wording";
import { weatherAt } from "@/lib/weather";
import type { Weather } from "@/types";
import type { GeoStatus } from "@/hooks/useGeolocation";
import { TONE_TEXT } from "@/components/ui/ScoreRing";

/** Ein Satz, der sagt, worauf es bei diesem Wetter ankommt. */
function advice(apparent: number, uv: number, rainProbability: number): string {
  if (rainProbability >= 60) return "Regen ist wahrscheinlich – kurz raus lohnt trotzdem.";
  const want = desiredShade(apparent, uv);
  if (want > 0.7) return "Jetzt zählt vor allem Schatten.";
  if (want > 0.4) return "Etwas Schatten tut gut.";
  if (apparent < 8) return "Kühl – sonnige Ecken sind angenehmer.";
  return "Angenehm – fast überall gut auszuhalten.";
}

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
  at,
  locationLabel,
  geoStatus,
  manualActive = false,
  onOpenLocation,
}: {
  weather: Weather | null;
  at: Date;
  locationLabel: string;
  geoStatus: GeoStatus;
  /** Ein Ort wurde manuell gewählt – dann sind die GPS-Hinweise unpassend. */
  manualActive?: boolean;
  onOpenLocation: () => void;
}) {
  const values = weather ? weatherAt(weather, at) : null;
  const uv = values ? uvWording(values.uvIndex) : null;

  return (
    <header className="sky-hero px-5 pt-[max(1.15rem,env(safe-area-inset-top))] pb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-primary-dark uppercase">
            WohlDraußen
          </p>
          <h1 className="mt-1.5 flex items-center gap-1.5 truncate text-[15px] font-medium text-muted">
            <MapPin size={14} aria-hidden className="shrink-0 text-primary-dark" />
            <span className="truncate">{locationLabel}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenLocation}
          aria-label="Standort ändern"
          className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/60 backdrop-blur transition active:scale-95 ${
            geoStatus === "locating" ? "animate-pulse text-primary-dark" : "text-dark"
          }`}
        >
          <Crosshair size={20} />
        </button>
      </div>

      {values && weather && uv && (
        <div className="mt-5">
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
            {advice(
              values.apparentTemperature,
              values.uvIndex,
              values.precipitationProbability,
            )}
          </p>

          {/* Jede Zahl bekommt ihre Bezeichnung – „0 %“ allein ist ein Rätsel. */}
          <dl className="mt-5 flex gap-3 rounded-2xl border border-white/70 bg-white/55 px-4 py-3 backdrop-blur">
            <Wert label="Sonne">
              <span className={TONE_TEXT[uv.tone]}>{uv.label}</span>{" "}
              <span className="font-normal text-muted">
                {values.uvIndex.toFixed(1)}
              </span>
            </Wert>
            <span aria-hidden className="w-px self-stretch bg-line" />
            <Wert label="Regen">
              {Math.round(values.precipitationProbability)} %
            </Wert>
            <span aria-hidden className="w-px self-stretch bg-line" />
            <Wert label="Wind">{Math.round(weather.windSpeed)} km/h</Wert>
          </dl>
        </div>
      )}

      {geoStatus === "denied" && !manualActive && (
        <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
          Ohne Standortfreigabe zeigen wir eine Beispielstadt. Tippe oben auf das
          Standort-Symbol, um deinen Standort freizugeben oder einen Ort zu suchen.
        </p>
      )}

      {geoStatus === "unavailable" && !manualActive && (
        <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
          Der Standort lässt sich gerade nicht bestimmen – im Gebäude oder ohne
          GPS-Empfang passiert das schnell. Angezeigt wird der zuletzt bekannte
          Ort; das Fadenkreuz versucht es erneut.
        </p>
      )}
    </header>
  );
}
