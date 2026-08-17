import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scorePlace } from "../lib/scoring";
import { NOON, place, summer, weather } from "./helpers";

/**
 * Wächter für das Logik-Audit vom 17.08.2026: Der Wert darf nie springen,
 * nie Schlechtwetter belohnen und nie unvermeidbaren Schatten loben.
 */

function bewerte(
  p = place(),
  w = weather(),
  at: Date = NOON,
  distanceM = 400,
) {
  return scorePlace(p, { weather: w, at, distanceM, statuses: [], now: at.getTime() });
}

function mitRegen(regen: number, uv = 2, temp = 22) {
  return weather({
    windSpeed: 8,
    hourly: {
      time: ["2026-06-21T13:00"],
      temperature: [temp],
      apparentTemperature: [temp],
      cloudCover: [70],
      precipitationProbability: [regen],
      uvIndex: [uv],
    },
  });
}

describe("Unterstand-Bonus", () => {
  const dach = place({
    tags: { toilet: true, shelter: true },
    shadeInputs: { canopy: 0.3, treeCount: 5, confidence: "high" },
  });

  it("springt nicht mehr an der 50-%-Regen-Schwelle", () => {
    // Vorher: 49 % Regen → 65, 50 % → 72. Mehr Regen machte den Platz besser.
    const a = bewerte(dach, mitRegen(49)).pleasantScore;
    const b = bewerte(dach, mitRegen(51)).pleasantScore;
    assert.ok(Math.abs(a - b) <= 3, `Sprung an der Schwelle: ${a} → ${b}`);
  });

  it("macht mehr Regen nie zum Vorteil", () => {
    let vorher = Infinity;
    for (const regen of [30, 40, 50, 60, 70, 80]) {
      const score = bewerte(dach, mitRegen(regen)).pleasantScore;
      assert.ok(
        score <= vorher + 1,
        `Score stieg mit dem Regen: ${vorher} → ${score} bei ${regen} %`,
      );
      vorher = score;
    }
  });

  it("gewinnt bei 80 % Regen gegen den gleichen Platz ohne Dach", () => {
    // Vorher dämpfte der Regenfaktor den Bonus auf +5 weg – ausgerechnet
    // dann, wenn das Dach am wichtigsten ist.
    const ohneDach = place({
      tags: { toilet: true },
      shadeInputs: { canopy: 0.3, treeCount: 5, confidence: "high" },
    });
    const mit = bewerte(dach, mitRegen(80)).pleasantScore;
    const ohne = bewerte(ohneDach, mitRegen(80)).pleasantScore;
    assert.ok(mit >= ohne + 8, `Dach zahlt sich nicht aus: ${mit} vs ${ohne}`);
  });
});

describe("Sonnenuntergang", () => {
  it("lässt den Wert nicht mehr um 15 Punkte springen", () => {
    // Lauer Sommerabend, kahler Platz: Der no-sun-Sentinel schaltete den
    // Schatten-Teil hart von ~48 auf 100. Jetzt gleitet die Dämmerung.
    const kahl = place({ shadeInputs: { canopy: 0.02, treeCount: 0 } });
    const lau = weather({
      windSpeed: 5,
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [24],
        apparentTemperature: [24],
        cloudCover: [10],
        precipitationProbability: [5],
        uvIndex: [0.5],
      },
    });
    let vorher: number | null = null;
    // 20:30–21:40 Ortszeit in 5-Minuten-Schritten über den Sonnenuntergang
    for (let min = 0; min <= 70; min += 5) {
      const at = new Date(summer(18, 30).getTime() + min * 60_000);
      const score = bewerte(kahl, lau, at).pleasantScore;
      if (vorher !== null) {
        assert.ok(
          Math.abs(score - vorher) <= 6,
          `Sprung um ${Math.abs(score - vorher)} Punkte bei +${min} Min`,
        );
      }
      vorher = score;
    }
  });
});

describe("Bergschatten", () => {
  it("zählt bei Kälte als Nachteil wie ein Gebäudeschatten", () => {
    // Vorher: Platz komplett hinterm Hügel bekam bei 5 °C denselben
    // Schatten-Teilwert wie die besonnte Wiese – samt Lob „Viel Schatten".
    const kalt = weather({
      windSpeed: 8,
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [5],
        apparentTemperature: [3],
        cloudCover: [5],
        precipitationProbability: [0],
        uvIndex: [1],
      },
    });
    const wiese = place({ shadeInputs: { canopy: 0.02, treeCount: 0 } });
    const tal = place({
      shadeInputs: {
        canopy: 0.02,
        treeCount: 0,
        horizon: [80, 80, 80, 80, 80, 80, 80, 80],
      },
    });
    const sonnig = bewerte(wiese, kalt);
    const verschattet = bewerte(tal, kalt);
    assert.ok(
      sonnig.pleasantScore >= verschattet.pleasantScore + 5,
      `Wiese ${sonnig.pleasantScore} vs Tal ${verschattet.pleasantScore}`,
    );
    assert.ok(
      !verschattet.reasons.includes("Viel Schatten"),
      "Unvermeidbarer Bergschatten wird bei Kälte nicht gelobt",
    );
  });
});

describe("Nacht", () => {
  it("verdünnt die Ausstattungs-Unterschiede nicht mehr", () => {
    // Nachts sagt Schatten nichts – Gewicht gehört zu Ausstattung und Nähe.
    const nacht = weather({
      isDay: false,
      windSpeed: 5,
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [24],
        apparentTemperature: [24],
        cloudCover: [20],
        precipitationProbability: [0],
        uvIndex: [0],
      },
    });
    const um23 = summer(21);
    const wald = place({ shadeInputs: { canopy: 0.8, treeCount: 30 } });
    const kahl = place({ shadeInputs: { canopy: 0.02, treeCount: 0 } });
    const a = bewerte(wald, nacht, um23);
    const b = bewerte(kahl, nacht, um23);
    // Gleiche Ausstattung, gleiche Entfernung: nachts darf der Baumbestand
    // keinen Unterschied machen.
    assert.ok(Math.abs(a.pleasantScore - b.pleasantScore) <= 1);
    // Und das Schatten-Gewicht liegt auf dem Boden von 15 %.
    assert.ok(a.breakdown.weights.shade <= 0.16);
  });
});
