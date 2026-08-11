"use client";

import { Crosshair, Droplets, Sun, Wind } from "lucide-react";
import { desiredShade } from "@/lib/scoring";
import { weatherAt } from "@/lib/weather";
import type { Weather } from "@/types";
import type { GeoStatus } from "@/hooks/useGeolocation";

function advice(apparent: number, uv: number, rainProbability: number): string {
  if (rainProbability >= 60) return "Regen wahrscheinlich – kurz raus lohnt trotzdem.";
  const want = desiredShade(apparent, uv);
  if (want > 0.7) return "Jetzt zählt vor allem Schatten.";
  if (want > 0.4) return "Etwas Schatten tut gut.";
  if (apparent < 8) return "Kühl – sonnige Ecken sind angenehmer.";
  return "Angenehm – fast überall gut auszuhalten.";
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
          aria-label="Standort aktualisieren"
          className={`flex size-11 shrink-0 items-center justify-center rounded-full border border-line ${
            geoStatus === "locating" ? "animate-pulse text-primary" : "text-muted"
          }`}
        >
          <Crosshair size={20} />
        </button>
      </div>

      {values && weather && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="font-display text-xl font-bold text-dark">
              {Math.round(values.temperature)} °C
            </span>
            <span>gefühlt {Math.round(values.apparentTemperature)} °C</span>
            <span className="inline-flex items-center gap-1">
              <Sun size={14} aria-hidden /> UV {values.uvIndex.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets size={14} aria-hidden />
              {Math.round(values.precipitationProbability)} %
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind size={14} aria-hidden />
              {Math.round(weather.windSpeed)} km/h
            </span>
          </div>
          <p className="mt-2 text-[15px] font-medium text-dark">
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
