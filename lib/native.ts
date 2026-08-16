"use client";

import { IS_APP_SHELL } from "./appMode";

/**
 * Kleine Brücke zu den iOS-Funktionen, die es im Browser nicht gibt.
 *
 * Alles hier ist absichtlich „fire and forget": Im Web passiert schlicht
 * nichts, in der App gibt es ein kurzes Tack. Die Plugins werden erst bei
 * Bedarf geladen, damit die Web-Auslieferung nicht unnötig wächst.
 */

/** Kurzes Tack – für Umschalter, Merken, Auswahl. */
export function tick(): void {
  if (!IS_APP_SHELL) return;
  void import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
    .catch(() => undefined);
}

/** Bestätigung – wenn etwas wirklich abgeschickt wurde. */
export function erfolg(): void {
  if (!IS_APP_SHELL) return;
  void import("@capacitor/haptics")
    .then(({ Haptics, NotificationType }) =>
      Haptics.notification({ type: NotificationType.Success }),
    )
    .catch(() => undefined);
}

/**
 * Öffnet die Route in der Karten-App des Geräts. In der iOS-App direkt in
 * Apple Karten (ein Tipp), im Browser wie bisher über Google Maps.
 */
export function routeUrl(lat: number, lng: number): string {
  return IS_APP_SHELL
    ? `maps://?daddr=${lat},${lng}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
