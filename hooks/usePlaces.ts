"use client";

import { useCallback, useEffect, useState } from "react";
import { haversine } from "@/lib/utils";
import type { OsmPlace, ShadeConfidence } from "@/types";
import type { Coords } from "./useGeolocation";

interface PlacesResponse {
  places: OsmPlace[];
  treeDataQuality: ShadeConfidence;
}

/**
 * Etwas mehr laden, als der Distanzfilter zeigt – Filter ändern sich schneller
 * als Daten. Der Radius bleibt aber an den Filter gekoppelt: Overpass-Zeit
 * wächst mit der Fläche, und die erste Liste soll schnell da sein.
 */
const RADIUS_MARGIN_M = 600;
const MIN_RADIUS_M = 1500;
/** Erst ab dieser Bewegung lohnt sich eine neue Abfrage. */
const REFETCH_DISTANCE_M = 400;

export interface UsePlacesResult {
  places: OsmPlace[];
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
  const [treeDataQuality, setTreeDataQuality] = useState<ShadeConfidence>("medium");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Nicht bei jedem GPS-Zucken neu laden. Anpassung des abgeleiteten Zustands
  // während des Renderns – React rendert direkt neu, ohne Effekt-Umweg.
  const [anchor, setAnchor] = useState(coords);
  if (haversine(anchor.lat, anchor.lng, coords.lat, coords.lng) > REFETCH_DISTANCE_M) {
    setAnchor(coords);
  }
  const { lat, lng } = anchor;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/places?lat=${lat}&lng=${lng}&radius=${radius}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Orte konnten nicht geladen werden");
        }
        const data = (await res.json()) as PlacesResponse;
        setPlaces(data.places);
        setTreeDataQuality(data.treeDataQuality);
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

  return { places, treeDataQuality, loading, error, reload };
}
