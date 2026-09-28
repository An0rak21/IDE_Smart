import { describe, expect, it } from "vitest";
import { ownsExercise } from "./ownership";

describe("ownsExercise", () => {
  it("accepte l'exercice de l'utilisateur", () => {
    expect(ownsExercise({ user_id: "user-1" }, "user-1")).toBe(true);
  });

  it("refuse l'exercice d'un autre utilisateur", () => {
    expect(ownsExercise({ user_id: "user-1" }, "user-2")).toBe(false);
  });

  it("refuse quand l'exercice n'existe pas", () => {
    expect(ownsExercise(null, "user-1")).toBe(false);
  });
});
