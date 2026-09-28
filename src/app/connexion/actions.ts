"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/redirect";
import { siteUrl } from "@/lib/site";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(formData.get("suite") ?? ""));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Cette adresse e-mail n’est pas valide. Vérifiez-la et réessayez.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl}${next}`, shouldCreateUser: true },
  });

  if (error) {
    const tooMany = error.status === 429;
    return {
      status: "error",
      email,
      message: tooMany
        ? "Trop de demandes en peu de temps. Attendez une minute avant de redemander un lien."
        : "Le lien n’a pas pu être envoyé. Réessayez dans un instant.",
    };
  }

  return { status: "sent", email };
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(String(formData.get("suite") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl}/auth/callback?suite=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/connexion?erreur=google");
  redirect(data.url);
}
