import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FALLBACK_WEATHER, weatherAt } from "../lib/weather";
import { scorePlace } from "../lib/scoring";
import { selectPlaces } from "../lib/select";
import { DEFAULT_FILTERS } from "../store/useFilters";
import { NOON, place } from "./helpers";

const NOW = NOON.getTime();

describe("Ersatzwetter bei Wetter-Ausfall", () => {
  it("weatherAt fällt bei leeren Stunden auf die Grundwerte zurück", () => {
    const jetzt = weatherAt(FALLBACK_WEATHER, NOON);
    assert.equal(jetzt.temperature, FALLBACK_WEATHER.temperature);
    assert.equal(jetzt.apparentTemperature, FALLBACK_WEATHER.apparentTemperature);
    assert.equal(jetzt.cloudCover, FALLBACK_WEATHER.cloudCover);
    assert.equal(jetzt.uvIndex, FALLBACK_WEATHER.uvIndex);

    // Auch für „+1 Std“ bleiben es dieselben neutralen Werte, kein Absturz.
    const spaeter = weatherAt(FALLBACK_WEATHER, new Date(NOW + 60 * 60_000));
    assert.equal(spaeter.temperature, FALLBACK_WEATHER.temperature);
  });

  it("bewertet einen Ort auch mit Ersatzwetter sauber (0..100, endlich)", () => {
    const scored = scorePlace(place({ tags: { toilet: true } }), {
      weather: FALLBACK_WEATHER,
      at: NOON,
      distanceM: 400,
      statuses: [],
      now: NOW,
    });
    assert.ok(Number.isFinite(scored.pleasantScore));
    assert.ok(scored.pleasantScore >= 0 && scored.pleasantScore <= 100);
  });

  it("zeigt die Liste weiter, wenn nur das Wetter fehlt", () => {
    const { visible } = selectPlaces({
      places: [
        place({ id: "way/1" }),
        place({ id: "way/2", lat: 48.138, lng: 11.576 }),
      ],
      weather: FALLBACK_WEATHER,
      statuses: [],
      filters: DEFAULT_FILTERS,
      origin: { lat: 48.137, lng: 11.575 },
      at: NOON,
      now: NOW,
    });
    assert.ok(
      visible.length > 0,
      "Orte sollen trotz fehlendem Wetter erscheinen, nicht leer bleiben",
    );
  });
});
