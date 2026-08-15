import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { desiredShade, scorePlace, WEIGHTS } from "../lib/scoring";
import { NOON, place, status, weather } from "./helpers";

const NOW = NOON.getTime();

function score(
  overrides: Parameters<typeof place>[0],
  ctx: Partial<Parameters<typeof scorePlace>[1]> = {},
) {
  return scorePlace(place(overrides), {
    weather: weather(),
    at: NOON,
    distanceM: 500,
    statuses: [],
    now: NOW,
    ...ctx,
  });
}

describe("Gewichtung", () => {
  it("summiert sich auf 1", () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `Summe war ${total}`);
  });

  it("gewichtet Schatten am stärksten", () => {
    assert.ok(WEIGHTS.shade > WEIGHTS.amenity);
    assert.ok(WEIGHTS.amenity > WEIGHTS.status);
    assert.ok(WEIGHTS.status > WEIGHTS.distance);
  });
});

describe("desiredShade", () => {
  it("steigt mit Hitze und UV", () => {
    assert.ok(desiredShade(31, 8) > 0.9);
    assert.ok(desiredShade(9, 1) < 0.05);
    assert.ok(desiredShade(24, 4) > desiredShade(18, 2));
  });
});

describe("scorePlace", () => {
  it("hebt bei Regenrisiko Orte mit Unterstand nach oben", () => {
    const rainy = weather({
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [18],
        apparentTemperature: [17],
        cloudCover: [90],
        precipitationProbability: [80],
        uvIndex: [1],
      },
    });
    const ohne = score({}, { weather: rainy });
    const mit = score({ tags: { shelter: true } }, { weather: rainy });
    assert.ok(
      mit.pleasantScore > ohne.pleasantScore,
      `${mit.pleasantScore} vs ${ohne.pleasantScore}`,
    );
    assert.ok(mit.reasons.includes("Unterstand für Regenpausen"), mit.reasons.join());
    // Ohne Regen kein Sonder-Bonus (nur der kleine Ausstattungs-Punkt).
    const trocken = score({ tags: { shelter: true } });
    assert.ok(!trocken.reasons.includes("Unterstand für Regenpausen"));
  });

  it("bevorzugt bei Hitze den schattigen Ort", () => {
    const sunny = score({});
    const shady = score({ shadeInputs: { canopy: 0.85 } });
    assert.ok(
      shady.pleasantScore > sunny.pleasantScore + 15,
      `${shady.pleasantScore} vs ${sunny.pleasantScore}`,
    );
  });

  it("bevorzugt bei Kälte die Sonne", () => {
    const cold = weather({
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [6],
        apparentTemperature: [4],
        cloudCover: [0],
        precipitationProbability: [0],
        uvIndex: [1],
      },
    });
    const sunny = score({}, { weather: cold });
    const shady = score({ shadeInputs: { canopy: 0.9 } }, { weather: cold });
    assert.ok(
      sunny.pleasantScore > shady.pleasantScore,
      `${sunny.pleasantScore} vs ${shady.pleasantScore}`,
    );
  });

  it("belohnt Toilette, Zaun und Wickeltisch", () => {
    const bare = score({});
    const equipped = score({
      tags: { toilet: true, fenced: true, changing_table: true },
    });
    assert.ok(equipped.breakdown.amenityScore > bare.breakdown.amenityScore);
    assert.ok(equipped.pleasantScore > bare.pleasantScore);
  });

  it("zieht frische Problemmeldungen ab und warnt sichtbar", () => {
    const target = { shadeInputs: { canopy: 0.85 } };
    const clean = score(target);
    const reported = score(target, {
      statuses: [status("too_sunny", 10, NOW)],
    });
    assert.ok(reported.pleasantScore < clean.pleasantScore);
    assert.ok(reported.warnings.some((w) => w.includes("Zu sonnig")));
    assert.ok(reported.breakdown.statusScore < 50);
  });

  it("hebt positive Meldungen an", () => {
    const boosted = score({}, { statuses: [status("great", 5, NOW)] });
    assert.ok(boosted.breakdown.statusScore > 50);
  });

  it("gewichtet ältere Meldungen schwächer als frische", () => {
    const fresh = score({}, { statuses: [status("too_crowded", 5, NOW)] });
    const old = score({}, { statuses: [status("too_crowded", 150, NOW)] });
    assert.ok(old.breakdown.statusScore > fresh.breakdown.statusScore);
  });

  it("ignoriert abgelaufene Meldungen", () => {
    const stale = score({}, { statuses: [status("too_sunny", 5 * 60, NOW)] });
    const clean = score({});
    assert.equal(stale.pleasantScore, clean.pleasantScore);
    assert.equal(stale.lastStatuses.length, 0);
  });

  it("belohnt kurze Wege, ohne sie dominieren zu lassen", () => {
    const near = score({}, { distanceM: 300 });
    const far = score({}, { distanceM: 3500 });
    assert.ok(near.pleasantScore > far.pleasantScore);
    // Entfernung wiegt nur 10 % – der Unterschied darf nicht alles überlagern.
    assert.ok(near.pleasantScore - far.pleasantScore < 15);
  });

  it("dämpft alle Orte bei Regen", () => {
    const rain = weather({
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [30],
        apparentTemperature: [31],
        cloudCover: [0],
        precipitationProbability: [90],
        uvIndex: [8],
      },
    });
    const dry = score({ shadeInputs: { canopy: 0.85 } });
    const wet = score({ shadeInputs: { canopy: 0.85 } }, { weather: rain });
    assert.ok(wet.pleasantScore < dry.pleasantScore);
    assert.ok(wet.warnings.some((w) => w.includes("Regenrisiko")));
  });

  it("liefert Scores im Bereich 0–100", () => {
    for (const result of [score({}), score({ shadeInputs: { canopy: 1 } })]) {
      assert.ok(result.pleasantScore >= 0 && result.pleasantScore <= 100);
      assert.ok(result.currentShadeScore >= 0 && result.currentShadeScore <= 100);
    }
  });
});

describe("Schatten bei Kälte", () => {
  const kalt = (cloudCover: number) =>
    weather({
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [6],
        apparentTemperature: [5],
        cloudCover: [cloudCover],
        precipitationProbability: [0],
        uvIndex: [1],
      },
    });

  it("bestraft vermeidbaren Baumschatten", () => {
    const result = score({ shadeInputs: { canopy: 0.9 } }, { weather: kalt(0) });
    assert.ok(result.breakdown.shadeScore < 40, `war ${result.breakdown.shadeScore}`);
  });

  it("bestraft Wolkenschatten nicht – dem entkommt kein Ort", () => {
    const result = score({}, { weather: kalt(95) });
    assert.ok(result.breakdown.shadeScore > 80, `war ${result.breakdown.shadeScore}`);
  });

  it("unterscheidet bei bedecktem Himmel weiter nach Bäumen", () => {
    const kahl = score({}, { weather: kalt(95) });
    const dicht = score({ shadeInputs: { canopy: 0.9 } }, { weather: kalt(95) });
    assert.ok(kahl.breakdown.shadeScore > dicht.breakdown.shadeScore);
  });
});
