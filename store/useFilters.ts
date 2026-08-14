"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlaceType } from "@/types";

export type ShadeRequirement = "any" | "partial" | "shady";
export type TimeOffset = 0 | 30 | 60;
export type ViewMode = "list" | "map";
export type MapStyle = "map" | "satellite";

/** Eine Quelle für die Zeit-Auswahl – Kopfzeile und Filter zeigen dieselben
 *  Wahlmöglichkeiten, also müssen sie auch dieselbe Liste benutzen. */
export const TIME_CHOICES: { value: TimeOffset; label: string }[] = [
  { value: 0, label: "Jetzt" },
  { value: 30, label: "In 30 Min" },
  { value: 60, label: "In 1 Std" },
];

export interface FilterState {
  timeOffsetMin: TimeOffset;
  maxDistanceM: number;
  // „prefer": weiche Priorität, solche Orte kommen zuerst, versteckt wird
  // nichts. So führt dünne OSM-Datenlage nicht zu einer leeren Liste.
  preferToilet: boolean;
  preferChangingTable: boolean;
  preferFenced: boolean;
  preferWater: boolean;
  preferWheelchair: boolean;
  shade: ShadeRequirement;
  types: PlaceType[];
  hideReportedProblems: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  timeOffsetMin: 0,
  // Rund 20 Minuten Fußweg. Weiter ist mit Kleinkind kein „mal eben raus“
  // mehr, und innerhalb dieser Spanne darf die Ausstattung entscheiden.
  maxDistanceM: 1500,
  preferToilet: false,
  preferChangingTable: false,
  preferFenced: false,
  preferWater: false,
  preferWheelchair: false,
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
        preferToilet: state.preferToilet,
        preferChangingTable: state.preferChangingTable,
        preferFenced: state.preferFenced,
        preferWater: state.preferWater,
        preferWheelchair: state.preferWheelchair,
        shade: state.shade,
        types: state.types,
        hideReportedProblems: state.hideReportedProblems,
        viewMode: state.viewMode,
        mapStyle: state.mapStyle,
      }),
    },
  ),
);

/** Aktive Filter als kurze Chips, auch die Grundlage für den Zähler am Button. */
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
  if (state.preferToilet) {
    chips.push({ key: "preferToilet", label: "Toilette", reset: { preferToilet: false } });
  }
  if (state.preferChangingTable) {
    chips.push({
      key: "preferChangingTable",
      label: "Wickeltisch",
      reset: { preferChangingTable: false },
    });
  }
  if (state.preferFenced) {
    chips.push({ key: "preferFenced", label: "Eingezäunt", reset: { preferFenced: false } });
  }
  if (state.preferWater) {
    chips.push({ key: "preferWater", label: "Wasser", reset: { preferWater: false } });
  }
  if (state.preferWheelchair) {
    chips.push({
      key: "preferWheelchair",
      label: "Barrierefrei",
      reset: { preferWheelchair: false },
    });
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
