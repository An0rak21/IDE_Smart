import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon espace" };

type Props = { searchParams: Promise<{ abonnement?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const account = await getAccount();
  if (!account) redirect("/connexion");
  const { user, profile, subscription, premium } = account;

  const supabase = await createClient();
  const [{ data: modules }, { count: attemptCount }, { data: attempts }, { count: doseCount }] = await Promise.all([
    supabase.from("modules").select("id, slug, title, semester").eq("is_published", true).order("position"),
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).not("finished_at", "is", null),
    supabase.from("quiz_attempts").select("score").not("score", "is", null).order("started_at", { ascending: false }).limit(20),
    supabase.from("dose_exercises").select("id", { count: "exact", head: true }),
  ]);

  const scores = (attempts ?? []).map((a) => Number(a.score));
  const average = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const trialing = subscription?.status === "trialing";

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <AccountNav current="espace" isAdmin={isAdminEmail(user.email)} />

      <h1 className="mt-8 font-display text-3xl font-extrabold text-teal">
        {profile?.first_name ? `Bonjour ${profile.first_name}` : "Bonjour"}
      </h1>

      {params.abonnement === "ok" ? (
        <p role="status" className="mt-4 rounded-lg border border-ok/30 bg-ok/5 p-4 text-ok">
          Abonnement activé. Tous les contenus premium vous sont ouverts.
        </p>
      ) : null}

      {!profile?.study_year ? (
        <p className="mt-4 rounded-lg border border-mint-line bg-white p-4">
          Indiquez votre semestre pour que l’on vous propose les bons modules.{" "}
          <Link href="/compte" className="font-bold text-teal underline">Compléter mon profil</Link>
        </p>
      ) : null}

      <section aria-labelledby="stats" className="mt-8">
        <h2 id="stats" className="sr-only">Ma progression</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-mint-line bg-white p-5">
            <dt className="text-sm text-ink-soft">Séries de QCM terminées</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold">{attemptCount ?? 0}</dd>
          </div>
          <div className="rounded-xl border border-mint-line bg-white p-5">
            <dt className="text-sm text-ink-soft">Score moyen (20 dernières séries)</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold">{average === null ? "–" : `${average} %`}</dd>
          </div>
          <div className="rounded-xl border border-mint-line bg-white p-5">
            <dt className="text-sm text-ink-soft">Calculs de doses faits</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold">{doseCount ?? 0}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="modules" className="mt-10">
        <h2 id="modules" className="font-display text-xl font-extrabold">Modules</h2>
        {modules && modules.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {modules.map((m) => (
              <li key={m.id} className="rounded-xl border border-mint-line bg-white p-5">
                <span className="text-sm font-bold text-teal">{m.semester}</span>
                <p className="font-display text-lg font-extrabold">{m.title}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-xl border-2 border-dashed border-mint-line p-8">
            <p className="font-bold">Les premiers modules arrivent bientôt.</p>
            <p className="mt-1 text-ink-soft">
              Cardiologie, hémostase, douleur et générateur de calculs de doses sont en préparation. Vous serez
              prévenu par e-mail dès leur mise en ligne.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="offre" className="mt-10 rounded-xl bg-mint/60 p-6">
        <h2 id="offre" className="font-display text-xl font-extrabold">Votre offre</h2>
        {premium ? (
          <p className="mt-2 text-ink-soft">
            {trialing ? "Essai premium en cours" : "Premium actif"}
            {subscription?.current_period_end
              ? `, ${trialing ? "jusqu’au" : subscription.cancel_at_period_end ? "jusqu’au" : "renouvellement le"} ${new Date(
                  subscription.current_period_end,
                ).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`
              : "."}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-ink-soft">Offre gratuite. Passez en premium pour l’entraînement illimité.</p>
            <Link href="/tarifs" className="btn btn-primary">Voir l’offre premium</Link>
          </div>
        )}
      </section>
    </div>
  );
}
