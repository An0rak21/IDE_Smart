import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail, isPremium, type Subscription } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };
export const dynamic = "force-dynamic";

type ProfileRow = { id: string; first_name: string | null; ifsi: string | null; study_year: string | null; created_at: string };
type SubRow = Subscription & { user_id: string };

export default async function AdminPage() {
  const account = await getAccount();
  if (!account || !isAdminEmail(account.user.email)) notFound();

  const admin = createAdminClient();
  const [{ data: usersPage }, { data: profiles }, { data: subs }, { count: attempts7d }, { count: doses7d }] =
    await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from("profiles").select("id, first_name, ifsi, study_year, created_at").returns<ProfileRow[]>(),
      admin.from("subscriptions").select("user_id, plan, status, current_period_end, cancel_at_period_end").returns<SubRow[]>(),
      admin.from("quiz_attempts").select("id", { count: "exact", head: true }).gte("started_at", daysAgo(7)),
      admin.from("dose_exercises").select("id", { count: "exact", head: true }).gte("created_at", daysAgo(7)),
    ]);

  const users = usersPage?.users ?? [];
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const subByUser = new Map((subs ?? []).map((s) => [s.user_id, s]));

  const premiumSubs = (subs ?? []).filter((s) => isPremium(s));
  const trialing = premiumSubs.filter((s) => s.status === "trialing").length;
  const paying = premiumSubs.length - trialing;
  const annual = premiumSubs.filter((s) => s.status === "active" && s.plan === "annual").length;
  const newUsers7d = users.filter((u) => u.created_at >= daysAgo(7)).length;
  const active7d = users.filter((u) => u.last_sign_in_at && u.last_sign_in_at >= daysAgo(7)).length;

  const byYear = countBy((profiles ?? []).map((p) => p.study_year ?? "Non renseigné"));
  const byIfsi = countBy((profiles ?? []).map((p) => p.ifsi?.trim() || "Non renseigné"));

  const recent = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50);

  const stats: [string, number][] = [
    ["Inscrits", users.length],
    ["Nouveaux sur 7 jours", newUsers7d],
    ["Connectés sur 7 jours", active7d],
    ["Abonnés payants", paying],
    ["dont annuels", annual],
    ["En essai", trialing],
    ["Séries de QCM sur 7 jours", attempts7d ?? 0],
    ["Calculs sur 7 jours", doses7d ?? 0],
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <AccountNav current="admin" isAdmin />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-normal tracking-tight text-ink">Administration</h1>
        <Link href="/admin/signalements" className="text-sm font-bold text-teal underline">
          Signalements sur les questions
        </Link>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-mint-line bg-white p-4">
            <dt className="text-sm text-ink-soft">{label}</dt>
            <dd className="font-display text-2xl font-extrabold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Breakdown title="Inscrits par semestre" rows={byYear} />
        <Breakdown title="Inscrits par IFSI" rows={byIfsi} />
      </div>

      <section aria-labelledby="inscrits" className="mt-10">
        <h2 id="inscrits" className="font-display text-xl font-extrabold">50 dernières inscriptions</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-mint-line bg-white">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-mint-line">
              <tr>
                <th scope="col" className="p-3">E-mail</th>
                <th scope="col" className="p-3">Prénom</th>
                <th scope="col" className="p-3">IFSI</th>
                <th scope="col" className="p-3">Semestre</th>
                <th scope="col" className="p-3">Offre</th>
                <th scope="col" className="p-3">Inscription</th>
                <th scope="col" className="p-3">Dernière connexion</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u) => {
                const p = profileById.get(u.id);
                const s = subByUser.get(u.id) ?? null;
                return (
                  <tr key={u.id} className="border-b border-mint-line last:border-0">
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{p?.first_name ?? "–"}</td>
                    <td className="p-3">{p?.ifsi ?? "–"}</td>
                    <td className="p-3">{p?.study_year ?? "–"}</td>
                    <td className="p-3">{isPremium(s) ? (s?.status === "trialing" ? "Essai" : s?.plan === "annual" ? "Annuel" : "Mensuel") : "Gratuit"}</td>
                    <td className="p-3">{fr(u.created_at)}</td>
                    <td className="p-3">{u.last_sign_in_at ? fr(u.last_sign_in_at) : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <section className="rounded-xl border border-mint-line bg-white p-5">
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Aucun inscrit pour l’instant.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map(([label, n]) => (
            <li key={label} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="truncate">{label}</span>
              <span className="h-2 rounded bg-mint" aria-hidden="true">
                <span className="block h-2 rounded bg-teal" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="text-right font-bold">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 864e5).toISOString();
}

function countBy(values: string[]): [string, number][] {
  const m = new Map<string, number>();
  values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
}

function fr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
