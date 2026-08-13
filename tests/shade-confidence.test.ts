import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shadeConfidenceFor } from "../lib/osm";

describe("shadeConfidenceFor (Verlässlichkeit pro Ort)", () => {
  it("vererbt gute Gebietsdaten NICHT auf einen kaum getaggten Ort im Grünen", () => {
    // Der Fall am Chinesischen Turm: das Gebiet ist top erfasst, dieser
    // Spielplatz hat aber keine getaggten Bäume, obwohl er im Grünen liegt.
    // Früher wurde er dadurch fälschlich als „verlässlich“ (high) markiert.
    const c = shadeConfidenceFor({
      isForest: false,
      inGreen: true,
      treeCount: 0,
      areaTreeQuality: "high",
    });
    assert.equal(c, "low");
  });

  it("ist hoch bei vielen Bäumen direkt am Ort", () => {
    assert.equal(
      shadeConfidenceFor({
        isForest: false,
        inGreen: true,
        treeCount: 12,
        areaTreeQuality: "medium",
      }),
      "high",
    );
  });

  it("ist hoch im Wald, auch ohne einzelne Baum-Punkte", () => {
    assert.equal(
      shadeConfidenceFor({
        isForest: true,
        inGreen: true,
        treeCount: 0,
        areaTreeQuality: "low",
      }),
      "high",
    );
  });

  it("ist niedrig, wenn im ganzen Gebiet kaum Bäume erfasst sind", () => {
    assert.equal(
      shadeConfidenceFor({
        isForest: false,
        inGreen: false,
        treeCount: 0,
        areaTreeQuality: "low",
      }),
      "low",
    );
  });

  it("ist mittel bei einem offenen Platz mit brauchbarer Gebietslage", () => {
    assert.equal(
      shadeConfidenceFor({
        isForest: false,
        inGreen: false,
        treeCount: 1,
        areaTreeQuality: "medium",
      }),
      "medium",
    );
  });
});
