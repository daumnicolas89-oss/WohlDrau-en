/*
 * Bewusst schlanker Service Worker:
 * - App-Shell und Icons kommen aus dem Cache (schneller Start, offline sichtbar)
 * - Kartenkacheln: Cache first mit Deckel, damit bekannte Gegenden schnell laden
 * - API-Daten: immer aus dem Netz. Ein veralteter Schatten wäre schlimmer als
 *   gar keiner – nur wenn das Netz ausfällt, greifen wir auf die Kopie zurück.
 */
// Bei jeder Änderung am Datenschema der API-Antworten mit hochzählen –
// sonst hält der Offline-Cache alte Objektformen unbegrenzt fest.
const VERSION = "v10";
const SHELL_CACHE = `wd-shell-${VERSION}`;
const TILE_CACHE = `wd-tiles-${VERSION}`;
const DATA_CACHE = `wd-data-${VERSION}`;
const MAX_TILES = 400;

const SHELL_ASSETS = ["/", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

/*
 * Orte ändern sich kaum, und das Wetter ist eine Vorhersage über zwölf
 * Stunden – weatherAt() greift daraus die passende Stunde. Beides bleibt
 * offline also brauchbar. Meldungen bewusst nicht: eine abgelaufene Meldung
 * wäre schlimmer als gar keine.
 */
const CACHEABLE_API = ["/api/places", "/api/weather"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.endsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(name, maxEntries) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
}

/** Wenn die Seite weder aus dem Netz noch aus dem Cache kommt: sagen, was
 *  los ist, statt eine andere Seite zu zeigen. */
function offlineSeite() {
  return new Response(
    `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Keine Verbindung · PlatzDa</title>
<style>
  body{margin:0;min-height:100dvh;display:flex;flex-direction:column;
       align-items:center;justify-content:center;gap:1rem;padding:2rem;
       background:#f6f3ec;color:#1c3540;text-align:center;
       font-family:-apple-system,system-ui,sans-serif;line-height:1.6}
  h1{font-size:1.25rem;margin:0}
  p{margin:0;max-width:22rem;color:#3d4a52;font-size:.95rem}
  a{margin-top:.5rem;padding:.85rem 1.5rem;border-radius:1rem;
    background:#1e766c;color:#fff;text-decoration:none;font-weight:600}
</style></head><body>
<h1>Keine Verbindung</h1>
<p>Diesen Platz haben wir noch nicht gespeichert. Sobald du wieder Empfang
hast, geht es weiter.</p>
<a href="/">Zur Übersicht</a>
</body></html>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Die Karte lädt ihre Kacheln von CARTO (hell) – nur dieser Host wird
  // offline vorgehalten. Esri-Luftbilder bewusst nicht (groß, selten nötig).
  if (url.hostname.endsWith("basemaps.cartocdn.com")) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
          trimCache(TILE_CACHE, MAX_TILES);
        }
        return response;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  /*
   * Orte laufen bewusst durch den generischen Netz-zuerst-Zweig unten: Das
   * Sofort-Zeigen beim Öffnen erledigt die App selbst (lastVisit-Speicher)
   * UND tauscht danach gegen die frische Antwort. Ein Cache-zuerst-SW hier
   * würde genau diese Aktualisierung aushebeln – die App bekäme dauerhaft
   * den vorletzten Stand und speicherte ihn mit frischem Datum wieder ein.
   */
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && CACHEABLE_API.some((path) => url.pathname === path)) {
            // Sofort klonen: nach dem await auf caches.open ist der Body
            // längst von der Seite gelesen und die Kopie leer.
            const copy = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: "Offline – keine gespeicherten Daten." }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }),
    );
    return;
  }

  /*
   * Seitenaufrufe: Netz zuerst, Erfolge werden vorgehalten.
   *
   * Vorher fiel JEDER fehlgeschlagene Aufruf auf die Startseite zurück. Wer
   * bei wackligem Netz einen Platz öffnete, landete wortlos in der Liste –
   * die Adresse zeigte noch den Platz, der Inhalt war ein anderer. Draußen
   * mit halbem Balken, also genau dort, wofür die App gebaut ist.
   *
   * Jetzt: erst die Seite selbst aus dem Cache (schon einmal besucht), dann
   * die Startseite – aber nur, wenn die Startseite auch gemeint war. Sonst
   * eine ehrliche Offline-Antwort statt der falschen Seite.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            // Unter dem PFAD ablegen, nicht der vollen URL: Detail-Links
            // tragen GPS-Koordinaten auf fünf Stellen – sonst wäre jeder
            // Aufruf desselben Platzes ein neuer Eintrag, für immer. Die
            // Identität steckt bei /ort/ im Pfad, bei /platz/ ist die Hülle
            // ohnehin gleich. Dazu ein Deckel gegen wochenlanges Wachsen.
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put(new Request(url.pathname), copy);
              trimCache(SHELL_CACHE, 60);
            });
          }
          return response;
        })
        .catch(async () => {
          const besucht = await caches.match(new Request(url.pathname), { ignoreSearch: true });
          if (besucht) return besucht;
          if (url.pathname === "/") {
            const huelle = await caches.match("/");
            if (huelle) return huelle;
          }
          return offlineSeite();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok && url.pathname.startsWith("/_next/static")) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
