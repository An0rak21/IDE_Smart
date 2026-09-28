import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SEMESTER_LABELS, SEMESTER_ORDER } from "@/lib/content/semester";

export const metadata: Metadata = { title: "Modules" };

type ModuleRow = { slug: string; title: string; semester: string; description: string };

export default async function ModulesPage() {
  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("modules")
    .select("slug, title, semester, description")
    .eq("is_published", true)
    .order("position")
    .returns<ModuleRow[]>();

  const bySemester = SEMESTER_ORDER.map((semester) => ({
    semester,
    modules: (modules ?? []).filter((m) => m.semester === semester),
  })).filter((g) => g.modules.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-normal tracking-tight text-ink">Modules</h1>
      <p className="mt-3 text-ink-soft">
        Fiches de révision, leçons et QCM corrigés, organisés par semestre.
      </p>

      {bySemester.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-mint-line p-8">
          <p className="font-bold">Les premiers modules arrivent bientôt.</p>
          <p className="mt-1 text-ink-soft">
            Cardiologie, hémostase et douleur sont en préparation. Vous serez prévenu par e-mail dès leur mise
            en ligne.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {bySemester.map((g) => (
            <section key={g.semester} aria-labelledby={`sem-${g.semester}`}>
              <h2 id={`sem-${g.semester}`} className="font-display text-xl font-extrabold">
                {SEMESTER_LABELS[g.semester] ?? g.semester}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {g.modules.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/modules/${m.slug}`}
                      className="block rounded-xl border border-mint-line bg-white p-5 transition-colors hover:border-ink"
                    >
                      <p className="font-display text-lg font-extrabold">{m.title}</p>
                      <p className="mt-1 text-sm text-ink-soft">{m.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
