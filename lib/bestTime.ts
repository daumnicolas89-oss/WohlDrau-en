import { isDaylight } from "./sun";
import type { Weather } from "@/types";

/**
 * Wann ist es HEUTE draußen am angenehmsten? Rein aus der Stunden-Vorhersage
 * (gefühlte Temperatur, UV, Regenrisiko) und dem Sonnenstand gerechnet –
 * keine neuen Datenquellen, keine Schätzung.
 */

export interface BestTime {
  /** Lokale Stunde, z. B. 16 für „ab 16 Uhr". */
  fromHour: number;
  /** Ende des Fensters (exklusiv), z. B. 18 für „bis 18 Uhr". */
  toHour: number;
  /** Liegt die aktuelle Stunde im besten Fenster? */
  nowIsBest: boolean;
}

/** Wohlfühl-Wert einer Stunde für „mit Kind draußen", 0–100. */
function comfort(
  apparent: number,
  uv: number,
  precipProbability: number,
  windSpeed?: number,
): number {
  let score = 100;
  score -= precipProbability * 0.6; // Regenrisiko drückt am stärksten
  score -= Math.max(0, apparent - 25) * 6; // Hitze
  score -= Math.max(0, 8 - apparent) * 5; // Kälte
  score -= Math.max(0, uv - 5) * 4; // pralle Mittagssonne
  // Wind wie im Platz-Score: sonst empfiehlt die Zeile eine stürmische
  // Stunde, die die Plätze selbst gerade abwerten.
  if (windSpeed !== undefined) score -= Math.max(0, windSpeed - 18) * 0.5;
  return score;
}

/**
 * Das beste 2-Stunden-Fenster des heutigen Resttages – oder null, wenn der Tag
 * zu gleichförmig ist (dann wäre jede Empfehlung Rauschen), keine zwei
 * Tageslicht-Stunden mehr übrig sind oder die Vorhersage fehlt.
 */
export function bestTimeToday(
  weather: Weather,
  origin: { lat: number; lng: number },
  now: Date,
): BestTime | null {
  const { time, apparentTemperature, uvIndex, precipitationProbability } =
    weather.hourly;

  // Open-Meteo liefert Orts-Lokalzeit ohne Suffix – gleiche Behandlung wie in
  // weatherAt: mit dem UTC-Versatz zum echten Zeitpunkt machen, damit auch ein
  // manuell gewählter Ort in fremder Zeitzone das richtige Fenster bekommt.
  const off = weather.utcOffsetSeconds;
  const epochOf = (t: string) =>
    off === undefined ? new Date(t).getTime() : Date.parse(`${t}Z`) - off * 1000;
  // Datum und Stunde in ORTS-Zeit (nicht Geräte-Zeit).
  const placeIso = (epoch: number) =>
    off === undefined ? null : new Date(epoch + off * 1000).toISOString();
  const nowIso = placeIso(now.getTime());
  const heutigerTag = nowIso ? nowIso.slice(0, 10) : null;
  const nowHour = nowIso ? Number(nowIso.slice(11, 13)) : now.getHours();

  const hours: { hour: number; score: number }[] = [];
  for (let i = 0; i < time.length; i++) {
    const epoch = epochOf(time[i]);
    if (Number.isNaN(epoch)) continue;
    // Nur der heutige Resttag, inklusive der laufenden Stunde.
    if (epoch < now.getTime() - 3_600_000) continue;
    const tag = heutigerTag !== null ? time[i].slice(0, 10) : null;
    if (tag !== null && tag !== heutigerTag) continue;
    if (tag === null && new Date(epoch).getDate() !== now.getDate()) continue;
    // Zur Stundenmitte prüfen, ob überhaupt noch Tag ist.
    if (!isDaylight(origin.lat, origin.lng, new Date(epoch + 1_800_000))) continue;
    // Nach 20 Uhr ist für die Zielgruppe Schluss: „Heute am angenehmsten:
    // 19–21 Uhr" ist im Juni rechnerisch wahr – aber Kleinkinder schlafen
    // dann. Die Empfehlung endet, wo der Familientag endet.
    {
      const stunde =
        heutigerTag !== null ? Number(time[i].slice(11, 13)) : new Date(epoch).getHours();
      if (stunde >= 20) continue;
    }
    hours.push({
      hour:
        heutigerTag !== null
          ? Number(time[i].slice(11, 13))
          : new Date(epoch).getHours(),
      score: comfort(
        apparentTemperature[i] ?? weather.apparentTemperature,
        uvIndex[i] ?? weather.uvIndex,
        precipitationProbability[i] ?? weather.precipitationProbability,
        weather.hourly.windSpeed?.[i],
      ),
    });
  }

  if (hours.length < 2) return null;

  // Bestes Fenster aus zwei aufeinanderfolgenden Stunden.
  let best = 0;
  let bestAvg = -Infinity;
  for (let i = 0; i < hours.length - 1; i++) {
    if (hours[i + 1].hour !== (hours[i].hour + 1) % 24) continue;
    const avg = (hours[i].score + hours[i + 1].score) / 2;
    if (avg > bestAvg) {
      bestAvg = avg;
      best = i;
    }
  }
  if (bestAvg === -Infinity) return null;

  // Nur melden, wenn das Fenster DEUTLICH besser ist als die schwächste
  // Stunde – an gleichmäßigen Tagen gibt es keine „beste Zeit".
  const worst = Math.min(...hours.map((h) => h.score));
  if (bestAvg - worst < 12) return null;

  const fromHour = hours[best].hour;
  return {
    fromHour,
    toHour: fromHour + 2,
    nowIsBest: nowHour === fromHour || nowHour === fromHour + 1,
  };
}

/** Der fertige Satz für den Wetterkopf, oder null (dann nichts anzeigen). */
export function bestTimeHint(best: BestTime | null): string | null {
  if (!best) return null;
  if (best.nowIsBest) return "Jetzt ist die angenehmste Zeit des Tages.";
  // „22–24 Uhr" statt „22–0 Uhr" am späten Sommerabend.
  const bis = Math.min(best.toHour, 24);
  return `Heute draußen am angenehmsten: ${best.fromHour}–${bis} Uhr.`;
}
