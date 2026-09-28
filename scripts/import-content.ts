/**
 * Importe /content dans Supabase : modules et questions (avec leurs options).
 * Les leçons et les fiches restent dans le dépôt et sont rendues au build.
 *
 *   npx tsx --env-file=.env.local scripts/import-content.ts           # import réel
 *   npx tsx --env-file=.env.local scripts/import-content.ts --dry-run # simulation
 *
 * Règles :
 * - Une question déjà en base dont le contenu a changé doit avoir une `version` supérieure,
 *   sinon l'import s'arrête (on ne corrige pas une question en silence).
 * - Seul le contenu au statut « valide » (fichier ET module) est publié.
 * - Une question retirée des fichiers est dépubliée, jamais supprimée (historique des réponses).
 */
import { createClient } from "@supabase/supabase-js";
import { loadContent } from "../src/lib/content/load";

const dryRun = process.argv.includes("--dry-run");
const { modules, errors } = loadContent();
if (errors.length) {
  console.error("Contenu invalide, import annulé :");
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: existing, error } = await db.from("questions").select("id, ref, version, content_hash, is_published");
  if (error) throw error;
  const byRef = new Map((existing ?? []).filter((q) => q.ref).map((q) => [q.ref as string, q]));
  const seen = new Set<string>();
  const stats = { created: 0, updated: 0, unchanged: 0, unpublished: 0 };
  const conflicts: string[] = [];

  for (const m of modules) {
    const moduleRow = {
      slug: m.slug,
      title: m.title,
      semester: m.semester,
      position: m.position,
      description: m.description,
      is_published: m.status === "valide",
    };
    let moduleId = "(simulation)";
    if (!dryRun) {
      const { data, error: e } = await db.from("modules").upsert(moduleRow, { onConflict: "slug" }).select("id").single();
      if (e) throw e;
      moduleId = data.id;
    }
    console.log(`Module ${m.slug} ${moduleRow.is_published ? "(publié)" : "(brouillon)"}`);

    for (const q of m.questions) {
      seen.add(q.ref);
      const current = byRef.get(q.ref);
      const row = {
        ref: q.ref,
        module_id: moduleId,
        type: q.type,
        prompt: q.prompt,
        context: q.context ?? null,
        explanation: q.explanation,
        level: q.level,
        is_free: q.free,
        lesson_slug: q.lesson,
        version: q.version,
        content_hash: q.hash,
        is_published: q.published,
      };

      if (current && current.content_hash === q.hash) {
        if (current.is_published !== q.published && !dryRun) {
          await db.from("questions").update({ is_published: q.published }).eq("id", current.id);
        }
        stats.unchanged++;
        continue;
      }
      if (current && q.version <= current.version) {
        conflicts.push(`${q.ref} (${q.file}) : contenu modifié, passer version à ${current.version + 1}`);
        continue;
      }
      if (dryRun) {
        current ? stats.updated++ : stats.created++;
        continue;
      }

      let questionId: string;
      if (current) {
        const { error: e } = await db.from("questions").update(row).eq("id", current.id);
        if (e) throw e;
        questionId = current.id;
        await db.from("question_options").delete().eq("question_id", questionId);
        stats.updated++;
      } else {
        const { data, error: e } = await db.from("questions").insert(row).select("id").single();
        if (e) throw e;
        questionId = data.id;
        stats.created++;
      }
      const { error: e } = await db.from("question_options").insert(
        q.options.map((o, i) => ({ question_id: questionId, label: o.label, is_correct: o.correct, position: i })),
      );
      if (e) throw e;
    }
  }

  for (const [ref, q] of byRef) {
    if (!seen.has(ref) && q.is_published) {
      if (!dryRun) await db.from("questions").update({ is_published: false }).eq("id", q.id);
      stats.unpublished++;
    }
  }

  console.log(
    `\n${dryRun ? "[simulation] " : ""}Questions : ${stats.created} créée(s), ${stats.updated} mise(s) à jour, ` +
      `${stats.unchanged} inchangée(s), ${stats.unpublished} dépubliée(s)`,
  );
  if (conflicts.length) {
    console.error(`\n${conflicts.length} question(s) non importée(s) :`);
    conflicts.forEach((c) => console.error(`  ✗ ${c}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
