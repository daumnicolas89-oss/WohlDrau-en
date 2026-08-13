import { bboxAround, haversine, offsetMeters } from "./utils";
import type {
  NearBuilding,
  OsmPlace,
  PlaceTags,
  PlaceType,
  ShadeConfidence,
  ShadeQuality,
  Toilet,
} from "@/types";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/**
 * Kurz genug, dass der Spiegel noch eine Chance bekommt, bevor jemand aufgibt.
 * Öffentliche Overpass-Instanzen sind zeitweise überlastet, das ist der
 * Normalfall, nicht die Ausnahme.
 */
const ENDPOINT_TIMEOUT_MS = 28_000;

/** Ohne Höhen-Tags in OSM: Annahme ~3,5 Geschosse in deutschen Wohnlagen. */
const DEFAULT_BUILDING_HEIGHT_M = 11;
/** Nur Gebäude in diesem Umkreis können den Ort realistisch beschatten. */
const BUILDING_SEARCH_RADIUS_M = 90;
const MAX_BUILDINGS_PER_PLACE = 24;
/** Kronenfläche eines ausgewachsenen Stadtbaums. */
const TREE_CANOPY_M2 = 80;
const TOILET_MAX_DISTANCE_M = 150;
const WATER_MAX_DISTANCE_M = 120;

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

function buildQuery(bbox: [number, number, number, number]): string {
  const b = bbox.map((n) => n.toFixed(5)).join(",");
  return `[out:json][timeout:25];
(
  nwr["leisure"="playground"](${b});
  nwr["leisure"="park"](${b});
  nwr["leisure"="garden"]["access"!="private"](${b});
  nwr["natural"="wood"](${b});
  nwr["landuse"="forest"](${b});
);
out tags center bb;
(
  node["amenity"="toilets"](${b});
  node["amenity"="drinking_water"](${b});
  node["amenity"="water_point"](${b});
);
out tags center;
node["natural"="tree"](${b});
out skel qt;
way["building"](${b});
out ids center;
way["highway"~"^(residential|living_street|unclassified|tertiary|secondary|pedestrian)$"]["name"](${b});
out tags geom;`;
}

/** Overpass antwortet mit 429/504, wenn gerade kein Slot frei ist. Das ist
 * kein Fehler, sondern eine Bitte um Geduld, kurz warten hilft mehr als der
 * sofortige Wechsel auf einen Spiegel, der ebenfalls überlastet sein kann. */
const RETRY_STATUS = new Set([429, 502, 503, 504]);
const RETRIES_PER_ENDPOINT = 3;
const RETRY_BASE_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runOverpass(query: string): Promise<OverpassElement[]> {
  let lastError: unknown = null;

  for (const endpoint of ENDPOINTS) {
    for (let attempt = 0; attempt < RETRIES_PER_ENDPOINT; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
            "User-Agent": "WohlDraussen/0.1",
          },
          body: query,
          signal: AbortSignal.timeout(ENDPOINT_TIMEOUT_MS),
        });

        if (res.ok) {
          const json = (await res.json()) as { elements?: OverpassElement[] };
          return json.elements ?? [];
        }

        lastError = new Error(`Overpass ${endpoint} → HTTP ${res.status}`);
        if (!RETRY_STATUS.has(res.status)) break;
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
      } catch (err) {
        lastError = err;
        // Zeitüberschreitung: einmal nachfassen, dann den nächsten Spiegel.
        if (attempt === RETRIES_PER_ENDPOINT - 1) break;
        await sleep(RETRY_BASE_DELAY_MS);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Overpass nicht erreichbar");
}

function centerOf(el: OverpassElement): { lat: number; lng: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  if (el.bounds) {
    return {
      lat: (el.bounds.minlat + el.bounds.maxlat) / 2,
      lng: (el.bounds.minlon + el.bounds.maxlon) / 2,
    };
  }
  return null;
}

function areaOf(el: OverpassElement): number | null {
  if (!el.bounds) return null;
  const { minlat, minlon, maxlat, maxlon } = el.bounds;
  const midLat = (minlat + maxlat) / 2;
  const h = (maxlat - minlat) * 110574;
  const w = (maxlon - minlon) * 111320 * Math.cos((midLat * Math.PI) / 180);
  // Die Bounding-Box überschätzt die echte Fläche; ~0,7 ist ein brauchbarer Faktor.
  return Math.max(0, h * w * 0.7);
}

function yesNo(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (["yes", "designated", "customers", "public", "1", "true"].includes(value))
    return true;
  if (["no", "none", "0", "false"].includes(value)) return false;
  return undefined;
}

function isAccessible(tags: Record<string, string>): boolean {
  if (tags.access && ["private", "no", "permit"].includes(tags.access)) return false;
  if (tags.indoor === "yes") return false;
  return true;
}

function fencedFrom(tags: Record<string, string>): boolean | undefined {
  const explicit = yesNo(tags.fenced);
  if (explicit !== undefined) return explicit;
  const barrier = tags.barrier;
  if (!barrier) return undefined;
  if (["fence", "hedge", "wall", "wall;fence", "railing", "gate"].includes(barrier))
    return true;
  return undefined;
}

/**
 * Ein echtes Foto, falls OSM eines kennt. `wikimedia_commons` ist die
 * verlässliche Quelle (Special:FilePath liefert das Bild direkt); ein `image`-
 * Tag nur, wenn es sicher über https lädt, sonst blockiert es der Browser.
 */
function imageUrlFrom(tags: Record<string, string>): string | undefined {
  const commons = tags.wikimedia_commons;
  // Nur einzelne Dateien liefern ein Bild, „Category:…" verweist auf eine
  // Sammlung ohne direktes Foto und würde ins Leere laufen.
  if (commons && !/^Category:/i.test(commons.trim())) {
    const file = commons.replace(/^File:/i, "").trim();
    if (file) {
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
        file,
      )}?width=800`;
    }
  }
  const direct = tags.image;
  if (direct && /^https:\/\//.test(direct)) return direct;
  return undefined;
}

function ageGroupFrom(tags: Record<string, string>): string | undefined {
  const min = Number.parseInt(tags.min_age ?? "", 10);
  const max = Number.parseInt(tags.max_age ?? "", 10);
  const hasMin = Number.isFinite(min);
  const hasMax = Number.isFinite(max);
  if (hasMin && hasMax) return `${min}–${max} Jahre`;
  if (hasMax) return `bis ${max} Jahre`;
  if (hasMin) return `ab ${min} Jahren`;
  return undefined;
}

function shadeQuality(canopy: number, confidence: ShadeConfidence): ShadeQuality {
  if (confidence === "low" && canopy < 0.2) return "unknown";
  if (canopy >= 0.55) return "good";
  if (canopy >= 0.28) return "medium";
  return "poor";
}

interface Point {
  lat: number;
  lng: number;
}

/** Einfaches Gitter, damit Umkreissuchen nicht über alle Bäume/Gebäude laufen. */
class Grid<T extends Point> {
  private cells = new Map<string, T[]>();
  private readonly size: number;

  constructor(items: T[], cellSizeDeg = 0.002) {
    this.size = cellSizeDeg;
    for (const item of items) {
      const key = this.key(item.lat, item.lng);
      const bucket = this.cells.get(key);
      if (bucket) bucket.push(item);
      else this.cells.set(key, [item]);
    }
  }

  private key(lat: number, lng: number) {
    return `${Math.floor(lat / this.size)}:${Math.floor(lng / this.size)}`;
  }

  near(lat: number, lng: number, radiusM: number): T[] {
    const span = Math.ceil(radiusM / 111000 / this.size);
    const out: T[] = [];
    const baseLat = Math.floor(lat / this.size);
    const baseLng = Math.floor(lng / this.size);
    for (let i = -span; i <= span; i++) {
      for (let j = -span; j <= span; j++) {
        const bucket = this.cells.get(`${baseLat + i}:${baseLng + j}`);
        if (bucket) out.push(...bucket);
      }
    }
    return out.filter((p) => haversine(lat, lng, p.lat, p.lng) <= radiusM);
  }
}

const DEFAULT_NAMES = new Set(["Spielplatz", "Grünfläche"]);
/** Derselbe Ort ist in OSM oft doppelt erfasst, als Punkt und als Fläche. */
const DUPLICATE_RADIUS_M = 45;

/** Je mehr ein Eintrag weiß, desto eher ist er der brauchbare Zwilling. */
function richness(place: OsmPlace): number {
  const known = Object.values(place.tags).filter(
    (value) => value !== undefined,
  ).length;
  return (
    (DEFAULT_NAMES.has(place.name) ? 0 : 10) +
    known +
    (place.shadeInputs.areaM2 ? 3 : 0) +
    (place.shadeInputs.treeCount > 0 ? 1 : 0)
  );
}

function sameThing(a: OsmPlace, b: OsmPlace): boolean {
  if (a.type !== b.type) return false;
  if (haversine(a.lat, a.lng, b.lat, b.lng) > DUPLICATE_RADIUS_M) return false;
  const aNamed = !DEFAULT_NAMES.has(a.name);
  const bNamed = !DEFAULT_NAMES.has(b.name);
  // Zwei verschiedene Namen so dicht beieinander sind meist wirklich zwei Orte.
  if (aNamed && bNamed) return a.name === b.name;
  return true;
}

export function dedupe(places: OsmPlace[]): OsmPlace[] {
  const ordered = [...places].sort((a, b) => richness(b) - richness(a));
  const kept: OsmPlace[] = [];
  for (const place of ordered) {
    if (!kept.some((other) => sameThing(place, other))) kept.push(place);
  }
  return kept;
}

/**
 * Bewusst ohne „an der/am": Das grammatische Geschlecht lässt sich aus dem
 * Straßennamen nicht zuverlässig raten (der Jungfernstieg, aber die
 * Lindenstraße). Der Name ohne Präposition ist immer korrekt und liest sich
 * wie eine Ortsangabe: „Spielplatz Jungfernstieg".
 */
function withStreet(base: string, street: string): string {
  return `${base} ${street}`;
}

/**
 * Name der benannten Grünfläche, in der ein Ort liegt, für Spielplätze mitten
 * im Park, die keine Straße in der Nähe haben. Die kleinste passende Fläche
 * gewinnt (spezifischer: „Alter Botanischer Garten" statt „Innenstadt").
 */
function namedGreenAt(
  greens: OverpassElement[],
  lat: number,
  lng: number,
): string | null {
  let best: { name: string; area: number } | null = null;
  for (const g of greens) {
    const name = g.tags?.name;
    if (!name || !g.bounds) continue;
    const { minlat, minlon, maxlat, maxlon } = g.bounds;
    if (lat < minlat || lat > maxlat || lng < minlon || lng > maxlon) continue;
    const area = (maxlat - minlat) * (maxlon - minlon);
    if (!best || area < best.area) best = { name, area };
  }
  return best ? best.name : null;
}

/**
 * Grobe Himmelsrichtung eines Punkts relativ zum Mittelpunkt einer Gruppe –
 * um gleichnamige Orte (zwei Spielplätze an derselben Straße) zu unterscheiden.
 * Längengrad wird mit cos(Breite) skaliert, damit Ost/West stimmt.
 */
function compassLabel(dLatDeg: number, dLngDeg: number, atLatDeg: number): string {
  const dy = dLatDeg;
  const dx = dLngDeg * Math.cos((atLatDeg * Math.PI) / 180);
  const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
  const dirs = ["Nord", "Nordost", "Ost", "Südost", "Süd", "Südwest", "West", "Nordwest"];
  return dirs[Math.round((((angle % 360) + 360) % 360) / 45) % 8];
}

/** Name der nächstgelegenen benannten Straße, oder null, wenn keine nah genug ist. */
function nearestStreetName(
  grid: Grid<Point & { name: string }>,
  lat: number,
  lng: number,
  radiusM = 200,
): string | null {
  const near = grid.near(lat, lng, radiusM);
  if (near.length === 0) return null;
  let best = near[0];
  let bestD = haversine(lat, lng, best.lat, best.lng);
  for (const point of near) {
    const d = haversine(lat, lng, point.lat, point.lng);
    if (d < bestD) {
      bestD = d;
      best = point;
    }
  }
  return best.name;
}

export interface FetchPlacesResult {
  places: OsmPlace[];
  /** Öffentliche Toiletten im Umkreis, für die Toiletten-Suche. */
  toilets: Toilet[];
  /** Wie gut ist die Baum-Datenlage in diesem Gebiet? */
  treeDataQuality: ShadeConfidence;
}

export async function fetchPlaces(
  lat: number,
  lng: number,
  radiusM: number,
): Promise<FetchPlacesResult> {
  const elements = await runOverpass(buildQuery(bboxAround(lat, lng, radiusM)));

  const rawPlaces: OverpassElement[] = [];
  const greens: OverpassElement[] = [];
  const toilets: (Point & { tags: Record<string, string>; id: string })[] = [];
  const waters: Point[] = [];
  const trees: Point[] = [];
  const buildings: Point[] = [];
  const streetPoints: (Point & { name: string })[] = [];

  for (const el of elements) {
    const tags = el.tags;
    if (!tags) {
      // Ohne Tags kommen genau zwei Sorten an: Bäume (`out skel`) und
      // Gebäude (`out ids center`).
      if (el.type === "node" && typeof el.lat === "number" && typeof el.lon === "number") {
        trees.push({ lat: el.lat, lng: el.lon });
      } else if (el.center) {
        buildings.push({ lat: el.center.lat, lng: el.center.lon });
      }
      continue;
    }
    // Benannte Straßen: alle Stützpunkte sammeln, um später namenlosen
    // Orten die nächstgelegene Straße als Kennung anzuhängen.
    if (tags.highway) {
      if (tags.name && el.geometry) {
        for (const g of el.geometry) {
          streetPoints.push({ lat: g.lat, lng: g.lon, name: tags.name });
        }
      }
      continue;
    }

    const c = centerOf(el);
    if (!c) continue;

    if (tags.amenity === "toilets") {
      toilets.push({ ...c, tags, id: `${el.type}/${el.id}` });
      continue;
    }
    if (tags.amenity === "drinking_water" || tags.amenity === "water_point") {
      waters.push(c);
      continue;
    }
    if (tags.leisure === "playground" || tags.leisure === "park") {
      if (isAccessible(tags)) rawPlaces.push(el);
      if (tags.leisure === "park") greens.push(el);
      continue;
    }
    if (tags.leisure === "garden" || tags.natural === "wood" || tags.landuse === "forest") {
      greens.push(el);
    }
  }

  const treeGrid = new Grid(trees);
  const buildingGrid = new Grid(buildings);
  const toiletGrid = new Grid(toilets);
  const waterGrid = new Grid(waters);

  const treeDataQuality: ShadeConfidence =
    trees.length > 400 ? "high" : trees.length > 60 ? "medium" : "low";

  const places: OsmPlace[] = [];
  const seen = new Set<string>();

  for (const el of rawPlaces) {
    const c = centerOf(el);
    const osmTags = el.tags!;
    if (!c) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const type: PlaceType = osmTags.leisure === "park" ? "park" : "playground";
    const areaM2 = areaOf(el);
    // Suchradius für Bäume: bei Punkt-Objekten pauschal 40 m.
    const extent = areaM2 ? Math.sqrt(areaM2) / 2 : 40;
    const treeRadius = Math.min(120, Math.max(35, extent));
    const treeCount = treeGrid.near(c.lat, c.lng, treeRadius).length;

    const effectiveArea = areaM2 ?? Math.PI * treeRadius ** 2;
    let canopy = Math.min(1, (treeCount * TREE_CANOPY_M2) / Math.max(400, effectiveArea));

    const inGreen =
      type === "park" ||
      greens.some((g) => {
        if (!g.bounds) return false;
        const pad = 0.0004; // ~45 m Toleranz
        return (
          c.lat >= g.bounds.minlat - pad &&
          c.lat <= g.bounds.maxlat + pad &&
          c.lng >= g.bounds.minlon - pad &&
          c.lng <= g.bounds.maxlon + pad
        );
      });

    // In Parks und Wäldern sind längst nicht alle Bäume erfasst.
    if (inGreen) canopy = Math.max(canopy, treeDataQuality === "low" ? 0.4 : 0.25);
    if (osmTags.natural === "wood" || osmTags.landuse === "forest") {
      canopy = Math.max(canopy, 0.8);
    }

    const nearBuildings: NearBuilding[] = buildingGrid
      .near(c.lat, c.lng, BUILDING_SEARCH_RADIUS_M)
      .map((b) => {
        const { dx, dy } = offsetMeters(c.lat, c.lng, b.lat, b.lng);
        return { dx: Math.round(dx), dy: Math.round(dy), h: DEFAULT_BUILDING_HEIGHT_M };
      })
      .sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy))
      .slice(0, MAX_BUILDINGS_PER_PLACE);

    const nearestToilet = toiletGrid
      .near(c.lat, c.lng, TOILET_MAX_DISTANCE_M)
      .map((t) => ({ t, d: haversine(c.lat, c.lng, t.lat, t.lng) }))
      .sort((a, b) => a.d - b.d)[0];

    const ownToilet = yesNo(osmTags.toilets);
    const hasWater =
      waterGrid.near(c.lat, c.lng, WATER_MAX_DISTANCE_M).length > 0 ||
      osmTags.drinking_water === "yes";
    // Wasser zum Planschen (Matschanlage, Splash-Pad) ist etwas anderes als
    // Trinkwasser, und an heißen Tagen der Top-Wunsch mit Kind.
    const waterPlay =
      osmTags["playground:water"] === "yes" ||
      osmTags.playground === "water" ||
      osmTags.playground === "splash_pad" ||
      osmTags["playground:splash_pad"] === "yes" ||
      osmTags.leisure === "splash_pad" ||
      osmTags.leisure === "paddling_pool"
        ? true
        : undefined;

    const confidence: ShadeConfidence =
      treeDataQuality === "high" && nearBuildings.length > 0
        ? "high"
        : treeDataQuality === "low" && nearBuildings.length === 0
          ? "low"
          : "medium";

    const tags: PlaceTags = {
      fenced: fencedFrom(osmTags),
      toilet: ownToilet === true || nearestToilet ? true : ownToilet,
      changing_table:
        yesNo(osmTags.changing_table) ??
        (nearestToilet ? yesNo(nearestToilet.t.tags.changing_table) : undefined),
      drinking_water: hasWater ? true : undefined,
      water_play: waterPlay,
      shade: shadeQuality(canopy, confidence),
      surface: osmTags.surface,
      age_group: ageGroupFrom(osmTags),
      shelter: yesNo(osmTags.shelter) ?? yesNo(osmTags.covered),
      wheelchair: yesNo(osmTags.wheelchair),
    };

    places.push({
      id,
      name: osmTags.name ?? (type === "park" ? "Grünfläche" : "Spielplatz"),
      lat: c.lat,
      lng: c.lng,
      type,
      tags,
      shadeInputs: {
        canopy: Number(canopy.toFixed(3)),
        treeCount,
        inGreen,
        areaM2: areaM2 ? Math.round(areaM2) : null,
        buildings: nearBuildings,
        confidence,
      },
      toiletDistance: nearestToilet ? Math.round(nearestToilet.d) : null,
      imageUrl: imageUrlFrom(osmTags),
    });
  }

  // Winzige, namenlose Grünschnipsel bringen niemanden weiter.
  const relevant = places.filter(
    (p) => p.type === "playground" || (p.shadeInputs.areaM2 ?? 0) > 1500,
  );

  const deduped = dedupe(relevant);

  // Namenlose Orte unterscheidbar machen: erst über die nächste Straße, sonst
  // über den Namen der Grünfläche, in der sie liegen (Park-Spielplätze).
  const streetGrid = streetPoints.length > 0 ? new Grid(streetPoints) : null;
  for (const place of deduped) {
    if (!DEFAULT_NAMES.has(place.name)) continue;
    const street = streetGrid
      ? nearestStreetName(streetGrid, place.lat, place.lng)
      : null;
    if (street) {
      place.name = withStreet(place.name, street);
      continue;
    }
    const green = namedGreenAt(greens, place.lat, place.lng);
    if (green) place.name = `${place.name} ${green}`;
  }

  // Bleiben Namen doppelt (zwei Spielplätze an derselben Straße), eine grobe
  // Himmelsrichtung dazusetzen, damit sie unterscheidbar werden.
  const byName = new Map<string, OsmPlace[]>();
  for (const place of deduped) {
    const bucket = byName.get(place.name);
    if (bucket) bucket.push(place);
    else byName.set(place.name, [place]);
  }
  for (const group of byName.values()) {
    if (group.length < 2) continue;
    const clat = group.reduce((sum, p) => sum + p.lat, 0) / group.length;
    const clng = group.reduce((sum, p) => sum + p.lng, 0) / group.length;
    for (const place of group) {
      place.name = `${place.name} (${compassLabel(place.lat - clat, place.lng - clng, clat)})`;
    }
  }

  // Letzte Sicherung: sollte ein Name trotz Himmelsrichtung noch doppelt sein
  // (drei Orte, gleiche Richtung), durchnummerieren, garantiert eindeutig.
  const used = new Map<string, number>();
  for (const place of deduped) {
    const count = (used.get(place.name) ?? 0) + 1;
    used.set(place.name, count);
    if (count > 1) place.name = `${place.name} ${count}`;
  }

  const publicToilets: Toilet[] = toilets.map((t) => ({
    id: t.id,
    lat: t.lat,
    lng: t.lng,
    wheelchair: yesNo(t.tags.wheelchair),
    changingTable: yesNo(t.tags.changing_table),
    fee: yesNo(t.tags.fee),
  }));

  return { places: deduped, toilets: publicToilets, treeDataQuality };
}
