export type { DoseType } from "@/lib/dose-exercise";
export { DOSE_TYPES } from "@/lib/dose-exercise";
import type { DoseType } from "@/lib/dose-exercise";

export type Exercise = {
  type: DoseType;
  seed: number;
  /** Titre court de la situation */
  title: string;
  /** Données de la prescription et du matériel, affichées comme une étiquette */
  data: { label: string; value: string }[];
  /** La question posée */
  question: string;
  answer: {
    value: number;
    unit: string;
    /** Écart toléré, dans l'unité de la réponse */
    tolerance: number;
    /** Nombre de décimales attendues à l'affichage */
    decimals: number;
  };
  /** Correction étape par étape, en texte */
  steps: string[];
  /** Point de vigilance infirmier, facultatif */
  tip?: string;
};

export type CheckResult = {
  correct: boolean;
  given: number | null;
  expected: number;
  unit: string;
};
