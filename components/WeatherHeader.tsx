"use client";

import { Crosshair } from "lucide-react";
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
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium text-dark">{children}</dd>
    </div>
  );
}

export function WeatherHeader({
  weather,
  at,
  locationLabel,
  geoStatus,
  onLocate,
}: {
  weather: Weather | null;
  at: Date;
  locationLabel: string;
  geoStatus: GeoStatus;
  onLocate: () => void;
}) {
  const values = weather ? weatherAt(weather, at) : null;
  const uv = values ? uvWording(values.uvIndex) : null;

  return (
    <header className="bg-card px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-primary-dark uppercase">
            WohlDraußen
          </p>
          <h1 className="mt-1 truncate font-display text-[22px] leading-tight font-bold text-dark">
            {locationLabel}
          </h1>
        </div>
        <button
          type="button"
          onClick={onLocate}
          aria-label="Standort neu bestimmen"
          className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-line ${
            geoStatus === "locating" ? "animate-pulse text-primary-dark" : "text-muted"
          }`}
        >
          <Crosshair size={20} />
        </button>
      </div>

      {values && weather && uv && (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none font-bold text-dark">
              {Math.round(values.temperature)} °C
            </span>
            <span className="text-sm text-muted">
              fühlt sich an wie {Math.round(values.apparentTemperature)} °C
            </span>
          </div>

          {/* Jede Zahl bekommt ihre Bezeichnung – „0 %“ allein ist ein Rätsel. */}
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <Wert label="Sonnenstärke">
              <span className={TONE_TEXT[uv.tone]}>{uv.label}</span>{" "}
              <span className="font-normal text-muted">
                (UV {values.uvIndex.toFixed(1)})
              </span>
            </Wert>
            <Wert label="Regenrisiko">
              {Math.round(values.precipitationProbability)} %
            </Wert>
            <Wert label="Wind">{Math.round(weather.windSpeed)} km/h</Wert>
          </dl>

          <p className="mt-3 text-[15px] font-semibold text-dark">
            {advice(
              values.apparentTemperature,
              values.uvIndex,
              values.precipitationProbability,
            )}
          </p>
        </div>
      )}

      {geoStatus === "denied" && (
        <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
          Ohne Standortfreigabe zeigen wir eine Beispielstadt. Freigabe im
          Browser erlauben und erneut auf das Fadenkreuz tippen.
        </p>
      )}

      {geoStatus === "unavailable" && (
        <p className="mt-3 rounded-2xl bg-accent-soft p-3 text-xs leading-relaxed text-accent-ink">
          Der Standort lässt sich gerade nicht bestimmen – im Gebäude oder ohne
          GPS-Empfang passiert das schnell. Angezeigt wird der zuletzt bekannte
          Ort; das Fadenkreuz versucht es erneut.
        </p>
      )}
    </header>
  );
}
