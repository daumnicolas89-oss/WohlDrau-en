"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadLastVisit, saveLastVisit } from "@/lib/lastVisit";
import { apiUrl } from "@/lib/appMode";
import { haversine } from "@/lib/utils";
import { FALLBACK_WEATHER } from "@/lib/weather";
import type { Weather } from "@/types";
import type { Coords } from "./useGeolocation";

/** Letzter Stand fürs Sofort-Anzeigen; Wetter altert schnell, darum kurz. */
const LAST_WEATHER_KEY = "platzda:lastWeather";
const LAST_WEATHER_MAX_AGE_MS = 6 * 3_600_000;
const LAST_WEATHER_NEAR_M = 25_000;

interface CachedWeather {
  weather: Weather;
  anchor: { lat: number; lng: number };
}

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
    // Liegt schon ein (letzter) Wetterstand vor, blockiert das Laden nichts
    // mehr – die Seite zeigt ihn und tauscht still gegen den frischen.
    weatherBlocksLoading: wetter.loading && !wetter.error && !wetter.weather,
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

  // Sofort-Start: das Wetter vom letzten Besuch (max. 6 Std alt) zeigen,
  // während das frische lädt. `weatherAt` greift ohnehin die passende Stunde
  // aus der Vorhersage, ein paar Stunden Alter verkraftet das.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const cached = loadLastVisit<CachedWeather>(LAST_WEATHER_KEY, LAST_WEATHER_MAX_AGE_MS);
    if (
      cached &&
      haversine(cached.anchor.lat, cached.anchor.lng, lat, lng) <= LAST_WEATHER_NEAR_M
    ) {
      // Bewusst im Mount-Effekt (siehe usePlaces): nach dem ersten Render,
      // ein einzelner gebündelter Zusatz-Render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWeather(cached.weather);
    }
  }, [lat, lng]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      letzterAbruf.current = Date.now();
      try {
        const res = await fetch(apiUrl(`/api/weather?lat=${lat}&lng=${lng}`), {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Wetter nicht verfügbar");
        }
        const fresh = (await res.json()) as Weather;
        setWeather(fresh);
        saveLastVisit<CachedWeather>(LAST_WEATHER_KEY, {
          weather: fresh,
          anchor: { lat, lng },
        });
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

  // Wetter altert: alle 10 Minuten (die Cache-Dauer des Servers) still
  // nachladen, solange die App sichtbar ist. Wer sie eine Stunde offen hat,
  // schaut nie auf verstaubte Grade.
  /** Wann zuletzt frisch geladen wurde – fürs Nachführen beim Aufwachen.
   *  0 = „noch nie": Der erste sichtbare Moment lädt ohnehin frisch. */
  const letzterAbruf = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        letzterAbruf.current = Date.now();
        setNonce((n) => n + 1);
      }
    }, 10 * 60_000);
    // iOS friert Intervalle im Hintergrund ein: Wer die App nach Stunden
    // wieder öffnet, sähe sonst bis zum nächsten Takt das Wetter von vorhin.
    const aufwachen = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - letzterAbruf.current < 10 * 60_000) return;
      letzterAbruf.current = Date.now();
      setNonce((n) => n + 1);
    };
    document.addEventListener("visibilitychange", aufwachen);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aufwachen);
    };
  }, []);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { weather, loading, error, reload };
}
