import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clothingAdvice, daylightHint, outfitFor } from "../lib/outdoorTips";
import { formatTime } from "../lib/utils";

describe("outfitFor", () => {
  const labels = (items: { label: string }[]) => items.map((i) => i.label);

  it("empfiehlt bei Hitze leichte Sachen, Sonnenschutz und Wasser", () => {
    const o = outfitFor({
      apparentTemperature: 29,
      uvIndex: 7,
      precipitationProbability: 0,
      windSpeed: 8,
    });
    assert.ok(labels(o.wear).some((l) => l.includes("T-Shirt")), labels(o.wear).join());
    assert.ok(labels(o.wear).includes("Sonnenhut"));
    assert.ok(labels(o.bring).includes("Sonnencreme"));
    assert.ok(labels(o.bring).includes("Wasser"));
  });

  it("empfiehlt bei Kälte Jacke, Mütze, Schal und Handschuhe", () => {
    const o = outfitFor({
      apparentTemperature: 2,
      uvIndex: 1,
      precipitationProbability: 0,
      windSpeed: 10,
    });
    const w = labels(o.wear);
    assert.ok(w.includes("Mütze") && w.includes("Schal") && w.includes("Handschuhe"), w.join());
  });

  it("packt bei Regen Regenjacke und Gummistiefel ein", () => {
    const o = outfitFor({
      apparentTemperature: 12,
      uvIndex: 1,
      precipitationProbability: 80,
      windSpeed: 10,
    });
    assert.ok(labels(o.bring).includes("Gummistiefel"), labels(o.bring).join());
  });

  it("liefert immer mindestens etwas zum Anziehen", () => {
    const o = outfitFor({
      apparentTemperature: 18,
      uvIndex: 3,
      precipitationProbability: 0,
      windSpeed: 5,
    });
    assert.ok(o.wear.length > 0);
  });

  it("zieht ein Baby bei gleicher Temperatur wärmer an als ein Schulkind", () => {
    const p = { apparentTemperature: 16, uvIndex: 1, precipitationProbability: 0, windSpeed: 5 };
    const baby = outfitFor(p, "baby");
    const school = outfitFor(p, "school");
    // Baby (16→gefühlt 12) landet im Pullover-Bereich, Schulkind (16→17) im T-Shirt-Bereich.
    assert.ok(labels(baby.wear).includes("Pullover"), labels(baby.wear).join());
    assert.ok(labels(school.wear).some((l) => l.includes("Shirt")), labels(school.wear).join());
  });

  it("empfiehlt einem Baby keine Sonnencreme, sondern Schatten", () => {
    const o = outfitFor(
      { apparentTemperature: 26, uvIndex: 7, precipitationProbability: 0, windSpeed: 5 },
      "baby",
    );
    assert.ok(!labels(o.bring).includes("Sonnencreme"), labels(o.bring).join());
    assert.ok(o.note && o.note.includes("Schatten"), o.note);
  });

  it("gibt kleinen Kindern schon bei mittlerem UV einen Sonnenhut", () => {
    const p = { apparentTemperature: 20, uvIndex: 3, precipitationProbability: 0, windSpeed: 5 };
    assert.ok(labels(outfitFor(p, "toddler").wear).includes("Sonnenhut"));
    assert.ok(!labels(outfitFor(p, "school").wear).includes("Sonnenhut"));
  });
});

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
    assert.ok(s.toLowerCase().includes("winddicht"), s);
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

  it("rät einem Baby bei Sonne zu Schatten statt Sonnencreme", () => {
    const s = clothingAdvice(
      { apparentTemperature: 24, uvIndex: 7, precipitationProbability: 0, windSpeed: 5 },
      "baby",
    );
    assert.ok(s.includes("Schatten"), s);
    assert.ok(!s.toLowerCase().includes("eincremen"), s);
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
    assert.ok(s!.includes("2 Stunden"), s!);
  });
});
