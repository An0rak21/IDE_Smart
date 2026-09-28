import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";
import { DOSE_TYPES, type DoseType } from "@/lib/doses";
import { parisMidnightUTC } from "@/lib/doses/paris-midnight";
import { CalculsClient } from "./calculs-client";

export const metadata: Metadata = { title: "Calculs de doses" };

const FREE_DAILY_LIMIT = 5;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type Props = { searchParams: Promise<{ type?: string }> };

export default async function CalculsPage({ searchParams }: Props) {
  const params = await searchParams;
  const account = await getAccount();
  if (!account) redirect("/connexion?suite=/calculs");
  const { user, premium } = account;

  const requested = DOSE_TYPES.find((t) => t.type === params.type);
  const initialType: DoseType = requested?.type ?? DOSE_TYPES[0].type;

  const supabase = await createClient();
  const [{ count: todayCount }, { data: recent }] = await Promise.all([
    premium
      ? Promise.resolve({ count: null as number | null })
      : supabase
          .from("dose_exercises")
          .select("id", { count: "exact", head: true })
          .gte("created_at", parisMidnightUTC().toISOString()),
    supabase
      .from("dose_exercises")
      .select("type, is_correct")
      .not("is_correct", "is", null)
      .gte("created_at", new Date(Date.now() - THIRTY_DAYS_MS).toISOString()),
  ]);

  const stats = DOSE_TYPES.map((t) => {
    const rows = (recent ?? []).filter((r) => r.type === t.type);
    const correct = rows.filter((r) => r.is_correct).length;
    return { type: t.type, label: t.label, rate: rows.length ? Math.round((correct / rows.length) * 100) : null };
  });

  const initialRemaining = premium ? null : Math.max(0, FREE_DAILY_LIMIT - (todayCount ?? 0));

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <AccountNav current="calculs" isAdmin={isAdminEmail(user.email)} />

      <h1 className="mt-8 font-display text-3xl font-normal tracking-tight text-ink">Calculs de doses</h1>
      <p className="mt-3 text-ink-soft">
        Débits de perfusion, seringue électrique, dilutions et doses selon le poids : des exercices sans fin,
        corrigés étape par étape.
      </p>

      <section aria-labelledby="stats-calculs" className="mt-8">
        <h2 id="stats-calculs" className="text-sm font-bold text-ink-soft">
          Taux de réussite sur les 30 derniers jours
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.type} className="rounded-xl border border-mint-line bg-white p-4">
              <dt className="text-xs text-ink-soft">{s.label}</dt>
              <dd className="mt-1 font-display text-xl font-extrabold">{s.rate === null ? "–" : `${s.rate} %`}</dd>
            </div>
          ))}
        </dl>
      </section>

      <CalculsClient types={DOSE_TYPES} initialType={initialType} premium={premium} initialRemaining={initialRemaining} />
    </div>
  );
}
