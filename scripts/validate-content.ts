import { loadContent } from "../src/lib/content/load";

const { modules, errors } = loadContent();

for (const m of modules) {
  const pub = m.questions.filter((q) => q.published).length;
  console.log(
    `• ${m.title} [${m.status}] : ${m.lessonsData.length} leçon(s), ${m.fiches.length} fiche(s), ` +
      `${m.questions.length} question(s) dont ${m.questions.filter((q) => q.free).length} gratuite(s), ${pub} publiable(s)`,
  );
  const drafts = [
    ...m.lessonsData.filter((l) => l.status === "brouillon").map((l) => l.file),
    ...m.fiches.filter((f) => f.status === "brouillon").map((f) => f.file),
  ];
  if (drafts.length) console.log(`  À relire : ${drafts.join(", ")}`);
}

if (errors.length) {
  console.error(`\n${errors.length} erreur(s) :`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("\n✓ Contenu valide");
