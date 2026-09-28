import { z } from "zod";

// ---------------------------------------------------------------------------
// Schémas du contenu pédagogique (dossier /content). Voir docs/format-contenu.md
// ---------------------------------------------------------------------------

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug en minuscules et tirets, sans accent");
const text = z.string().trim().min(1);

/** brouillon = rédigé, pas encore relu ; valide = relu par le relecteur scientifique */
export const status = z.enum(["brouillon", "valide"]);

export const moduleSchema = z.object({
  slug,
  title: text,
  semester: z.enum(["S1", "S3", "S5", "transversal"]),
  position: z.number().int().min(0),
  description: text,
  status,
  lessons: z.array(slug).min(1, "au moins une leçon"),
});

export const lessonFrontmatter = z.object({
  slug,
  title: text,
  duration: z.number().int().min(1).max(60).describe("minutes"),
  free: z.boolean().default(false),
  status,
  objectives: z.array(text).min(1).max(5),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const molecule = z.object({
  dci: text,
  specialites: z.array(text).default([]),
});

export const ficheSchema = z.object({
  slug,
  title: text,
  classe: text,
  status,
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lesson: slug.optional(),
  molecules: z.array(molecule).min(1),
  mecanisme: text,
  indications: z.array(text).min(1),
  contre_indications: z.array(text).min(1),
  effets_indesirables: z.array(text).min(1),
  surveillance: z.array(text).min(1),
  interactions: z.array(text).default([]),
  education: z.array(text).min(1),
  a_retenir: z.array(text).min(1).max(5),
});

const option = z.object({
  label: text,
  correct: z.boolean().default(false),
});

export const questionSchema = z
  .object({
    ref: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*-\d{3}$/, "ref du type cardio-diur-001"),
    version: z.number().int().min(1),
    type: z.enum(["single", "multiple", "true_false", "case"]),
    level: z.number().int().min(1).max(3),
    free: z.boolean().default(false),
    lesson: slug,
    context: text.optional(),
    prompt: text,
    options: z.array(option).min(2).max(6),
    explanation: text,
  })
  .superRefine((q, ctx) => {
    const n = q.options.filter((o) => o.correct).length;
    if ((q.type === "single" || q.type === "true_false" || q.type === "case") && n !== 1) {
      ctx.addIssue({ code: "custom", message: `${q.ref} : ${q.type} doit avoir exactement 1 bonne réponse (${n})` });
    }
    if (q.type === "multiple" && n < 1) {
      ctx.addIssue({ code: "custom", message: `${q.ref} : au moins 1 bonne réponse` });
    }
    if (q.type === "true_false" && (q.options.length !== 2 || q.options[0].label !== "Vrai" || q.options[1].label !== "Faux")) {
      ctx.addIssue({ code: "custom", message: `${q.ref} : true_false = options « Vrai » puis « Faux »` });
    }
    if (q.type === "case" && !q.context) {
      ctx.addIssue({ code: "custom", message: `${q.ref} : un cas clinique a besoin d'un context` });
    }
    const labels = q.options.map((o) => o.label.toLowerCase());
    if (new Set(labels).size !== labels.length) {
      ctx.addIssue({ code: "custom", message: `${q.ref} : options en double` });
    }
  });

export const qcmFileSchema = z.object({
  status,
  questions: z.array(questionSchema).min(1),
});

export type ModuleContent = z.infer<typeof moduleSchema>;
export type LessonFrontmatter = z.infer<typeof lessonFrontmatter>;
export type Fiche = z.infer<typeof ficheSchema>;
export type Question = z.infer<typeof questionSchema>;
