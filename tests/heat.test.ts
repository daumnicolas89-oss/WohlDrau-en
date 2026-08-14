import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { heatWarning } from "../lib/heat";

describe("heatWarning", () => {
  it("gibt nachts keinen Hinweis, egal wie warm oder UV", () => {
    assert.equal(
      heatWarning({ apparentTemperature: 34, uvIndex: 9, isDay: false }),
      null,
    );
  });

  it("gibt bei angenehmem Wetter keinen Hinweis", () => {
    assert.equal(
      heatWarning({ apparentTemperature: 22, uvIndex: 4, isDay: true }),
      null,
    );
  });

  it("warnt bei großer Hitze", () => {
    const w = heatWarning({ apparentTemperature: 32, uvIndex: 6, isDay: true });
    assert.equal(w?.tone, "heat");
    assert.match(w!.text, /Hitze/);
  });

  it("warnt bei extremer Hitze deutlicher", () => {
    const gross = heatWarning({ apparentTemperature: 32, uvIndex: 6, isDay: true });
    const extrem = heatWarning({ apparentTemperature: 36, uvIndex: 6, isDay: true });
    assert.equal(extrem?.tone, "heat");
    assert.notEqual(extrem!.text, gross!.text);
    assert.match(extrem!.text, /[Ee]xtrem/);
  });

  it("warnt bei sehr hohem UV, auch wenn es nicht heiß ist", () => {
    const w = heatWarning({ apparentTemperature: 24, uvIndex: 8, isDay: true });
    assert.equal(w?.tone, "uv");
    assert.match(w!.text, /UV/);
  });

  it("zeigt bei Hitze UND hohem UV die Hitze (dringlicher)", () => {
    const w = heatWarning({ apparentTemperature: 33, uvIndex: 9, isDay: true });
    assert.equal(w?.tone, "heat");
  });
});
