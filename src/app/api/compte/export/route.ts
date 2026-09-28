import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Portabilité RGPD : toutes les données du compte en JSON
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  // dose_exercises contient le seed et la réponse attendue, illisibles avec la session
  // utilisateur (voir 0002_dose_exercises_hide_answer.sql) : on relit cette table avec le
  // client admin, filtré explicitement sur l'utilisateur.
  const admin = createAdminClient();

  const [profile, subscription, attempts, answers, doses, reports] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").eq("user_id", user.id).maybeSingle(),
    supabase.from("quiz_attempts").select("*").order("started_at"),
    supabase.from("attempt_answers").select("*").order("created_at"),
    admin.from("dose_exercises").select("*").eq("user_id", user.id).order("created_at"),
    supabase.from("question_reports").select("*").order("created_at"),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    subscription: subscription.data,
    quiz_attempts: attempts.data ?? [],
    attempt_answers: answers.data ?? [],
    dose_exercises: doses.data ?? [],
    question_reports: reports.data ?? [],
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mes-donnees.json"`,
    },
  });
}
