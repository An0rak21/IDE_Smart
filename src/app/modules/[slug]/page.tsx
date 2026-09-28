import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccount, isAdminEmail } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";
import { getContent, findModule } from "@/lib/content/render";
import { SEMESTER_LABELS } from "@/lib/content/semester";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { modules } = getContent();
  const mod = findModule(modules, slug);
  return { title: mod?.title ?? "Module" };
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const account = await getAccount();
  const isAdmin = isAdminEmail(account?.user.email);

  const { modules } = getContent();
  const mod = findModule(modules, slug);
  if (!mod) notFound();
  if (mod.status === "brouillon" && !isAdmin) notFound();

  const supabase = await createClient();
  const { data: moduleRow } = await supabase.from("modules").select("id").eq("slug", slug).maybeSingle();

  let questionCount = 0;
  if (moduleRow) {
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("module_id", moduleRow.id)
      .eq("is_published", true);
    questionCount = count ?? 0;
  }

  const lessons = mod.lessonsData.filter((l) => l.status === "valide" || isAdmin);
  const fiches = mod.fiches.filter((f) => f.status === "valide" || isAdmin);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      {mod.status === "brouillon" ? (
        <p
          role="status"
          className="mb-6 inline-block rounded-lg border border-signal bg-signal/10 px-4 py-2 text-sm font-bold text-signal"
        >
          Brouillon, non publié
        </p>
      ) : null}

      <p className="text-sm font-bold text-teal">{SEMESTER_LABELS[mod.semester] ?? mod.semester}</p>
      <h1 className="mt-1 font-display text-3xl font-normal tracking-tight text-ink">{mod.title}</h1>
      <p className="mt-3 text-ink-soft">{mod.description}</p>

      <section aria-labelledby="lecons" className="mt-8">
        <h2 id="lecons" className="font-display text-xl font-extrabold">
          Leçons
        </h2>
        {lessons.length === 0 ? (
          <p className="mt-3 text-ink-soft">À venir.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {lessons.map((l) => (
              <li key={l.slug}>
                <Link
                  href={`/modules/${mod.slug}/${l.slug}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-mint-line bg-white p-4 hover:border-ink"
                >
                  <span className="font-medium text-ink">
                    {l.status === "brouillon" ? (
                      <span className="mr-2 rounded-full bg-signal/15 px-2 py-0.5 text-xs font-bold text-signal">
                        Brouillon
                      </span>
                    ) : null}
                    {l.title}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-ink-soft">
                    {l.duration} min
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        l.free ? "bg-ok/10 text-ok" : "bg-signal/15 text-signal"
                      }`}
                    >
                      {l.free ? "Gratuit" : "Premium"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {fiches.length > 0 ? (
        <section aria-labelledby="fiches" className="mt-8">
          <h2 id="fiches" className="font-display text-xl font-extrabold">
            Fiches
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {fiches.map((f) => (
              <li key={f.slug}>
                <Link
                  href={`/fiches/${f.slug}`}
                  className="block rounded-xl border border-mint-line bg-white p-4 hover:border-ink"
                >
                  <p className="font-medium text-ink">{f.title}</p>
                  <p className="text-sm text-ink-soft">{f.classe}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {questionCount > 0 ? (
        <section aria-labelledby="qcm" className="mt-8 rounded-xl bg-mint/60 p-6">
          <h2 id="qcm" className="font-display text-xl font-extrabold">
            S’entraîner
          </h2>
          <p className="mt-2 text-ink-soft">{questionCount} question(s) disponible(s) pour ce module.</p>
          <Link href={`/modules/${mod.slug}/qcm`} className="btn btn-primary mt-4">
            Lancer un QCM
          </Link>
        </section>
      ) : null}
    </div>
  );
}
