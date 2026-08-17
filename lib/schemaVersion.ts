/**
 * Version der Orts-Datenform, die /api/places liefert.
 *
 * Sie MUSS an drei Stellen übereinstimmen: im Server-Cache-Schlüssel, im
 * ?v=-Parameter des Abrufs und im lastVisit-Schnellstart-Speicher. Vorher
 * lebte in jeder Datei eine eigene Zahl – die Route stand bei 5, der
 * lastVisit-Speicher noch bei 3 und hydrierte kommentarlos alte Objektformen
 * in neuen Code. Deshalb: eine Konstante, drei Verbraucher.
 */
export const PLACES_SCHEMA_VERSION = 5;
