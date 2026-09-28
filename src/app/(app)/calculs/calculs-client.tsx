"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fr } from "@/lib/format";
import { newExercise, submitAnswer } from "./actions";
import type { DoseType, PublicExercise } from "@/lib/dose-exercise";

type TypeInfo = { type: DoseType; label: string; description: string };

type Correction = {
  correct: boolean;
  expected: number;
  unit: string;
  steps: string[];
  tip?: string;
};

export function CalculsClient({
  types,
  initialType,
  premium,
  initialRemaining,
}: {
  types: TypeInfo[];
  initialType: DoseType;
  premium: boolean;
  initialRemaining: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [type, setType] = useState<DoseType>(initialType);
  const [exercise, setExercise] = useState<PublicExercise | null>(null);
  const [remaining, setRemaining] = useState<number | null>(initialRemaining);
  const [limit, setLimit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [pending, startTransition] = useTransition();

  const answerRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  function load(nextType: DoseType) {
    setLoadError(null);
    setCorrection(null);
    setInvalid(false);
    setAnswer("");
    startTransition(async () => {
      const result = await newExercise(nextType);
      if (result.status === "limit") {
        setLimit(true);
        setExercise(null);
      } else if (result.status === "ok") {
        setLimit(false);
        setExercise(result.exercise);
        setRemaining(result.remaining);
        requestAnimationFrame(() => answerRef.current?.focus());
      } else {
        setLoadError(result.message);
      }
    });
  }

  // Premier exercice au chargement de la page
  useEffect(() => {
    load(initialType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (correction) nextButtonRef.current?.focus();
  }, [correction]);

  function selectType(next: DoseType) {
    if (next === type) return;
    setType(next);
    router.replace(`${pathname}?type=${next}`, { scroll: false });
    load(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise || pending) return;
    startTransition(async () => {
      const result = await submitAnswer(exercise.id, answer);
      if (result.status === "invalid") {
        setInvalid(true);
        return;
      }
      if (result.status === "error") {
        setLoadError(result.message);
        return;
      }
      setInvalid(false);
      setCorrection(result);
    });
  }

  return (
    <div className="mt-8">
      <div role="group" aria-label="Type de calcul" className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t.type}
            type="button"
            aria-pressed={type === t.type}
            onClick={() => selectType(t.type)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              type === t.type ? "bg-ink text-white" : "border border-mint-line text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!premium && !limit && remaining !== null ? (
        <p className="mt-4 text-sm text-ink-soft">
          Il vous reste {fr(remaining)} exercice{remaining > 1 ? "s" : ""} aujourd’hui.
        </p>
      ) : null}

      {limit ? (
        <div role="status" className="mt-6 rounded-xl border border-mint-line bg-mint/60 p-6">
          <p className="font-display text-lg font-medium text-ink">Vous avez fait vos 5 calculs du jour.</p>
          <p className="mt-2 text-ink-soft">
            Revenez demain, ou{" "}
            <Link href="/tarifs" className="font-bold text-teal underline">
              passez en premium
            </Link>{" "}
            pour un entraînement illimité.
          </p>
        </div>
      ) : loadError ? (
        <p role="alert" className="mt-6 text-alert">
          {loadError}
        </p>
      ) : exercise ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-mint-line bg-white shadow-[0_1px_2px_rgba(28,28,26,0.04),0_16px_40px_-24px_rgba(28,28,26,0.35)]">
          <div className="flex items-center justify-between border-b border-mint-line bg-signal/15 px-5 py-3 text-sm">
            <span className="font-medium text-ink">{exercise.title}</span>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 py-5 text-sm">
            {exercise.data.map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-ink-soft">{d.label}</dt>
                <dd className="font-medium">{d.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-mint-line px-5 py-5">
            <p className="font-display text-lg font-normal text-ink">{exercise.question}</p>

            <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label htmlFor="answer" className="block text-sm font-bold">
                  Réponse
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={answerRef}
                    id="answer"
                    name="answer"
                    inputMode="decimal"
                    autoComplete="off"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      if (invalid) setInvalid(false);
                    }}
                    disabled={pending || !!correction}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? "answer-erreur" : undefined}
                    className="field w-40"
                  />
                  <span className="text-ink-soft" aria-hidden="true">
                    {exercise.unit}
                  </span>
                </div>
              </div>
              {!correction ? (
                <button type="submit" className="btn btn-primary" disabled={pending || answer.trim() === ""}>
                  {pending ? "Correction…" : "Corriger"}
                </button>
              ) : null}
            </form>

            {invalid ? (
              <p id="answer-erreur" role="alert" className="mt-2 text-sm text-alert">
                Saisissez un nombre, par exemple 2,5.
              </p>
            ) : null}

            {correction ? (
              <div role="status" className="mt-5">
                <p
                  className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${
                    correction.correct ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"
                  }`}
                >
                  {correction.correct ? "Juste" : "Pas tout à fait"}
                </p>
                <p className="mt-2 text-ink">
                  Réponse attendue :{" "}
                  <strong className="font-medium">
                    {fr(correction.expected, 2)} {correction.unit}
                  </strong>
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
                  {correction.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                {correction.tip ? (
                  <p className="mt-3 rounded-lg bg-mint/60 p-3 text-sm text-ink-soft">{correction.tip}</p>
                ) : null}
                <button ref={nextButtonRef} type="button" onClick={() => load(type)} className="btn btn-secondary mt-4">
                  Exercice suivant
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-ink-soft">Chargement de l’exercice…</p>
      )}

      <p className="mt-10 text-sm text-ink-soft">
        Exercices à visée pédagogique. En service, suivez la prescription et les protocoles de l’établissement.
      </p>
    </div>
  );
}
