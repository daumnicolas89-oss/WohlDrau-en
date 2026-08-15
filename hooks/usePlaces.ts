"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadLastVisit, saveLastVisit } from "@/lib/lastVisit";
import { haversine } from "@/lib/utils";
import type { OsmPlace, ShadeConfidence, Toilet } from "@/types";
import type { Coords } from "./useGeolocation";

interface PlacesResponse {
  places: OsmPlace[];
  toilets: Toilet[];
  treeDataQuality: ShadeConfidence;
}

/** Letzter Stand fürs Sofort-Anzeigen beim nächsten Öffnen. */
const LAST_PLACES_KEY = "platzda:lastPlaces";
const LAST_PLACES_MAX_AGE_MS = 7 * 24 * 3_600_000;
/** Nur verwenden, wenn der Nutzer noch ungefähr in derselben Gegend ist. */
const LAST_PLACES_NEAR_M = 5_000;

interface CachedPlaces extends PlacesResponse {
  anchor: { lat: number; lng: number };
}

/**
 * Etwas mehr laden, als der Distanzfilter zeigt, Filter ändern sich schneller
 * als Daten. Der Radius bleibt aber an den Filter gekoppelt: Overpass-Zeit
 * wächst mit der Fläche, und die erste Liste soll schnell da sein.
 */
const RADIUS_MARGIN_M = 600;
const MIN_RADIUS_M = 1500;
/** Erst ab dieser Bewegung lohnt sich eine neue Abfrage. */
const REFETCH_DISTANCE_M = 400;

export interface UsePlacesResult {
  places: OsmPlace[];
  toilets: Toilet[];
  treeDataQuality: ShadeConfidence;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Auf 500-m-Stufen gerundet, damit ein Filterwechsel den Server-Cache trifft
 * und derselbe Umkreis nicht in zwölf Varianten abgefragt wird.
 */
export function radiusForDistance(maxDistanceM: number): number {
  return Math.max(
    MIN_RADIUS_M,
    Math.ceil((maxDistanceM + RADIUS_MARGIN_M) / 500) * 500,
  );
}

export function usePlaces(coords: Coords, radius: number): UsePlacesResult {
  const [places, setPlaces] = useState<OsmPlace[]>([]);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [treeDataQuality, setTreeDataQuality] = useState<ShadeConfidence>("medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Nicht bei jedem GPS-Zucken neu laden. Anpassung des abgeleiteten Zustands
  // während des Renderns, React rendert direkt neu, ohne Effekt-Umweg.
  const [anchor, setAnchor] = useState(coords);
  if (haversine(anchor.lat, anchor.lng, coords.lat, coords.lng) > REFETCH_DISTANCE_M) {
    setAnchor(coords);
  }
  const { lat, lng } = anchor;

  // Sofort-Start: den Stand des letzten Besuchs zeigen, während frisch geladen
  // wird. Nur beim Mount und nur, wenn der Nutzer noch in derselben Gegend ist.
  // Läuft VOR dem Lade-Effekt; die frische Antwort überschreibt später einfach.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const cached = loadLastVisit<CachedPlaces>(LAST_PLACES_KEY, LAST_PLACES_MAX_AGE_MS);
    if (
      cached &&
      cached.places.length > 0 &&
      haversine(cached.anchor.lat, cached.anchor.lng, lat, lng) <= LAST_PLACES_NEAR_M
    ) {
      setPlaces(cached.places);
      setToilets(cached.toilets ?? []);
      setTreeDataQuality(cached.treeDataQuality ?? "medium");
    }
  }, [lat, lng]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Aufs ~1-km-Raster runden: So fragen alle in derselben Gegend
        // dieselbe Adresse ab und teilen sich die (am CDN) gecachte Antwort,
        // statt jeder einzeln den langsamen Overpass-Abruf auszulösen. Die
        // Entfernung wird ohnehin aus den echten Koordinaten berechnet.
        const gridLat = lat.toFixed(2);
        const gridLng = lng.toFixed(2);
        // v = Schema-Version der Antwort (siehe PLACES_SCHEMA_VERSION in der
        // Route): neue Version = neue URL = CDN/Service-Worker liefern nie
        // tagelang alte Objektformen an neuen Client-Code.
        const res = await fetch(
          `/api/places?v=3&lat=${gridLat}&lng=${gridLng}&radius=${radius}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Orte konnten nicht geladen werden");
        }
        const data = (await res.json()) as PlacesResponse;
        setPlaces(data.places);
        setToilets(data.toilets ?? []);
        setTreeDataQuality(data.treeDataQuality);
        // Für den Sofort-Start beim nächsten Öffnen aufheben.
        saveLastVisit<CachedPlaces>(LAST_PLACES_KEY, {
          ...data,
          anchor: { lat, lng },
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Etwas ist schiefgelaufen");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [lat, lng, radius, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { places, toilets, treeDataQuality, loading, error, reload };
}
