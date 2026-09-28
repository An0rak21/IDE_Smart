"use server";

import { getAccount, isAdminEmail } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";

type Status = "open" | "fixed" | "rejected";

export type UpdateReportStatusResult = { status: "ok" } | { status: "error"; message: string };

export async function updateReportStatus(reportId: string, status: Status): Promise<UpdateReportStatusResult> {
  const account = await getAccount();
  if (!account || !isAdminEmail(account.user.email)) {
    return { status: "error", message: "Accès réservé aux administrateurs." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("question_reports").update({ status }).eq("id", reportId);
  if (error) return { status: "error", message: "Le statut n'a pas pu être mis à jour. Réessayez." };
  return { status: "ok" };
}
