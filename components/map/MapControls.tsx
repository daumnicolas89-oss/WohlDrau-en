"use client";

import { List, MapPin, RefreshCw } from "lucide-react";
import { TIME_CHOICES, useFilters } from "@/store/useFilters";
import { tick } from "@/lib/native";

/**
 * Die zwei Entscheidungen, die im Alltag ständig fallen: „wann?“ und
 * „Liste oder Karte?“, deshalb dauerhaft sichtbar statt im Filter versteckt.
 * Dazu der Neu-laden-Knopf: frische Orte und frisches Wetter mit einem Tipp,
 * ohne den Browser bemühen zu müssen.
 */
export function MapControls({
  onRefresh,
  refreshing = false,
}: {
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const filters = useFilters();

  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-[900] flex items-center gap-2 bg-background/80 px-4 py-2.5 backdrop-blur-md">
      {/* Gleiche Bauart wie die Umschalter in Filter- und Anzieh-Fenster:
          heller Einleger, aktive Wahl als weiße Karte mit Schatten. */}
      <div className="flex flex-1 gap-1 rounded-2xl border border-line bg-background p-1">
        {TIME_CHOICES.map((choice) => {
          const active = filters.timeOffsetMin === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={active}
              onClick={() => {
                tick();
                filters.set("timeOffsetMin", choice.value);
              }}
              className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                active ? "bg-card text-dark shadow-card" : "text-muted active:bg-card/60"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => filters.setViewMode(filters.viewMode === "list" ? "map" : "list")}
        aria-label={filters.viewMode === "list" ? "Karte anzeigen" : "Liste anzeigen"}
        className="flex size-11 items-center justify-center rounded-2xl bg-card text-dark shadow-card transition duration-200 active:scale-95"
      >
        {filters.viewMode === "list" ? <MapPin size={20} /> : <List size={20} />}
      </button>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Neu laden"
          className="flex size-11 items-center justify-center rounded-2xl bg-card text-dark shadow-card transition duration-200 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
        >
          <RefreshCw size={20} className={refreshing ? "animate-spin" : undefined} />
        </button>
      )}
    </div>
  );
}
