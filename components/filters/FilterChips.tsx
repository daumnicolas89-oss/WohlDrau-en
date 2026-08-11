"use client";

import { X } from "lucide-react";
import { activeFilterChips, useFilters } from "@/store/useFilters";

/** Zeigt aktive Filter direkt in der Liste – und lässt sie einzeln wegtippen. */
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
            className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary bg-primary-soft px-3 text-sm font-semibold text-primary-dark"
          >
            {chip.label}
            <X size={14} aria-label="Filter entfernen" />
          </button>
        </li>
      ))}
    </ul>
  );
}
