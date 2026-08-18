"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nativerStandort } from "@/lib/native";

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

/**
 * @param enabled Erst fragen, wenn der Nutzer weiß, wofür. Beim allerersten
 *   Öffnen liegt der Willkommens-Bildschirm noch davor; auf dem iPhone ist
 *   die Standortabfrage ein blockierender Systemdialog, der den Erklärtext
 *   verdeckt. Er erscheint deshalb erst nach „Los geht's".
 */
export function useGeolocation(enabled = true) {
  const [coords, setCoords] = useState<Coords>(
    () => readLastKnown() ?? FALLBACK_COORDS,
  );
  const [status, setStatus] = useState<GeoStatus>(() =>
    available() ? "locating" : "unavailable",
  );

  const merken = useCallback((next: Coords) => {
    letzterFix.current = Date.now();
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

  // Ein Pfad fürs Übernehmen (Web wie nativ): merken() stempelt auch den
  // Fix-Zeitpunkt – ohne ihn feuerte das Nachführen im Browser bei JEDEM
  // Tab-Wechsel ungedrosselt, samt erneutem Berechtigungsdialog.
  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      merken({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracyM: position.coords.accuracy ?? null,
        source: "gps",
      });
    },
    [merken],
  );

  const handleError = useCallback((error: GeolocationPositionError) => {
    setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
  }, []);

  /** Wann der letzte echte GPS-Fix gelang – Basis für das stille
   *  Nachführen, wenn die App aus dem Hintergrund zurückkommt. */
  const letzterFix = useRef(0);


  /**
   * In der App über iOS, im Browser über die Web-Schnittstelle. Der native
   * Weg spart den zweiten Dialog, den WebKit sonst zusätzlich zeigt.
   */
  const holen = useCallback(async () => {
    const nativ = await nativerStandort();
    if (nativ) {
      if (nativ.ok) {
        merken({
          lat: nativ.lat,
          lng: nativ.lng,
          accuracyM: nativ.accuracyM,
          source: "gps",
        });
      } else {
        setStatus(nativ.grund);
      }
      return;
    }
    if (!available()) {
      setStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, OPTIONS);
  }, [merken, handleSuccess, handleError]);

  // Die App wird draußen benutzt: Wer sie nach der U-Bahn-Fahrt wieder
  // öffnet, steht woanders. Ohne dieses Nachführen klebte die App am
  // Start-Standort – selbst der Aktualisieren-Knopf lud nur die alten
  // Koordinaten neu (Nicolas' Feldtest-Fund).
  useEffect(() => {
    if (!enabled) return;
    const nachfuehren = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - letzterFix.current < 2 * 60_000) return;
      void holen();
    };
    document.addEventListener("visibilitychange", nachfuehren);
    return () => document.removeEventListener("visibilitychange", nachfuehren);
  }, [enabled, holen]);

  useEffect(() => {
    if (!enabled) return;
    // Standort holen ist genau das, wofür Effekte da sind: ein Seiteneffekt
    // nach außen, dessen Ergebnis später in den Zustand fließt. Die Regel
    // zielt auf setState während des Renderns – das passiert hier nicht,
    // `holen` ist asynchron und antwortet frühestens im nächsten Tick.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void holen();
  }, [enabled, holen]);

  /** Erneuter Versuch, z. B. nachdem die Freigabe erteilt wurde. */
  const locate = useCallback(() => {
    setStatus("locating");
    void holen();
  }, [holen]);

  return { coords, status, locate };
}
