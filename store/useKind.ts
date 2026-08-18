"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgeGroup, WarmthSensitivity } from "@/lib/outdoorTips";

/**
 * Das Kind-Profil: Alter und Wärmeempfinden, EINMAL gepflegt und von
 * Anzieh-Empfehlung UND Filter geteilt. Vorher lebten die Werte als lose
 * localStorage-Schlüssel nur im Anzieh-Fenster – wer im Filter nach
 * kindgerechten Plätzen suchte, musste dieselbe Information nochmal denken.
 *
 * Bleibt vollständig auf dem Gerät (steht so in der Datenschutzerklärung).
 */
interface KindStore {
  age: AgeGroup;
  sensitivity: WarmthSensitivity;
  setAge: (age: AgeGroup) => void;
  setSensitivity: (s: WarmthSensitivity) => void;
}

/** Die alten Anzieh-Schlüssel einmalig übernehmen, damit niemand seine
 *  Einstellung verliert. */
function alteWerte(): { age: AgeGroup; sensitivity: WarmthSensitivity } {
  const fallback = { age: "kita" as AgeGroup, sensitivity: "neutral" as WarmthSensitivity };
  if (typeof localStorage === "undefined") return fallback;
  try {
    const a = localStorage.getItem("platzda:outfit:age");
    const s = localStorage.getItem("platzda:outfit:sensitivity");
    return {
      age: (["baby", "toddler", "kita", "school"] as const).includes(a as AgeGroup)
        ? (a as AgeGroup)
        : fallback.age,
      sensitivity: (["chilly", "neutral", "warm"] as const).includes(s as WarmthSensitivity)
        ? (s as WarmthSensitivity)
        : fallback.sensitivity,
    };
  } catch {
    return fallback;
  }
}

export const useKind = create<KindStore>()(
  persist(
    (set) => ({
      ...alteWerte(),
      setAge: (age) => set({ age }),
      setSensitivity: (sensitivity) => set({ sensitivity }),
    }),
    { name: "platzda:kind" },
  ),
);

/** Die Altersstufen, wie sie überall angezeigt werden. */
export const AGES: { key: AgeGroup; label: string; sub: string }[] = [
  { key: "baby", label: "Baby", sub: "0–1 J" },
  { key: "toddler", label: "Kleinkind", sub: "1–3 J" },
  { key: "kita", label: "Kita", sub: "3–6 J" },
  { key: "school", label: "Schule", sub: "6+ J" },
];

/**
 * Welche Wünsche zum Alter passen – die Grundlage für den Vorschlag
 * „Mit 1–3 Jahren sind Zaun und Wickeltisch oft wichtig".
 * Bewusst Empfehlung statt Automatik: Die App schlägt vor, Eltern schalten.
 */
export const ALTERS_WUENSCHE: Record<
  AgeGroup,
  { label: string; keys: ("preferFenced" | "preferChangingTable" | "preferToilet" | "preferWater")[] }
> = {
  baby: {
    label: "Mit einem Baby sind Wickeltisch und Toilette oft entscheidend.",
    keys: ["preferChangingTable", "preferToilet"],
  },
  toddler: {
    label: "Mit 1–3 Jahren sind Zaun, Wickeltisch und Toilette oft wichtig.",
    keys: ["preferFenced", "preferChangingTable", "preferToilet"],
  },
  kita: {
    label: "Im Kita-Alter sind Planschwasser und eine Toilette oft das Größte.",
    keys: ["preferWater", "preferToilet"],
  },
  school: {
    label: "Für Schulkinder reicht meist eine Toilette in der Nähe.",
    keys: ["preferToilet"],
  },
};
