import { NextResponse } from "next/server";
import { fetchPlaces } from "@/lib/osm";
import {
  pruneTiles,
  readTileAges,
  tileKey,
  writeTile,
} from "@/lib/tileStore";
import {
  FRISCH_GENUG_MS,
  planeWarmup,
  STAEDTE,
  WARMUP_RADIUS_M,
} from "@/lib/warmupPlan";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Nächtliches Vorwärmen des dauerhaften Orte-Speichers: Wer morgens in einer
 * der Städte aus lib/warmupPlan.ts die App öffnet, bekommt die Liste sofort,
 * statt als erster Besucher des Tages auf Overpass zu warten. Gewärmt wird
 * die Rasterzelle des Stadtzentrums mit dem Standard-Radius; wer weiter
 * draußen wohnt oder andere Filter nutzt, profitiert vom normalen
 * Nutzer-Speicher.
 *
 * Bewusst höflich zu Overpass (ehrenamtlich betrieben): pro Nacht höchstens
 * DREI Städte, nacheinander, mit Pausen, älteste zuerst. Scheitert eine
 * Stadt, ist die nächste dran; nach zwei Fehlschlägen ist die Nacht vorbei –
 * Overpass hat dann offensichtlich keine Kapazität.
 */
const MAX_STAEDTE_PRO_LAUF = 3;
const MAX_FEHLSCHLAEGE = 2;
const ZEITBUDGET_MS = 90_000;
/** Eine einzelne Stadt darf das Nacht-Budget nicht sprengen: fetchPlaces
 *  kann im Worst Case Minuten brauchen, maxDuration ist aber 120 s. */
const STADT_TIMEOUT_MS = 70_000;
const PAUSE_MS = 2_000;
/** Aufräum-Grenze für sehr alte Speicher-Zeilen. */
const TILE_MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Nicht öfter als einmal pro Stunde je Instanz – das Netz für lokale Läufe. */
let letzterLauf = 0;

function mitFrist<T>(arbeit: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    arbeit,
    new Promise<never>((_, ablehnen) =>
      setTimeout(() => ablehnen(new Error("Stadt-Zeitlimit erreicht")), ms),
    ),
  ]);
}

export async function GET(request: Request) {
  // Vercel-Cron schickt den Secret-Header automatisch mit, sobald CRON_SECRET
  // als Umgebungsvariable existiert. Auf Vercel OHNE Secret bleibt der
  // Endpunkt zu (fail closed): Die Instanz-Drossel unten schützt nicht vor
  // parallelen Aufrufen auf viele kalte Instanzen – jemand könnte sonst
  // unsere Function als Overpass-Hammer benutzen.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "nicht erlaubt" }, { status: 401 });
    }
  } else if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "CRON_SECRET ist nicht gesetzt, Vorwärmen bleibt aus." },
      { status: 503 },
    );
  } else if (Date.now() - letzterLauf < 60 * 60 * 1000) {
    return NextResponse.json({ ok: true, note: "gerade erst gelaufen" });
  }
  letzterLauf = Date.now();

  const start = Date.now();

  // Erst aufräumen (billig), dann wärmen. Fremde Schema-Versionen und
  // Uralt-Zeilen fliegen raus, damit der Speicher nicht ewig wächst.
  await pruneTiles(TILE_MAX_AGE_MS);

  // Älteste zuerst: EIN Abruf holt das Alter aller Stadt-Tiles.
  const alterJeKey = await readTileAges(
    STAEDTE.map(([, lat, lng]) => tileKey(lat, lng, WARMUP_RADIUS_M, false)),
  );
  const alterJeStadt = new Map<string, number>();
  for (const [stadt, lat, lng] of STAEDTE) {
    const alter = alterJeKey.get(tileKey(lat, lng, WARMUP_RADIUS_M, false));
    if (alter !== undefined) alterJeStadt.set(stadt, alter);
  }
  const plan = planeWarmup(alterJeStadt, MAX_STAEDTE_PRO_LAUF, FRISCH_GENUG_MS);

  const ergebnis: { stadt: string; status: string }[] = [];
  let aufgefrischt = 0;
  let fehlschlaege = 0;

  for (const { stadt, lat, lng } of plan) {
    if (Date.now() - start > ZEITBUDGET_MS) break;
    if (fehlschlaege >= MAX_FEHLSCHLAEGE) break;

    try {
      const voll = await mitFrist(
        fetchPlaces(lat, lng, WARMUP_RADIUS_M, false),
        STADT_TIMEOUT_MS,
      );
      const gespeichert = await writeTile(
        tileKey(lat, lng, WARMUP_RADIUS_M, false),
        voll,
      );
      const schnell = await mitFrist(
        fetchPlaces(lat, lng, WARMUP_RADIUS_M, true),
        STADT_TIMEOUT_MS,
      ).catch(() => null);
      if (schnell) {
        await writeTile(tileKey(lat, lng, WARMUP_RADIUS_M, true), schnell);
      }
      aufgefrischt += 1;
      // Ehrlich melden, ob wirklich gespeichert wurde: Ohne Service-Key
      // liefe der Vorwärmer sonst jede Nacht umsonst, und niemand sähe es.
      ergebnis.push({
        stadt,
        status: gespeichert
          ? `ok (${voll.places.length} Orte)`
          : "geholt, aber NICHT gespeichert. Fehlt der Service-Key?",
      });
      if (!gespeichert) break;
    } catch {
      fehlschlaege += 1;
      ergebnis.push({ stadt, status: "overpass nicht erreichbar" });
    }
    await pause(PAUSE_MS);
  }

  return NextResponse.json({
    ok: true,
    aufgefrischt,
    dauerMs: Date.now() - start,
    ergebnis,
  });
}
