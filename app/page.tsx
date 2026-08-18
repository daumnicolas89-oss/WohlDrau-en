import { IS_APP_SHELL } from "@/lib/appMode";
import { AppEntry } from "@/components/AppEntry";
import { Landing } from "@/components/landing/Landing";

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
