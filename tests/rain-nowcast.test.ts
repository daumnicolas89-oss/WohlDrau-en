import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rainNowcast } from "../lib/rainNowcast";
import { weather } from "./helpers";

/** Viertelstunden-Slots ab 14:00 am 21.06.2026 bauen. */
function mitRadar(precipitation: number[]) {
  return weather({
    minutely15: {
      time: precipitation.map((_, i) => {
        const min = i * 15;
        const h = 14 + Math.floor(min / 60);
        return `2026-06-21T${String(h).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
      }),
      precipitation,
    },
  });
}

const NOW = new Date(2026, 5, 21, 14, 0);

describe("rainNowcast", () => {
  it("kündigt aufziehenden Regen mit Minuten an", () => {
    const s = rainNowcast(mitRadar([0, 0, 0.4, 0.6, 0.2, 0]), NOW);
    assert.ok(s, "sollte warnen");
    assert.match(s!, /Regen zieht auf: In rund 30 Minuten/);
  });

  it("sagt, wann der Regen aufhört", () => {
    const s = rainNowcast(mitRadar([0.5, 0.4, 0, 0, 0, 0]), NOW);
    assert.match(s!, /hört in rund 30 Minuten auf/);
  });

  it("schweigt bei durchgehend trockenem Wetter", () => {
    assert.equal(rainNowcast(mitRadar([0, 0, 0, 0, 0, 0]), NOW), null);
  });

  it("schweigt bei Dauerregen ohne Ende in Sicht", () => {
    assert.equal(rainNowcast(mitRadar([1, 1, 1, 1, 1, 1]), NOW), null);
  });

  it("schweigt ohne Radar-Daten (alte Cache-Antwort)", () => {
    assert.equal(rainNowcast(weather(), NOW), null);
  });

  it("ignoriert Nieseln unter der Schwelle", () => {
    assert.equal(rainNowcast(mitRadar([0, 0.05, 0.05, 0, 0, 0]), NOW), null);
  });
});
