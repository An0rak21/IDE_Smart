"use client";

import { useState } from "react";
import { checkVerifierAnswer } from "@/app/qcm/actions";
import type { PublicQuestion } from "@/lib/qcm/public-question";

type Result = { correct: boolean; correctOptionIds: string[]; explanation: string };

export function VerifierClient({ questions }: { questions: PublicQuestion[] }) {
  return (
    <div className="my-8 space-y-6">
      <p className="font-display text-lg font-medium text-ink">Vérifiez vos connaissances</p>
      {questions.map((q, i) => (
        <VerifierQuestion key={q.id} index={i + 1} question={q} />
      ))}
    </div>
  );
}

function VerifierQuestion({ index, question }: { index: number; question: PublicQuestion }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const multiple = question.type === "multiple";

  function toggle(id: string) {
    if (result) return;
    setSelected((prev) => {
      if (multiple) return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return [id];
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0 || pending || result) return;
    setPending(true);
    const r = await checkVerifierAnswer(question.id, selected);
    setPending(false);
    if (r.status === "ok") setResult(r);
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-mint-line bg-white p-5">
      {question.context ? (
        <p className="mb-3 rounded-lg bg-mint/60 p-3 text-sm text-ink-soft">{question.context}</p>
      ) : null}
      <fieldset>
        <legend className="font-medium text-ink">
          {index}. {question.prompt}
        </legend>
        {multiple ? <p className="mt-1 text-xs text-ink-soft">Plusieurs réponses possibles</p> : null}
        <div className="mt-3 space-y-2">
          {question.options.map((o) => {
            const checked = selected.includes(o.id);
            const isCorrectOption = !!result?.correctOptionIds.includes(o.id);
            return (
              <label
                key={o.id}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  result
                    ? isCorrectOption
                      ? "border-ok bg-ok/5"
                      : checked
                        ? "border-alert bg-alert/5"
                        : "border-mint-line"
                    : "border-mint-line"
                }`}
              >
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={`verifier-${question.id}`}
                  checked={checked}
                  disabled={!!result}
                  onChange={() => toggle(o.id)}
                />
                <span>{o.label}</span>
                {result && isCorrectOption ? (
                  <span className="ml-auto text-xs font-bold text-ok">Bonne réponse</span>
                ) : null}
                {result && checked && !isCorrectOption ? (
                  <span className="ml-auto text-xs font-bold text-alert">Votre réponse</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {!result ? (
        <button type="submit" className="btn btn-primary mt-4" disabled={selected.length === 0 || pending}>
          {pending ? "Correction…" : "Corriger"}
        </button>
      ) : (
        <div role="status" className="mt-4">
          <p
            className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${
              result.correct ? "bg-ok/10 text-ok" : "bg-alert/10 text-alert"
            }`}
          >
            {result.correct ? "Juste" : "Pas tout à fait"}
          </p>
          {result.explanation ? <p className="mt-2 text-sm text-ink-soft">{result.explanation}</p> : null}
        </div>
      )}
    </form>
  );
}
