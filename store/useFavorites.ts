"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesStore {
  /** OSM-Ids der gemerkten Plätze (z. B. "way/12345"). */
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

/**
 * „Meine Plätze": die zwei, drei Orte, zu denen eine Familie ständig geht.
 * Bewusst nur lokal auf dem Gerät gespeichert – kein Konto, keine Cloud,
 * nichts zu erklären im Datenschutz.
 */
export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        })),
      has: (id) => get().ids.includes(id),
    }),
    { name: "platzda:favorites" },
  ),
);
