"use client";

import Link from "next/link";

export function PrintButton({ premium }: { premium: boolean }) {
  if (!premium) {
    return (
      <p className="rounded-xl border border-mint-line bg-white p-4 text-sm text-ink-soft">
        L’impression et l’export PDF sont réservés au premium.{" "}
        <Link href="/tarifs" className="font-bold text-teal underline">
          Voir l’offre
        </Link>
      </p>
    );
  }
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-secondary">
      Imprimer / PDF
    </button>
  );
}
