import { describe, expect, it } from "vitest";
import { computeScore } from "./scoring";

describe("computeScore", () => {
  it("calcule le pourcentage de réponses justes", () => {
    expect(computeScore(10, 10)).toBe(100);
    expect(computeScore(10, 0)).toBe(0);
    expect(computeScore(4, 3)).toBe(75);
  });

  it("compte les questions non répondues comme fausses", () => {
    // 10 questions, seulement 6 réponses enregistrées dont 6 justes : les 4 non
    // répondues pèsent quand même dans le dénominateur.
    expect(computeScore(10, 6)).toBe(60);
  });

  it("arrondit à 2 décimales", () => {
    expect(computeScore(3, 1)).toBeCloseTo(33.33, 2);
  });

  it("ne divise jamais par zéro", () => {
    expect(computeScore(0, 0)).toBe(0);
  });
});
