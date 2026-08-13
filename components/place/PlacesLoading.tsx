"use client";

import { useEffect, useState } from "react";

/** Ab hier ist klar: Es liegt nicht am Handy, sondern an OpenStreetMap. */
const PATIENCE_MS = 8000;

/** Schlanke Zeile, deckungsgleich mit der echten Listen-Zeile (Ring + zwei
 *  Textzeilen), damit beim Laden nichts umspringt. */
function SlimSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-card bg-card p-4 shadow-card">
      <div className="size-[46px] shrink-0 rounded-full bg-background" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-background" />
        <div className="h-3 w-2/5 rounded bg-background" />
      </div>
    </div>
  );
}

/** Der hohe „Beste Wahl“-Platzhalter, in Form und Höhe wie die echte Karte. */
function HeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-card shadow-card ring-1 ring-[#eec97a]/50">
      <div className="h-8 bg-accent-soft" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-5 w-4/5 rounded bg-background" />
            <div className="h-4 w-1/3 rounded bg-background" />
          </div>
          <div className="size-[60px] shrink-0 rounded-full bg-background" />
        </div>
        <div className="h-2.5 w-full rounded-full bg-background" />
        <div className="h-4 w-5/6 rounded bg-background" />
        <div className="h-10 w-full rounded-xl bg-background" />
      </div>
    </div>
  );
}

/**
 * Kein stiller Ladebalken: Overpass braucht für eine neue Gegend gemessen
 * zwischen 3 und 60 Sekunden. Wer weiß, worauf er wartet, wartet lieber.
 *
 * `hero` zeigt die Listen-Form (ein hoher Favorit plus schlanke Zeilen);
 * ohne `hero` bleibt es die ruhige Kartenreihe für die Detailseite.
 */
export function PlacesLoading({
  rows = 3,
  hero = false,
}: {
  rows?: number;
  hero?: boolean;
}) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), PATIENCE_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="space-y-3 p-4">
      <div className="animate-pulse space-y-3">
        {hero ? (
          <>
            <HeroSkeleton />
            {Array.from({ length: rows }, (_, i) => (
              <SlimSkeleton key={i} />
            ))}
          </>
        ) : (
          Array.from({ length: rows }, (_, i) => (
            <div key={i} className="h-36 rounded-card bg-card shadow-card" />
          ))
        )}
      </div>
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
