"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { status: "idle" | "saved" | "error"; message?: string };

const YEARS = ["S1", "S2", "S3", "S4", "S5", "S6"];

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };

  const firstName = String(formData.get("first_name") ?? "").trim().slice(0, 60) || null;
  const ifsi = String(formData.get("ifsi") ?? "").trim().slice(0, 120) || null;
  const yearRaw = String(formData.get("study_year") ?? "");
  const studyYear = YEARS.includes(yearRaw) ? yearRaw : null;

  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, ifsi, study_year: studyYear, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { status: "error", message: "Le profil n’a pas été enregistré. Réessayez." };
  revalidatePath("/espace");
  revalidatePath("/compte");
  return { status: "saved" };
}
