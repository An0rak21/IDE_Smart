import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContent } from "@/lib/content/render";
import { ReportStatusForm } from "./report-status-form";

export const metadata: Metadata = { title: "Signalements", robots: { index: false } };
export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  question_id: string;
  message: string;
  status: "open" | "fixed" | "rejected";
  created_at: string;
};

type QuestionRow = { id: string; ref: string | null; prompt: string };

export default async function ReportsPage() {
  const account = await getAccount();
  if (!account || !isAdminEmail(account.user.email)) notFound();

  const admin = createAdminClient();
  const { data: reports } = await admin
    .from("question_reports")
    .select("id, question_id, message, status, created_at")
    .order("created_at", { ascending: false })
    .returns<ReportRow[]>();

  const questionIds = [...new Set((reports ?? []).map((r) => r.question_id))];
  const { data: questions } = questionIds.length
    ? await admin.from("questions").select("id, ref, prompt").in("id", questionIds).returns<QuestionRow[]>()
    : { data: [] as QuestionRow[] };
  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));

  const { modules } = getContent();
  const fileByRef = new Map(modules.flatMap((m) => m.questions.map((q) => [q.ref, q.file] as const)));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <AccountNav current="admin" isAdmin />
      <h1 className="mt-8 font-display text-3xl font-normal tracking-tight text-ink">Signalements</h1>

      {!reports || reports.length === 0 ? (
        <p className="mt-6 text-ink-soft">Aucun signalement pour l’instant.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reports.map((r) => {
            const q = questionById.get(r.question_id);
            const file = q?.ref ? fileByRef.get(q.ref) : undefined;
            return (
              <li key={r.id} className="rounded-xl border border-mint-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{q?.prompt ?? "Question introuvable"}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {q?.ref ?? "—"}
                      {file ? ` · ${file}` : ""}
                    </p>
                  </div>
                  <ReportStatusForm reportId={r.id} status={r.status} />
                </div>
                <p className="mt-3 text-sm text-ink-soft">{r.message}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
