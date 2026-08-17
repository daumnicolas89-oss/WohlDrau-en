const EARTH_R = 6371000;

export function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function haversine(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

/** Grobe, aber für Stadtdistanzen völlig ausreichende Meter-Umrechnung. */
export function metersPerDegLng(lat: number) {
  return 111320 * Math.cos(toRad(lat));
}

export const METERS_PER_DEG_LAT = 110574;

/** Offset in Metern (Ost/Nord) von a nach b. */
export function offsetMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
) {
  return {
    dx: (bLng - aLng) * metersPerDegLng(aLat),
    dy: (bLat - aLat) * METERS_PER_DEG_LAT,
  };
}

/**
 * Liegt der Punkt innerhalb des Polygons? Ray-Casting, planar gerechnet (für
 * Stadtflächen völlig ausreichend). Beantwortet die Kernfrage „liegt dieser
 * Ort wirklich in dieser Wald-/Baumfläche?" statt nur in ihrer Bounding-Box.
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  ring: { lat: number; lng: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i].lat;
    const xi = ring[i].lng;
    const yj = ring[j].lat;
    const xj = ring[j].lng;
    const crosses =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Bounding-Box um einen Punkt mit Radius in Metern → [süd, west, nord, ost] */
export function bboxAround(
  lat: number,
  lng: number,
  radiusM: number,
): [number, number, number, number] {
  const dLat = radiusM / METERS_PER_DEG_LAT;
  const dLng = radiusM / metersPerDegLng(lat);
  return [lat - dLat, lng - dLng, lat + dLat, lng + dLng];
}

export function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Fußweg-Faustregel MIT KIND: ~3,5 km/h (58 m/min) plus 15 % Umwegfaktor
 * gegenüber Luftlinie. Die alten 4,5 km/h waren zügiges Erwachsenen-Tempo –
 * mit Laufrad, Buggy und Anhalte-Käfer sind die Minuten sonst systematisch
 * geschönt, und die App verspricht „7 Minuten", die real zwölf sind.
 */
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round((meters * 1.15) / 58));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

const ANONYMOUS_ID_KEY = "wohldraussen-anonymous-id";

/**
 * Grober Absender-Fingerprint für Rate-Limiting, bewusst kein Tracking:
 * eine Zufalls-ID im localStorage, die der Nutzer jederzeit löschen kann.
 */
/** Fällt localStorage aus (Privatmodus, volle Quota), hält diese Variable
 *  die Kennung wenigstens für die laufende Sitzung stabil. */
let sitzungsId: string | null = null;

export function anonymousId(): string {
  if (typeof localStorage === "undefined") return "unknown";
  // Einziger Zweck ist der Spam-Schutz – eine Meldung darf niemals daran
  // scheitern, dass sich die Kennung nicht SPEICHERN lässt. Vorher warf
  // setItem im strengen Privatmodus und der Nutzer sah die rohe
  // Browser-Fehlermeldung statt eines Danke.
  try {
    let id = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANONYMOUS_ID_KEY, id);
    }
    return id;
  } catch {
    sitzungsId ??= crypto.randomUUID();
    return sitzungsId;
  }
}

const IN_APP_NAV_KEY = "wohldraussen-in-app-nav";

/**
 * Merkt sich (pro Tab), dass innerhalb der App navigiert wurde. Nur dann darf
 * „Zurück" den Browser-Verlauf zurückspulen, sonst landet man bei einem
 * geteilten Link auf der vorher offenen fremden Seite statt auf der Übersicht.
 * `history.length` reicht dafür nicht, weil auch fremde Seiten mitzählen.
 */
export function markInAppNavigation(): void {
  try {
    sessionStorage.setItem(IN_APP_NAV_KEY, "1");
  } catch {
    // Privater Modus o. Ä.: dann bleibt „Zurück" beim sicheren Link auf "/".
  }
}

export function hasInAppHistory(): boolean {
  try {
    return sessionStorage.getItem(IN_APP_NAV_KEY) === "1";
  } catch {
    return false;
  }
}
