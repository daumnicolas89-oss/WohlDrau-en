/**
 * Genauigkeits-Prüfung der Schatten-/Sonnen-Kette gegen bekannte Physik:
 * Sonnenstand (Einheiten!), Schattenrichtung und -länge von Gebäuden,
 * Kronendeckung, Lichtungen, Multipolygon-Ringe, Zustands-Schwellen.
 * Ausführen mit: npx tsx scripts/accuracy-check.ts
 * Gehört bewusst ins Repo – vor Änderungen an sun.ts/canopy.ts laufen lassen.
 */
import * as SunCalc from "suncalc";
import { computeShade, shadeStateOf } from "../lib/sun";
import { coverCanopyAt } from "../lib/canopy";
import type { OsmPlace } from "../types";

let failures = 0;
function check(name: string, ok: boolean, detail: string) {
  console.log(`${ok ? "✅" : "❌"} ${name} — ${detail}`);
  if (!ok) failures++;
}

const MUC = { lat: 48.1372, lng: 11.5755 };

function place(overrides: Partial<OsmPlace["shadeInputs"]> = {}): OsmPlace {
  return {
    id: "way/1",
    name: "Test",
    lat: MUC.lat,
    lng: MUC.lng,
    type: "playground",
    kind: "playground",
    tags: {},
    toiletDistance: null,
    shadeInputs: {
      canopy: 0,
      treeCount: 0,
      inGreen: false,
      areaM2: 1600,
      buildings: [],
      confidence: "high",
      ...overrides,
    },
  };
}

// ---------- 1. SunCalc-Einheiten gegen bekannte Astronomie ----------
// Sonnenhöchststand München zur Sommersonnenwende: ~65,3° (90 − 48,14 + 23,44),
// Azimut dabei ~180° (Süden). 21.06.2026, 13:15 MESZ = 11:15 UTC.
{
  const noon = new Date(Date.UTC(2026, 5, 21, 11, 15));
  const p = SunCalc.getPosition(noon, MUC.lat, MUC.lng);
  check(
    "Sonnenhöhe Mittag Sonnenwende ≈ 65°",
    p.altitude > 63 && p.altitude < 67,
    `altitude=${p.altitude.toFixed(2)}° (wäre Radiant: ~1.14)`,
  );
  check(
    "Azimut Mittag ≈ 180° (Süden, ab Nord im Uhrzeigersinn)",
    p.azimuth > 170 && p.azimuth < 190,
    `azimuth=${p.azimuth.toFixed(1)}°`,
  );

  const evening = new Date(Date.UTC(2026, 5, 21, 17, 30)); // 19:30 MESZ
  const pe = SunCalc.getPosition(evening, MUC.lat, MUC.lng);
  check(
    "Abends steht die Sonne im Westen (Azimut 250–300°)",
    pe.azimuth > 250 && pe.azimuth < 300,
    `azimuth=${pe.azimuth.toFixed(1)}°, altitude=${pe.altitude.toFixed(1)}°`,
  );

  const midnight = new Date(Date.UTC(2026, 5, 21, 23, 0));
  const pm = SunCalc.getPosition(midnight, MUC.lat, MUC.lng);
  check("Nachts ist die Höhe negativ", pm.altitude < 0, `altitude=${pm.altitude.toFixed(1)}°`);

  // Winter-Gegenprobe: 21.12., Mittag → ~18,4°
  const winterNoon = new Date(Date.UTC(2026, 11, 21, 11, 15));
  const pw = SunCalc.getPosition(winterNoon, MUC.lat, MUC.lng);
  check(
    "Wintersonne Mittag ≈ 18° (flach)",
    pw.altitude > 16 && pw.altitude < 21,
    `altitude=${pw.altitude.toFixed(2)}°`,
  );
}

// ---------- 2. Gebäudeschatten: Richtung und Reichweite ----------
{
  const noon = new Date(Date.UTC(2026, 5, 21, 11, 15)); // Sonne hoch im Süden

  // Gebäude 20 m SÜDLICH (dy=-20), 15 m hoch: Schatten mittags nur ~7 m lang
  // → erreicht den Platz NICHT. Wer hier "schattig" meldete, würde lügen.
  const southNear = computeShade(
    place({ buildings: [{ dx: 0, dy: -20, h: 15 }] }),
    noon,
    0,
  );
  check(
    "Mittags: 15-m-Haus 20 m südlich wirft KEINEN Schatten auf den Platz",
    southNear.fromBuildings < 0.05,
    `fromBuildings=${southNear.fromBuildings.toFixed(3)} (Schattenlänge ~${(15 / Math.tan((65 * Math.PI) / 180)).toFixed(1)} m)`,
  );

  // Gleiches Haus NÖRDLICH: liegt sonnenabgewandt, darf nie beschatten.
  const north = computeShade(place({ buildings: [{ dx: 0, dy: 20, h: 15 }] }), noon, 0);
  check(
    "Mittags: Haus im NORDEN beschattet nie",
    north.fromBuildings === 0,
    `fromBuildings=${north.fromBuildings}`,
  );

  // Abends: Haus exakt ZWISCHEN Platz und Sonne (Azimut ~288,6°), 30 m
  // entfernt → langer Schatten (15 m Haus, Sonne 15° hoch → ~56 m) trifft voll.
  const evening = new Date(Date.UTC(2026, 5, 21, 17, 30));
  const az = SunCalc.getPosition(evening, MUC.lat, MUC.lng).azimuth * (Math.PI / 180);
  const towardSun = { dx: 30 * Math.sin(az), dy: 30 * Math.cos(az), h: 15 };
  const westEvening = computeShade(place({ buildings: [towardSun] }), evening, 0);
  check(
    "Abends: Haus in Sonnenrichtung beschattet den Platz deutlich",
    westEvening.fromBuildings > 0.7,
    `fromBuildings=${westEvening.fromBuildings.toFixed(3)} (Haus bei dx=${towardSun.dx.toFixed(1)}, dy=${towardSun.dy.toFixed(1)})`,
  );

  // Gegenprobe: Haus exakt im Westen, Sonne aber WNW → Schatten verfehlt den
  // Platz teilweise. Das Modell darf hier NICHT vollen Schatten behaupten.
  const westOffAxis = computeShade(
    place({ buildings: [{ dx: -30, dy: 0, h: 15 }] }),
    evening,
    0,
  );
  check(
    "Abends: seitlich versetztes Haus gibt nur Teilschatten (keine Übertreibung)",
    westOffAxis.fromBuildings > 0.2 && westOffAxis.fromBuildings < 0.6,
    `fromBuildings=${westOffAxis.fromBuildings.toFixed(3)} – ehrlich statt geschönt`,
  );

  // Dasselbe Haus im Westen beschattet MITTAGS nicht (Sonne steht im Süden).
  const westNoon = computeShade(
    place({ buildings: [{ dx: -30, dy: 0, h: 15 }] }),
    noon,
    0,
  );
  check(
    "Mittags: Haus im Westen beschattet (noch) nicht",
    westNoon.fromBuildings < 0.05,
    `fromBuildings=${westNoon.fromBuildings.toFixed(3)}`,
  );

  // Großer Park: ein einzelnes Haus darf die Fläche kaum dunkel machen.
  const bigPark = computeShade(
    place({ areaM2: 40_000, buildings: [{ dx: -30, dy: 0, h: 15 }] }),
    evening,
    0,
  );
  check(
    "Ein Haus verdunkelt keinen ganzen Park (Dämpfung greift)",
    bigPark.fromBuildings < westEvening.fromBuildings * 0.5,
    `Park=${bigPark.fromBuildings.toFixed(3)} vs. Spielplatz=${westEvening.fromBuildings.toFixed(3)}`,
  );
}

// ---------- 3. Kronendeckung: Wald vs. baumlos, hoch- vs. tiefstehende Sonne ----------
{
  const noon = new Date(Date.UTC(2026, 5, 21, 11, 15));
  const forest = computeShade(place({ canopy: 0.85 }), noon, 0);
  check(
    "Waldspielplatz mittags: klar schattig (Index ≥ 0.68)",
    forest.index >= 0.68 && forest.state === "shady",
    `index=${forest.index.toFixed(3)}, state=${forest.state}`,
  );

  const bare = computeShade(place({ canopy: 0 }), noon, 0);
  check(
    "Baumloser Platz mittags, wolkenlos: klar sonnig",
    bare.index < 0.1 && bare.state === "sunny",
    `index=${bare.index.toFixed(3)}, state=${bare.state}`,
  );

  // Tiefe Sonne UND kahle Laubbäume (Leaf-Faktor 0,55): Der Winterwald schirmt
  // deutlich schlechter — muss klar unter dem Sommerwert liegen, aber nicht 0
  // (Äste und Nadelbaum-Anteil bleiben).
  const winterNoon = new Date(Date.UTC(2026, 11, 21, 11, 15));
  const forestWinter = computeShade(place({ canopy: 0.85 }), winterNoon, 0);
  check(
    "Wald im Winter: kahle Kronen + flache Sonne = deutlich weniger Deckung",
    forestWinter.fromCanopy > 0.15 && forestWinter.fromCanopy < forest.fromCanopy * 0.6,
    `Winter=${forestWinter.fromCanopy.toFixed(3)} vs. Sommer=${forest.fromCanopy.toFixed(3)}`,
  );
}

// ---------- 4. Sonnenuntergang: nie "sonnig" ohne Sonne ----------
{
  const night = new Date(Date.UTC(2026, 5, 21, 21, 30)); // 23:30 MESZ
  const r = computeShade(place({ canopy: 0 }), night, 0);
  check(
    "Nach Sonnenuntergang: state=no-sun, Index=1 (Sonne spielt keine Rolle)",
    r.state === "no-sun" && r.index === 1,
    `state=${r.state}, index=${r.index}`,
  );
}

// ---------- 5. Wolken ----------
{
  const noon = new Date(Date.UTC(2026, 5, 21, 11, 15));
  const overcast = computeShade(place({ canopy: 0 }), noon, 100);
  check(
    "Komplett bedeckt: hoher Schutz-Index, aber nie volle 1.0 (Restlicht)",
    overcast.index >= 0.68 && overcast.index <= 0.85,
    `index=${overcast.index.toFixed(3)}`,
  );
  const half = computeShade(place({ canopy: 0 }), noon, 50);
  check(
    "Halb bewölkt + baumlos: bleibt 'sonnig'/'teils' — kein falsches 'schattig'",
    half.state !== "shady",
    `index=${half.index.toFixed(3)}, state=${half.state}`,
  );
}

// ---------- 6. Wald-Polygone: drin/draußen, Lichtung (Loch), Segment-Ringe ----------
{
  // Quadrat-Wald 0.001° Kantenlänge um (48.1, 11.5)
  const outer = [
    { lat: 48.0995, lng: 11.4995 },
    { lat: 48.1005, lng: 11.4995 },
    { lat: 48.1005, lng: 11.5005 },
    { lat: 48.0995, lng: 11.5005 },
    { lat: 48.0995, lng: 11.4995 },
  ];
  // Lichtung in der Mitte
  const inner = [
    { lat: 48.0998, lng: 11.4998 },
    { lat: 48.1002, lng: 11.4998 },
    { lat: 48.1002, lng: 11.5002 },
    { lat: 48.0998, lng: 11.5002 },
    { lat: 48.0998, lng: 11.4998 },
  ];
  const withHole = [{ kind: "dense" as const, rings: [outer, inner] }];

  check(
    "Punkt im Waldrand-Bereich → Kronendeckung 0.85",
    coverCanopyAt(48.0996, 11.4996, withHole) === 0.85,
    "zwischen Außenrand und Lichtung",
  );
  check(
    "Punkt in der LICHTUNG → Kronendeckung 0 (Loch zählt)",
    coverCanopyAt(48.1, 11.5, withHole) === 0,
    "Spielplatz auf Lichtung gilt nicht als Wald",
  );
  check(
    "Punkt außerhalb → 0",
    coverCanopyAt(48.2, 11.6, withHole) === 0,
    "weit weg",
  );

  // Multipolygon: derselbe Außenring als ZWEI offene Segmente (wie Overpass
  // Relationen liefern) muss dasselbe Ergebnis geben.
  const segA = outer.slice(0, 3); // 3 Punkte = 2 Kanten
  const segB = outer.slice(2); // Rest inkl. Schluss
  const segmented = [{ kind: "dense" as const, rings: [segA, segB] }];
  check(
    "Ring aus zwei offenen Segmenten (Relation) wird korrekt erkannt",
    coverCanopyAt(48.0996, 11.4996, segmented) === 0.85 &&
      coverCanopyAt(48.2, 11.6, segmented) === 0,
    "Segment-Kanten decken zusammen den ganzen Rand ab",
  );
}

// ---------- 7. Schwellen der Zustände ----------
{
  check(
    "Zustandsgrenzen: 0.68→schattig, 0.38→teils, darunter sonnig",
    shadeStateOf(0.68, true) === "shady" &&
      shadeStateOf(0.5, true) === "partial" &&
      shadeStateOf(0.37, true) === "sunny" &&
      shadeStateOf(0.9, false) === "no-sun",
    "Kanten exakt geprüft",
  );
}

console.log(failures === 0 ? "\nALLE PRÜFUNGEN BESTANDEN" : `\n${failures} FEHLER`);
process.exit(failures === 0 ? 0 : 1);
