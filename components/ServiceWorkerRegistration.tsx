"use client";

import { useEffect } from "react";
import { IS_APP_SHELL } from "@/lib/appMode";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // In der App-Hülle liegen die Dateien schon im Bündel, und unter
    // capacitor://localhost gibt es ohnehin keine Service Worker.
    if (IS_APP_SHELL) return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}

/**
 * Der Marken-Startbildschirm bleibt stehen (launchAutoHide: false), bis die
 * Oberfläche wirklich gezeichnet ist. Ohne das blitzt zwischen Start und
 * erster Darstellung kurz der leere Hintergrund auf.
 */
export function SplashHide() {
  useEffect(() => {
    if (!IS_APP_SHELL) return;
    const timer = window.setTimeout(() => {
      void import("@capacitor/splash-screen")
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 250 }))
        .catch(() => undefined);
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
