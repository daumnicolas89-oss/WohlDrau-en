import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bestTimeHint, bestTimeToday } from "../lib/bestTime";
import { weather } from "./helpers";

const MUC = { lat: 48.1372, lng: 11.5755 };

/** Stunden-Vorhersage für den 21.06.2026 ab `startHour` bauen. */
function tag(
  startHour: number,
  stunden: { t: number; uv?: number; regen?: number }[],
) {
  return weather({
    hourly: {
      time: stunden.map(
        (_, i) =>
          `2026-06-21T${String(startHour + i).padStart(2, "0")}:00`,
      ),
      temperature: stunden.map((s) => s.t),
      apparentTemperature: stunden.map((s) => s.t),
      cloudCover: stunden.map(() => 20),
      precipitationProbability: stunden.map((s) => s.regen ?? 0),
      uvIndex: stunden.map((s) => s.uv ?? 3),
    },
  });
}

describe("bestTimeToday", () => {
  it("empfiehlt am Hitzetag den kühleren Abend", () => {
    const w = tag(10, [
      { t: 27, uv: 6 },
      { t: 30, uv: 8 },
      { t: 32, uv: 9 },
      { t: 33, uv: 8 },
      { t: 32, uv: 6 },
      { t: 30, uv: 4 },
      { t: 27, uv: 2 },
      { t: 24, uv: 1 },
      { t: 22, uv: 0.5 },
    ]);
    const best = bestTimeToday(w, MUC, new Date(2026, 5, 21, 10, 0));
    assert.ok(best, "sollte ein Fenster finden");
    assert.ok(best!.fromHour >= 16, `Fenster begann schon um ${best!.fromHour} Uhr`);
    assert.equal(best!.nowIsBest, false);
    assert.match(bestTimeHint(best)!, /am angenehmsten: \d+–\d+ Uhr/);
  });

  it("meldet nichts an gleichförmig milden Tagen", () => {
    const w = tag(10, Array.from({ length: 8 }, () => ({ t: 20, uv: 3 })));
    assert.equal(bestTimeToday(w, MUC, new Date(2026, 5, 21, 10, 0)), null);
  });

  it("erkennt, wenn die beste Zeit gerade JETZT ist", () => {
    // Kalter Morgen, mildes Mittagsfenster, kalter Abend – jetzt ist 12 Uhr.
    const w = tag(11, [
      { t: 6 },
      { t: 14 },
      { t: 15 },
      { t: 6 },
      { t: 4 },
    ]);
    const best = bestTimeToday(w, MUC, new Date(2026, 5, 21, 12, 30));
    assert.ok(best);
    assert.equal(best!.nowIsBest, true);
    assert.equal(bestTimeHint(best), "Jetzt ist die angenehmste Zeit des Tages.");
  });

  it("meldet nachts nichts (kein Tageslicht mehr übrig)", () => {
    const w = tag(22, [{ t: 18 }, { t: 17 }]);
    assert.equal(bestTimeToday(w, MUC, new Date(2026, 5, 21, 22, 0)), null);
  });

  it("schaut nicht in den nächsten Tag hinüber", () => {
    // Vorhersage läuft bis in den Morgen – der zählt nicht zu „heute".
    const w = weather({
      hourly: {
        time: ["2026-06-21T20:00", "2026-06-21T21:00", "2026-06-22T10:00", "2026-06-22T11:00"],
        temperature: [28, 27, 18, 18],
        apparentTemperature: [28, 27, 18, 18],
        cloudCover: [0, 0, 0, 0],
        precipitationProbability: [0, 0, 0, 0],
        uvIndex: [2, 1, 4, 4],
      },
    });
    const best = bestTimeToday(w, MUC, new Date(2026, 5, 21, 20, 0));
    // 20/21 Uhr sind die einzigen heutigen Kandidaten; ohne klaren Vorteil → null
    assert.ok(!best || best.fromHour >= 20);
  });
});
