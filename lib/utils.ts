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

/** Fußweg-Faustregel: 4,5 km/h, plus 15 % Umwegfaktor gegenüber Luftlinie. */
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round((meters * 1.15) / 75));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

const ANONYMOUS_ID_KEY = "wohldraussen-anonymous-id";

/**
 * Grober Absender-Fingerprint für Rate-Limiting, bewusst kein Tracking:
 * eine Zufalls-ID im localStorage, die der Nutzer jederzeit löschen kann.
 */
export function anonymousId(): string {
  if (typeof localStorage === "undefined") return "unknown";
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}
