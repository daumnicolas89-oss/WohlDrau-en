"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nativerStandort, type NativerStandort } from "@/lib/native";
import { haversine } from "@/lib/utils";

export interface Coords {
  lat: number;
  lng: number;
  accuracyM: number | null;
  source: "gps" | "fallback" | "last-known" | "manual";
}

/** Startstadt, solange kein Standort freigegeben ist. */
export const FALLBACK_COORDS: Coords = {
  lat: 48.1372,
  lng: 11.5755,
  accuracyM: null,
  source: "fallback",
};

export const FALLBACK_LABEL = "München (Beispielstadt)";

export type GeoStatus = "locating" | "granted" | "denied" | "unavailable";

/**
 * Zwei Stufen statt einem 12-Sekunden-Alles-oder-nichts (Nicolas' Feldtest:
 * „Standort wird nicht gut gefunden"):
 *
 * Stufe 1 nimmt SOFORT, was das Gerät hat – Mobilfunk/WLAN-Ortung oder einen
 * Fix der letzten Minuten. Auf ein paar hundert Meter genau, und das reicht
 * für „Spielplätze im Umkreis" völlig; die Liste startet in 1–2 Sekunden.
 *
 * Stufe 2 holt danach in Ruhe den präzisen GPS-Fix und schärft nach, aber
 * nur bei echter Abweichung – sonst zuckt die Liste ohne Grund.
 */
const STUFE_SCHNELL: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 6_000,
  maximumAge: 600_000,
};
/** Beim ausdrücklichen „Aktualisieren" darf Stufe 1 keinen 10 Minuten alten
 *  Cache-Fix als frisch verkaufen – wer den Knopf drückt, ist oft gerade
 *  umgestiegen und will genau NICHT die Position von vor der U-Bahn-Fahrt. */
const STUFE_SCHNELL_FRISCH: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 6_000,
  maximumAge: 30_000,
};
const STUFE_GENAU: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 20_000,
  maximumAge: 0,
};
/** Ab dieser Abweichung ersetzt der präzise Fix den schnellen. */
const NACHSCHAERFEN_AB_M = 150;

const LAST_KNOWN_KEY = "wohldraussen-last-position";

function available() {
  return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
}

/** Der zuletzt bekannte Standort ist ein besserer Start als eine fremde Stadt. */
function readLastKnown(): Coords | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_KNOWN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat: number; lng: number };
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    return { lat: parsed.lat, lng: parsed.lng, accuracyM: null, source: "last-known" };
  } catch {
    return null;
  }
}

/**
 * @param enabled Erst fragen, wenn der Nutzer weiß, wofür. Beim allerersten
 *   Öffnen liegt der Willkommens-Bildschirm noch davor; auf dem iPhone ist
 *   die Standortabfrage ein blockierender Systemdialog, der den Erklärtext
 *   verdeckt. Er erscheint deshalb erst nach „Los geht's".
 */
export function useGeolocation(enabled = true) {
  const [coords, setCoords] = useState<Coords>(
    () => readLastKnown() ?? FALLBACK_COORDS,
  );
  const [status, setStatus] = useState<GeoStatus>(() =>
    available() ? "locating" : "unavailable",
  );

  const merken = useCallback((next: Coords) => {
    letzterFix.current = Date.now();
    setCoords(next);
    setStatus("granted");
    try {
      localStorage.setItem(
        LAST_KNOWN_KEY,
        JSON.stringify({ lat: next.lat, lng: next.lng }),
      );
    } catch {
      // Privater Modus o. Ä., der Standort funktioniert trotzdem.
    }
  }, []);

  /** Wann der letzte echte GPS-Fix gelang – Basis für das stille
   *  Nachführen, wenn die App aus dem Hintergrund zurückkommt. */
  const letzterFix = useRef(0);
  /** Auch FEHLversuche drosseln: Ohne diesen Stempel startete jeder
   *  Tab-Wechsel bei dauerhaft scheiternder Ortung eine neue 26-Sekunden-
   *  GPS-Suche im Hintergrund (Akku). */
  const letzterVersuch = useRef(0);
  /** Nur der jüngste holen()-Lauf darf schreiben. Sonst überschreibt ein
   *  spät eintreffendes Stufe-2-Ergebnis eines ALTEN Laufs die frischere
   *  Position eines neuen (z. B. locate() während Stufe 2 läuft). */
  const laufNummer = useRef(0);

  /**
   * EIN Fix über den passenden Weg: in der App über iOS (spart den zweiten
   * WebKit-Dialog), im Browser über die Web-Schnittstelle. Liefert immer ein
   * Ergebnis statt zu werfen – die Stufenlogik entscheidet, was es bedeutet.
   */
  const holeEinenFix = useCallback(
    async (optionen: PositionOptions): Promise<NativerStandort> => {
      const nativ = await nativerStandort({
        enableHighAccuracy: optionen.enableHighAccuracy ?? false,
        timeout: optionen.timeout ?? 12_000,
        maximumAge: optionen.maximumAge ?? 0,
      });
      if (nativ) return nativ;
      if (!available()) return { ok: false, grund: "unavailable" };
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              ok: true,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracyM: pos.coords.accuracy ?? null,
            }),
          (fehler) =>
            resolve({
              ok: false,
              grund:
                fehler.code === fehler.PERMISSION_DENIED
                  ? "denied"
                  : "unavailable",
            }),
          optionen,
        );
      });
    },
    [],
  );

  /** Zweistufig: sofort grob anfangen, in Ruhe präzise nachschärfen. */
  const holen = useCallback(
    async (frisch = false) => {
      const lauf = ++laufNummer.current;
      const aktuell = () => laufNummer.current === lauf;
      letzterVersuch.current = Date.now();

      const grob = await holeEinenFix(
        frisch ? STUFE_SCHNELL_FRISCH : STUFE_SCHNELL,
      );
      if (!aktuell()) return;
      if (grob.ok) {
        merken({
          lat: grob.lat,
          lng: grob.lng,
          accuracyM: grob.accuracyM,
          source: "gps",
        });
      } else if (grob.grund === "denied") {
        // Wer die Freigabe ablehnt, lehnt sie auch für Stufe 2 ab.
        setStatus("denied");
        return;
      }

      const genau = await holeEinenFix(STUFE_GENAU);
      if (!aktuell()) return;
      if (genau.ok) {
        if (
          !grob.ok ||
          haversine(grob.lat, grob.lng, genau.lat, genau.lng) >
            NACHSCHAERFEN_AB_M
        ) {
          merken({
            lat: genau.lat,
            lng: genau.lng,
            accuracyM: genau.accuracyM,
            source: "gps",
          });
        }
      } else if (!grob.ok) {
        setStatus(genau.grund);
      }
    },
    [merken, holeEinenFix],
  );

  // Die App wird draußen benutzt: Wer sie nach der U-Bahn-Fahrt wieder
  // öffnet, steht woanders. Ohne dieses Nachführen klebte die App am
  // Start-Standort – selbst der Aktualisieren-Knopf lud nur die alten
  // Koordinaten neu (Nicolas' Feldtest-Fund).
  useEffect(() => {
    if (!enabled) return;
    const nachfuehren = () => {
      if (document.visibilityState !== "visible") return;
      const zuletzt = Math.max(letzterFix.current, letzterVersuch.current);
      if (Date.now() - zuletzt < 2 * 60_000) return;
      void holen();
    };
    document.addEventListener("visibilitychange", nachfuehren);
    return () => document.removeEventListener("visibilitychange", nachfuehren);
  }, [enabled, holen]);

  useEffect(() => {
    if (!enabled) return;
    // Standort holen ist genau das, wofür Effekte da sind: ein Seiteneffekt
    // nach außen, dessen Ergebnis später in den Zustand fließt. Die Regel
    // zielt auf setState während des Renderns – das passiert hier nicht,
    // `holen` ist asynchron und antwortet frühestens im nächsten Tick.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void holen();
  }, [enabled, holen]);

  /** Erneuter Versuch auf Nutzerwunsch (Aktualisieren-Knopf, nach erteilter
   *  Freigabe) – mit frischem Fix statt Minuten altem Cache. */
  const locate = useCallback(() => {
    setStatus("locating");
    void holen(true);
  }, [holen]);

  return { coords, status, locate };
}
