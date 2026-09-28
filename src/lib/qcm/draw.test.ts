import { describe, expect, it } from "vitest";
import { drawQuestionIds, type DrawablePool } from "./draw";

function pool(n: number, freeCount: number): DrawablePool[] {
  return Array.from({ length: n }, (_, i) => ({ id: `q${i}`, isFree: i < freeCount }));
}

describe("drawQuestionIds", () => {
  it("ne pioche jamais de question non gratuite pour un non-abonné", () => {
    const p = pool(20, 5);
    for (let seed = 0; seed < 200; seed++) {
      const ids = drawQuestionIds(p, 10, false, seed);
      expect(ids.every((id) => Number(id.slice(1)) < 5)).toBe(true);
    }
  });

  it("ne tire jamais de doublon", () => {
    const p = pool(30, 30);
    for (let seed = 0; seed < 200; seed++) {
      const ids = drawQuestionIds(p, 10, true, seed);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("prend tout le pool si moins de questions que demandé", () => {
    const p = pool(3, 3);
    expect(drawQuestionIds(p, 10, true, 1).sort()).toEqual(["q0", "q1", "q2"]);

    const nonPremium = pool(10, 2);
    expect(drawQuestionIds(nonPremium, 10, false, 1).sort()).toEqual(["q0", "q1"]);
  });

  it("renvoie exactement `count` questions quand le pool est assez grand", () => {
    const p = pool(50, 50);
    expect(drawQuestionIds(p, 20, true, 42)).toHaveLength(20);
  });
});
