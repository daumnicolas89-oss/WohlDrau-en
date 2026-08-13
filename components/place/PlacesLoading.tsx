"use client";

import { useEffect, useState } from "react";

/** Ab hier ist klar: Es liegt nicht am Handy, sondern an OpenStreetMap. */
const PATIENCE_MS = 8000;

/**
 * Kein stiller Ladebalken: Overpass braucht für eine neue Gegend gemessen
 * zwischen 3 und 60 Sekunden. Wer weiß, worauf er wartet, wartet lieber.
 */
export function PlacesLoading({ rows = 3 }: { rows?: number }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), PATIENCE_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-card bg-card shadow-card" />
      ))}
      <p className="text-center text-sm text-muted" aria-live="polite">
        Orte, Wetter und Sonnenstand werden geladen …
      </p>
      {slow && (
        <p className="text-center text-xs leading-relaxed text-muted">
          Beim ersten Besuch einer Gegend holen wir die Kartendaten live von
          OpenStreetMap. Das kann eine Minute dauern. Danach ist es sofort da.
        </p>
      )}
    </div>
  );
}
