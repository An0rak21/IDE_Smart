"use client";

import { useState } from "react";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
        Supprimer mon compte
      </button>
    );
  }

  return (
    <form action="/api/compte/supprimer" method="post" className="space-y-3 rounded-lg border border-alert/40 bg-alert/5 p-4">
      <p className="text-sm">
        La suppression est définitive : votre progression est effacée et un abonnement en cours est résilié
        immédiatement, sans remboursement de la période entamée.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="confirm" value="oui" required />
        Je confirme vouloir supprimer mon compte
      </label>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-danger">Supprimer définitivement</button>
        <button type="button" className="btn" onClick={() => setConfirming(false)}>Annuler</button>
      </div>
    </form>
  );
}
