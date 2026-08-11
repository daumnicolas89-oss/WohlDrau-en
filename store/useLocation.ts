"use client";

import { create } from "zustand";

/** Ein manuell gewählter Ort (Suche/„Reise"), der den GPS-Standort überstimmt. */
export interface ManualLocation {
  lat: number;
  lng: number;
  label: string;
}

interface LocationStore {
  manual: ManualLocation | null;
  setManual: (loc: ManualLocation | null) => void;
}

/**
 * Bewusst NICHT gespeichert: Beim nächsten Öffnen startet man wieder am
 * eigenen Standort und steckt nicht ungewollt in einer fremden Stadt fest.
 */
export const useManualLocation = create<LocationStore>((set) => ({
  manual: null,
  setManual: (manual) => set({ manual }),
}));
