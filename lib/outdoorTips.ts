import { formatTime } from "./utils";

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

/**
 * Bei kurzen Tagen relevant: wie lange lohnt sich Rausgehen noch? Nur unter
 * drei Stunden Restlicht, sonst kein Hinweis (dann ist genug Tag übrig).
 */
export function daylightHint(now: Date, sunset: Date): string | null {
  if (Number.isNaN(sunset.getTime())) return null;
  const msLeft = sunset.getTime() - now.getTime();
  if (msLeft <= 0) return null;
  const hoursLeft = msLeft / 3_600_000;
  if (hoursLeft > 3) return null;
  const menge = hoursLeft < 1 ? "weniger als 1 Std" : `rund ${Math.round(hoursLeft)} Std`;
  return `Noch ${menge} Sonne (bis ${formatTime(sunset)}).`;
}
