"use client";

import { apiUrl } from "@/lib/appMode";
import { Hinweis } from "./ui/Hinweis";
import { IS_APP_SHELL } from "@/lib/appMode";

import { useState } from "react";
import { Crosshair, Search } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import type { GeoStatus } from "@/hooks/useGeolocation";
import type { ManualLocation } from "@/store/useLocation";

interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Ein Ort auf zwei Wegen: der eigene Standort (GPS) oder ein gesuchter Ort.
 * Die Suche fängt zugleich den Fall ab, dass GPS blockiert ist, dann steckt
 * niemand mehr in der Beispielstadt fest.
 */
export function LocationSheet({
  open,
  onClose,
  geoStatus,
  onUseGps,
  manual,
  onSetManual,
}: {
  open: boolean;
  onClose: () => void;
  geoStatus: GeoStatus;
  onUseGps: () => void;
  manual: ManualLocation | null;
  onSetManual: (loc: ManualLocation | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setBusy(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(apiUrl(`/api/geocode?q=${encodeURIComponent(q)}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suche fehlgeschlagen");
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suche fehlgeschlagen");
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function useGps() {
    onSetManual(null);
    onUseGps();
    onClose();
  }

  function pick(result: GeoResult) {
    onSetManual({ lat: result.lat, lng: result.lng, label: result.label });
    onClose();
  }

  return (
    <Sheet
      open={open}
      title="Standort"
      description="Nutze deinen Standort oder sieh dir einen anderen Ort an."
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <button
        type="button"
        onClick={useGps}
        className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line px-4 text-left font-semibold text-dark transition active:bg-background"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
          <Crosshair size={20} />
        </span>
        {geoStatus === "locating" ? "Standort wird bestimmt …" : "Meinen Standort verwenden"}
      </button>

      {geoStatus === "denied" && (
        <Hinweis className="mt-2">
          {/* In der App gibt es keine Adressleiste und kein Schloss-Symbol –
              der Browser-Hinweis führte dort ins Leere. */}
          {IS_APP_SHELL
            ? "Der Standort ist für PlatzDa nicht freigegeben. Erlaube ihn in den iPhone-Einstellungen unter PlatzDa → Standort – oder such einfach unten deinen Ort."
            : "Der Standort ist im Browser blockiert. Erlaube ihn über das Schloss-Symbol in der Adressleiste – oder such einfach unten deinen Ort."}
        </Hinweis>
      )}

      {manual && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-primary-soft px-4 py-3 text-sm text-primary-dark">
          <span>
            Du schaust dir gerade <span className="font-semibold">{manual.label}</span> an.
          </span>
          <button
            type="button"
            onClick={useGps}
            className="shrink-0 font-semibold underline"
          >
            Zu mir zurück
          </button>
        </div>
      )}

      <form onSubmit={search} className="mt-4 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-line bg-background px-3 focus-within:border-primary">
          <Search size={20} aria-hidden className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Stadt oder Ort suchen …"
            aria-label="Ort suchen"
            className="min-h-12 w-full bg-transparent text-base outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy || query.trim().length < 2}
          className="min-h-12 shrink-0 rounded-2xl bg-primary-dark px-4 font-semibold text-white transition hover:bg-primary-darker active:bg-primary-darker disabled:bg-disabled disabled:hover:bg-disabled"
        >
          {busy ? "…" : "Suchen"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-warning-ink">{error}</p>}

      {!busy && !error && searched && results.length === 0 && (
        <p className="mt-3 text-sm text-muted">
          Nichts gefunden. Versuch es mit einem anderen Namen.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mt-3 space-y-1">
          {results.map((result) => (
            <li key={`${result.lat},${result.lng}`}>
              <button
                type="button"
                onClick={() => pick(result)}
                className="flex min-h-12 w-full items-center rounded-2xl px-3 text-left text-[15px] text-dark transition active:bg-background"
              >
                {result.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
