import "server-only";
import { cache } from "react";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import path from "node:path";
import { loadContent, type LoadedModule } from "./load";
import { remarkRowHeaders } from "./remark-row-headers";
import { ARetenir } from "@/components/content/a-retenir";
import { Attention } from "@/components/content/attention";
import { RoleInfirmier } from "@/components/content/role-infirmier";
import { Verifier } from "@/components/content/verifier";

// Un seul parse disque par requête, même si plusieurs pages/segments le lisent.
export const getContent = cache(() => loadContent(path.join(process.cwd(), "content")));

export function findModule(modules: LoadedModule[], slug: string) {
  return modules.find((m) => m.slug === slug) ?? null;
}

export function findFiche(modules: LoadedModule[], slug: string) {
  for (const mod of modules) {
    const fiche = mod.fiches.find((f) => f.slug === slug);
    if (fiche) return { mod, fiche };
  }
  return null;
}

const components = {
  ARetenir,
  Attention,
  RoleInfirmier,
  Verifier,
  table: (props: React.ComponentProps<"table">) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  ),
  th: ({ scope, ...props }: React.ComponentProps<"th">) => <th scope={scope ?? "col"} {...props} />,
};

/** Compile et exécute le corps MDX d'une leçon (Server Component uniquement). */
export async function LessonBody({ body }: { body: string }) {
  const compiled = await compile(body, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm, remarkRowHeaders],
  });
  const { default: Content } = await run(compiled, runtime);
  return <Content components={components} />;
}
