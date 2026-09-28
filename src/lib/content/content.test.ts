import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { loadContent, questionHash } from "./load";

describe("contenu du dépôt", () => {
  const { modules, errors } = loadContent();

  it("est valide", () => {
    expect(errors).toEqual([]);
    expect(modules.length).toBeGreaterThan(0);
  });

  it("chaque leçon compile en MDX", async () => {
    for (const m of modules) {
      for (const l of m.lessonsData) {
        await expect(compile(l.body, { remarkPlugins: [remarkGfm] }), l.file).resolves.toBeDefined();
      }
    }
  });

  it("chaque module a une première leçon gratuite", () => {
    for (const m of modules) expect(m.lessonsData[0]?.free, m.slug).toBe(true);
  });
});

describe("validation", () => {
  function tempModule(files: Record<string, string>) {
    const root = mkdtempSync(path.join(tmpdir(), "content-"));
    for (const [rel, body] of Object.entries(files)) {
      const p = path.join(root, "modules", "test", rel);
      mkdirSync(path.dirname(p), { recursive: true });
      writeFileSync(p, body);
    }
    return loadContent(root);
  }
  const moduleYml = `slug: test\ntitle: Test\nsemester: S1\nposition: 0\ndescription: d\nstatus: brouillon\nlessons: [intro]\n`;
  const lesson = (body: string) =>
    `---\nslug: intro\ntitle: Intro\nduration: 5\nfree: true\nstatus: brouillon\nupdated: 2026-01-01\nobjectives: [o]\n---\n${body}`;
  const qcm = (q: string) => `status: brouillon\nquestions:\n${q}`;
  const single = (correct: number) => `  - ref: test-q-001
    version: 1
    type: single
    level: 1
    free: true
    lesson: intro
    prompt: p
    options:
${[0, 1, 2].map((i) => `      - label: o${i}${i < correct ? "\n        correct: true" : ""}`).join("\n")}
    explanation: e
`;

  it("refuse une question à choix unique avec deux bonnes réponses", () => {
    const r = tempModule({ "module.yml": moduleYml, "lecons/a.mdx": lesson("x"), "qcm/a.yml": qcm(single(2)) });
    expect(r.errors.join()).toMatch(/exactement 1 bonne réponse/);
  });

  it("refuse un « < » isolé dans une leçon", () => {
    const r = tempModule({ "module.yml": moduleYml, "lecons/a.mdx": lesson("K⁺ < 3,5") });
    expect(r.errors.join()).toMatch(/« < » isolé/);
  });

  it("refuse un <Verifier> qui cite une question absente", () => {
    const r = tempModule({
      "module.yml": moduleYml,
      "lecons/a.mdx": lesson(`<Verifier refs={["test-q-999"]} />`),
      "qcm/a.yml": qcm(single(1)),
    });
    expect(r.errors.join()).toMatch(/test-q-999/);
  });

  it("détecte une leçon listée mais absente", () => {
    const r = tempModule({ "module.yml": moduleYml });
    expect(r.errors.join()).toMatch(/fichier absent/);
  });

  it("l'empreinte change quand le contenu change", () => {
    const base = {
      ref: "a-b-001", version: 1, type: "single" as const, level: 1, free: false, lesson: "x",
      prompt: "p", options: [{ label: "a", correct: true }, { label: "b", correct: false }], explanation: "e",
    };
    expect(questionHash(base)).toBe(questionHash({ ...base }));
    expect(questionHash(base)).not.toBe(questionHash({ ...base, explanation: "e2" }));
    expect(questionHash(base)).toBe(questionHash({ ...base, version: 2, free: true }));
  });
});
