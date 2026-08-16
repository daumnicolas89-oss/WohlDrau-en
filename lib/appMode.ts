/**
 * Weiche zwischen Web-Auslieferung (platzda.app, Server inklusive) und der
 * gebündelten App-Hülle für den App Store (Capacitor: nur die Oberfläche,
 * Daten kommen per HTTPS von platzda.app).
 *
 * Gebaut wird die Hülle mit `npm run build:app` – das setzt NEXT_PUBLIC_APP_SHELL
 * und legt Server-Teile (app/api, app/ort, proxy.ts) für den Build beiseite.
 */
export const IS_APP_SHELL = process.env.NEXT_PUBLIC_APP_SHELL === "1";

/**
 * In der App-Hülle gehen alle Datenabrufe an die echte Domain – bewusst mit
 * `www`: platzda.app leitet mit 308 dorthin um, und eine Umleitung mitten im
 * Datenabruf kostet nicht nur Zeit, sie lässt auch CORS-Anfragen scheitern.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (IS_APP_SHELL ? "https://www.platzda.app" : "");

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * Link zu einer Detailseite. Im Web die schöne Pfad-URL (/ort/way/123), in der
 * App-Hülle die statisch exportierbare Query-Variante (/platz/?id=way/123) –
 * dynamische Pfad-Segmente gibt es in einem statischen Export nicht.
 */
export function placeHref(id: string, query = ""): string {
  if (IS_APP_SHELL) {
    return `/platz/?id=${encodeURIComponent(id)}${query ? `&${query}` : ""}`;
  }
  return `/ort/${id}${query ? `?${query}` : ""}`;
}
