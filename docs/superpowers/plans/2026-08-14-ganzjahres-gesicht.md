# PlatzDa Ganzjahres-Gesicht Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Gesicht der App (Kopf-Texte plus zwei kleine Helfer) folgt dem tatsächlichen Wetter, damit PlatzDa das ganze Jahr stimmig wirkt, nicht nur im Sommer.

**Architecture:** Reine, testbare Logik in `lib/` (Wetter-Regime, Anzieh-Tipp, Tageslicht-Hinweis). Der bestehende Bewertungs-Motor, die Liste, die Karte und der Score bleiben unangetastet. Die Anzeige im `WeatherHeader` liest die neue Logik und blendet regime-abhängig einen kurzen Anzieh-Satz und (bei kurzen Tagen) einen Tageslicht-Hinweis ein.

**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4, Tests mit `node:test` (`npm test`), bestehende Fixtures in `tests/helpers.ts`.

## Global Constraints

- Sichtbare Texte: **keine Bindestrich-Gedankenstriche** (kein „–"/„—"); Kommas oder Punkte verwenden.
- Deutsche typografische Anführungszeichen „…" in JSX-Text (gerade `"` lösen einen Lint-Fehler aus, react/no-unescaped-entities).
- Ansprache in „du"-Form, warm und knapp, passend zum bestehenden Ton.
- Nur echte Daten nutzen (Open-Meteo-Werte, Sonnenstand). Keine neuen geschätzten Größen.
- Reine Logik gehört in `lib/` und wird per `node:test` getestet; UI wird im Browser geprüft (Projekt testet keine Komponenten).
- Nach jeder Logik-Änderung: `npm run typecheck` und `npm test` müssen grün sein. Nach UI-Änderung zusätzlich `npm run lint`.

---

### Task 1: Wetter-Regime bestimmen

Ordnet die aktuellen Wetterwerte einem von vier „Gesichtern" zu. Reine Funktion, damit das Kernstück testbar ist.

**Files:**
- Create: `lib/regime.ts`
- Test: `tests/regime.test.ts`

**Interfaces:**
- Consumes: `desiredShade(apparentTemperature: number, uvIndex: number): number` aus `lib/scoring.ts` (0..1, wie viel Schatten das Wetter verlangt).
- Produces: `type Regime = "night" | "hot" | "cold" | "mild"` und `weatherRegime(apparentTemperature: number, uvIndex: number, isDay: boolean): Regime`.

- [ ] **Step 1: Failing test schreiben**

Create `tests/regime.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weatherRegime } from "../lib/regime";

describe("weatherRegime", () => {
  it("ist nachts immer 'night', egal wie warm", () => {
    assert.equal(weatherRegime(24, 0, false), "night");
  });

  it("ist bei Hitze mit Sonne 'hot' (Schatten zählt)", () => {
    assert.equal(weatherRegime(28, 6, true), "hot");
  });

  it("ist auch bei kühler Luft mit sehr hohem UV 'hot'", () => {
    // hoher UV lässt Schatten zählen, auch wenn es nicht heiß ist
    assert.equal(weatherRegime(13, 8, true), "hot");
  });

  it("ist bei Kälte 'cold'", () => {
    assert.equal(weatherRegime(4, 1, true), "cold");
  });

  it("ist bei angenehmer Temperatur ohne Schatten-Bedarf 'mild'", () => {
    assert.equal(weatherRegime(20, 3, true), "mild");
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

Run: `npm test`
Expected: FAIL, `Cannot find module '../lib/regime'`.

- [ ] **Step 3: Minimale Implementierung**

Create `lib/regime.ts`:

```ts
import { desiredShade } from "./scoring";

export type Regime = "night" | "hot" | "cold" | "mild";

/**
 * Das „Gesicht" der App folgt dem tatsächlichen Wetter, nicht dem Kalender:
 * nachts spielt die Sonne keine Rolle, bei Hitze/hohem UV zählt Schatten,
 * bei Kälte zählen Sonne und Windschutz, dazwischen ist fast überall okay.
 */
export function weatherRegime(
  apparentTemperature: number,
  uvIndex: number,
  isDay: boolean,
): Regime {
  if (!isDay) return "night";
  if (desiredShade(apparentTemperature, uvIndex) >= 0.5) return "hot";
  if (apparentTemperature < 10) return "cold";
  return "mild";
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

Run: `npm test` und `npm run typecheck`
Expected: PASS (alle bisherigen Tests bleiben grün), typecheck ohne Fehler.

- [ ] **Step 5: Commit**

```bash
git add lib/regime.ts tests/regime.test.ts
git commit -m "Wetter-Regime: hot/mild/cold/night aus den Werten ableiten"
```

---

### Task 2: Anzieh- und Mitnehm-Tipp

Ein kurzer, wetterabhängiger Satz für den „bevor ich losgehe"-Moment. v1 altersneutral.

**Files:**
- Create: `lib/outdoorTips.ts`
- Test: `tests/outdoor-tips.test.ts`

**Interfaces:**
- Produces: `clothingAdvice(params: { apparentTemperature: number; uvIndex: number; precipitationProbability: number; windSpeed: number }): string`.

- [ ] **Step 1: Failing test schreiben**

Create `tests/outdoor-tips.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clothingAdvice } from "../lib/outdoorTips";

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
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

Run: `npm test`
Expected: FAIL, `Cannot find module '../lib/outdoorTips'`.

- [ ] **Step 3: Minimale Implementierung**

Create `lib/outdoorTips.ts`:

```ts
/** Kurzer Anzieh- und Mitnehm-Tipp aus den echten Wetterwerten. Altersneutral
 *  gehalten (Krippe bis Grundschule), rein abgeleitet, keine Schätzung. */
export function clothingAdvice(params: {
  apparentTemperature: number;
  uvIndex: number;
  precipitationProbability: number;
  windSpeed: number;
}): string {
  const { apparentTemperature, uvIndex, precipitationProbability, windSpeed } = params;
  const teile: string[] = [];

  if (apparentTemperature >= 24) teile.push("Leichte Sachen");
  else if (apparentTemperature >= 15) teile.push("Leichte Jacke reicht");
  else if (apparentTemperature >= 8) teile.push("Warm anziehen");
  else teile.push("Dick einpacken, Mütze auf");

  if (uvIndex >= 5) teile.push("Sonnenhut und eincremen");
  if (windSpeed >= 25) teile.push("winddichte Jacke");
  if (precipitationProbability >= 60) teile.push("Regenkleidung");
  if (apparentTemperature >= 27) teile.push("genug Wasser mit");

  const satz = teile.join(", ");
  return satz.charAt(0).toUpperCase() + satz.slice(1) + ".";
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

Run: `npm test` und `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/outdoorTips.ts tests/outdoor-tips.test.ts
git commit -m "Anzieh-Tipp: kurzer wetterabhängiger Satz (altersneutral)"
```

---

### Task 3: Tageslicht-Hinweis

„Noch rund X Std Sonne (bis 16:48)" nur dann, wenn das Tageslicht knapp wird (unter 3 Stunden). Exakt aus dem Sonnenuntergang.

**Files:**
- Modify: `lib/outdoorTips.ts` (Funktion ergänzen)
- Test: `tests/outdoor-tips.test.ts` (Block ergänzen)

**Interfaces:**
- Consumes: `formatTime(date: Date): string` aus `lib/utils.ts` (liefert „HH:MM").
- Produces: `daylightHint(now: Date, sunset: Date): string | null`.

- [ ] **Step 1: Failing test ergänzen**

In `tests/outdoor-tips.test.ts` ergänzen (Import oben erweitern und Block anhängen):

```ts
import { clothingAdvice, daylightHint } from "../lib/outdoorTips";
import { formatTime } from "../lib/utils";

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
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

Run: `npm test`
Expected: FAIL (`daylightHint` ist noch kein Export).

- [ ] **Step 3: Minimale Implementierung ergänzen**

Am Anfang von `lib/outdoorTips.ts` den Import ergänzen und Funktion anhängen:

```ts
import { formatTime } from "./utils";

/** Bei kurzen Tagen relevant: wie lange lohnt sich Rausgehen noch? Nur unter
 *  drei Stunden Restlicht, sonst kein Hinweis. */
export function daylightHint(now: Date, sunset: Date): string | null {
  const msLeft = sunset.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  const hoursLeft = msLeft / 3_600_000;
  if (hoursLeft > 3) return null;
  const menge = hoursLeft < 1 ? "weniger als 1 Std" : `rund ${Math.round(hoursLeft)} Std`;
  return `Noch ${menge} Sonne (bis ${formatTime(sunset)}).`;
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg prüfen**

Run: `npm test` und `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/outdoorTips.ts tests/outdoor-tips.test.ts
git commit -m "Tageslicht-Hinweis: noch X Std Sonne bei kurzen Tagen"
```

---

### Task 4: Helfer im Wetter-Kopf anzeigen

Den Anzieh-Tipp immer und den Tageslicht-Hinweis bei knappem Licht unter dem großen Wetter-Satz einblenden. Der bestehende Rat-Satz (`weatherAdvice`) bleibt die Überschrift und ist bereits regime-adaptiv; hier kommen die zwei Helfer dazu.

**Files:**
- Modify: `components/WeatherHeader.tsx`

**Interfaces:**
- Consumes: `clothingAdvice`, `daylightHint` aus `lib/outdoorTips.ts`; `sunTimes(lat, lng, date)` aus `lib/sun.ts` (liefert `{ sunrise, sunset }`); vorhandene `values` (aus `weatherAt`) und `weather` im Kopf.

- [ ] **Step 1: Imports ergänzen**

In `components/WeatherHeader.tsx` bei den Imports ergänzen:

```ts
import { clothingAdvice, daylightHint } from "@/lib/outdoorTips";
import { sunTimes } from "@/lib/sun";
```

- [ ] **Step 2: Helfer-Texte im Render berechnen**

Der `WeatherHeader` braucht für den Sonnenuntergang die Koordinaten des Anzeige-Orts. Ergänze dafür zuerst ein optionales Prop `origin`, dann berechne die Helfer-Texte innerhalb des `{values && weather && uv && (` Blocks direkt vor dem `<dl>`-Element.

Ergänze die Props-Signatur um optionale Koordinaten:

```ts
  origin,
}: {
  weather: Weather | null;
  weatherError?: boolean;
  at: Date;
  origin?: { lat: number; lng: number };
  locationLabel: string;
  geoStatus: GeoStatus;
  manualActive?: boolean;
  onOpenLocation: () => void;
}) {
```

Dann im Render (vor dem `<dl>`):

```tsx
{(() => {
  const tipp = clothingAdvice({
    apparentTemperature: values.apparentTemperature,
    uvIndex: values.uvIndex,
    precipitationProbability: values.precipitationProbability,
    windSpeed: weather.windSpeed,
  });
  const licht =
    origin && weather.isDay
      ? daylightHint(at, sunTimes(origin.lat, origin.lng, at).sunset)
      : null;
  return (
    <div className="relative mt-3 space-y-1 text-[15px] leading-snug text-dark">
      <p>{tipp}</p>
      {licht && <p className="text-muted">{licht}</p>}
    </div>
  );
})()}
```

- [ ] **Step 3: Koordinaten vom Aufrufer durchreichen**

In `components/HomeView.tsx` bei der Verwendung von `<WeatherHeader ... />` das Prop `origin={coords}` ergänzen (die Variable `coords` existiert dort bereits als aktueller Anzeige-Ort).

- [ ] **Step 4: Prüfen**

Run: `npm run typecheck && npm run lint`
Expected: beide ohne Fehler.

Dann Dev-Server starten und im Browser `http://localhost:<port>/` laden. Erwartet: Unter dem großen Wetter-Satz steht ein kurzer Anzieh-Tipp; bei Testzeitpunkten mit knappem Tageslicht zusätzlich der „Noch X Std Sonne"-Satz. Bei fehlendem Wetter (Fehlerfall) erscheint wie bisher nur der Hinweis-Kasten, kein Tipp.

- [ ] **Step 5: Commit**

```bash
git add components/WeatherHeader.tsx components/HomeView.tsx
git commit -m "Wetter-Kopf: Anzieh-Tipp und Tageslicht-Hinweis eingewoben"
```

---

### Task 5: Regime im Kopf sichtbar machen (Kälte-Gesicht)

Bei „cold" den Wind sichtbarer betonen (kuratiertes C, echte Daten). Kleiner, gezielter Eingriff: im Kälte-Regime bekommt der Wind-Wert in der Statistik-Zeile eine dezente Hervorhebung, damit klar wird, dass jetzt Windschutz zählt.

**Files:**
- Modify: `components/WeatherHeader.tsx`

**Interfaces:**
- Consumes: `weatherRegime`, `type Regime` aus `lib/regime.ts`.

- [ ] **Step 1: Import und Regime berechnen**

In `components/WeatherHeader.tsx` ergänzen:

```ts
import { weatherRegime } from "@/lib/regime";
```

Im Render, wo `values` bekannt ist, das Regime ableiten:

```ts
const regime = weather && values ? weatherRegime(values.apparentTemperature, values.uvIndex, weather.isDay) : null;
```

- [ ] **Step 2: Wind im Kälte-Gesicht betonen**

Im `<Wert label="Wind">`-Baustein den Wert bei `regime === "cold"` in der Akzentfarbe zeigen:

```tsx
<Wert label="Wind">
  <span className={regime === "cold" ? "text-accent-ink" : undefined}>
    {Math.round(weather.windSpeed)} km/h
  </span>
</Wert>
```

- [ ] **Step 3: Prüfen**

Run: `npm run typecheck && npm run lint`
Expected: ohne Fehler. Im Browser (falls gerade kaltes, windiges Wetter am Testort nicht vorliegt, reicht die Prüfung, dass nichts bricht; die Farbe greift automatisch, sobald das Regime „cold" ist).

- [ ] **Step 4: Commit**

```bash
git add components/WeatherHeader.tsx
git commit -m "Kälte-Gesicht: Wind dezent betont, wenn Windschutz zählt"
```

---

## Self-Review (durchgeführt)

- **Spec-Abdeckung:** Wetteradaptives Gesicht (Task 1 Regime, Task 5 Kälte-Betonung, bestehender `weatherAdvice` deckt die Überschrift bereits regime-adaptiv ab). Helfer „Was anziehen" (Task 2, 4) und „Tageslicht/beste Zeit" (Task 3, 4). Kuratiertes C: Wind (Task 5); „nass/matschig" ist über die bestehenden Community-Meldungen und Warnungen bereits sichtbar und braucht keinen neuen Baustein. Nicht-Ziele eingehalten (kein Motor-Umbau, keine geratenen Größen, altersneutral).
- **Platzhalter:** keine.
- **Typ-Konsistenz:** `Regime` und `weatherRegime` einheitlich; `clothingAdvice`/`daylightHint` Signaturen stimmen zwischen Definition (Task 2, 3) und Verwendung (Task 4).
- **Umfang:** eine zusammenhängende Erweiterung, ein Plan.
