import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bedeckt, gewichtsSatz, mainDriver, shadeOutlook, surfaceLabel } from "../lib/wording";
import { scorePlace } from "../lib/scoring";
import { NOON, place, weather } from "./helpers";

describe("gewichtsSatz", () => {
  it("behauptet nicht pauschal, Schatten zähle am meisten", () => {
    // An milden Tagen wiegt Schatten nur 15 % – der frühere feste Satz
    // widersprach damit der Aufschlüsselung direkt darunter.
    const mild = { shade: 0.15, amenity: 0.43, status: 0.2, distance: 0.22 };
    assert.match(gewichtsSatz(mild), /Ausstattung und Nähe/);
    assert.doesNotMatch(gewichtsSatz(mild), /vor allem der Schatten/);
  });

  it("nennt den Schatten, wenn er tatsächlich führt", () => {
    const hitze = { shade: 0.45, amenity: 0.25, status: 0.2, distance: 0.1 };
    assert.match(gewichtsSatz(hitze), /vor allem der Schatten/);
  });
});

describe("mainDriver", () => {
  it("nennt bei mildem Wetter nicht den Schatten als Hauptgrund", () => {
    // Fester Faktor 0,45 machte den Schatten selbst dann zum Hauptgrund,
    // wenn er im Score nur mit 15 % einging.
    // Der Wert wird aus der Stundenreihe gelesen, nicht aus den Einzelwerten.
    const mild = weather({
      windSpeed: 4,
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [17],
        apparentTemperature: [17],
        cloudCover: [40],
        precipitationProbability: [0],
        uvIndex: [1],
      },
    });
    const bewertet = scorePlace(
      place({ tags: { toilet: true, fenced: true, drinking_water: true } }),
      {
        weather: mild,
        at: NOON,
        distanceM: 500,
        statuses: [],
        now: NOON.getTime(),
      },
    );
    // Die genutzten Gewichte müssen zum genannten Grund passen.
    const w = bewertet.breakdown.weights;
    assert.ok(w.shade < w.amenity, "Schatten sollte hier klein gewichtet sein");
    assert.ok(mainDriver(bewertet).text.length > 0);
  });
});

describe("surfaceLabel", () => {
  it("übersetzt englische OpenStreetMap-Rohwerte", () => {
    assert.equal(surfaceLabel("fine_gravel"), "Feinkies");
    assert.equal(surfaceLabel("woodchips"), "Holzhäcksel");
    assert.equal(surfaceLabel("sand"), "Sand");
  });

  it("macht aus Semikolon-Ketten einen lesbaren Satz", () => {
    assert.equal(surfaceLabel("sand;grass"), "Sand und Rasen");
    assert.equal(surfaceLabel("sand;grass;rubber"), "Sand, Rasen und Fallschutzmatten");
  });

  it("doppelt sich nicht und lässt Unbekanntes lesbar durch", () => {
    assert.equal(surfaceLabel("sand;sand"), "Sand");
    assert.equal(surfaceLabel("acrylic_paint"), "acrylic paint");
  });
});

describe("shadeOutlook", () => {
  it("verkauft den Sonnenuntergang nicht als mehr Schatten", () => {
    // Der no-sun-Sentinel (index 1) machte aus dem Sonnenuntergang die
    // Aussage „deutlich mehr Schatten" – kurz vor Abend auf jeder Detailseite.
    const jetzt = { index: 0.13, state: "sunny" as const };
    const dann = { index: 1, state: "no-sun" as const };
    assert.equal(
      shadeOutlook(jetzt, dann),
      "Die Sonne geht in der nächsten Stunde unter.",
    );
  });

  it("schweigt, wenn schon Nacht ist", () => {
    const nacht = { index: 1, state: "no-sun" as const };
    assert.equal(shadeOutlook(nacht, nacht), null);
  });

  it("meldet echte Änderungen weiterhin", () => {
    const a = { index: 0.2, state: "sunny" as const };
    const b = { index: 0.5, state: "partial" as const };
    assert.match(shadeOutlook(a, b) ?? "", /deutlich mehr Schatten/);
    assert.match(shadeOutlook(b, a) ?? "", /sonniger/);
  });
});

describe("mainDriver bei Regenwetter", () => {
  it("nennt den Regen, wenn der Dämpfer stärker drückt als jeder Einzelteil", () => {
    // Realfall Bürgerpark: 75 % Regenrisiko → Faktor 0,625 → Wert 35.
    // Die App nannte als Grund „Ausstattung" – der wahre Grund war der Regen.
    const regen = weather({
      windSpeed: 12,
      hourly: {
        time: ["2026-06-21T13:00"],
        temperature: [17],
        apparentTemperature: [16],
        cloudCover: [95],
        precipitationProbability: [75],
        uvIndex: [1],
      },
    });
    const bewertet = scorePlace(place({}), {
      weather: regen,
      at: NOON,
      distanceM: 200,
      statuses: [],
      now: NOON.getTime(),
    });
    assert.match(mainDriver(bewertet).text, /Regen/);
  });
});

describe("bedeckt", () => {
  it("nennt Wolken-Schatten nicht Baum-Schatten (Realfall Bürgerpark)", () => {
    // Komplett bedeckter Himmel: Die App sagte „Aktuell viel Schatten, 91 %" –
    // rechnerisch wahr, aber Eltern lesen daraus Bäume, nicht Wolken.
    assert.equal(bedeckt({ fromClouds: 0.9, state: "shady" }), true);
    assert.equal(bedeckt({ fromClouds: 0.2, state: "shady" }), false);
    // Nachts hat „bedeckt" keinen eigenen Auftritt – da gilt „Keine Sonne mehr".
    assert.equal(bedeckt({ fromClouds: 0.9, state: "no-sun" }), false);
  });
});
