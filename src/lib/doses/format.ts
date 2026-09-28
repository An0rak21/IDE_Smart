export { fr } from "@/lib/format";

export function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

// Accepte « 2,5 », « 2.5 », « 2,5 ml/h », « 1 250 »
export function parseAnswer(input: string): number | null {
  const cleaned = input
    .trim()
    .replace(/[\s  ]/g, "")
    .replace(",", ".")
    .match(/^-?\d+(\.\d+)?/);
  if (!cleaned) return null;
  const n = Number(cleaned[0]);
  return Number.isFinite(n) ? n : null;
}
