"use client";

import { useCallback, useEffect, useState } from "react";
import { anonymousId } from "@/lib/utils";
import type { PlaceStatus, PlaceStatusType } from "@/types";

export interface UseStatusesResult {
  statuses: PlaceStatus[];
  /** Meldung absenden; wirft bei Fehlern, damit das Formular sie anzeigen kann. */
  report: (
    placeId: string,
    type: PlaceStatusType,
    message?: string,
  ) => Promise<void>;
}

export function useStatuses(placeIds: string[]): UseStatusesResult {
  const [statuses, setStatuses] = useState<PlaceStatus[]>([]);
  // Die Liste selbst ändert sich bei jedem Render, nur ihr Inhalt zählt.
  const key = placeIds.slice(0, 300).join(",");

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();

    fetch(`/api/status?placeIds=${encodeURIComponent(key)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (body?.statuses) setStatuses(body.statuses as PlaceStatus[]);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [key]);

  const report = useCallback(
    async (placeId: string, type: PlaceStatusType, message?: string) => {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          type,
          message,
          anonymousId: anonymousId(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Meldung fehlgeschlagen");
      setStatuses((current) => [body.status as PlaceStatus, ...current]);
    },
    [],
  );

  return { statuses, report };
}
