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

export type NativerStandort =
  | { ok: true; lat: number; lng: number; accuracyM: number | null }
  | { ok: false; grund: "denied" | "unavailable" };

/**
 * Standort über iOS statt über den WebView.
 *
 * Die Browser-Schnittstelle löst in der App ZWEI Dialoge aus: erst den von
 * iOS, dann den von WebKit („localhost möchte deinen aktuellen Ort
 * verwenden"). Der zweite nennt die App „localhost" – ausgerechnet in dem
 * Moment, in dem jemand entscheidet, ob er seinen Standort hergibt. Über
 * das native Plugin fragt nur iOS, einmal, mit dem Text aus der Info.plist.
 *
 * Gibt `null` zurück, wenn wir im Web laufen – dort bleibt alles wie bisher.
 */
export async function nativerStandort(
  optionen: {
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
  } = { enableHighAccuracy: true, timeout: 12_000, maximumAge: 120_000 },
): Promise<NativerStandort | null> {
  if (!IS_APP_SHELL) return null;
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    let rechte = await Geolocation.checkPermissions();
    if (rechte.location !== "granted") {
      rechte = await Geolocation.requestPermissions({ permissions: ["location"] });
    }
    if (rechte.location !== "granted") return { ok: false, grund: "denied" };

    const pos = await Geolocation.getCurrentPosition(optionen);
    return {
      ok: true,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracyM: pos.coords.accuracy ?? null,
    };
  } catch {
    // Kein GPS-Empfang, Ortungsdienste aus, Zeitüberschreitung: alles Fälle,
    // in denen die App den zuletzt bekannten Ort weiterbenutzt.
    return { ok: false, grund: "unavailable" };
  }
}

/**
 * Teilt einen Link über das System-Teilen-Blatt: in der App über iOS,
 * im Browser über die Web-Schnittstelle. Wo beides fehlt (Desktop-Firefox
 * u. Ä.), landet der Link ehrlich in der Zwischenablage.
 *
 * „nichts" heißt meist: Der Mensch hat das Teilen-Blatt selbst geschlossen –
 * das ist kein Fehler und verdient keinen Hinweis.
 */
export async function teilen(
  titel: string,
  url: string,
): Promise<"geteilt" | "kopiert" | "nichts"> {
  if (IS_APP_SHELL) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: titel, url });
      return "geteilt";
    } catch {
      return "nichts";
    }
  }
  if (typeof navigator === "undefined") return "nichts";
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: titel, url });
      return "geteilt";
    } catch {
      return "nichts";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "kopiert";
  } catch {
    return "nichts";
  }
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
