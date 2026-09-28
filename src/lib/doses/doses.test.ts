import { describe, expect, it } from "vitest";
import { checkAnswer, generateExercise, parseAnswer, type DoseType } from "./index";

const TYPES: DoseType[] = ["perfusion", "seringue", "dilution", "poids"];
const SEEDS = Array.from({ length: 2000 }, (_, i) => i * 7919 + 13);

describe("parseAnswer", () => {
  it("accepte la virgule, le point, les espaces et l'unité", () => {
    expect(parseAnswer("2,5")).toBe(2.5);
    expect(parseAnswer("2.5")).toBe(2.5);
    expect(parseAnswer(" 1 250 ")).toBe(1250);
    expect(parseAnswer("2 ml/h")).toBe(2);
    expect(parseAnswer("0,72ml")).toBe(0.72);
  });
  it("refuse ce qui n'est pas un nombre", () => {
    expect(parseAnswer("")).toBeNull();
    expect(parseAnswer("deux")).toBeNull();
  });
});

describe("déterminisme", () => {
  it("un même seed redonne le même exercice", () => {
    for (const t of TYPES) {
      expect(generateExercise(t, 42)).toEqual(generateExercise(t, 42));
    }
  });
});

describe("invariants sur 2 000 exercices par type", () => {
  for (const type of TYPES) {
    it(`${type} : réponses plausibles et correction cohérente`, () => {
      for (const seed of SEEDS) {
        const e = generateExercise(type, seed);
        expect(e.type).toBe(type);
        expect(Number.isFinite(e.answer.value)).toBe(true);
        expect(e.answer.value).toBeGreaterThan(0);
        expect(e.steps.length).toBeGreaterThan(0);
        expect(e.data.length).toBeGreaterThan(0);
        // La valeur attendue, saisie telle quelle, est acceptée
        expect(checkAnswer(type, seed, String(e.answer.value).replace(".", ",")).correct).toBe(true);
        // Une erreur d'un facteur 10 est toujours refusée
        expect(checkAnswer(type, seed, String(e.answer.value * 10)).correct).toBe(false);
        expect(checkAnswer(type, seed, String(e.answer.value / 10)).correct).toBe(false);
        // Pas de NaN ni d'undefined dans les textes
        const text = JSON.stringify(e);
        expect(text).not.toMatch(/NaN|undefined|Infinity/);
      }
    });
  }

  it("perfusion : débits dans des bornes réalistes", () => {
    for (const seed of SEEDS) {
      const e = generateExercise("perfusion", seed);
      if (e.answer.unit === "ml/h") expect(e.answer.value).toBeLessThanOrEqual(500);
      if (e.answer.unit === "gouttes/min") expect(e.answer.value).toBeLessThanOrEqual(170);
    }
  });

  it("seringue : un volume d'héparine ne dépasse jamais la seringue", () => {
    for (const seed of SEEDS) {
      const e = generateExercise("seringue", seed);
      if (e.question.startsWith("Quel volume d'héparine")) expect(e.answer.value).toBeLessThanOrEqual(10);
      if (e.answer.unit === "ml/h") expect(e.answer.value).toBeLessThanOrEqual(10);
    }
  });

  it("dilution : on ne prélève jamais plus que le flacon reconstitué", () => {
    for (const seed of SEEDS) {
      const e = generateExercise("dilution", seed);
      if (e.answer.unit === "ml") expect(e.answer.value).toBeLessThanOrEqual(20);
    }
  });

  it("poids : paracétamol jamais au-delà de 750 mg par prise", () => {
    for (const seed of SEEDS) {
      const e = generateExercise("poids", seed);
      if (e.title.startsWith("Paracétamol")) expect(e.answer.value * 10).toBeLessThanOrEqual(750);
    }
  });
});

describe("cas vérifiés à la main", () => {
  it("héparine 20 000 UI/24 h dans 48 ml : 4 ml de produit et 2 ml/h", () => {
    // Retrouver un seed qui produit exactement ce cas
    const hits = SEEDS.map((s) => generateExercise("seringue", s)).filter(
      (e) => e.data[0]?.value.includes("20\u00a0000") && e.data[2]?.value.includes("48"),
    );
    expect(hits.length).toBeGreaterThan(0);
    for (const e of hits) {
      if (e.answer.unit === "ml/h") expect(e.answer.value).toBe(2);
      else expect(e.answer.value).toBe(4);
    }
  });

  it("perfusion 500 ml sur 8 h : 62,5 ml/h ou 21 gouttes/min", () => {
    const hits = SEEDS.map((s) => generateExercise("perfusion", s)).filter((e) =>
      e.data[0].value.includes("500 ml sur 8 h"),
    );
    expect(hits.length).toBeGreaterThan(0);
    for (const e of hits) expect(e.answer.value).toBe(e.answer.unit === "ml/h" ? 62.5 : 21);
  });

  it("insuline 50 UI dans 50 ml à 3 UI/h : 3 ml/h", () => {
    const hits = SEEDS.map((s) => generateExercise("seringue", s)).filter(
      (e) => e.title.startsWith("Insuline") && e.data[2].value.startsWith("50 UI") && e.data[0].value.includes(" 3 UI/h"),
    );
    expect(hits.length).toBeGreaterThan(0);
    for (const e of hits) expect(e.answer.value).toBe(3);
  });

  it("énoxaparine 72 kg : 0,72 ml", () => {
    const hits = SEEDS.map((s) => generateExercise("poids", s)).filter(
      (e) => e.title.startsWith("Énoxaparine") && e.data[1].value === "72 kg",
    );
    expect(hits.length).toBeGreaterThan(0);
    for (const e of hits) expect(e.answer.value).toBe(0.72);
  });
});
