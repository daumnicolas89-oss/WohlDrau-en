import type {
  OsmPlace,
  PlaceStatus,
  PlaceStatusType,
  ShadeInputs,
  Weather,
} from "../types";

type PlaceOverrides = Partial<Omit<OsmPlace, "shadeInputs">> & {
  shadeInputs?: Partial<ShadeInputs>;
};

export function place(overrides: PlaceOverrides = {}): OsmPlace {
  return {
    id: "way/1",
    name: "Testplatz",
    lat: 48.137,
    lng: 11.575,
    type: "playground",
    tags: {},
    toiletDistance: null,
    ...overrides,
    shadeInputs: {
      canopy: 0,
      treeCount: 0,
      inGreen: false,
      areaM2: 2500,
      buildings: [],
      confidence: "high",
      ...overrides.shadeInputs,
    },
  };
}

export function weather(overrides: Partial<Weather> = {}): Weather {
  const hourly = {
    time: ["2026-06-21T13:00"],
    temperature: [30],
    apparentTemperature: [31],
    cloudCover: [0],
    precipitationProbability: [0],
    uvIndex: [8],
    ...overrides.hourly,
  };
  return {
    time: "2026-06-21T13:00",
    temperature: hourly.temperature[0],
    apparentTemperature: hourly.apparentTemperature[0],
    cloudCover: hourly.cloudCover[0],
    precipitation: 0,
    precipitationProbability: hourly.precipitationProbability[0],
    windSpeed: 6,
    uvIndex: hourly.uvIndex[0],
    isDay: true,
    ...overrides,
    hourly,
  };
}

/** Frische Meldung mit der üblichen Gültigkeit von 3 Stunden. */
export function status(
  type: PlaceStatusType,
  ageMinutes: number,
  now: number,
  placeId = "way/1",
): PlaceStatus {
  const createdAt = new Date(now - ageMinutes * 60_000);
  return {
    id: `${type}-${ageMinutes}`,
    placeId,
    type,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 3 * 60 * 60_000).toISOString(),
  };
}

/**
 * 21. Juni über München, bewusst in UTC angegeben: Die Zeitzone der
 * Testmaschine darf den Sonnenstand nicht verschieben. Sonnenhöchststand
 * liegt hier gegen 11:15 UTC.
 */
export const summer = (utcHour: number, utcMinute = 0) =>
  new Date(Date.UTC(2026, 5, 21, utcHour, utcMinute));

export const NOON = summer(11);
export const EVENING = summer(17, 30);
export const NIGHT = summer(22);
