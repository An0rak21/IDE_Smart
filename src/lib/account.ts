import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Subscription = {
  plan: "monthly" | "annual" | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type Profile = {
  id: string;
  first_name: string | null;
  ifsi: string | null;
  study_year: string | null;
};

export function isPremium(sub: Subscription | null) {
  if (!sub) return false;
  const active = sub.status === "active" || sub.status === "trialing";
  const notExpired = !sub.current_period_end || new Date(sub.current_period_end) > new Date();
  return active && notExpired;
}

// Utilisateur connecté + profil + abonnement, en un appel
export async function getAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, ifsi, study_year").eq("id", user.id).maybeSingle<Profile>(),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle<Subscription>(),
  ]);

  return { user, profile, subscription, premium: isPremium(subscription) };
}

export function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
