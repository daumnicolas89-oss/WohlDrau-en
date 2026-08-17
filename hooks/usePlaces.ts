"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLACES_SCHEMA_VERSION } from "@/lib/schemaVersion";

/** Overpass braucht für eine neue Gegend bis ~60 s. Danach ist etwas kaputt,
 *  und Warten hilft nicht mehr – dann lieber ehrlich sein und neu anbieten. */
const FETCH_TIMEOUT_MS = 75_000;
import { loadLastVisit, saveLastVisit } from "@/lib/lastVisit";
import { apiUrl } from "@/lib/appMode";
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
  /** Schnellstart: Liste ist vorläufig – ohne Schatten und Bewertung. */
  preliminary: boolean;
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
  // Schnellstart aktiv: Die aktuelle Liste ist vorläufig (ohne Schatten).
  const [preliminary, setPreliminary] = useState(false);
  const placesRef = useRef(places);
  useEffect(() => {
    placesRef.current = places;
  }, [places]);
  /** Zu welcher Gegend die aktuelle Liste gehört – der Schnellstart darf
   *  eine Liste derselben Gegend nicht verdrängen, eine fremde schon
   *  (Städtewechsel: alte Orte wären dort ohnehin unbrauchbar). */
  const ankerRef = useRef<{ lat: number; lng: number } | null>(null);
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
      // Bewusst setState direkt im Mount-Effekt: Die Hydrierung MUSS nach dem
      // ersten Render passieren (Server kennt localStorage nicht), und React
      // bündelt die drei Setzer zu genau einem Zusatz-Render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlaces(cached.places);
      setToilets(cached.toilets ?? []);
      setTreeDataQuality(cached.treeDataQuality ?? "medium");
    }
  }, [lat, lng]);

  useEffect(() => {
    const controller = new AbortController();
    // Ohne Zeitlimit wartete die App unbegrenzt: kein Fehler, kein Ausweg,
    // nur Skelette. Auf dem Handy im Funkloch bleibt eine fetch-Anfrage
    // beliebig lange hängen. Nach dieser Zeit brechen wir ab und sagen es.
    const abbruch = setTimeout(() => controller.abort("timeout"), FETCH_TIMEOUT_MS);
    let abgelaufen = false;
    const abgelaufenPruefen = setTimeout(() => {
      abgelaufen = true;
    }, FETCH_TIMEOUT_MS - 50);

    /*
     * Schnellstart: parallel zur vollen Abfrage eine leichte anstoßen (nur
     * Orte + Ausstattung, ohne Wälder/Bäume/Gebäude). In waldreichen Gegenden
     * braucht die volle kalt bis ~60 s – niemand wartet so lange vor einer
     * leeren Seite. Die leichte Antwort zeigt WAS es gibt und WIE WEIT es
     * ist; Schatten und Bewertung liefert die volle nach.
     *
     * Nur wenn noch nichts angezeigt wird: Ein Wiederkehrer hat schon die
     * gespeicherte VOLLE Liste – die darf keine vorläufige verdrängen.
     */
    let vollDa = false;
    const fastController = new AbortController();
    const fastAbbruch = setTimeout(() => fastController.abort(), 20_000);
    async function loadFast() {
      const anker = ankerRef.current;
      const gleicheGegend =
        anker !== null && haversine(anker.lat, anker.lng, lat, lng) < 3000;
      if (placesRef.current.length > 0 && gleicheGegend) return;
      try {
        const res = await fetch(
          apiUrl(
            `/api/places?v=${PLACES_SCHEMA_VERSION}&fast=1&lat=${lat.toFixed(2)}&lng=${lng.toFixed(2)}&radius=${radius}`,
          ),
          { signal: fastController.signal },
        );
        if (!res.ok || vollDa) return;
        const data = (await res.json()) as PlacesResponse;
        if (vollDa) return;
        if (
          placesRef.current.length > 0 &&
          ankerRef.current !== null &&
          haversine(ankerRef.current.lat, ankerRef.current.lng, lat, lng) < 3000
        )
          return;
        setPlaces(data.places);
        setToilets(data.toilets ?? []);
        setPreliminary(true);
        setLoading(false);
        ankerRef.current = { lat, lng };
      } catch {
        // Schnellstart ist ein Bonus – scheitert er, bleibt alles wie bisher.
      }
    }

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
          apiUrl(`/api/places?v=${PLACES_SCHEMA_VERSION}&lat=${gridLat}&lng=${gridLng}&radius=${radius}`),
          { signal: controller.signal },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Orte konnten nicht geladen werden");
        }
        const data = (await res.json()) as PlacesResponse;
        vollDa = true;
        fastController.abort();
        ankerRef.current = { lat, lng };
        setPlaces(data.places);
        setToilets(data.toilets ?? []);
        setPreliminary(false);
        setTreeDataQuality(data.treeDataQuality);
        // Für den Sofort-Start beim nächsten Öffnen aufheben.
        saveLastVisit<CachedPlaces>(LAST_PLACES_KEY, {
          ...data,
          anchor: { lat, lng },
        });
      } catch (err) {
        // Selbst abgebrochen wegen Zeitüberschreitung: Das ist KEIN stiller
        // Abbruch, sondern der Fall, den der Nutzer erklärt bekommen muss.
        if (abgelaufen) {
          setError(
            "Die Orte brauchen gerade zu lange. Das liegt meist an OpenStreetMap " +
              "oder an schwachem Empfang.",
          );
          setLoading(false);
          return;
        }
        if (controller.signal.aborted) return;
        // Browser-Netzwerkfehler heißen „Failed to fetch" – roh angezeigt
        // wirkt das wie ein Absturz. Auf Deutsch, mit Handlungsidee.
        const roh = err instanceof Error ? err.message : "";
        setError(
          /fetch|network|load failed/i.test(roh)
            ? "Keine Verbindung zum Server. Prüf kurz dein Netz und versuch es erneut."
            : roh || "Etwas ist schiefgelaufen",
        );
      } finally {
        clearTimeout(abbruch);
        clearTimeout(abgelaufenPruefen);
        if (!controller.signal.aborted || abgelaufen) setLoading(false);
      }
    }

    load();
    loadFast();
    return () => {
      clearTimeout(abbruch);
      clearTimeout(abgelaufenPruefen);
      clearTimeout(fastAbbruch);
      controller.abort();
      fastController.abort();
    };
  }, [lat, lng, radius, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { places, toilets, treeDataQuality, loading, error, reload, preliminary };
}
