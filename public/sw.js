/*
 * Bewusst schlanker Service Worker:
 * - App-Shell und Icons kommen aus dem Cache (schneller Start, offline sichtbar)
 * - Kartenkacheln: Cache first mit Deckel, damit bekannte Gegenden schnell laden
 * - API-Daten: immer aus dem Netz. Ein veralteter Schatten wäre schlimmer als
 *   gar keiner – nur wenn das Netz ausfällt, greifen wir auf die Kopie zurück.
 */
const VERSION = "v2";
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.hostname.endsWith("tile.openstreetmap.org")) {
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

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/")) ?? Response.error()),
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
