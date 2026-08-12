import { desiredShade } from "./scoring";
import { formatAge, statusOption } from "./status";
import { formatDistance, walkingMinutes } from "./utils";
import { weatherAt } from "./weather";
import type { Place, PlaceStatus, ShadeState, Weather } from "@/types";

/**
 * Diese Datei übersetzt Zahlen in Sätze. Sie ist die einzige Stelle, an der
 * aus „shadeScore: 72“ ein „Passt gut zum Wetter gerade“ wird – damit die
 * Sprache überall dieselbe bleibt und niemand eine rohe Zahl vorgesetzt bekommt.
 */

export type Tone = "good" | "medium" | "bad" | "neutral";

export interface Wording {
  label: string;
  tone: Tone;
}

/* ------------------------------------------------------------------ Score */

export function scoreWording(score: number): Wording {
  if (score >= 70) return { label: "Besonders angenehm", tone: "good" };
  if (score >= 55) return { label: "Angenehm", tone: "good" };
  if (score >= 40) return { label: "Geht so", tone: "medium" };
  if (score >= 25) return { label: "Eher unangenehm", tone: "bad" };
  return { label: "Gerade ungünstig", tone: "bad" };
}

export const SCORE_ERKLAERUNG =
  "Der Wert fasst vier Dinge zusammen: wie viel Schatten es dort gerade gibt " +
  "(zählt am meisten), welche Ausstattung erfasst ist, was andere Eltern in " +
  "den letzten Stunden gemeldet haben und wie weit der Weg ist. 100 wäre " +
  "perfekt für dieses Wetter.";

/* ---------------------------------------------------------------- Schatten */

const SCHATTEN_WORTE: Record<ShadeState, Wording> = {
  shady: { label: "Aktuell viel Schatten", tone: "good" },
  partial: { label: "Teilweise sonnig", tone: "medium" },
  sunny: { label: "Aktuell voll in der Sonne", tone: "bad" },
  "no-sun": { label: "Keine Sonne mehr", tone: "neutral" },
};

export function shadeWording(state: ShadeState): Wording {
  return SCHATTEN_WORTE[state];
}

/** Kurzform für die Karte, wo der Platz knapp ist. */
export function shadeShort(state: ShadeState): string {
  return {
    shady: "Viel Schatten",
    partial: "Teils sonnig",
    sunny: "Volle Sonne",
    "no-sun": "Ohne Sonne",
  }[state];
}

/**
 * Warum ist es hier gerade so? Ein Satz, der die stärkste Ursache benennt –
 * das beantwortet die Frage „und was heißt das jetzt?“ besser als jede Zahl.
 */
export function shadeReason(place: Place, at: Date): string {
  const { fromClouds, fromCanopy, fromBuildings, sunAltitudeDeg, state } = place.shade;

  if (state === "no-sun") {
    return "Die Sonne steht unter dem Horizont – Schatten spielt jetzt keine Rolle.";
  }

  const stunde = at.getHours();

  if (fromClouds >= 0.5 && fromClouds >= Math.max(fromCanopy, fromBuildings)) {
    return "Dichte Wolken – die Sonne kommt gerade kaum durch.";
  }
  if (fromCanopy >= 0.35 && fromCanopy >= fromBuildings) {
    return "Viele Bäume ringsum halten die Sonne ab.";
  }
  if (fromBuildings >= 0.3) {
    return sunAltitudeDeg < 25
      ? "Die Sonne steht tief – die Häuser ringsum werfen lange Schatten."
      : "Gebäude in der Nähe beschatten einen Teil der Fläche.";
  }
  if (sunAltitudeDeg > 45) {
    return "Die Sonne steht hoch – offene Flächen sind gerade stark besonnt.";
  }
  if (sunAltitudeDeg < 25) {
    return stunde >= 15
      ? "Später Nachmittag – Bäume und Gebäude werfen jetzt mehr Schatten."
      : "Die Morgensonne steht noch flach – lange Schatten von Häusern und Bäumen.";
  }
  return "Kaum Bäume und offene Fläche – hier gibt es wenig Schutz vor der Sonne.";
}

/** Was sich in der nächsten Stunde ändert – nur wenn es der Rede wert ist. */
export function shadeOutlook(jetzt: number, spaeter: number): string | null {
  const differenz = spaeter - jetzt;
  if (differenz > 0.18) return "In einer Stunde ist hier deutlich mehr Schatten.";
  if (differenz < -0.18) return "In einer Stunde wird es hier sonniger.";
  return null;
}

/* ------------------------------------------------------------- Ausstattung */

export function amenitySentence(place: Place): string {
  const { tags, toiletDistance } = place;
  const teile: string[] = [];

  if (tags.toilet === true) {
    teile.push(
      toiletDistance !== null && toiletDistance > 25
        ? `Toilette ${formatDistance(toiletDistance)} entfernt`
        : "Toilette vor Ort",
    );
  }
  if (tags.fenced === true) teile.push("eingezäunt");
  if (tags.changing_table === true) teile.push("Wickeltisch");
  if (tags.drinking_water === true) teile.push("Wasser");
  if (tags.shelter === true) teile.push("überdachter Bereich");

  if (teile.length === 0) return "Zur Ausstattung ist nichts eingetragen";
  const satz = teile.join(", ");
  return satz.charAt(0).toUpperCase() + satz.slice(1);
}

/**
 * Für die Aufschlüsselung reicht die Aufzählung des Vorhandenen nicht: Neben
 * einer roten 30 muss stehen, *warum* sie niedrig ist – nämlich weil das
 * Wichtige fehlt oder gar nicht erfasst ist.
 */
export function amenityBreakdownSentence(place: Place): string {
  const { tags } = place;
  const vorhanden: string[] = [];
  if (tags.toilet === true) vorhanden.push("Toilette");
  if (tags.fenced === true) vorhanden.push("Zaun");
  if (tags.changing_table === true) vorhanden.push("Wickeltisch");
  if (tags.drinking_water === true) vorhanden.push("Wasser");
  if (tags.shelter === true) vorhanden.push("überdachter Bereich");

  const fehlend: string[] = [];
  if (tags.toilet !== true) fehlend.push("Toilette");
  if (tags.fenced !== true) fehlend.push("Zaun");

  if (vorhanden.length === 0) {
    return "Nichts eingetragen – zu Toilette und Zaun fehlt jede Angabe";
  }
  if (fehlend.length === 0) return `${vorhanden.join(", ")} – alles Wichtige da`;
  return `${vorhanden.join(", ")} – zu ${listeMitUnd(fehlend)} fehlt die Angabe`;
}

function listeMitUnd(teile: string[]): string {
  if (teile.length <= 1) return teile.join("");
  return `${teile.slice(0, -1).join(", ")} und ${teile[teile.length - 1]}`;
}

/* ---------------------------------------------------------------- Meldungen */

/** „Vor 20 Minuten gemeldet: zu voll“ – oder nichts, wenn es nichts gibt. */
export function statusSentence(
  statuses: PlaceStatus[],
  now = Date.now(),
): { text: string; tone: Tone } | null {
  if (statuses.length === 0) return null;
  const neueste = [...statuses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  const option = statusOption(neueste.type);
  const alter = formatAge(neueste.createdAt, now);
  const tone: Tone = option.tone === "good" ? "good" : option.tone === "bad" ? "bad" : "neutral";
  return {
    text: `${alter} gemeldet: ${option.label.toLowerCase()}`,
    tone,
  };
}

/* ---------------------------------------------------------------------- UV */

/** „5.6“ sagt niemandem etwas – „hoch“ schon. */
export function uvWording(uvIndex: number): Wording {
  if (uvIndex < 3) return { label: "niedrig", tone: "good" };
  if (uvIndex < 6) return { label: "mittel", tone: "medium" };
  if (uvIndex < 8) return { label: "hoch", tone: "bad" };
  return { label: "sehr hoch", tone: "bad" };
}

/* --------------------------------------------------------------- Entfernung */

export function distanceSentence(meters: number): string {
  const minuten = walkingMinutes(meters);
  const einheit = minuten === 1 ? "Minute" : "Minuten";
  if (minuten <= 8) return `Nur ${minuten} ${einheit} zu Fuß`;
  if (minuten <= 20) return `${minuten} ${einheit} zu Fuß`;
  return `${minuten} ${einheit} zu Fuß – schon ein Stück`;
}

/* -------------------------------------------------------- Wichtigster Grund */

export interface Driver {
  text: string;
  tone: Tone;
}

/**
 * Warum steht dieser Ort da, wo er steht? Gesucht ist der Bestandteil, der am
 * stärksten vom Mittelmaß abweicht – gewichtet, denn Schatten zählt 45 % und
 * Entfernung nur 10 %. Das beantwortet die eigentliche Frage: „Wieso der?“
 */
export function mainDriver(place: Place): Driver {
  const b = place.breakdown;
  const beitraege = [
    { key: "shade", delta: (b.shadeScore - 50) * 0.45 },
    { key: "amenity", delta: (b.amenityScore - 50) * 0.25 },
    { key: "status", delta: (b.statusScore - 50) * 0.2 },
    { key: "distance", delta: (b.distanceScore - 50) * 0.1 },
  ].sort((a, z) => Math.abs(z.delta) - Math.abs(a.delta));

  const staerkster = beitraege[0];
  const positiv = staerkster.delta > 0;

  if (Math.abs(staerkster.delta) < 4) {
    return { text: "Alles im Mittelfeld – nichts sticht heraus.", tone: "neutral" };
  }

  switch (staerkster.key) {
    case "shade":
      return positiv
        ? {
            text:
              place.shade.state === "no-sun"
                ? "Vor allem, weil die Sonne hier keine Rolle mehr spielt."
                : "Vor allem, weil es hier gerade viel Schatten gibt.",
            tone: "good",
          }
        : { text: "Bremst vor allem: kaum Schatten bei dieser Sonne.", tone: "bad" };
    case "amenity":
      return positiv
        ? { text: `Punktet vor allem mit: ${vorhandeneAusstattung(place)}.`, tone: "good" }
        : {
            text: "Bremst vor allem: zur Ausstattung ist wenig eingetragen.",
            tone: "bad",
          };
    case "status": {
      const meldung = statusSentence(place.lastStatuses);
      if (!meldung) return { text: "Alles im Mittelfeld.", tone: "neutral" };
      return {
        text: positiv
          ? `Andere Eltern haben ${meldung.text}.`
          : `Bremst vor allem eine Meldung: ${meldung.text}.`,
        tone: positiv ? "good" : "bad",
      };
    }
    default:
      return positiv
        ? { text: "Vor allem, weil es gleich um die Ecke liegt.", tone: "good" }
        : { text: "Bremst vor allem der weite Weg.", tone: "bad" };
  }
}

function vorhandeneAusstattung(place: Place): string {
  const teile: string[] = [];
  if (place.tags.toilet === true) teile.push("Toilette");
  if (place.tags.fenced === true) teile.push("Zaun");
  if (place.tags.changing_table === true) teile.push("Wickeltisch");
  if (place.tags.drinking_water === true) teile.push("Wasser");
  return teile.length ? listeMitUnd(teile) : "der Ausstattung";
}

/* -------------------------------------------------------- Fakten in Kurzform */

/**
 * Die Zeile unter der Karte. Bewusst inklusive der Lücken: Wer nur auflistet,
 * was da ist, suggeriert, der Rest sei geprüft und nicht vorhanden.
 */
export function factChips(place: Place): { text: string; unknown: boolean }[] {
  const chips: { text: string; unknown: boolean }[] = [
    { text: distanceSentence(place.distance ?? 0).replace("Nur ", ""), unknown: false },
  ];

  if (place.tags.toilet === true) {
    chips.push({
      text:
        place.toiletDistance !== null && place.toiletDistance > 25
          ? `Toilette ${formatDistance(place.toiletDistance)}`
          : "Toilette",
      unknown: false,
    });
  } else if (place.tags.toilet === undefined) {
    chips.push({ text: "Toilette unbekannt", unknown: true });
  }

  if (place.tags.fenced === true) chips.push({ text: "Eingezäunt", unknown: false });
  else if (place.tags.fenced === undefined) {
    chips.push({ text: "Zaun unbekannt", unknown: true });
  }

  if (place.tags.water_play === true) {
    chips.push({ text: "Planschwasser", unknown: false });
  }
  if (place.tags.changing_table === true) {
    chips.push({ text: "Wickeltisch", unknown: false });
  }
  if (place.tags.age_group) {
    chips.push({ text: place.tags.age_group, unknown: false });
  }
  if (place.tags.drinking_water === true) {
    chips.push({ text: "Trinkwasser", unknown: false });
  }

  return chips;
}

/* ---------------------------------------------------------------- Aufteilung */

export interface BreakdownRow {
  key: string;
  label: string;
  /** Anteil am Gesamtwert, z. B. 45 */
  weightPercent: number;
  value: number;
  tone: Tone;
  sentence: string;
}

function toneForValue(value: number): Tone {
  if (value >= 70) return "good";
  if (value >= 45) return "medium";
  return "bad";
}

/**
 * Die vier Bestandteile mit je einem Satz, der sagt, was die Zahl bedeutet.
 * „Schatten: 72“ allein hilft niemandem.
 */
export function breakdownRows(
  place: Place,
  weather: Weather,
  at: Date,
  now = Date.now(),
): BreakdownRow[] {
  const b = place.breakdown;
  const w = weatherAt(weather, at);
  const gewuenscht = desiredShade(w.apparentTemperature, w.uvIndex);
  const abweichung = place.shade.index - gewuenscht;

  const schattenSatz =
    place.shade.state === "no-sun"
      ? "Ohne Sonne spielt Schatten gerade keine Rolle"
      : abweichung < -0.15
        ? "Weniger Schatten, als es bei dem Wetter bräuchte"
        : abweichung > 0.25 && w.apparentTemperature < 14
          ? "Mehr Schatten als nötig – bei der Kühle eher ungemütlich"
          : "Passt gut zum Wetter gerade";

  const meldung = statusSentence(place.lastStatuses, now);
  // Die tatsächlich verwendeten Gewichte – Schatten kann bei mildem Wetter
  // klein sein, dann zählen Ausstattung und Nähe entsprechend mehr.
  const wt = b.weights;

  return [
    {
      key: "shade",
      label: "Schatten",
      weightPercent: Math.round(wt.shade * 100),
      value: Math.round(b.shadeScore),
      tone: toneForValue(b.shadeScore),
      sentence: schattenSatz,
    },
    {
      key: "amenity",
      label: "Ausstattung",
      weightPercent: Math.round(wt.amenity * 100),
      value: Math.round(b.amenityScore),
      tone: toneForValue(b.amenityScore),
      sentence: amenityBreakdownSentence(place),
    },
    {
      key: "status",
      label: "Meldungen anderer Eltern",
      weightPercent: Math.round(wt.status * 100),
      value: Math.round(b.statusScore),
      tone: toneForValue(b.statusScore),
      sentence: meldung
        ? meldung.text.charAt(0).toUpperCase() + meldung.text.slice(1)
        : "Bisher keine Meldungen – zählt weder positiv noch negativ",
    },
    {
      key: "distance",
      label: "Entfernung",
      weightPercent: Math.round(wt.distance * 100),
      value: Math.round(b.distanceScore),
      tone: toneForValue(b.distanceScore),
      sentence: distanceSentence(place.distance ?? 0),
    },
  ];
}

/** Regen und Wind wirken auf alle Orte gleich – das gehört dazugesagt. */
export function weatherFactorNote(factor: number): string | null {
  if (factor >= 0.97) return null;
  const abzug = Math.round((1 - factor) * 100);
  return `Wetter zieht überall ${abzug} % ab – Regen oder starker Wind.`;
}
