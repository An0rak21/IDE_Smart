import { describe, expect, it } from "vitest";
import { parisMidnightUTC } from "./paris-midnight";

describe("parisMidnightUTC", () => {
  it("hiver : Paris est en UTC+1", () => {
    expect(parisMidnightUTC(new Date("2026-01-15T15:30:00Z")).toISOString()).toBe("2026-01-14T23:00:00.000Z");
  });

  it("été : Paris est en UTC+2", () => {
    expect(parisMidnightUTC(new Date("2026-07-15T15:30:00Z")).toISOString()).toBe("2026-07-14T22:00:00.000Z");
  });

  it("jour du passage à l'heure d'été (dernier dimanche de mars) : minuit est encore en UTC+1", () => {
    expect(parisMidnightUTC(new Date("2026-03-29T15:30:00Z")).toISOString()).toBe("2026-03-28T23:00:00.000Z");
  });

  it("lendemain du passage à l'heure d'été : minuit est en UTC+2", () => {
    expect(parisMidnightUTC(new Date("2026-03-30T15:30:00Z")).toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });

  it("jour du passage à l'heure d'hiver (dernier dimanche d'octobre) : minuit est encore en UTC+2", () => {
    expect(parisMidnightUTC(new Date("2026-10-25T15:30:00Z")).toISOString()).toBe("2026-10-24T22:00:00.000Z");
  });

  it("lendemain du passage à l'heure d'hiver : minuit est en UTC+1", () => {
    expect(parisMidnightUTC(new Date("2026-10-26T15:30:00Z")).toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
});
