"use client";

import { useCallback, useEffect, useState } from "react";
import { FALLBACK_WEATHER } from "@/lib/weather";
import type { Weather } from "@/types";
import type { Coords } from "./useGeolocation";

export interface UseWeatherResult {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Leitet aus dem Wetter-Zustand die drei Dinge ab, die Start- und Detailseite
 * bei einem Ausfall gleich behandeln müssen: das Ersatzwetter fürs Rechnen, ob
 * das echte Wetter gerade fehlt (für den Hinweis), und ob das Laden noch aufs
 * Wetter warten soll. An einer Stelle, damit beide Seiten nie auseinanderlaufen.
 */
export function deriveWeatherState(wetter: UseWeatherResult) {
  return {
    scoringWeather: wetter.weather ?? FALLBACK_WEATHER,
    weatherMissing: !wetter.weather && !wetter.loading,
    weatherBlocksLoading: wetter.loading && !wetter.error,
  };
}

/** Auf ~1 km runden: feiner braucht es das Wetter nicht, spart Anfragen. */
function round(value: number) {
  return Number(value.toFixed(2));
}

export function useWeather(coords: Coords): UseWeatherResult {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const lat = round(coords.lat);
  const lng = round(coords.lng);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Wetter nicht verfügbar");
        }
        setWeather((await res.json()) as Weather);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Wetter nicht verfügbar");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [lat, lng, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { weather, loading, error, reload };
}
