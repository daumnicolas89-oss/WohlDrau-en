import { PLACES_SCHEMA_VERSION } from "./schemaVersion";
/**
 * Letzter-Besuch-Speicher: Beim Öffnen zeigt die App sofort den Stand des
 * letzten Besuchs und aktualisiert still im Hintergrund – statt Sekunden auf
 * Skelette zu starren. Ungefährlich für die Genauigkeit: Schatten und
 * Bewertung rechnet der Client ohnehin live; hier liegen nur träge Rohdaten
 * (Orte, Bäume, Ausstattung, Wetter-Stunden).
 */

/** Bei Formatänderungen hochzählen, dann wird alter Stand ignoriert. */
// An die Datenform der API gekoppelt: Ändert sich das Schema, läuft der
// Schnellstart-Speicher ins Leere statt alte Objektformen zu hydrieren.
const VERSION = PLACES_SCHEMA_VERSION;

interface Envelope<T> {
  v: number;
  at: number;
  value: T;
}

export function saveLastVisit<T>(key: string, value: T): void {
  if (typeof localStorage === "undefined") return;
  try {
    const envelope: Envelope<T> = { v: VERSION, at: Date.now(), value };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Voller Speicher oder privater Modus – dann eben ohne Schnellstart.
  }
}

export function loadLastVisit<T>(key: string, maxAgeMs: number): T | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Envelope<T>;
    if (envelope.v !== VERSION) return null;
    if (!Number.isFinite(envelope.at) || Date.now() - envelope.at > maxAgeMs) {
      return null;
    }
    return envelope.value ?? null;
  } catch {
    return null;
  }
}
