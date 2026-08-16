import type { Weather } from "@/types";

/**
 * Das „Regen-Radar-Gefühl": Aus dem 15-Minuten-Niederschlag von Open-Meteo
 * wird ein Satz, der die nächste Dreiviertelstunde planbar macht – „zieht
 * auf" oder „hört auf". Kein Hinweis, wenn sich nichts ändert: Dauerregen
 * und Dauer-Trocken sagt schon der Rest des Kopfes.
 */

/** Ab dieser Menge pro Viertelstunde gilt ein Slot als „es regnet". */
const REGEN_MM = 0.1;
/** Nur die nächsten ~90 Minuten sind fürs Losgehen relevant. */
const BLICK_SLOTS = 6;

export function rainNowcast(weather: Weather, now: Date): string | null {
  const m = weather.minutely15;
  if (!m || m.time.length === 0) return null;

  const off = weather.utcOffsetSeconds;
  const epochOf = (t: string) =>
    off === undefined ? new Date(t).getTime() : Date.parse(`${t}Z`) - off * 1000;

  // Slots ab jetzt (der laufende Viertelstunden-Slot zählt mit).
  const slots: { startsInMin: number; regen: boolean }[] = [];
  for (let i = 0; i < m.time.length && slots.length < BLICK_SLOTS; i++) {
    const epoch = epochOf(m.time[i]);
    if (Number.isNaN(epoch) || epoch < now.getTime() - 15 * 60_000) continue;
    slots.push({
      startsInMin: Math.max(0, Math.round((epoch - now.getTime()) / 60_000)),
      regen: (m.precipitation[i] ?? 0) >= REGEN_MM,
    });
  }
  if (slots.length < 2) return null;

  const jetztRegen = slots[0].regen;

  if (!jetztRegen) {
    const kommt = slots.find((s) => s.regen);
    if (!kommt) return null;
    if (kommt.startsInMin <= 5) return "Gleich fängt es an zu regnen.";
    return `Regen zieht auf: In rund ${kommt.startsInMin} Minuten geht es los.`;
  }

  const vorbei = slots.find((s) => !s.regen);
  if (!vorbei) return null;
  if (vorbei.startsInMin <= 5) return "Der Regen hört gleich auf.";
  return `Der Regen hört in rund ${vorbei.startsInMin} Minuten auf.`;
}
