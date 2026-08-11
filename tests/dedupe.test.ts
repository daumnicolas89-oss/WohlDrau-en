import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dedupe } from "../lib/osm";
import { place } from "./helpers";

/** ~10 m nördlich. */
const NEARBY_LAT = 48.13709;
/** ~200 m nördlich. */
const FAR_LAT = 48.1388;

describe("dedupe", () => {
  it("führt Punkt- und Flächenerfassung desselben Orts zusammen", () => {
    const result = dedupe([
      place({ id: "node/1", name: "Spielplatz", shadeInputs: { areaM2: null } }),
      place({ id: "way/2", name: "Spielplatz", lat: NEARBY_LAT }),
    ]);
    assert.equal(result.length, 1);
    // Der Eintrag mit Fläche weiß mehr und gewinnt.
    assert.equal(result[0].id, "way/2");
  });

  it("behält den benannten Eintrag", () => {
    const result = dedupe([
      place({ id: "node/1", name: "Spielplatz" }),
      place({ id: "way/2", name: "Spielplatz am Neudeck", lat: NEARBY_LAT }),
    ]);
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "Spielplatz am Neudeck");
  });

  it("hält zwei unterschiedlich benannte Nachbarn auseinander", () => {
    const result = dedupe([
      place({ id: "way/1", name: "Spielplatz Nord" }),
      place({ id: "way/2", name: "Spielplatz Süd", lat: NEARBY_LAT }),
    ]);
    assert.equal(result.length, 2);
  });

  it("fasst weit entfernte Orte nicht zusammen", () => {
    const result = dedupe([
      place({ id: "node/1", name: "Spielplatz" }),
      place({ id: "node/2", name: "Spielplatz", lat: FAR_LAT }),
    ]);
    assert.equal(result.length, 2);
  });

  it("trennt Spielplatz und Grünfläche am selben Punkt", () => {
    const result = dedupe([
      place({ id: "way/1", name: "Spielplatz" }),
      place({ id: "way/2", name: "Grünfläche", type: "park" }),
    ]);
    assert.equal(result.length, 2);
  });
});
