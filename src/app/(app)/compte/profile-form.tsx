"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "./actions";
import type { Profile } from "@/lib/account";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, { status: "idle" });

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="first_name" className="block font-bold">Prénom</label>
        <input id="first_name" name="first_name" defaultValue={profile?.first_name ?? ""} autoComplete="given-name" className="field" />
      </div>
      <div className="space-y-1">
        <label htmlFor="study_year" className="block font-bold">Semestre en cours</label>
        <select id="study_year" name="study_year" defaultValue={profile?.study_year ?? ""} className="field">
          <option value="">Non renseigné</option>
          {["S1", "S2", "S3", "S4", "S5", "S6"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="ifsi" className="block font-bold">IFSI (facultatif)</label>
        <input id="ifsi" name="ifsi" defaultValue={profile?.ifsi ?? ""} placeholder="Ex. IFSI de Beaune" className="field" />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le profil"}
        </button>
        <p role="status" className={`text-sm ${state.status === "error" ? "text-alert" : "text-ok"}`}>
          {state.status === "saved" ? "Profil enregistré." : state.status === "error" ? state.message : ""}
        </p>
      </div>
    </form>
  );
}
