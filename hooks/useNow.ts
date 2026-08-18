"use client";

import { useEffect, useState } from "react";

/** Taktgeber, damit „jetzt“ auch wirklich jetzt bleibt. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    // Kommt die App aus dem Hintergrund zurück (iOS friert Timer ein),
    // wäre „jetzt" sonst bis zum nächsten Takt die Uhrzeit von vorhin –
    // nach einer Nacht in der Tasche rechnete alles kurz mit gestern Abend.
    const aufwachen = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", aufwachen);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aufwachen);
    };
  }, [intervalMs]);

  return now;
}
