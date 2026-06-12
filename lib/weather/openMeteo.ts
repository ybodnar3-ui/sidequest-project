function wmoLabel(code: number): string {
  if (code === 0) return "clear";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code >= 45 && code <= 48) return "foggy";
  if (code >= 51 && code <= 67) return "rainy";
  if (code >= 71 && code <= 77) return "snowy";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code >= 95) return "thunderstorm";
  return "mild";
}

export function summarizeWeather(code: number, tempC: number): string {
  return `${wmoLabel(code)}, ${Math.round(tempC)}°C`;
}

export async function getWeather(lat: number, lon: number, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
  const res = await fetchImpl(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { current?: { temperature_2m: number; weather_code: number } };
  if (!data.current) return null;
  return summarizeWeather(data.current.weather_code, data.current.temperature_2m);
}
