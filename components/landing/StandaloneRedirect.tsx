"use client";

import { useEffect } from "react";

/**
 * Wer PlatzDa früher als Web-App auf den Home-Bildschirm gelegt hat, startet
 * über die alte Startadresse „/" – und soll in der App landen, nicht auf der
 * Werbeseite für die App, die er längst benutzt.
 */
export function StandaloneRedirect() {
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true);
    if (standalone) window.location.replace("/app");
  }, []);
  return null;
}
