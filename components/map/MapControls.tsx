"use client";

import { List, MapPin } from "lucide-react";
import { useFilters, type TimeOffset } from "@/store/useFilters";

const TIME_CHOICES: { value: TimeOffset; label: string }[] = [
  { value: 0, label: "Jetzt" },
  { value: 30, label: "+30 Min" },
  { value: 60, label: "+1 Std" },
];

/**
 * Die zwei Entscheidungen, die im Alltag ständig fallen: „wann?“ und
 * „Liste oder Karte?“ – deshalb dauerhaft sichtbar statt im Filter versteckt.
 */
export function MapControls() {
  const filters = useFilters();

  return (
    <div className="sticky top-0 z-[900] flex items-center gap-2 border-b border-line bg-background/95 px-4 py-2 backdrop-blur">
      <div className="flex flex-1 gap-1 rounded-2xl bg-card p-1 shadow-card">
        {TIME_CHOICES.map((choice) => {
          const active = filters.timeOffsetMin === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={active}
              onClick={() => filters.set("timeOffsetMin", choice.value)}
              className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                active ? "bg-primary-dark text-white" : "text-muted"
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
        className="flex size-11 items-center justify-center rounded-2xl bg-card text-dark shadow-card"
      >
        {filters.viewMode === "list" ? <MapPin size={20} /> : <List size={20} />}
      </button>
    </div>
  );
}
