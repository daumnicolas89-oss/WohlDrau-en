export type PlaceType = "playground" | "park" | "other";

/** Feinere Kategorie nur für die Anzeige (Label/Icon), unabhängig von der
 *  Bewertung. Grünflächen, Wäldchen und Gärten teilen sich den Score-Typ „park". */
export type PlaceKind = "playground" | "park" | "wood" | "garden";

/** Statische Schatten-Einschätzung eines Ortes (unabhängig von der Uhrzeit). */
export type ShadeQuality = "good" | "medium" | "poor" | "unknown";

/**
 * Ausstattung. Bewusst optional statt `boolean`: OpenStreetMap weiß vieles
 * schlicht nicht, und „unbekannt“ darf nicht als „nicht vorhanden“ erscheinen.
 */
export interface PlaceTags {
  fenced?: boolean;
  toilet?: boolean;
  changing_table?: boolean;
  drinking_water?: boolean;
  /** Wasser zum Planschen (Matschanlage, Wasserspielplatz) – nicht zum Trinken. */
  water_play?: boolean;
  shade?: ShadeQuality;
  surface?: string;
  age_group?: string;
  shelter?: boolean;
  wheelchair?: boolean;
  /** Zugang laut OSM eingeschränkt (z. B. Schulhof), anzeigen mit Hinweis. */
  restrictedAccess?: boolean;
}

/** Gebäude in der Nähe, relativ zum Ort in Metern. Basis für den Gebäudeschatten. */
export interface NearBuilding {
  /** Meter nach Osten */
  dx: number;
  /** Meter nach Norden */
  dy: number;
  /** geschätzte Höhe in Metern */
  h: number;
}

export type ShadeConfidence = "high" | "medium" | "low";

/** Was die Schattenberechnung über die Umgebung des Ortes braucht. */
export interface ShadeInputs {
  /** 0..1 – geschätzter Kronendeckungsgrad */
  canopy: number;
  /** Laubtyp der prägenden Baumfläche: Nadelwald bleibt im Winter dicht. */
  canopyLeaf?: "needle" | "broad" | "mixed";
  /** Gelände-Horizont in Grad je Himmelsrichtungs-Achtel (N, NO, O, …):
   *  steht die Sonne flacher, verschattet der Hügel den Platz. */
  horizon?: number[];
  treeCount: number;
  /** liegt in oder an einer Grünfläche */
  inGreen: boolean;
  areaM2: number | null;
  buildings: NearBuilding[];
  confidence: ShadeConfidence;
}

/** Ein Ort, wie ihn `/api/places` liefert – ohne Bewertung. */
export interface OsmPlace {
  /** OSM-Referenz, z. B. "way/12345" */
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: PlaceType;
  /** Anzeige-Kategorie (Spielplatz, Grünfläche, Wäldchen, Garten). */
  kind: PlaceKind;
  tags: PlaceTags;
  shadeInputs: ShadeInputs;
  /** Entfernung zur nächsten Toilette in Metern, falls eine gefunden wurde. */
  toiletDistance: number | null;
  /** Echtes Foto aus OSM (Tag `image` oder `wikimedia_commons`), falls vorhanden. */
  imageUrl?: string;
}

/** Eine öffentliche Toilette aus OpenStreetMap (amenity=toilets). */
export interface Toilet {
  id: string;
  lat: number;
  lng: number;
  wheelchair?: boolean;
  changingTable?: boolean;
  fee?: boolean;
}

export type ShadeState = "no-sun" | "shady" | "partial" | "sunny";

export interface ShadeResult {
  /** 0..1 – Anteil Schatten */
  index: number;
  state: ShadeState;
  sunAltitudeDeg: number;
  fromCanopy: number;
  fromBuildings: number;
  fromClouds: number;
  /** 1, wenn ein Hügel/Berg die Sonne gerade komplett verdeckt. */
  fromTerrain?: number;
}

/** Die vier Bestandteile des „Angenehm jetzt“-Scores, jeweils 0–100. */
export interface ScoreBreakdown {
  shadeScore: number;
  amenityScore: number;
  statusScore: number;
  distanceScore: number;
  /** Regen und Wind dämpfen das Gesamtergebnis (0..1). */
  weatherFactor: number;
  /**
   * Tatsächlich verwendete Gewichte (0..1). Schatten schrumpft, wenn er beim
   * aktuellen Wetter kaum zählt – dann entscheiden Ausstattung und Nähe mehr,
   * damit es auch an milden Tagen einen echten Sieger gibt.
   */
  weights: { shade: number; amenity: number; status: number; distance: number };
}

/** Bewerteter Ort – das, womit die UI arbeitet. */
export interface Place extends OsmPlace {
  /** in Metern, clientseitig berechnet */
  distance?: number;
  /** 0–100 */
  currentShadeScore: number;
  /** 0–100, Hauptsortierung */
  pleasantScore: number;
  lastStatuses: PlaceStatus[];
  shade: ShadeResult;
  breakdown: ScoreBreakdown;
  reasons: string[];
  warnings: string[];
}

export type PlaceStatusType =
  | "great"
  | "too_sunny"
  | "too_crowded"
  | "toilet_closed"
  | "wet"
  | "dirty_broken"
  | "other";

export interface PlaceStatus {
  id: string;
  placeId: string;
  type: PlaceStatusType;
  message?: string;
  /** ISO */
  createdAt: string;
  /** ISO */
  expiresAt: string;
}

export interface Weather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  cloudCover: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  uvIndex: number;
  isDay: boolean;
  /** WMO-Wettercode (Open-Meteo) – für Schnee, gefrierenden Regen, Reifnebel. */
  weatherCode: number;
  /** Schneefall der letzten Stunde in cm. */
  snowfall: number;
  /**
   * UTC-Versatz des Orts in Sekunden (Open-Meteo). Optional, weil alte
   * gecachte Antworten ihn nicht tragen – dann fällt `weatherAt` auf die
   * Geräte-Zeitzone zurück (für Nutzer vor Ort identisch).
   */
  utcOffsetSeconds?: number;
  /** 15-Minuten-Niederschlag der nächsten ~3 Stunden, radar-gestützt. */
  minutely15?: {
    time: string[];
    precipitation: number[];
  };
  /** stündliche Vorschau ab jetzt, für „+30 Min“ und „+1 Std“ */
  hourly: {
    time: string[];
    temperature: number[];
    apparentTemperature: number[];
    cloudCover: number[];
    precipitationProbability: number[];
    uvIndex: number[];
  };
}
