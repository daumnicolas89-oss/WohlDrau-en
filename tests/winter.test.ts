import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { winterWarning } from "../lib/winter";

describe("winterWarning", () => {
  it("gibt bei mildem, trockenem Wetter keinen Hinweis", () => {
    assert.equal(
      winterWarning({ temperature: 12, apparentTemperature: 11, weatherCode: 3, snowfall: 0, precipitation: 0 }),
      null,
    );
  });

  it("warnt bei gefrierendem Regen vor Glätte (höchste Priorität)", () => {
    const w = winterWarning({ temperature: 0, apparentTemperature: -2, weatherCode: 66, snowfall: 0, precipitation: 1 });
    assert.equal(w?.tone, "ice");
    assert.match(w!.text, /glatt/);
  });

  it("erkennt Schnee am Wettercode", () => {
    const w = winterWarning({ temperature: -2, apparentTemperature: -5, weatherCode: 73, snowfall: 0, precipitation: 0.5 });
    assert.equal(w?.tone, "snow");
  });

  it("erkennt Schnee auch nur am Schneefall-Wert", () => {
    const w = winterWarning({ temperature: -1, apparentTemperature: -4, weatherCode: 0, snowfall: 0.4, precipitation: 0.4 });
    assert.equal(w?.tone, "snow");
  });

  it("warnt bei Reifnebel", () => {
    const w = winterWarning({ temperature: -1, apparentTemperature: -3, weatherCode: 48, snowfall: 0, precipitation: 0 });
    assert.equal(w?.tone, "ice");
  });

  it("warnt bei strenger Kälte (gefühlt sehr kalt) auch ohne Niederschlag", () => {
    const w = winterWarning({ temperature: -6, apparentTemperature: -13, weatherCode: 3, snowfall: 0, precipitation: 0 });
    assert.equal(w?.tone, "frost");
    assert.match(w!.text, /Strenge Kälte/);
  });

  it("weist bei Frost mit Nässe deutlicher auf Glätte hin als bei trockenem Frost", () => {
    const nass = winterWarning({ temperature: -3, apparentTemperature: -3, weatherCode: 3, snowfall: 0, precipitation: 0.6 });
    const trocken = winterWarning({ temperature: -3, apparentTemperature: -3, weatherCode: 0, snowfall: 0, precipitation: 0 });
    assert.equal(nass?.tone, "frost");
    assert.equal(trocken?.tone, "frost");
    assert.match(nass!.text, /Nässe|glatt/);
    assert.notEqual(nass!.text, trocken!.text);
  });

  it("gibt bei leichtem Frost ohne Niederschlag noch einen ruhigen Hinweis", () => {
    const w = winterWarning({ temperature: 0, apparentTemperature: -1, weatherCode: 1, snowfall: 0, precipitation: 0 });
    assert.equal(w?.tone, "frost");
  });
});
