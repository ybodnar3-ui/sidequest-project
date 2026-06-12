import { describe, it, expect } from "vitest";
import { urlBase64ToUint8Array } from "./vapid";

describe("urlBase64ToUint8Array", () => {
  it("decodes a base64url string to the right byte length", () => {
    const out = urlBase64ToUint8Array("BABC");
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out.length).toBe(3);
  });
  it("handles url-safe chars (- and _)", () => {
    const out = urlBase64ToUint8Array("-_-_");
    expect(out.length).toBe(3);
    expect(out[0]).toBe(0xfb);
  });
});
