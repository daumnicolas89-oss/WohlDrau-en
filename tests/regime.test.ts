import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weatherRegime } from "../lib/regime";

describe("weatherRegime", () => {
  it("ist nachts immer 'night', egal wie warm", () => {
    assert.equal(weatherRegime(24, 0, false), "night");
  });

  it("ist bei Hitze mit Sonne 'hot' (Schatten zählt)", () => {
    assert.equal(weatherRegime(28, 6, true), "hot");
  });

  it("ist auch bei kühler Luft mit sehr hohem UV 'hot'", () => {
    assert.equal(weatherRegime(13, 8, true), "hot");
  });

  it("ist bei Kälte 'cold'", () => {
    assert.equal(weatherRegime(4, 1, true), "cold");
  });

  it("ist bei angenehmer Temperatur ohne Schatten-Bedarf 'mild'", () => {
    assert.equal(weatherRegime(20, 3, true), "mild");
  });
});
