import { createRng, randomSeed } from "@/lib/doses/rng";

export type DrawablePool = { id: string; isFree: boolean };

// Tirage aléatoire sans doublon parmi les questions publiées du module ; un non-abonné
// ne pioche que dans les questions gratuites. Si le pool est plus petit que `count`,
// on prend tout ce qu'il y a.
export function drawQuestionIds(pool: DrawablePool[], count: number, premium: boolean, seed = randomSeed()): string[] {
  const eligible = premium ? pool : pool.filter((q) => q.isFree);
  const ids = eligible.map((q) => q.id);
  const rng = createRng(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, Math.min(count, ids.length));
}
