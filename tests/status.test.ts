import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expiresAtFor, formatAge, freshness, STATUS_TTL_MS } from "../lib/status";
import { selectPlaces } from "../lib/select";
import { DEFAULT_FILTERS } from "../store/useFilters";
import { NOON, place, status, weather } from "./helpers";

const NOW = NOON.getTime();

describe("Gültigkeit von Meldungen", () => {
  it("setzt expiresAt drei Stunden nach createdAt", () => {
    const createdAt = new Date(NOW).toISOString();
    const expires = new Date(expiresAtFor(createdAt)).getTime();
    assert.equal(expires - NOW, STATUS_TTL_MS);
  });

  it("verliert linear an Gewicht und ist nach Ablauf wertlos", () => {
    assert.ok(freshness(status("great", 0, NOW), NOW) > 0.99);
    const halb = freshness(status("great", 90, NOW), NOW);
    assert.ok(Math.abs(halb - 0.5) < 0.02, `war ${halb}`);
    assert.equal(freshness(status("great", 180, NOW), NOW), 0);
    assert.equal(freshness(status("great", 181, NOW), NOW), 0);
  });

  it("zählt genau bis zur Ablaufsekunde", () => {
    const kurzDavor = status("great", 179.99, NOW);
    assert.ok(freshness(kurzDavor, NOW) > 0);
    assert.equal(freshness(kurzDavor, NOW + 2 * 60_000), 0);
  });

  it("formuliert das Alter lesbar", () => {
    assert.equal(formatAge(new Date(NOW).toISOString(), NOW), "gerade eben");
    assert.equal(formatAge(new Date(NOW - 25 * 60_000).toISOString(), NOW), "vor 25 Min");
    assert.equal(formatAge(new Date(NOW - 125 * 60_000).toISOString(), NOW), "vor 2 Std");
  });
});

describe("selectPlaces mit Meldungen", () => {
  const origin = { lat: 48.137, lng: 11.575 };
  const basis = {
    places: [place({ id: "way/1" })],
    weather: weather(),
    filters: DEFAULT_FILTERS,
    origin,
    at: NOON,
    now: NOW,
  };

  it("zeigt frische Meldungen am Ort", () => {
    const { visible } = selectPlaces({
      ...basis,
      statuses: [status("too_crowded", 20, NOW, "way/1")],
    });
    assert.equal(visible[0].lastStatuses.length, 1);
  });

  it("blendet abgelaufene Meldungen aus", () => {
    const { visible } = selectPlaces({
      ...basis,
      statuses: [status("too_crowded", 200, NOW, "way/1")],
    });
    assert.equal(visible[0].lastStatuses.length, 0);
  });

  it("versteckt gemeldete Probleme auf Wunsch", () => {
    const statuses = [status("wet", 15, NOW, "way/1")];
    assert.equal(selectPlaces({ ...basis, statuses }).visible.length, 1);

    const streng = selectPlaces({
      ...basis,
      statuses,
      filters: { ...DEFAULT_FILTERS, hideReportedProblems: true },
    });
    assert.equal(streng.visible.length, 0);
    assert.equal(streng.filteredOut, 1);
  });

  it("lässt eine abgelaufene Problemmeldung den Ort nicht mehr verstecken", () => {
    const { visible } = selectPlaces({
      ...basis,
      statuses: [status("wet", 200, NOW, "way/1")],
      filters: { ...DEFAULT_FILTERS, hideReportedProblems: true },
    });
    assert.equal(visible.length, 1);
  });

  it("hält Orte außerhalb der Maximalentfernung heraus", () => {
    const { visible } = selectPlaces({
      ...basis,
      places: [place({ id: "way/2", lat: 48.2, lng: 11.7 })],
      statuses: [],
    });
    assert.equal(visible.length, 0);
  });
});
