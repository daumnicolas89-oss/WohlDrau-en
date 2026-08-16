"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ModerationStore {
  /** Einzelne gemeldete Beiträge – sofort weg, ohne auf andere zu warten. */
  hiddenIds: string[];
  /** Verfasser, die man nicht mehr sehen möchte (nicht rückführbarer Schlüssel). */
  blockedAuthors: string[];
  hide: (statusId: string) => void;
  block: (authorKey: string) => void;
  isHidden: (statusId: string, authorKey?: string) => boolean;
}

/**
 * Was jemand meldet oder blockiert, verschwindet für ihn sofort und dauerhaft –
 * unabhängig davon, was der Server daraus macht. Rein auf dem Gerät
 * gespeichert, ohne Konto.
 */
export const useModeration = create<ModerationStore>()(
  persist(
    (set, get) => ({
      hiddenIds: [],
      blockedAuthors: [],
      hide: (statusId) =>
        set((s) =>
          s.hiddenIds.includes(statusId)
            ? s
            : { hiddenIds: [...s.hiddenIds, statusId].slice(-500) },
        ),
      block: (authorKey) =>
        set((s) =>
          s.blockedAuthors.includes(authorKey)
            ? s
            : { blockedAuthors: [...s.blockedAuthors, authorKey].slice(-200) },
        ),
      isHidden: (statusId, authorKey) => {
        const s = get();
        return (
          s.hiddenIds.includes(statusId) ||
          (authorKey !== undefined && s.blockedAuthors.includes(authorKey))
        );
      },
    }),
    { name: "platzda:moderation" },
  ),
);
