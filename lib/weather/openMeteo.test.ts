import { describe, it, expect, vi } from "vitest";
import { summarizeWeather, getWeather } from "./openMeteo";

describe("summarizeWeather", () => {
  it("maps a WMO code + temp into a short summary", () => {
    expect(summarizeWeather(0, 31)).toBe("clear, 31°C");
    expect(summarizeWeather(61, 24)).toBe("rainy, 24°C");
    expect(summarizeWeather(95, 27)).toBe("thunderstorm, 27°C");
  });
});

describe("getWeather", () => {
  it("calls Open-Meteo and returns a summary", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ current: { temperature_2m: 30, weather_code: 2 } }) });
    const result = await getWeather(-8.65, 115.21, fetchMock as unknown as typeof fetch);
    expect(result).toBe("partly cloudy, 30°C");
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("latitude=-8.65");
    expect(url).toContain("longitude=115.21");
  });
  it("returns null on a non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    expect(await getWeather(0, 0, fetchMock as unknown as typeof fetch)).toBeNull();
  });
});
