import type { PlaceStatus, PlaceStatusType } from "@/types";

/** Community-Meldungen sind bewusst kurzlebig – danach zählen sie nicht mehr. */
export const STATUS_TTL_MS = 3 * 60 * 60 * 1000;

export interface StatusOption {
  type: PlaceStatusType;
  label: string;
  tone: "good" | "neutral" | "bad";
}

export const STATUS_OPTIONS: StatusOption[] = [
  { type: "great", label: "Gerade super", tone: "good" },
  { type: "too_sunny", label: "Zu sonnig", tone: "bad" },
  { type: "too_crowded", label: "Sehr voll", tone: "bad" },
  { type: "toilet_closed", label: "Toilette zu", tone: "bad" },
  { type: "wet", label: "Nass / matschig", tone: "bad" },
  { type: "dirty_broken", label: "Verschmutzt / kaputt", tone: "bad" },
  { type: "other", label: "Sonstiges", tone: "neutral" },
];

export function statusOption(type: PlaceStatusType): StatusOption {
  return (
    STATUS_OPTIONS.find((option) => option.type === type) ?? {
      type,
      label: type,
      tone: "neutral",
    }
  );
}

export function expiresAtFor(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() + STATUS_TTL_MS).toISOString();
}

/** 1 → gerade eben, 0 → abgelaufen. Ältere Meldungen wiegen weniger. */
export function freshness(status: PlaceStatus, now = Date.now()): number {
  const expires = new Date(status.expiresAt).getTime();
  if (now >= expires) return 0;
  const created = new Date(status.createdAt).getTime();
  const lifetime = Math.max(1, expires - created);
  return clampUnit((expires - now) / lifetime);
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function formatAge(createdAt: string, now = Date.now()): string {
  const minutes = Math.round((now - new Date(createdAt).getTime()) / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min`;
  const hours = Math.round(minutes / 60);
  return `vor ${hours} Std`;
}
