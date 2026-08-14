import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clothingAdvice, daylightHint } from "../lib/outdoorTips";
import { formatTime } from "../lib/utils";

describe("clothingAdvice", () => {
  it("empfiehlt bei Hitze und hohem UV Sonnenschutz", () => {
    const s = clothingAdvice({
      apparentTemperature: 29,
      uvIndex: 7,
      precipitationProbability: 0,
      windSpeed: 8,
    });
    assert.ok(s.includes("Sonnenhut"), s);
    assert.ok(s.toLowerCase().includes("eincremen"), s);
  });

  it("rät bei Kälte zu warmer Kleidung und Mütze", () => {
    const s = clothingAdvice({
      apparentTemperature: 3,
      uvIndex: 1,
      precipitationProbability: 0,
      windSpeed: 5,
    });
    assert.ok(s.toLowerCase().includes("warm") || s.includes("Mütze"), s);
  });

  it("weist bei viel Wind auf winddichte Kleidung hin", () => {
    const s = clothingAdvice({
      apparentTemperature: 7,
      uvIndex: 1,
      precipitationProbability: 0,
      windSpeed: 32,
    });
    assert.ok(s.includes("winddicht"), s);
  });

  it("weist bei hohem Regenrisiko auf Regenkleidung hin", () => {
    const s = clothingAdvice({
      apparentTemperature: 12,
      uvIndex: 1,
      precipitationProbability: 80,
      windSpeed: 10,
    });
    assert.ok(s.includes("Regen"), s);
  });

  it("endet als sauberer Satz mit Punkt", () => {
    const s = clothingAdvice({
      apparentTemperature: 18,
      uvIndex: 3,
      precipitationProbability: 0,
      windSpeed: 8,
    });
    assert.ok(s.endsWith("."), s);
    assert.equal(s[0], s[0].toUpperCase());
  });
});

describe("daylightHint", () => {
  it("gibt null, wenn noch viel Tageslicht bleibt", () => {
    const now = new Date(2026, 0, 1, 12, 0);
    const sunset = new Date(2026, 0, 1, 20, 0);
    assert.equal(daylightHint(now, sunset), null);
  });

  it("gibt null, wenn die Sonne schon unter ist", () => {
    const now = new Date(2026, 0, 1, 17, 0);
    const sunset = new Date(2026, 0, 1, 16, 30);
    assert.equal(daylightHint(now, sunset), null);
  });

  it("warnt, wenn das Tageslicht knapp wird, mit Uhrzeit", () => {
    const now = new Date(2026, 0, 1, 15, 0);
    const sunset = new Date(2026, 0, 1, 16, 48);
    const s = daylightHint(now, sunset);
    assert.ok(s, "sollte einen Hinweis liefern");
    assert.ok(s!.includes(formatTime(sunset)), s!);
    assert.ok(s!.includes("2 Std"), s!);
  });
});
