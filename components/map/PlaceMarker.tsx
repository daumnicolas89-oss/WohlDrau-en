import { divIcon } from "leaflet";

/**
 * Marker als DivIcon statt Bilddatei.
 *
 * Die Zahl war früher der Listenplatz – damit war die Bewertung auf der
 * Karte AUSSCHLIESSLICH die Farbe, und die drei Bewertungsfarben sind fast
 * gleich hell (Kontrast untereinander 1,01–1,07). Für Rot-Grün-Blinde, und
 * für alle anderen bei praller Sonne, waren das sechzig gleich aussehende
 * olive Nadeln. In der Liste steht neben jedem Ring ein Wort, auf der Karte
 * stand nichts.
 *
 * Jetzt zeigt die Zahl den Wert selbst. Die Farbe bestätigt ihn nur noch,
 * sie trägt die Information nicht mehr allein.
 */
export function placeMarkerIcon(color: string, score: number, beste = false) {
  // Die beste Wahl ist größer und trägt einen Ring – dieselbe Auszeichnung
  // wie „Beste Wahl gerade" in der Liste, nur in Kartenform.
  const groesse = beste ? 40 : 32;
  const ring = beste
    ? `outline:3px solid #e9c46a;outline-offset:1px;`
    : "";
  return divIcon({
    className: "",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${groesse}px;height:${groesse}px;border-radius:999px;
      background:${color};color:#fff;${ring}
      border:2.5px solid #fff;box-shadow:0 2px 8px rgba(38,70,83,.35);
      font:700 ${beste ? 15 : 13}px/1 var(--font-inter,sans-serif);
      font-variant-numeric:tabular-nums;
    ">${score}</span>`,
    iconSize: [groesse, groesse],
    iconAnchor: [groesse / 2, groesse / 2],
  });
}

/** Der eigene Standort, bewusst anders als die Orte. */
export const ORIGIN_MARKER_STYLE = {
  color: "#ffffff",
  weight: 3,
  fillColor: "#264653",
  fillOpacity: 1,
} as const;
