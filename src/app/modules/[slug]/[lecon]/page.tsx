import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail } from "@/lib/account";
import { getContent, findModule, LessonBody } from "@/lib/content/render";
import { extractTeaserParagraphs } from "@/lib/content/teaser";

type Props = { params: Promise<{ slug: string; lecon: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lecon } = await params;
  const { modules } = getContent();
  const mod = findModule(modules, slug);
  const lesson = mod?.lessonsData.find((l) => l.slug === lecon);
  return { title: lesson?.title ?? "Leçon" };
}

export default async function LessonPage({ params }: Props) {
  const { slug, lecon } = await params;
  const account = await getAccount();
  if (!account) redirect(`/connexion?suite=/modules/${slug}/${lecon}`);
  const isAdmin = isAdminEmail(account.user.email);

  const { modules } = getContent();
  const mod = findModule(modules, slug);
  if (!mod) notFound();
  if (mod.status === "brouillon" && !isAdmin) notFound();

  const index = mod.lessonsData.findIndex((l) => l.slug === lecon);
  const lesson = index === -1 ? null : mod.lessonsData[index];
  if (!lesson) notFound();
  if (lesson.status === "brouillon" && !isAdmin) notFound();

  const locked = !lesson.free && !account.premium;
  const prev = index > 0 ? mod.lessonsData[index - 1] : null;
  const next = index < mod.lessonsData.length - 1 ? mod.lessonsData[index + 1] : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <AccountNav current="modules" isAdmin={isAdmin} />

      {mod.status === "brouillon" || lesson.status === "brouillon" ? (
        <p
          role="status"
          className="mb-6 inline-block rounded-lg border border-signal bg-signal/10 px-4 py-2 text-sm font-bold text-signal"
        >
          Brouillon, non publié
        </p>
      ) : null}

      <Link href={`/modules/${mod.slug}`} className="text-sm font-bold text-teal">
        ← {mod.title}
      </Link>

      <h1 className="mt-2 font-display text-3xl font-normal tracking-tight text-ink">{lesson.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{lesson.duration} min</p>

      <ul className="mt-4 space-y-1">
        {lesson.objectives.map((o, i) => (
          <li key={i} className="flex gap-2 text-ink-soft">
            <span aria-hidden="true">•</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>

      <div className="prose-content mt-8">
        <LessonBody body={locked ? extractTeaserParagraphs(lesson.body) : lesson.body} />
      </div>

      {locked ? (
        <div className="mt-6 rounded-xl bg-mint/60 p-6">
          <p className="font-display text-lg font-medium text-ink">Cette leçon est réservée au premium</p>
          <p className="mt-2 text-ink-soft">Débloquez l’ensemble des leçons, fiches et QCM.</p>
          <Link href="/tarifs" className="btn btn-primary mt-4">
            Voir l’offre premium
          </Link>
        </div>
      ) : null}

      <nav
        aria-label="Navigation entre leçons"
        className="mt-10 flex items-center justify-between gap-4 border-t border-mint-line pt-6"
      >
        {prev ? (
          <Link href={`/modules/${mod.slug}/${prev.slug}`} className="text-sm font-bold text-teal">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/modules/${mod.slug}/${next.slug}`} className="text-sm font-bold text-teal">
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
