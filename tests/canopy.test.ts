import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coverCanopyAt, type TreeCover } from "../lib/canopy";
import { pointInPolygon } from "../lib/utils";

const quadrat = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
  { lat: 1, lng: 0 },
];

describe("pointInPolygon", () => {
  it("erkennt einen Punkt innerhalb", () => {
    assert.equal(pointInPolygon(0.5, 0.5, quadrat), true);
  });

  it("erkennt einen Punkt außerhalb", () => {
    assert.equal(pointInPolygon(1.5, 0.5, quadrat), false);
    assert.equal(pointInPolygon(0.5, -0.2, quadrat), false);
  });
});

describe("coverCanopyAt", () => {
  const wald: TreeCover = { kind: "dense", rings: [quadrat] };

  it("liefert hohe Deckung, wenn der Ort im Wald liegt (Waldspielplatz)", () => {
    assert.equal(coverCanopyAt(0.5, 0.5, [wald]), 0.85);
  });

  it("liefert 0, wenn der Ort außerhalb liegt (offener Park)", () => {
    assert.equal(coverCanopyAt(2, 2, [wald]), 0);
  });

  it("nimmt bei Überlappung die stärkste Deckung", () => {
    const gebuesch: TreeCover = { kind: "medium", rings: [quadrat] };
    assert.equal(coverCanopyAt(0.5, 0.5, [gebuesch, wald]), 0.85);
  });

  it("erkennt ein Multipolygon aus zwei offenen Rand-Segmenten (große Wälder)", () => {
    // Dasselbe Quadrat, aber als zwei getrennte, nicht geschlossene Linien,
    // wie sie eine OSM-Relation liefert.
    const relation: TreeCover = {
      kind: "dense",
      rings: [
        [
          { lat: 0, lng: 0 },
          { lat: 0, lng: 1 },
          { lat: 1, lng: 1 },
        ],
        [
          { lat: 1, lng: 1 },
          { lat: 1, lng: 0 },
          { lat: 0, lng: 0 },
        ],
      ],
    };
    assert.equal(coverCanopyAt(0.5, 0.5, [relation]), 0.85);
    assert.equal(coverCanopyAt(2, 2, [relation]), 0);
  });
});
