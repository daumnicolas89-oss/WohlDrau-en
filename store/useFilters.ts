"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlaceType } from "@/types";

export type ShadeRequirement = "any" | "partial" | "shady";
export type TimeOffset = 0 | 30 | 60;
export type ViewMode = "list" | "map";
export type MapStyle = "map" | "satellite";

export interface FilterState {
  timeOffsetMin: TimeOffset;
  maxDistanceM: number;
  requireToilet: boolean;
  requireChangingTable: boolean;
  requireFenced: boolean;
  shade: ShadeRequirement;
  types: PlaceType[];
  hideReportedProblems: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  timeOffsetMin: 0,
  // Rund 20 Minuten Fußweg. Weiter ist mit Kleinkind kein „mal eben raus“
  // mehr – und innerhalb dieser Spanne darf die Ausstattung entscheiden.
  maxDistanceM: 1500,
  requireToilet: false,
  requireChangingTable: false,
  requireFenced: false,
  shade: "any",
  types: ["playground", "park"],
  hideReportedProblems: false,
};

interface FilterStore extends FilterState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
  set: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  toggleType: (type: PlaceType) => void;
  reset: () => void;
}

export const useFilters = create<FilterStore>()(
  persist(
    (set) => ({
      ...DEFAULT_FILTERS,
      viewMode: "list",
      setViewMode: (viewMode) => set({ viewMode }),
      mapStyle: "map",
      setMapStyle: (mapStyle) => set({ mapStyle }),
      set: (key, value) => set({ [key]: value } as Partial<FilterState>),
      toggleType: (type) =>
        set((state) => {
          const next = state.types.includes(type)
            ? state.types.filter((t) => t !== type)
            : [...state.types, type];
          // Ohne Ortsart gäbe es nichts zu zeigen.
          return { types: next.length ? next : state.types };
        }),
      reset: () => set({ ...DEFAULT_FILTERS }),
    }),
    {
      name: "wohldraussen-filters",
      // Die Zeitwahl ist eine Momententscheidung und startet immer bei „jetzt“,
      // wird deshalb bewusst nicht gespeichert.
      partialize: (state) => ({
        maxDistanceM: state.maxDistanceM,
        requireToilet: state.requireToilet,
        requireChangingTable: state.requireChangingTable,
        requireFenced: state.requireFenced,
        shade: state.shade,
        types: state.types,
        hideReportedProblems: state.hideReportedProblems,
        viewMode: state.viewMode,
        mapStyle: state.mapStyle,
      }),
    },
  ),
);

/** Aktive Filter als kurze Chips – auch die Grundlage für den Zähler am Button. */
export interface ActiveFilterChip {
  key: keyof FilterState;
  label: string;
  reset: Partial<FilterState>;
}

export function activeFilterChips(state: FilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (state.shade !== DEFAULT_FILTERS.shade) {
    chips.push({
      key: "shade",
      label: state.shade === "shady" ? "Nur schattig" : "Mind. teils Schatten",
      reset: { shade: DEFAULT_FILTERS.shade },
    });
  }
  if (state.maxDistanceM !== DEFAULT_FILTERS.maxDistanceM) {
    chips.push({
      key: "maxDistanceM",
      label: `≤ ${(state.maxDistanceM / 1000).toFixed(1).replace(".", ",")} km`,
      reset: { maxDistanceM: DEFAULT_FILTERS.maxDistanceM },
    });
  }
  if (state.requireToilet) {
    chips.push({ key: "requireToilet", label: "Toilette", reset: { requireToilet: false } });
  }
  if (state.requireChangingTable) {
    chips.push({
      key: "requireChangingTable",
      label: "Wickeltisch",
      reset: { requireChangingTable: false },
    });
  }
  if (state.requireFenced) {
    chips.push({ key: "requireFenced", label: "Eingezäunt", reset: { requireFenced: false } });
  }
  if (state.hideReportedProblems) {
    chips.push({
      key: "hideReportedProblems",
      label: "Ohne Warnungen",
      reset: { hideReportedProblems: false },
    });
  }
  if (state.types.length !== DEFAULT_FILTERS.types.length) {
    chips.push({
      key: "types",
      label: state.types.includes("playground") ? "Nur Spielplätze" : "Nur Grünflächen",
      reset: { types: DEFAULT_FILTERS.types },
    });
  }
  return chips;
}
