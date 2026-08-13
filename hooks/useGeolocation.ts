"use client";

import { useCallback, useEffect, useState } from "react";

export interface Coords {
  lat: number;
  lng: number;
  accuracyM: number | null;
  source: "gps" | "fallback" | "last-known" | "manual";
}

/** Startstadt, solange kein Standort freigegeben ist. */
export const FALLBACK_COORDS: Coords = {
  lat: 48.1372,
  lng: 11.5755,
  accuracyM: null,
  source: "fallback",
};

export const FALLBACK_LABEL = "München (Beispielstadt)";

export type GeoStatus = "locating" | "granted" | "denied" | "unavailable";

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12_000,
  maximumAge: 120_000,
};

const LAST_KNOWN_KEY = "wohldraussen-last-position";

function available() {
  return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
}

/** Der zuletzt bekannte Standort ist ein besserer Start als eine fremde Stadt. */
function readLastKnown(): Coords | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_KNOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat: number; lng: number };
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    return { lat: parsed.lat, lng: parsed.lng, accuracyM: null, source: "last-known" };
  } catch {
    return null;
  }
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords>(
    () => readLastKnown() ?? FALLBACK_COORDS,
  );
  const [status, setStatus] = useState<GeoStatus>(() =>
    available() ? "locating" : "unavailable",
  );

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const next: Coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracyM: position.coords.accuracy ?? null,
      source: "gps",
    };
    setCoords(next);
    setStatus("granted");
    try {
      localStorage.setItem(
        LAST_KNOWN_KEY,
        JSON.stringify({ lat: next.lat, lng: next.lng }),
      );
    } catch {
      // Privater Modus o. Ä., der Standort funktioniert trotzdem.
    }
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
  }, []);

  useEffect(() => {
    if (!available()) return;
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, OPTIONS);
  }, [handleSuccess, handleError]);

  /** Erneuter Versuch, z. B. nachdem die Freigabe im Browser erteilt wurde. */
  const locate = useCallback(() => {
    if (!available()) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, OPTIONS);
  }, [handleSuccess, handleError]);

  return { coords, status, locate };
}
