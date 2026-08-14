"use client";

import { X } from "lucide-react";
import { activeFilterChips, useFilters } from "@/store/useFilters";

/** Zeigt aktive Filter direkt in der Liste, und lässt sie einzeln wegtippen. */
export function FilterChips() {
  const filters = useFilters();
  const chips = activeFilterChips(filters);

  if (chips.length === 0) return null;

  return (
    <ul className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => {
              for (const [key, value] of Object.entries(chip.reset)) {
                filters.set(
                  key as Parameters<typeof filters.set>[0],
                  value as never,
                );
              }
            }}
            aria-label={`Filter „${chip.label}“ entfernen`}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-primary-dark/15 bg-primary-soft px-3 text-sm font-semibold text-primary-dark transition active:scale-95"
          >
            {chip.label}
            <X size={14} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
