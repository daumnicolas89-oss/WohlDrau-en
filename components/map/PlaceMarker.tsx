import { divIcon } from "leaflet";

/**
 * Marker als DivIcon statt Bilddatei: die Farbe folgt der Bewertung (wie der
 * Ring in der Liste), die Zahl ist der Listenplatz. So sprechen Karte und Liste
 * dieselbe Sprache: der Favorit ist auch auf der Karte grün.
 */
export function placeMarkerIcon(color: string, rank: number) {
  return divIcon({
    className: "",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:30px;height:30px;border-radius:999px;
      background:${color};color:#fff;
      border:2.5px solid #fff;box-shadow:0 2px 8px rgba(38,70,83,.35);
      font:600 12px/1 var(--font-inter,sans-serif);
    ">${rank}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** Der eigene Standort, bewusst anders als die Orte. */
export const ORIGIN_MARKER_STYLE = {
  color: "#ffffff",
  weight: 3,
  fillColor: "#264653",
  fillOpacity: 1,
} as const;
