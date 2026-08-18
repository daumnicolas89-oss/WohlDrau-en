import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FRISCH_GENUG_MS,
  planeWarmup,
  STAEDTE,
  WARMUP_RADIUS_M,
} from "../lib/warmupPlan";
import { radiusForDistance } from "../hooks/usePlaces";

/**
 * Wächter für den Vorwärmer: Die erste Fassung nahm stur die Listen-
 * Reihenfolge – nach fünf Nächten rotierten nur die ersten 15 Städte,
 * die Tester-Gegenden am Listenende kamen NIE dran. Diese Simulation
 * hätte das sofort gefangen.
 */

const TAG_MS = 24 * 60 * 60 * 1000;

describe("planeWarmup", () => {
  it("wärmt über die Nächte JEDE Stadt mindestens einmal", () => {
    // Simulation: 3 Städte pro Nacht, Frischefenster 5 Tage, 30 Nächte.
    const zuletzt = new Map<string, number>(); // Stadt → Nacht der letzten Wärmung
    const gewaermt = new Set<string>();
    for (let nacht = 0; nacht < 30; nacht++) {
      const alter = new Map<string, number>();
      for (const [stadt, alterNacht] of zuletzt) {
        alter.set(stadt, (nacht - alterNacht) * TAG_MS);
      }
      for (const { stadt } of planeWarmup(alter, 3, FRISCH_GENUG_MS)) {
        zuletzt.set(stadt, nacht);
        gewaermt.add(stadt);
      }
    }
    const fehlend = STAEDTE.map(([s]) => s).filter((s) => !gewaermt.has(s));
    assert.deepEqual(fehlend, [], `nie gewärmt: ${fehlend.join(", ")}`);
  });

  it("nimmt die ältesten zuerst, nie geholte ganz vorn", () => {
    const alter = new Map<string, number>([
      ["Berlin", 6 * TAG_MS],
      ["Hamburg", 20 * TAG_MS],
      ["München", 2 * TAG_MS], // frisch genug, darf nicht auftauchen
    ]);
    const plan = planeWarmup(alter, 3, FRISCH_GENUG_MS);
    // Nie geholte Städte (unendlich alt) schlagen sogar Hamburg.
    assert.ok(plan.every((k) => k.stadt !== "München"));
    assert.ok(!plan.some((k) => alter.get(k.stadt) === 2 * TAG_MS));
    assert.equal(plan.length, 3);
  });

  it("hält den Radius auf der Stufe der echten App-Anfragen", () => {
    // Der Standard-Filter der App ist 1,5 km – der Vorwärmer muss EXAKT den
    // Radius wärmen, den die App wirklich anfragt, sonst schreibt er an
    // Cache-Adressen, die nie jemand liest.
    assert.equal(radiusForDistance(1500), WARMUP_RADIUS_M);
  });
});
