import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { packTile, tileKey, unpackTile } from "../lib/tileStore";
import { PLACES_SCHEMA_VERSION } from "../lib/schemaVersion";
import type { FetchPlacesResult } from "../lib/osm";

/**
 * Wächter für den dauerhaften Orte-Speicher: Der Schlüssel muss exakt dem
 * Raster der Route entsprechen (sonst schreibt der Vorwärmer an Adressen,
 * die nie jemand liest), und Packen/Entpacken muss verlustfrei sein.
 */

describe("tileKey", () => {
  it("rundet aufs ~1-km-Raster und trägt die Schema-Version", () => {
    assert.equal(
      tileKey(48.1372, 11.5755, 2500, false),
      `v${PLACES_SCHEMA_VERSION}:48.14:11.58:2500`,
    );
  });

  it("hält Schnellstart- und volle Antworten strikt auseinander", () => {
    const voll = tileKey(48.1372, 11.5755, 2500, false);
    const schnell = tileKey(48.1372, 11.5755, 2500, true);
    assert.equal(schnell, `f:${voll}`);
    assert.notEqual(voll, schnell);
  });
});

describe("packTile/unpackTile", () => {
  it("übersteht die Rundreise verlustfrei und spart dabei Platz", () => {
    const antwort = {
      places: Array.from({ length: 50 }, (_, i) => ({
        id: `way/${i}`,
        name: `Spielplatz ${i}`,
        kind: "playground",
        lat: 48.1 + i / 1000,
        lng: 11.5 + i / 1000,
        tags: { toilet: i % 2 === 0 },
        shadeInputs: { canopy: 0.3, treeCount: 5, confidence: "medium" },
      })),
      toilets: [],
      treeDataQuality: "medium",
    } as unknown as FetchPlacesResult;

    const gepackt = packTile(antwort);
    assert.deepEqual(unpackTile(gepackt), antwort);
    assert.ok(
      gepackt.length < JSON.stringify(antwort).length,
      "gepackt sollte kleiner sein als roh",
    );
  });
});
