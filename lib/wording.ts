import { desiredShade } from "./scoring";
import { formatAge, statusOption } from "./status";
import { formatDistance, walkingMinutes } from "./utils";
import { weatherAt } from "./weather";
import type { Place, PlaceStatus, ShadeState, Weather } from "@/types";

/**
 * Diese Datei übersetzt Zahlen in Sätze. Sie ist die einzige Stelle, an der
 * aus „shadeScore: 72“ ein „Passt gut zum Wetter gerade“ wird, damit die
 * Sprache überall dieselbe bleibt und niemand eine rohe Zahl vorgesetzt bekommt.
 */

export type Tone = "good" | "medium" | "bad" | "neutral";

/**
 * Ein Satz für den Wetter-Kopf, der sagt, worauf es gerade ankommt. Nachts
 * spielt Schatten keine Rolle, dann empfiehlt der Satz auch keinen, sonst
 * widerspricht er dem Mond und der Liste („Keine Sonne mehr“).
 */
export function weatherAdvice(
  apparent: number,
  uv: number,
  rainProbability: number,
  isDay: boolean,
): string {
  if (rainProbability >= 60) return "Regen ist wahrscheinlich. Kurz raus lohnt trotzdem.";
  if (!isDay) {
    if (apparent < 8) return "Kühle Nacht, zieh dich warm an.";
    if (apparent >= 21) return "Laue Nacht, angenehm für draußen.";
    return "Angenehm draußen, ganz ohne Sonne.";
  }
  const want = desiredShade(apparent, uv);
  if (want > 0.7) return "Jetzt zählt vor allem Schatten.";
  if (want > 0.4) return "Etwas Schatten tut gut.";
  if (apparent < 8) return "Kühl. Sonnige Ecken sind angenehmer.";
  return "Angenehm, fast überall gut auszuhalten.";
}

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
  "Der Wert fasst vier Dinge zusammen: wie viel Schatten es dort gerade gibt, " +
  "welche Ausstattung bekannt ist, was andere Eltern in den letzten Stunden " +
  "gemeldet haben und wie weit der Weg ist. Wie stark der Schatten zählt, " +
  "hängt vom Wetter ab: Bei Hitze zählt er fast die Hälfte, an milden Tagen " +
  "kaum. Deshalb kann derselbe Platz morgens anders dastehen als mittags.";

/**
 * Was zählt bei DIESEM Wetter am meisten? Der feste Satz oben behauptete
 * früher pauschal „Schatten zählt am meisten" – an milden Tagen wiegt der
 * aber nur 15 %, und die Aufschlüsselung zeigte das auch so an. Die App
 * widersprach sich selbst.
 */
export function gewichtsSatz(weights: {
  shade: number;
  amenity: number;
  status: number;
  distance: number;
}): string {
  // Nur zwei Fälle: Entweder führt der Schatten, oder es ist mild – dann
  // teilen sich Ausstattung und Nähe das frei gewordene Gewicht. Ein eigener
  // Entfernungs-Zweig kann nie eintreten (max. 0,22 gegen min. 0,25).
  if (weights.shade >= weights.amenity) {
    return "Heute zählt vor allem der Schatten.";
  }
  return "Heute ist es mild. Deshalb zählen vor allem Ausstattung und Nähe.";
}

/**
 * OpenStreetMap-Untergründe sind englische Rohwerte („fine_gravel"). So etwas
 * gehört nicht in eine Eltern-App – und Mehrfachwerte („sand;grass") schon
 * gar nicht als Semikolon-Kette.
 */
const UNTERGRUND: Record<string, string> = {
  sand: "Sand",
  grass: "Rasen",
  artificial_turf: "Kunstrasen",
  grass_paver: "Rasengittersteine",
  woodchips: "Holzhäcksel",
  wood_chips: "Holzhäcksel",
  bark_mulch: "Rindenmulch",
  mulch: "Rindenmulch",
  gravel: "Kies",
  fine_gravel: "Feinkies",
  pebblestone: "Kiesel",
  compacted: "Wassergebundene Decke",
  dirt: "Erdboden",
  earth: "Erdboden",
  soil: "Erdboden",
  ground: "Naturboden",
  unpaved: "Unbefestigt",
  paved: "Befestigt",
  asphalt: "Asphalt",
  concrete: "Beton",
  paving_stones: "Pflastersteine",
  sett: "Kopfsteinpflaster",
  rubber: "Fallschutzmatten",
  tartan: "Kunststoffbelag",
  synthetic: "Kunststoffbelag",
  wood: "Holz",
  metal: "Metall",
  clay: "Tenne",
  stone: "Stein",
  rock: "Fels",
};

export function surfaceLabel(raw: string): string {
  const teile = raw
    .split(";")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => UNTERGRUND[t] ?? t.replace(/_/g, " "));
  const einmalig = [...new Set(teile)];
  if (einmalig.length === 0) return raw;
  if (einmalig.length === 1) return einmalig[0];
  return `${einmalig.slice(0, -1).join(", ")} und ${einmalig[einmalig.length - 1]}`;
}

/**
 * Ab dieser Wolken-Dämpfung spricht die App nicht mehr von „Schatten", als
 * schiene die Sonne: Bei bedecktem Himmel ist „Aktuell viel Schatten, 91 %"
 * rechnerisch wahr, liest sich aber absurd – Eltern meinen mit Schatten den
 * Schutz vor Sonne, und die gibt es gerade gar nicht.
 */
export function bedeckt(shade: { fromClouds: number; state: ShadeState }): boolean {
  return shade.state !== "no-sun" && shade.fromClouds >= 0.55;
}

/* ---------------------------------------------------------------- Schatten */

const SCHATTEN_WORTE: Record<ShadeState, Wording> = {
  shady: { label: "Aktuell viel Schatten", tone: "good" },
  partial: { label: "Teilweise sonnig", tone: "medium" },
  sunny: { label: "Aktuell voll in der Sonne", tone: "bad" },
  "no-sun": { label: "Keine Sonne mehr", tone: "neutral" },
};

/** Ab dieser Deckung sagt „sonnig" ehrlicherweise „überwiegend", nicht „voll". */
const UEBERWIEGEND_AB = 0.15;

/**
 * `index` (0..1, Schatten-Anteil) verfeinert die Beschriftung: Ein Platz mit
 * einem Drittel Schatten ist nicht „voll in der Sonne" – das widerspräche der
 * Prozentzahl direkt darunter und dem, was Eltern vor Ort sehen.
 */
export function shadeWording(
  state: ShadeState,
  index?: number,
  /** Zeitvorschau (+30 Min/+1 Std): „Aktuell" wäre dann gelogen. */
  spaeter = false,
): Wording {
  if (state === "sunny" && index !== undefined && index >= UEBERWIEGEND_AB) {
    return { label: spaeter ? "Dann überwiegend sonnig" : "Überwiegend in der Sonne", tone: "bad" };
  }
  const w = SCHATTEN_WORTE[state];
  if (!spaeter) return w;
  return {
    ...w,
    label: w.label
      .replace("Aktuell viel Schatten", "Dann viel Schatten")
      .replace("Aktuell voll in der Sonne", "Dann voll in der Sonne")
      .replace("Teilweise sonnig", "Dann teils sonnig"),
  };
}

/** Kurzform für die Karte, wo der Platz knapp ist. */
export function shadeShort(state: ShadeState, index?: number): string {
  if (state === "sunny" && index !== undefined && index >= UEBERWIEGEND_AB) {
    return "Meist sonnig";
  }
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
    return "Die Sonne steht unter dem Horizont. Schatten spielt jetzt keine Rolle.";
  }

  const stunde = at.getHours();

  if (fromClouds >= 0.5 && fromClouds >= Math.max(fromCanopy, fromBuildings)) {
    return "Dichte Wolken. Die Sonne kommt gerade kaum durch.";
  }
  if (fromCanopy >= 0.35 && fromCanopy >= fromBuildings) {
    return "Viele Bäume ringsum halten die Sonne ab.";
  }
  if (fromBuildings >= 0.3) {
    return sunAltitudeDeg < 25
      ? "Die Sonne steht tief. Die Häuser ringsum werfen lange Schatten."
      : "Gebäude in der Nähe beschatten einen Teil der Fläche.";
  }
  if (sunAltitudeDeg > 45) {
    return "Die Sonne steht hoch. Offene Flächen sind gerade stark besonnt.";
  }
  if (sunAltitudeDeg < 25) {
    return stunde >= 15
      ? "Später Nachmittag. Bäume und Gebäude werfen jetzt mehr Schatten."
      : "Die Morgensonne steht noch flach. Lange Schatten von Häusern und Bäumen.";
  }
  return "Kaum Bäume und offene Fläche. Hier gibt es wenig Schutz vor der Sonne.";
}

/** Was sich in der nächsten Stunde ändert, nur wenn es der Rede wert ist. */
export function shadeOutlook(
  jetzt: { index: number; state: ShadeState },
  spaeter: { index: number; state: ShadeState },
): string | null {
  // Kurz vor Sonnenuntergang meldet die Stunde danach den Sentinel „voller
  // Schatten" (no-sun, index 1). Daraus „deutlich mehr Schatten" zu machen
  // wäre Unsinn – die Sonne geht schlicht unter, und genau das sagen wir.
  if (spaeter.state === "no-sun") {
    return jetzt.state === "no-sun"
      ? null
      : "Die Sonne geht in der nächsten Stunde unter.";
  }
  if (jetzt.state === "no-sun") return null;
  const differenz = spaeter.index - jetzt.index;
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
        ? `Toilette ${formatDistance(toiletDistance)} entfernt (Luftlinie)`
        : "Toilette vor Ort",
    );
  }
  if (tags.fenced === true) teile.push("eingezäunt");
  if (tags.changing_table === true) teile.push("Wickeltisch");
  if (tags.drinking_water === true) teile.push("Trinkwasser");
  if (tags.shelter === true) teile.push("Unterstand");

  if (teile.length === 0) return "Zur Ausstattung ist nichts eingetragen";
  const satz = teile.join(", ");
  return satz.charAt(0).toUpperCase() + satz.slice(1);
}

/**
 * Für die Aufschlüsselung reicht die Aufzählung des Vorhandenen nicht: Neben
 * einer roten 30 muss stehen, *warum* sie niedrig ist, nämlich weil das
 * Wichtige fehlt oder gar nicht erfasst ist.
 */
export function amenityBreakdownSentence(place: Place): string {
  const { tags } = place;
  const vorhanden: string[] = [];
  if (tags.toilet === true) vorhanden.push("Toilette");
  if (tags.fenced === true) vorhanden.push("Zaun");
  if (tags.changing_table === true) vorhanden.push("Wickeltisch");
  if (tags.drinking_water === true) vorhanden.push("Trinkwasser");
  if (tags.shelter === true) vorhanden.push("Unterstand");

  const fehlend: string[] = [];
  if (tags.toilet !== true) fehlend.push("Toilette");
  if (tags.fenced !== true) fehlend.push("Zaun");

  if (vorhanden.length === 0) {
    return "Nichts eingetragen. Zu Toilette und Zaun fehlt jede Angabe";
  }
  if (fehlend.length === 0) return `${vorhanden.join(", ")}. Alles Wichtige da`;
  return `${vorhanden.join(", ")}. Zu ${listeMitUnd(fehlend)} fehlt die Angabe`;
}

function listeMitUnd(teile: string[]): string {
  if (teile.length <= 1) return teile.join("");
  return `${teile.slice(0, -1).join(", ")} und ${teile[teile.length - 1]}`;
}

/* ---------------------------------------------------------------- Meldungen */

/** „Vor 20 Minuten gemeldet: zu voll“, oder nichts, wenn es nichts gibt. */
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
    text: `${alter} gemeldet: ${option.label}`,
    tone,
  };
}

/* ---------------------------------------------------------------------- UV */

/** „5.6“ sagt niemandem etwas, „hoch“ schon. */
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
  return `${minuten} ${einheit} zu Fuß, schon ein Stück`;
}

/* -------------------------------------------------------- Wichtigster Grund */

export interface Driver {
  text: string;
  tone: Tone;
}

/**
 * Warum der Schatten hier zum guten Wert beiträgt. Wichtig: bei mildem Wetter
 * ist der Schatten-Score auch dann hoch, wenn kaum Schatten da ist (er wird
 * dann nicht gebraucht). Dann darf der Satz nicht „viel Schatten“ behaupten,
 * sonst widerspricht er der Schatten-Anzeige darunter.
 */
function schattenGrund(shade: Place["shade"]): string {
  // Bedeckter Himmel zuerst: „viel Schatten" wäre hier zwar rechnerisch
  // richtig, klingt aber nach Bäumen – dabei machen die Wolken die Arbeit.
  if (bedeckt(shade)) {
    return "Der Himmel ist bedeckt, Sonnenschutz ist gerade kein Thema.";
  }
  switch (shade.state) {
    case "no-sun":
      return "Die Sonne ist unter, jetzt zählt nur noch, was der Platz bietet.";
    case "shady":
      return "Hier gibt es gerade viel Schatten.";
    case "partial":
      return "Hier gibt es auch jetzt schattige Ecken.";
    default:
      return "Die Sonne ist gerade mild, Schatten braucht es kaum.";
  }
}

/**
 * Warum steht dieser Ort da, wo er steht? Gesucht ist der Bestandteil, der am
 * stärksten vom Mittelmaß abweicht, gewichtet, denn Schatten zählt 45 % und
 * Entfernung nur 10 %. Das beantwortet die eigentliche Frage: „Wieso der?“
 */

export function mainDriver(place: Place): Driver {
  const b = place.breakdown;
  // Die tatsächlich verwendeten Gewichte, nicht die Standardwerte: bei mildem
  // Wetter wiegt Schatten nur 15 %, dann darf er nicht als Hauptgrund gelten.
  const w = b.weights;
  const beitraege = [
    { key: "shade", delta: (b.shadeScore - 50) * w.shade },
    { key: "amenity", delta: (b.amenityScore - 50) * w.amenity },
    { key: "status", delta: (b.statusScore - 50) * w.status },
    { key: "distance", delta: (b.distanceScore - 50) * w.distance },
  ].sort((a, z) => Math.abs(z.delta) - Math.abs(a.delta));

  const staerkster = beitraege[0];
  const positiv = staerkster.delta > 0;

  // Der Wetter-Dämpfer multipliziert den GANZEN Wert – bei 75 % Regenrisiko
  // drückt er stärker als jeder Einzelteil. Dann muss der Grund „Regen"
  // heißen, nicht „Ausstattung": Nutzer sehen „Eher unangenehm" bei dichten
  // Wolken und fragen sich sonst zu Recht, wie das zustande kommt.
  const daempfungPunkte =
    b.weatherFactor < 1
      ? (place.pleasantScore * (1 - b.weatherFactor)) / b.weatherFactor
      : 0;
  if (
    b.weatherDriver &&
    daempfungPunkte >= 8 &&
    daempfungPunkte > Math.abs(staerkster.delta)
  ) {
    return b.weatherDriver === "rain"
      ? { text: "Regen ist angesagt. Das macht es heute draußen überall ungemütlicher, nicht nur hier.", tone: "bad" }
      : { text: "Draußen weht ein kräftiger Wind. Das macht es heute überall ungemütlicher, nicht nur hier.", tone: "bad" };
  }

  if (Math.abs(staerkster.delta) < 4) {
    return { text: "Kein besonderer Vorteil, kein Haken. Ein ganz solider Platz.", tone: "neutral" };
  }

  // Klartext über den PLATZ, nicht über die Punkte-Mechanik: Sätze wie
  // „Bremst vor allem …" haben echte Eltern schlicht nicht verstanden.
  switch (staerkster.key) {
    case "shade":
      return positiv
        ? { text: schattenGrund(place.shade), tone: "good" }
        : { text: "Bei dieser Sonne gibt es hier kaum Schatten.", tone: "bad" };
    case "amenity":
      return positiv
        ? { text: `Gut ausgestattet: ${vorhandeneAusstattung(place)}.`, tone: "good" }
        : {
            text: "Über die Ausstattung hier ist wenig bekannt. Vor Ort kann es mehr geben.",
            tone: "bad",
          };
    case "status": {
      const meldung = statusSentence(place.lastStatuses);
      if (!meldung) return { text: "Kein besonderer Vorteil, kein Haken. Ein ganz solider Platz.", tone: "neutral" };
      return {
        text: `Andere Eltern haben ${meldung.text}.`,
        tone: positiv ? "good" : "bad",
      };
    }
    default:
      return positiv
        ? { text: "Der Platz liegt gleich um die Ecke.", tone: "good" }
        : { text: "Der Platz liegt ein ganzes Stück entfernt.", tone: "bad" };
  }
}

function vorhandeneAusstattung(place: Place): string {
  const teile: string[] = [];
  if (place.tags.toilet === true) teile.push("Toilette");
  if (place.tags.fenced === true) teile.push("Zaun");
  if (place.tags.changing_table === true) teile.push("Wickeltisch");
  if (place.tags.drinking_water === true) teile.push("Trinkwasser");
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
          ? "Mehr Schatten als nötig, bei der Kühle eher ungemütlich"
          : "Passt gut zum Wetter gerade";

  const meldung = statusSentence(place.lastStatuses, now);
  // Die tatsächlich verwendeten Gewichte, Schatten kann bei mildem Wetter
  // klein sein, dann zählen Ausstattung und Nähe entsprechend mehr.
  const wt = b.weights;
  // Größte-Reste-Rundung: Einzeln gerundet ergaben die Anteile schon mal
  // „19 + 54 + 0 + 28 = 101 %" – wer nachrechnet (und genau dafür ist die
  // Aufschlüsselung da), stolpert. So summieren sie sich immer auf 100.
  const roh = [wt.shade * 100, wt.amenity * 100, wt.status * 100, wt.distance * 100];
  const boden = roh.map(Math.floor);
  let rest = 100 - boden.reduce((a, x) => a + x, 0);
  const reihenfolge = roh
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, z) => z.frac - a.frac);
  for (const { i } of reihenfolge) {
    if (rest <= 0) break;
    boden[i] += 1;
    rest -= 1;
  }
  const [pctShade, pctAmenity, pctStatus, pctDistance] = boden;

  return [
    {
      key: "shade",
      label: "Schatten",
      weightPercent: pctShade,
      value: Math.round(b.shadeScore),
      tone: toneForValue(b.shadeScore),
      sentence: schattenSatz,
    },
    {
      key: "amenity",
      label: "Ausstattung",
      weightPercent: pctAmenity,
      value: Math.round(b.amenityScore),
      tone: toneForValue(b.amenityScore),
      sentence: amenityBreakdownSentence(place),
    },
    {
      key: "status",
      label: "Meldungen anderer Eltern",
      weightPercent: pctStatus,
      value: Math.round(b.statusScore),
      tone: toneForValue(b.statusScore),
      sentence: meldung
        ? meldung.text.charAt(0).toUpperCase() + meldung.text.slice(1)
        : "Bisher keine Meldungen, zählt weder positiv noch negativ",
    },
    {
      key: "distance",
      label: "Entfernung",
      weightPercent: pctDistance,
      value: Math.round(b.distanceScore),
      tone: toneForValue(b.distanceScore),
      sentence: distanceSentence(place.distance ?? 0),
    },
  ];
}

/** Regen und Wind wirken auf alle Orte gleich, das gehört dazugesagt. */
export function weatherFactorNote(factor: number): string | null {
  if (factor >= 0.97) return null;
  const abzug = Math.round((1 - factor) * 100);
  return `Regen oder starker Wind zieht überall ${abzug} % ab.`;
}
