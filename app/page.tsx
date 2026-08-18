import type { Viewport } from "next";
import { IS_APP_SHELL } from "@/lib/appMode";
import { AppEntry } from "@/components/AppEntry";
import { Landing } from "@/components/landing/Landing";

/** Die Browser-Chrome soll zum bernsteinfarbenen Hero passen, nicht zum
 *  Teal der App – gilt nur für diese Route, alle anderen erben das Teal
 *  aus dem Layout. (In der App-Hülle ist theme-color ohne Wirkung.) */
export const viewport: Viewport = {
  themeColor: "#fdebc9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Die Startroute trägt zwei Gesichter, entschieden zur BAUZEIT:
 * - Web (platzda.app): die Landing Page – die Haustür zur iPhone-App.
 * - App-Hülle (Capacitor): direkt die App. Die Hülle lädt ihre Oberfläche
 *   von "/", eine Werbeseite für sich selbst wäre dort absurd.
 * Die App selbst bleibt im Web unter /app erreichbar (alte Home-Bildschirm-
 * Installationen, geteilte Links, Android) – nur beworben wird sie nicht mehr.
 */
export default function Page() {
  if (IS_APP_SHELL) return <AppEntry />;
  return <Landing />;
}
