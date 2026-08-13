"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { markInAppNavigation } from "@/lib/utils";

/**
 * Hält fest, ob innerhalb der App navigiert wurde. Der erste Seitenaufruf zählt
 * als Direkteinstieg (geteilter Link, PWA-Start), jeder weitere Wechsel als
 * App-interne Navigation. Die Detailseite entscheidet damit, ob „Zurück" den
 * Verlauf zurückspulen darf (zur Liste) oder sicher auf die Übersicht führt.
 */
export function NavTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    markInAppNavigation();
  }, [pathname]);

  return null;
}
