import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeShade } from "../lib/sun";
import { EVENING, NIGHT, NOON, place } from "./helpers";

describe("computeShade", () => {
  it("liefert mittags auf freier Fläche volle Sonne", () => {
    const result = computeShade(place(), NOON, 0);
    assert.equal(result.state, "sunny");
    assert.ok(result.index < 0.1, `index=${result.index}`);
    assert.ok(result.sunAltitudeDeg > 50);
  });

  it("erkennt Baumkronen als Hauptquelle für Schatten", () => {
    const result = computeShade(
      place({ shadeInputs: { canopy: 0.85 } }),
      NOON,
      0,
    );
    assert.equal(result.state, "shady");
    assert.ok(result.fromCanopy > 0.7);
  });

  it("behandelt dichte Bewölkung wie Schatten", () => {
    const result = computeShade(place(), NOON, 95);
    assert.ok(result.index > 0.7);
    assert.equal(result.fromBuildings, 0);
  });

  it("wirft Gebäudeschatten nur aus der Richtung der Sonne", () => {
    const west = place({
      shadeInputs: { areaM2: 900, buildings: [{ dx: -22, dy: 0, h: 15 }] },
    });
    const east = place({
      shadeInputs: { areaM2: 900, buildings: [{ dx: 22, dy: 0, h: 15 }] },
    });

    const eveningWest = computeShade(west, EVENING, 0);
    const eveningEast = computeShade(east, EVENING, 0);
    const noonWest = computeShade(west, NOON, 0);

    assert.ok(
      eveningWest.fromBuildings > 0.5,
      `Westhaus am Abend sollte beschatten, war ${eveningWest.fromBuildings}`,
    );
    assert.ok(
      eveningEast.fromBuildings < 0.05,
      `Osthaus am Abend sollte nicht beschatten, war ${eveningEast.fromBuildings}`,
    );
    assert.ok(
      noonWest.fromBuildings < 0.2,
      `Mittags ist der Schatten zu kurz, war ${noonWest.fromBuildings}`,
    );
  });

  it("dämpft Gebäudeschatten auf großen Flächen", () => {
    const buildings = [{ dx: -22, dy: 0, h: 15 }];
    const small = computeShade(
      place({ shadeInputs: { areaM2: 900, buildings } }),
      EVENING,
      0,
    );
    const park = computeShade(
      place({ shadeInputs: { areaM2: 90_000, buildings } }),
      EVENING,
      0,
    );
    assert.ok(park.fromBuildings < small.fromBuildings / 2);
  });

  it("meldet nachts keine direkte Sonne", () => {
    const result = computeShade(place(), NIGHT, 0);
    assert.equal(result.state, "no-sun");
    assert.equal(result.index, 1);
  });
});

describe("Saison der Baumkronen", () => {
  it("rechnet denselben Wald im Winter deutlich lichter als im Sommer", () => {
    const ort = place({ shadeInputs: { canopy: 0.85 } });
    const sommer = computeShade(ort, new Date(2026, 5, 21, 13, 0), 0);
    const winter = computeShade(ort, new Date(2026, 0, 21, 13, 0), 0);
    assert.ok(
      winter.fromCanopy < sommer.fromCanopy * 0.6,
      `Winter ${winter.fromCanopy} sollte klar unter Sommer ${sommer.fromCanopy} liegen`,
    );
    assert.ok(winter.fromCanopy > 0.1, "Äste schirmen weiterhin etwas ab");
  });

  it("lässt den Hochsommer unverändert voll belaubt", () => {
    const ort = place({ shadeInputs: { canopy: 0.85 } });
    const juni = computeShade(ort, new Date(2026, 5, 21, 13, 0), 0);
    const juli = computeShade(ort, new Date(2026, 6, 21, 13, 0), 0);
    assert.ok(Math.abs(juni.fromCanopy - juli.fromCanopy) < 0.05);
  });
});

describe("Bergschatten (Gelände-Horizont)", () => {
  it("verschattet den Platz, wenn die Sonne hinter dem Hügel steht", () => {
    // Horizont: 70° Richtung Süden (Achtel 4) – mittags steht die Sonne
    // dort bei ~65° und ist damit hinter dem Berg.
    const ort = place({
      shadeInputs: { horizon: [0, 0, 0, 0, 70, 0, 0, 0] },
    });
    const result = computeShade(ort, NOON, 0);
    assert.equal(result.fromTerrain, 1);
    assert.equal(result.state, "shady");
    assert.equal(result.index, 1);
  });

  it("lässt die Sonne durch, wenn sie über dem Horizont steht", () => {
    const ort = place({
      shadeInputs: { horizon: [0, 0, 0, 0, 20, 0, 0, 0] },
    });
    const result = computeShade(ort, NOON, 0);
    assert.equal(result.fromTerrain, undefined);
    assert.equal(result.state, "sunny");
  });

  it("ohne Horizont-Daten ändert sich nichts (Flachland, alte Caches)", () => {
    const result = computeShade(place(), NOON, 0);
    assert.equal(result.fromTerrain, undefined);
  });
});

describe("Nadel- vs. Laubwald im Winter", () => {
  it("hält Nadelwald ganzjährig dicht, Laubwald wird kahl", () => {
    const winter = new Date(2026, 0, 21, 13, 0);
    const nadel = computeShade(
      place({ shadeInputs: { canopy: 0.85, canopyLeaf: "needle" } }),
      winter,
      0,
    );
    const laub = computeShade(
      place({ shadeInputs: { canopy: 0.85, canopyLeaf: "broad" } }),
      winter,
      0,
    );
    assert.ok(
      nadel.fromCanopy > laub.fromCanopy * 1.8,
      `Nadel ${nadel.fromCanopy} sollte deutlich über Laub ${laub.fromCanopy} liegen`,
    );
  });
});
