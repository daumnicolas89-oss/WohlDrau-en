import type { Weather } from "@/types";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    cloud_cover: number;
    precipitation: number;
    wind_speed_10m: number;
    uv_index: number | null;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    cloud_cover: number[];
    precipitation_probability: (number | null)[];
    uv_index: (number | null)[];
  };
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("latitude", lat.toFixed(3));
  url.searchParams.set("longitude", lng.toFixed(3));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,cloud_cover,precipitation,wind_speed_10m,uv_index,is_day",
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,apparent_temperature,cloud_cover,precipitation_probability,uv_index",
  );
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Open-Meteo → HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;

  const nowIndex = Math.max(
    0,
    data.hourly.time.findIndex((t) => t >= data.current.time.slice(0, 13)),
  );
  const slice = <T>(arr: T[]) => arr.slice(nowIndex, nowIndex + 12);

  return {
    time: data.current.time,
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    cloudCover: data.current.cloud_cover,
    precipitation: data.current.precipitation,
    precipitationProbability: data.hourly.precipitation_probability[nowIndex] ?? 0,
    windSpeed: data.current.wind_speed_10m,
    uvIndex: data.current.uv_index ?? 0,
    isDay: data.current.is_day === 1,
    hourly: {
      time: slice(data.hourly.time),
      temperature: slice(data.hourly.temperature_2m),
      apparentTemperature: slice(data.hourly.apparent_temperature),
      cloudCover: slice(data.hourly.cloud_cover),
      precipitationProbability: slice(data.hourly.precipitation_probability).map(
        (v) => v ?? 0,
      ),
      uvIndex: slice(data.hourly.uv_index).map((v) => v ?? 0),
    },
  };
}

/** Wetterwerte zum gewünschten Zeitpunkt (jetzt, +30 Min, +1 Std). */
export function weatherAt(weather: Weather, date: Date) {
  const stamp = date.getTime();
  const hours = weather.hourly.time;
  let index = 0;
  for (let i = 0; i < hours.length; i++) {
    // Open-Meteo liefert lokale Zeit ohne Zeitzonen-Suffix.
    if (new Date(hours[i]).getTime() <= stamp) index = i;
  }
  return {
    temperature: weather.hourly.temperature[index] ?? weather.temperature,
    apparentTemperature:
      weather.hourly.apparentTemperature[index] ?? weather.apparentTemperature,
    cloudCover: weather.hourly.cloudCover[index] ?? weather.cloudCover,
    precipitationProbability:
      weather.hourly.precipitationProbability[index] ??
      weather.precipitationProbability,
    uvIndex: weather.hourly.uvIndex[index] ?? weather.uvIndex,
  };
}
