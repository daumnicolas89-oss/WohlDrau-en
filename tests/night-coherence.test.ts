import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weatherAdvice } from "../lib/wording";
import { SHADE_WINDOW_STEPS, shadeWindow, windowHasSun } from "../lib/sun";
import { FALLBACK_WEATHER } from "../lib/weather";
import { NIGHT, NOON, place, weather } from "./helpers";

describe("weatherAdvice", () => {
  it("empfiehlt nachts keinen Schatten, auch wenn es warm ist", () => {
    // Der gemeldete Fall: 25 Grad gefühlt, aber Nacht. Früher kam hier
    // faelschlich „Etwas Schatten tut gut", passend zum Mond ist das falsch.
    const satz = weatherAdvice(25, 0, 0, false);
    assert.ok(!satz.toLowerCase().includes("schatten"), `Nacht-Satz nennt Schatten: ${satz}`);
    assert.equal(satz, "Laue Nacht, angenehm für draußen.");
  });

  it("warnt nachts bei Kaelte", () => {
    assert.equal(weatherAdvice(4, 0, 0, false), "Kühle Nacht, zieh dich warm an.");
  });

  it("nennt nachts bei milden Werten die fehlende Sonne", () => {
    assert.equal(weatherAdvice(15, 0, 0, false), "Angenehm draußen, ganz ohne Sonne.");
  });

  it("empfiehlt tagsueber bei Hitze Schatten", () => {
    assert.equal(weatherAdvice(31, 8, 0, true), "Jetzt zählt vor allem Schatten.");
  });

  it("Regen schlaegt alles", () => {
    assert.equal(
      weatherAdvice(31, 8, 80, true),
      "Regen ist wahrscheinlich. Kurz raus lohnt trotzdem.",
    );
  });
});

describe("windowHasSun / shadeWindow", () => {
  it("ist nachts durchgehend ohne Sonne, der Verlauf lohnt dann nicht", () => {
    assert.equal(windowHasSun(place(), FALLBACK_WEATHER, NIGHT), false);
  });

  it("hat mittags Sonne im Fenster", () => {
    assert.equal(windowHasSun(place(), weather(), NOON), true);
  });

  it("liefert genau ein Fenster der vereinbarten Laenge", () => {
    assert.equal(shadeWindow(place(), weather(), NOON).length, SHADE_WINDOW_STEPS);
  });

  it("markiert nachts jeden Schritt als no-sun", () => {
    const alleOhneSonne = shadeWindow(place(), FALLBACK_WEATHER, NIGHT).every(
      (step) => step.shade.state === "no-sun",
    );
    assert.ok(alleOhneSonne);
  });
});
