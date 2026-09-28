import { fr, round } from "./format";
import { createRng, type Rng } from "./rng";
import type { DoseType, Exercise } from "./types";

// ---------------------------------------------------------------------------
// Toutes les valeurs (produits, présentations, doses) sont choisies pour rester
// réalistes. Toute modification doit être relue et couverte par les tests.
// ---------------------------------------------------------------------------

const DROPS_PER_ML = 20; // perfuseur standard

function perfusion(seed: number, rng: Rng): Exercise {
  const solute = rng.pick(["Glucose 5 %", "NaCl 0,9 %", "Ringer lactate", "Glucosé 5 % + électrolytes"]);
  const volume = rng.pick([250, 500, 1000]);
  const hours = rng.pick([1, 2, 4, 6, 8, 12, 24].filter((h) => volume / h >= 10 && volume / h <= 500));
  const data = [
    { label: "Prescription", value: `${solute}, ${fr(volume)} ml sur ${fr(hours)} h` },
    { label: "Matériel", value: rng.next() < 0.5 ? "Pompe volumétrique" : "Perfuseur par gravité (1 ml = 20 gouttes)" },
  ];

  if (data[1].value.startsWith("Pompe")) {
    const exact = volume / hours;
    const value = round(exact, 1);
    return {
      type: "perfusion",
      seed,
      title: "Perfusion à la pompe",
      data,
      question: "Quel débit programmer sur la pompe, en ml/h ?",
      answer: { value, unit: "ml/h", tolerance: 0.5, decimals: 1 },
      steps: [
        "Débit (ml/h) = volume (ml) ÷ durée (h)",
        `${fr(volume)} ÷ ${fr(hours)} = ${fr(exact, 2)} ml/h`,
        `Débit à programmer : ${fr(value, 1)} ml/h`,
      ],
    };
  }

  const exact = (volume * DROPS_PER_ML) / (hours * 60);
  const value = Math.round(exact);
  return {
    type: "perfusion",
    seed,
    title: "Perfusion par gravité",
    data,
    question: "Combien de gouttes par minute régler ?",
    answer: { value, unit: "gouttes/min", tolerance: 1, decimals: 0 },
    steps: [
      "Débit (gouttes/min) = volume (ml) × 20 ÷ durée (min)",
      `Durée : ${fr(hours)} h × 60 = ${fr(hours * 60)} min`,
      `${fr(volume)} × 20 = ${fr(volume * DROPS_PER_ML)} gouttes`,
      `${fr(volume * DROPS_PER_ML)} ÷ ${fr(hours * 60)} = ${fr(exact, 2)} gouttes/min`,
      `On arrondit à l'unité : ${fr(value)} gouttes/min`,
    ],
    tip: "Perfuseur standard : 1 ml = 20 gouttes. Perfuseur pédiatrique (microgouttes) : 1 ml = 60 gouttes.",
  };
}

function seringue(seed: number, rng: Rng): Exercise {
  const product = rng.pick(["heparine", "insuline", "furosemide"] as const);

  if (product === "heparine") {
    const dose = rng.pick([10000, 12500, 15000, 17500, 20000, 25000]);
    const total = rng.pick([48, 24]);
    const drugVolume = (dose * 5) / 25000;
    const diluent = total - drugVolume;
    const data = [
      { label: "Prescription", value: `Héparine sodique ${fr(dose)} UI/24 h à la seringue électrique` },
      { label: "Flacon", value: "25 000 UI dans 5 ml" },
      { label: "Préparation", value: `Seringue complétée à ${fr(total)} ml de NaCl 0,9 %, sur 24 h` },
    ];
    const common = [
      "Concentration du flacon : 25 000 UI ÷ 5 ml = 5 000 UI/ml",
      `Volume d'héparine : ${fr(dose)} ÷ 5 000 = ${fr(drugVolume)} ml`,
    ];
    if (rng.next() < 0.5) {
      return {
        type: "seringue",
        seed,
        title: "Héparine à la seringue électrique",
        data,
        question: "Quel volume d'héparine prélever dans le flacon, en ml ?",
        answer: { value: round(drugVolume, 2), unit: "ml", tolerance: 0.05, decimals: 1 },
        steps: [...common, `Compléter avec ${fr(diluent)} ml de NaCl 0,9 % pour obtenir ${fr(total)} ml`],
        tip: "Héparine : surveillance de l'anti-Xa ou du TCA et des plaquettes selon la prescription.",
      };
    }
    const rate = total / 24;
    return {
      type: "seringue",
      seed,
      title: "Héparine à la seringue électrique",
      data,
      question: "Quel débit programmer sur la seringue électrique, en ml/h ?",
      answer: { value: round(rate, 2), unit: "ml/h", tolerance: 0.05, decimals: 1 },
      steps: [
        ...common,
        `Seringue : ${fr(drugVolume)} ml d'héparine + ${fr(diluent)} ml de NaCl = ${fr(total)} ml`,
        `Débit : ${fr(total)} ml ÷ 24 h = ${fr(rate, 2)} ml/h`,
      ],
    };
  }

  if (product === "insuline") {
    const units = rng.pick([50, 100]);
    const concentration = units / 50; // UI/ml dans 50 ml
    const perHour = rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]);
    const rate = perHour / concentration;
    return {
      type: "seringue",
      seed,
      title: "Insuline à la seringue électrique",
      data: [
        { label: "Prescription", value: `Insuline rapide ${fr(perHour, 1)} UI/h selon le protocole` },
        { label: "Flacon", value: "Insuline rapide 100 UI/ml" },
        { label: "Préparation", value: `${fr(units)} UI complétées à 50 ml de NaCl 0,9 %` },
      ],
      question: "Quel débit programmer, en ml/h ?",
      answer: { value: round(rate, 2), unit: "ml/h", tolerance: 0.05, decimals: 2 },
      steps: [
        `Volume d'insuline prélevé : ${fr(units)} UI ÷ 100 UI/ml = ${fr(units / 100)} ml`,
        `Concentration de la seringue : ${fr(units)} UI ÷ 50 ml = ${fr(concentration)} UI/ml`,
        `Débit : ${fr(perHour, 1)} UI/h ÷ ${fr(concentration)} UI/ml = ${fr(rate, 2)} ml/h`,
      ],
      tip: "Insuline : prélèvement avec une seringue graduée en unités, double contrôle et glycémies capillaires selon le protocole.",
    };
  }

  const mgPerHour = rng.pick([5, 10, 15, 20]);
  const rate = mgPerHour / 10;
  return {
    type: "seringue",
    seed,
    title: "Furosémide à la seringue électrique",
    data: [
      { label: "Prescription", value: `Furosémide ${fr(mgPerHour)} mg/h à la seringue électrique, pur` },
      { label: "Présentation", value: "Ampoule de 250 mg dans 25 ml" },
    ],
    question: "Quel débit programmer, en ml/h ?",
    answer: { value: round(rate, 2), unit: "ml/h", tolerance: 0.05, decimals: 1 },
    steps: [
      "Concentration : 250 mg ÷ 25 ml = 10 mg/ml",
      `Débit : ${fr(mgPerHour)} mg/h ÷ 10 mg/ml = ${fr(rate, 1)} ml/h`,
    ],
    tip: "Furosémide : surveillance de la diurèse, de la tension artérielle et de la kaliémie.",
  };
}

function dilution(seed: number, rng: Rng): Exercise {
  const product = rng.pick(["amoxicilline", "ceftriaxone", "morphine"] as const);

  if (product === "morphine") {
    const bolus = rng.pick([1, 2, 3]);
    return {
      type: "dilution",
      seed,
      title: "Titration de morphine",
      data: [
        { label: "Prescription", value: `Morphine ${fr(bolus)} mg IV lente toutes les 5 min selon l'EVA` },
        { label: "Ampoule", value: "Morphine 10 mg dans 1 ml" },
        { label: "Préparation", value: "Ampoule diluée dans une seringue de 10 ml au total (NaCl 0,9 %)" },
      ],
      question: "Quel volume injecter pour un bolus, en ml ?",
      answer: { value: bolus, unit: "ml", tolerance: 0.05, decimals: 1 },
      steps: [
        "Concentration après dilution : 10 mg ÷ 10 ml = 1 mg/ml",
        `Volume : ${fr(bolus)} mg ÷ 1 mg/ml = ${fr(bolus)} ml`,
      ],
      tip: "Morphine : surveillance de la fréquence respiratoire, de la sédation et de l'EVA avant chaque bolus. Naloxone à disposition.",
    };
  }

  const vial = 1000; // mg
  const solvent = product === "amoxicilline" ? 20 : 10;
  const name = product === "amoxicilline" ? "Amoxicilline" : "Ceftriaxone";
  const concentration = vial / solvent;
  const dose = rng.pick([250, 500, 750]);
  const volume = dose / concentration;
  const data = [
    { label: "Prescription", value: `${name} ${fr(dose)} mg IV` },
    { label: "Flacon", value: `${name} 1 g, poudre à reconstituer` },
    { label: "Reconstitution", value: `Dans ${fr(solvent)} ml d'eau pour préparations injectables` },
  ];

  if (rng.next() < 0.4) {
    return {
      type: "dilution",
      seed,
      title: `Reconstitution de ${name.toLowerCase()}`,
      data,
      question: "Quelle est la concentration de la solution reconstituée, en mg/ml ?",
      answer: { value: concentration, unit: "mg/ml", tolerance: 0.5, decimals: 0 },
      steps: ["1 g = 1 000 mg", `Concentration : 1 000 mg ÷ ${fr(solvent)} ml = ${fr(concentration)} mg/ml`],
    };
  }

  return {
    type: "dilution",
    seed,
    title: `Reconstitution de ${name.toLowerCase()}`,
    data,
    question: "Quel volume prélever pour la dose prescrite, en ml ?",
    answer: { value: round(volume, 2), unit: "ml", tolerance: 0.1, decimals: 1 },
    steps: [
      "1 g = 1 000 mg",
      `Concentration : 1 000 mg ÷ ${fr(solvent)} ml = ${fr(concentration)} mg/ml`,
      `Volume : ${fr(dose)} mg ÷ ${fr(concentration)} mg/ml = ${fr(volume, 2)} ml`,
    ],
  };
}

function poids(seed: number, rng: Rng): Exercise {
  const product = rng.pick(["paracetamol", "enoxaparine", "gentamicine"] as const);

  if (product === "paracetamol") {
    const weight = rng.int(10, 50);
    const dose = 15 * weight;
    const volume = dose / 10;
    return {
      type: "poids",
      seed,
      title: "Paracétamol IV chez l'enfant",
      data: [
        { label: "Prescription", value: "Paracétamol IV 15 mg/kg par prise, toutes les 6 h" },
        { label: "Patient", value: `${fr(weight)} kg` },
        { label: "Présentation", value: "Solution à 10 mg/ml" },
      ],
      question: "Quel volume administrer par prise, en ml ?",
      answer: { value: round(volume, 2), unit: "ml", tolerance: 0.1, decimals: 1 },
      steps: [
        `Dose par prise : 15 mg × ${fr(weight)} kg = ${fr(dose)} mg`,
        `Volume : ${fr(dose)} mg ÷ 10 mg/ml = ${fr(volume, 1)} ml`,
        `Contrôle : dose journalière ${fr(dose * 4)} mg, soit 60 mg/kg/j, dose maximale`,
      ],
      tip: "Paracétamol IV : vérifier l'absence d'autre paracétamol reçu (per os, associations) avant chaque prise.",
    };
  }

  if (product === "enoxaparine") {
    const weight = rng.int(50, 100);
    const dose = 100 * weight;
    const volume = dose / 10000;
    return {
      type: "poids",
      seed,
      title: "Énoxaparine à dose curative",
      data: [
        { label: "Prescription", value: "Énoxaparine 100 UI anti-Xa/kg toutes les 12 h, SC" },
        { label: "Patient", value: `${fr(weight)} kg` },
        { label: "Présentation", value: "10 000 UI anti-Xa/ml (seringues graduées)" },
      ],
      question: "Quel volume injecter, en ml ?",
      answer: { value: round(volume, 2), unit: "ml", tolerance: 0.005, decimals: 2 },
      steps: [
        `Dose : 100 UI × ${fr(weight)} kg = ${fr(dose)} UI anti-Xa`,
        `Volume : ${fr(dose)} UI ÷ 10 000 UI/ml = ${fr(volume, 2)} ml`,
        "Choisir la seringue de capacité immédiatement supérieure et purger l'excédent",
      ],
      tip: "HBPM : surveillance des plaquettes, des signes de saignement et de la fonction rénale.",
    };
  }

  const weight = rng.int(50, 90);
  const dose = 3 * weight;
  const volume = dose / 40;
  return {
    type: "poids",
    seed,
    title: "Gentamicine en une injection par jour",
    data: [
      { label: "Prescription", value: "Gentamicine 3 mg/kg/24 h en une injection IV" },
      { label: "Patient", value: `${fr(weight)} kg` },
      { label: "Présentation", value: "Ampoule de 80 mg dans 2 ml" },
    ],
    question: "Quel volume prélever, en ml ?",
    answer: { value: round(volume, 2), unit: "ml", tolerance: 0.05, decimals: 1 },
    steps: [
      `Dose : 3 mg × ${fr(weight)} kg = ${fr(dose)} mg`,
      "Concentration : 80 mg ÷ 2 ml = 40 mg/ml",
      `Volume : ${fr(dose)} mg ÷ 40 mg/ml = ${fr(volume, 2)} ml`,
    ],
    tip: "Aminosides : surveillance de la fonction rénale, de l'audition et des dosages sanguins prescrits.",
  };
}

const GENERATORS: Record<DoseType, (seed: number, rng: Rng) => Exercise> = {
  perfusion,
  seringue,
  dilution,
  poids,
};

/** Génère un exercice de façon déterministe à partir de son type et de son seed */
export function generateExercise(type: DoseType, seed: number): Exercise {
  return GENERATORS[type](seed, createRng(seed));
}
