import { divIcon } from "leaflet";
import type { ShadeState } from "@/types";

export const MARKER_COLORS: Record<ShadeState, string> = {
  shady: "#2a9d8f",
  partial: "#e9c46a",
  sunny: "#e76f51",
  "no-sun": "#264653",
};

/**
 * Marker als DivIcon statt Bilddatei: färbt sich nach Schattenlage und
 * trägt den Listenplatz, damit Karte und Liste dieselbe Sprache sprechen.
 */
export function placeMarkerIcon(state: ShadeState, rank: number) {
  return divIcon({
    className: "",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:30px;height:30px;border-radius:999px;
      background:${MARKER_COLORS[state]};color:#fff;
      border:2.5px solid #fff;box-shadow:0 2px 8px rgba(38,70,83,.35);
      font:600 12px/1 var(--font-inter,sans-serif);
    ">${rank}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** Der eigene Standort – bewusst anders als die Orte. */
export const ORIGIN_MARKER_STYLE = {
  color: "#ffffff",
  weight: 3,
  fillColor: "#264653",
  fillOpacity: 1,
} as const;
