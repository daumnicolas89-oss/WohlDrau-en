import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shadeShort, shadeWording } from "../lib/wording";

describe("shadeWording", () => {
  it("nennt ein Drittel Schatten nicht mehr voll sonnig", () => {
    // Real-Fall vom Nutzer: 36 % Schatten, Anzeige behauptete „voll in der
    // Sonne" – direkt über der eigenen 36-%-Zahl.
    assert.equal(shadeWording("sunny", 0.36).label, "Überwiegend in der Sonne");
    assert.equal(shadeShort("sunny", 0.36), "Meist sonnig");
  });

  it("bleibt bei wirklich praller Fläche deutlich", () => {
    assert.equal(shadeWording("sunny", 0.05).label, "Aktuell voll in der Sonne");
    assert.equal(shadeShort("sunny", 0.05), "Volle Sonne");
  });

  it("lässt die übrigen Zustände unverändert", () => {
    assert.equal(shadeWording("shady", 0.8).label, "Aktuell viel Schatten");
    assert.equal(shadeWording("partial", 0.5).label, "Teilweise sonnig");
    assert.equal(shadeWording("no-sun", 1).label, "Keine Sonne mehr");
  });
});
