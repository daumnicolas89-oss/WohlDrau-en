import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { loadLastVisit, saveLastVisit } from "../lib/lastVisit";

// Einfacher localStorage-Ersatz für die Node-Testumgebung.
const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

describe("lastVisit", () => {
  beforeEach(() => store.clear());

  it("liefert Gespeichertes innerhalb der Frist zurück", () => {
    saveLastVisit("test", { orte: 3 });
    assert.deepEqual(loadLastVisit<{ orte: number }>("test", 60_000), { orte: 3 });
  });

  it("verwirft zu alten Stand", () => {
    saveLastVisit("test", { orte: 3 });
    const raw = JSON.parse(store.get("test")!);
    raw.at = Date.now() - 10 * 60_000; // 10 Minuten alt
    store.set("test", JSON.stringify(raw));
    assert.equal(loadLastVisit("test", 60_000), null);
  });

  it("verwirft fremde Versionen (Formatwechsel)", () => {
    saveLastVisit("test", { orte: 3 });
    const raw = JSON.parse(store.get("test")!);
    raw.v = 999;
    store.set("test", JSON.stringify(raw));
    assert.equal(loadLastVisit("test", 60_000), null);
  });

  it("übersteht kaputtes JSON und fehlende Einträge", () => {
    store.set("kaputt", "{nicht json");
    assert.equal(loadLastVisit("kaputt", 60_000), null);
    assert.equal(loadLastVisit("gibtsnicht", 60_000), null);
  });
});
