"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Offline ist im Park kein Ausnahmefall, sondern Alltag. Die App soll das
 * benennen können, statt einen Netzfehler wie einen Datenfehler aussehen zu
 * lassen.
 *
 * `useSyncExternalStore` statt eines Effekts: Der Wert wird bei jedem Render
 * frisch aus dem Browser gelesen. Ein einmalig gemerkter Startwert kann sonst
 * veralten – etwa wenn die Seite ohne Netz neu geladen wird und
 * `navigator.onLine` beim ersten Render noch `true` meldet.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
