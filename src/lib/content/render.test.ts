import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { remarkRowHeaders } from "./remark-row-headers";
import { loadContent } from "./load";
import { ARetenir } from "@/components/content/a-retenir";
import { Attention } from "@/components/content/attention";
import { RoleInfirmier } from "@/components/content/role-infirmier";

// <Verifier> est un Server Component qui appelle cookies()/Supabase : hors de portée d'un
// rendu Node isolé. On le remplace par une coquille pour valider le reste du rendu MDX
// (tableaux, blocs pédagogiques) sur le contenu réel du dépôt.
function VerifierStub({ refs }: { refs: string[] }) {
  return createElement("div", { "data-verifier-stub": true }, refs.join(","));
}

const components = {
  ARetenir,
  Attention,
  RoleInfirmier,
  Verifier: VerifierStub,
  table: (props: Record<string, unknown>) => createElement("div", { className: "overflow-x-auto" }, createElement("table", props)),
  th: ({ scope, ...props }: { scope?: string } & Record<string, unknown>) =>
    createElement("th", { scope: scope ?? "col", ...props }),
};

async function renderBody(body: string) {
  const compiled = await compile(body, { outputFormat: "function-body", remarkPlugins: [remarkGfm, remarkRowHeaders] });
  const { default: Content } = await run(compiled, runtime);
  return renderToStaticMarkup(createElement(Content, { components }));
}

describe("rendu MDX des leçons réelles", () => {
  const { modules, errors } = loadContent();
  it("le contenu du dépôt est chargeable", () => expect(errors).toEqual([]));

  for (const mod of modules) {
    for (const lesson of mod.lessonsData) {
      it(`${lesson.file} se rend sans exception`, async () => {
        const html = await renderBody(lesson.body);
        expect(html.length).toBeGreaterThan(0);
      });
    }
  }

  it("marque la première colonne d'un tableau en th scope=\"row\"", async () => {
    const html = await renderBody("| A | B |\n| --- | --- |\n| ligne | valeur |\n");
    expect(html).toContain('scope="row"');
    expect(html).toContain('scope="col"');
  });

  it("<RoleInfirmier> restitue les sections Avant/Pendant/Éducation", async () => {
    const diuretiques = modules.find((m) => m.slug === "cardiologie")?.lessonsData.find((l) => l.slug === "diuretiques");
    expect(diuretiques).toBeDefined();
    const html = await renderBody(diuretiques!.body);
    expect(html).toContain("Rôle infirmier");
    expect(html).toContain("Avant");
    expect(html).toContain("Pendant");
    expect(html).toContain("Éducation");
  });

  it("<Verifier> reçoit bien la liste des refs citées", async () => {
    const html = await renderBody('<Verifier refs={["a-b-001", "a-b-002"]} />');
    expect(html).toContain("data-verifier-stub");
    expect(html).toContain("a-b-001,a-b-002");
  });
});
