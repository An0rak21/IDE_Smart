import { createHash } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  ficheSchema,
  lessonFrontmatter,
  moduleSchema,
  qcmFileSchema,
  type Fiche,
  type LessonFrontmatter,
  type ModuleContent,
  type Question,
} from "./schema";

export type LoadedLesson = LessonFrontmatter & { body: string; file: string };
export type LoadedQuestion = Question & { hash: string; published: boolean; file: string };
export type LoadedModule = ModuleContent & {
  dir: string;
  lessonsData: LoadedLesson[];
  fiches: (Fiche & { file: string })[];
  questions: LoadedQuestion[];
};

export type LoadResult = { modules: LoadedModule[]; errors: string[] };

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function files(dir: string, ext: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => path.join(dir, f));
}

/** Empreinte du contenu d'une question : tout changement impose d'augmenter `version` */
export function questionHash(q: Question) {
  const { ref, type, level, lesson, context, prompt, options, explanation } = q;
  return createHash("sha256")
    .update(JSON.stringify({ ref, type, level, lesson, context, prompt, options, explanation }))
    .digest("hex")
    .slice(0, 16);
}

function issues(file: string, err: { issues: { path: PropertyKey[]; message: string }[] }) {
  return err.issues.map((i) => `${file} › ${i.path.join(".") || "(racine)"} : ${i.message}`);
}

export function loadContent(root = path.join(process.cwd(), "content")): LoadResult {
  const errors: string[] = [];
  const modules: LoadedModule[] = [];
  const refs = new Map<string, string>();
  const modulesDir = path.join(root, "modules");
  if (!existsSync(modulesDir)) return { modules, errors: [`Dossier introuvable : ${modulesDir}`] };

  for (const name of readdirSync(modulesDir).sort()) {
    const dir = path.join(modulesDir, name);
    const moduleFile = path.join(dir, "module.yml");
    if (!existsSync(moduleFile)) continue;
    const rel = (f: string) => path.relative(root, f);

    const m = moduleSchema.safeParse(parseYaml(readFileSync(moduleFile, "utf8")));
    if (!m.success) {
      errors.push(...issues(rel(moduleFile), m.error));
      continue;
    }
    if (m.data.slug !== name) errors.push(`${rel(moduleFile)} : slug « ${m.data.slug} » ≠ dossier « ${name} »`);

    const lessonsData: LoadedLesson[] = [];
    for (const file of files(path.join(dir, "lecons"), ".mdx")) {
      const match = readFileSync(file, "utf8").match(FM);
      if (!match) {
        errors.push(`${rel(file)} : en-tête --- manquant`);
        continue;
      }
      const fm = lessonFrontmatter.safeParse(parseYaml(match[1]));
      if (!fm.success) {
        errors.push(...issues(rel(file), fm.error));
        continue;
      }
      const body = match[2].trim();
      // MDX : un « < » ou un « { » isolé casse la compilation
      body.split("\n").forEach((line, i) => {
        if (/<(?![A-Za-z/!])/.test(line)) errors.push(`${rel(file)} ligne ${i + 1} : « < » isolé, écrire « inférieur à » ou &lt;`);
        if (/\{(?!\[)/.test(line.replace(/refs=\{\[/g, ""))) errors.push(`${rel(file)} ligne ${i + 1} : « { » isolé, à échapper`);
      });
      lessonsData.push({ ...fm.data, body, file: rel(file) });
    }
    const lessonSlugs = new Set(lessonsData.map((l) => l.slug));
    for (const s of m.data.lessons) {
      if (!lessonSlugs.has(s)) errors.push(`${rel(moduleFile)} : leçon « ${s} » listée mais fichier absent`);
    }
    for (const l of lessonsData) {
      if (!m.data.lessons.includes(l.slug)) errors.push(`${l.file} : leçon absente de module.yml › lessons`);
    }
    lessonsData.sort((a, b) => m.data.lessons.indexOf(a.slug) - m.data.lessons.indexOf(b.slug));

    const fiches: (Fiche & { file: string })[] = [];
    for (const file of files(path.join(dir, "fiches"), ".yml")) {
      const f = ficheSchema.safeParse(parseYaml(readFileSync(file, "utf8")));
      if (!f.success) {
        errors.push(...issues(rel(file), f.error));
        continue;
      }
      if (f.data.lesson && !lessonSlugs.has(f.data.lesson)) {
        errors.push(`${rel(file)} : leçon « ${f.data.lesson} » inconnue`);
      }
      fiches.push({ ...f.data, file: rel(file) });
    }

    const questions: LoadedQuestion[] = [];
    for (const file of files(path.join(dir, "qcm"), ".yml")) {
      const q = qcmFileSchema.safeParse(parseYaml(readFileSync(file, "utf8")));
      if (!q.success) {
        errors.push(...issues(rel(file), q.error));
        continue;
      }
      for (const question of q.data.questions) {
        if (refs.has(question.ref)) errors.push(`${rel(file)} : ref ${question.ref} déjà utilisée dans ${refs.get(question.ref)}`);
        refs.set(question.ref, rel(file));
        if (!lessonSlugs.has(question.lesson)) errors.push(`${rel(file)} › ${question.ref} : leçon « ${question.lesson} » inconnue`);
        questions.push({
          ...question,
          hash: questionHash(question),
          published: q.data.status === "valide" && m.data.status === "valide",
          file: rel(file),
        });
      }
    }

    // Les questions citées dans <Verifier refs={[...]} /> doivent exister dans ce module
    const moduleRefs = new Set(questions.map((q) => q.ref));
    for (const l of lessonsData) {
      for (const m of l.body.matchAll(/<Verifier\s+refs=\{\[([^\]]*)\]\}\s*\/>/g)) {
        for (const r of m[1].split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean)) {
          if (!moduleRefs.has(r)) errors.push(`${l.file} : <Verifier> cite ${r}, introuvable dans qcm/`);
        }
      }
    }

    // Chaque module doit offrir une série découverte gratuite
    if (questions.length > 0 && !questions.some((q) => q.free)) {
      errors.push(`${rel(moduleFile)} : aucune question marquée free (série découverte)`);
    }

    modules.push({ ...m.data, dir, lessonsData, fiches, questions });
  }

  return { modules, errors };
}
