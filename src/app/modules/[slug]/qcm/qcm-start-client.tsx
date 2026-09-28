"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startAttempt } from "@/app/qcm/actions";

export function QcmStartClient({ moduleSlug, premium }: { moduleSlug: string; premium: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"training" | "exam">("training");
  const [count, setCount] = useState<10 | 20>(10);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startAttempt(moduleSlug, mode, count);
      if (result.status === "ok") {
        router.push(`/qcm/${result.attemptId}`);
      } else if (result.status === "forbidden") {
        setError("Le mode examen est réservé au premium.");
      } else if (result.status === "empty") {
        setError("Aucune question disponible pour ce choix pour l’instant.");
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <fieldset>
        <legend className="font-bold text-ink">Mode</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={mode === "training"}
            onClick={() => setMode("training")}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === "training" ? "bg-ink text-white" : "border border-mint-line text-ink-soft hover:text-ink"
            }`}
          >
            Entraînement
          </button>
          <button
            type="button"
            aria-pressed={mode === "exam"}
            onClick={() => premium && setMode("exam")}
            disabled={!premium}
            className={`rounded-full px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "exam" ? "bg-ink text-white" : "border border-mint-line text-ink-soft hover:text-ink"
            }`}
          >
            Examen (90 s / question)
          </button>
        </div>
        {!premium ? <p className="mt-2 text-sm text-ink-soft">Le mode examen est réservé au premium.</p> : null}
      </fieldset>

      <fieldset>
        <legend className="font-bold text-ink">Nombre de questions</legend>
        <div className="mt-2 flex gap-2">
          {([10, 20] as const).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={count === n}
              onClick={() => setCount(n)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                count === n ? "bg-ink text-white" : "border border-mint-line text-ink-soft hover:text-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Préparation…" : "Commencer"}
      </button>
    </form>
  );
}
