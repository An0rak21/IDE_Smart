import { describe, expect, it } from "vitest";
import { isFullyCorrect } from "./grading";

describe("isFullyCorrect", () => {
  const correct = ["a", "b"];

  it("accepte l'ensemble exact, dans n'importe quel ordre", () => {
    expect(isFullyCorrect(["a", "b"], correct)).toBe(true);
    expect(isFullyCorrect(["b", "a"], correct)).toBe(true);
  });

  it("refuse une option en trop (multiple)", () => {
    expect(isFullyCorrect(["a", "b", "c"], correct)).toBe(false);
  });

  it("refuse une option en moins (multiple)", () => {
    expect(isFullyCorrect(["a"], correct)).toBe(false);
  });

  it("refuse une sélection vide", () => {
    expect(isFullyCorrect([], correct)).toBe(false);
  });

  it("refuse une mauvaise option seule (single)", () => {
    expect(isFullyCorrect(["c"], ["a"])).toBe(false);
  });

  it("accepte la bonne option seule (single)", () => {
    expect(isFullyCorrect(["a"], ["a"])).toBe(true);
  });
});
