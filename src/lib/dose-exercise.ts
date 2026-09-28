// Formes de données des calculs de doses sûres pour le navigateur : aucun import de
// src/lib/doses/ (le moteur, réponses et seeds compris) ne doit apparaître ici.
export type DoseType = "perfusion" | "seringue" | "dilution" | "poids";

/** Vue « élève » d'un exercice : ni la réponse, ni le seed, ni la correction. */
export type PublicExercise = {
  id: string;
  type: DoseType;
  title: string;
  data: { label: string; value: string }[];
  question: string;
  unit: string;
};

export const DOSE_TYPES: { type: DoseType; label: string; description: string }[] = [
  { type: "perfusion", label: "Débit de perfusion", description: "ml/h et gouttes/min" },
  { type: "seringue", label: "Seringue électrique", description: "Préparation et débit en ml/h" },
  { type: "dilution", label: "Dilutions", description: "Concentration et volume à prélever" },
  { type: "poids", label: "Dose selon le poids", description: "mg/kg, puis volume à administrer" },
];
