"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { answerQuestion, finishAttempt, reportQuestion, type QuestionCorrection } from "@/app/qcm/actions";
import type { PublicQuestion } from "@/lib/qcm/public-question";

type Mode = "training" | "exam";
type TrainingCorrection = { correct: boolean; correctOptionIds: string[]; explanation: string; lessonSlug: string | null };

const EXAM_SECONDS = 90;

export function QcmClient({
  attemptId,
  mode,
  questions,
  answeredQuestionIds,
  finished,
  finalScore,
  lessonHrefs,
}: {
  attemptId: string;
  mode: Mode;
  questions: PublicQuestion[];
  answeredQuestionIds: string[];
  finished: boolean;
  finalScore: number | null;
  lessonHrefs: Record<string, string | null>;
}) {
  const answeredSet = useMemo(() => new Set(answeredQuestionIds), [answeredQuestionIds]);
  const firstUnanswered = questions.findIndex((q) => !answeredSet.has(q.id));
  const allAnswered = firstUnanswered === -1;

  const [index, setIndex] = useState(allAnswered ? Math.max(questions.length - 1, 0) : firstUnanswered);
  const [selected, setSelected] = useState<string[]>([]);
  const [training, setTraining] = useState<TrainingCorrection | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(finished || allAnswered);
  const [score, setScore] = useState<number | null>(finalScore);
  const [examCorrections, setExamCorrections] = useState<QuestionCorrection[] | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sent" | "error">("idle");
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);

  const question = questions[index];
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  function finish() {
    startTransition(async () => {
      const result = await finishAttempt(attemptId);
      if (result.status === "ok") {
        setScore(result.score);
        setExamCorrections(result.corrections);
        setDone(true);
      } else {
        setError(result.message);
      }
    });
  }

  // Minuteur en mode examen : à zéro, la série se termine immédiatement, le reste compte faux.
  useEffect(() => {
    if (mode !== "exam" || done || !question) return;
    setSecondsLeft(EXAM_SECONDS);
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode, done]);

  useEffect(() => {
    if (training) nextButtonRef.current?.focus();
  }, [training]);

  function toggle(id: string) {
    if (!question || training || pending) return;
    setSelected((prev) => {
      if (question.type === "multiple") return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      return [id];
    });
  }

  function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!question || selected.length === 0 || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await answerQuestion(attemptId, question.id, selected);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      if (mode === "training") {
        setTraining(result.training);
      } else {
        goNext();
      }
    });
  }

  function goNext() {
    setSelected([]);
    setTraining(null);
    setReportOpen(false);
    setReportMessage("");
    setReportStatus("idle");
    if (index + 1 >= questions.length) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
  }

  async function submitReport() {
    if (!question) return;
    const r = await reportQuestion(question.id, reportMessage);
    setReportStatus(r.status === "ok" ? "sent" : "error");
  }

  if (done) {
    const missed = mode === "exam" && examCorrections ? examCorrections.filter((c) => !c.correct) : [];
    return (
      <div role="status" className="rounded-2xl border border-mint-line bg-white p-6">
        <p className="font-display text-2xl font-medium text-ink">Série terminée</p>
        <p className="mt-2 text-ink-soft">
          Score : <strong className="font-bold text-ink">{score === null ? "–" : `${score} %`}</strong>
        </p>
        {missed.length > 0 ? (
          <div className="mt-6">
            <p className="font-bold text-ink">Questions à revoir</p>
            <ul className="mt-2 space-y-2">
              {missed.map((c) => (
                <li key={c.questionId} className="rounded-lg border border-mint-line p-3">
                  <p className="text-sm text-ink">{c.prompt}</p>
                  {lessonHrefs[c.questionId] ? (
                    <Link href={lessonHrefs[c.questionId]!} className="mt-1 inline-block text-sm font-bold text-teal underline">
                      Revoir la leçon
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Link href="/espace" className="btn btn-primary mt-6">
          Retour à mon espace
        </Link>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <p>
          {index + 1} / {questions.length}
        </p>
        {mode === "exam" ? (
          <p aria-live="polite" className={secondsLeft <= 10 ? "font-bold text-alert" : undefined}>
            {secondsLeft} s
          </p>
        ) : null}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-mint" aria-hidden="true">
        <div
          className="h-1.5 rounded-full bg-teal transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <form onSubmit={submitAnswer} className="mt-6 rounded-2xl border border-mint-line bg-white p-6">
        {question.context ? (
          <p className="mb-4 rounded-lg bg-mint/60 p-3 text-sm text-ink-soft">{question.context}</p>
        ) : null}
        <fieldset>
          <legend className="font-display text-lg font-normal text-ink">{question.prompt}</legend>
          {question.type === "multiple" ? (
            <p className="mt-1 text-xs text-ink-soft">Plusieurs réponses possibles</p>
          ) : null}
          <div className="mt-4 space-y-2">
            {question.options.map((o) => {
              const checked = selected.includes(o.id);
              const isCorrectOption = !!training?.correctOptionIds.includes(o.id);
              return (
                <label
                  key={o.id}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    training
                      ? isCorrectOption
                        ? "border-ok bg-ok/5"
                        : checked
                          ? "border-alert bg-alert/5"
                          : "border-mint-line"
                      : "border-mint-line"
                  }`}
                >
                  <input
                    type={question.type === "multiple" ? "checkbox" : "radio"}
                    name="qcm-option"
                    checked={checked}
                    disabled={!!training || pending}
                    onChange={() => toggle(o.id)}
                  />
                  <span>{o.label}</span>
                  {training && isCorrectOption ? (
                    <span className="ml-auto text-xs font-bold text-ok">Bonne réponse</span>
                  ) : null}
                  {training && checked && !isCorrectOption ? (
                    <span className="ml-auto text-xs font-bold text-alert">Votre réponse</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-alert">
            {error}
          </p>
        ) : null}

        {!training ? (
          <button type="submit" className="btn btn-primary mt-5" disabled={selected.length === 0 || pending}>
            {pending ? "Correction…" : "Valider"}
          </button>
        ) : (
          <div className="mt-5">
            {training.explanation ? <p className="text-sm text-ink-soft">{training.explanation}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {lessonHrefs[question.id] ? (
                <Link href={lessonHrefs[question.id]!} className="text-sm font-bold text-teal underline">
                  Revoir la leçon
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setReportOpen((v) => !v)}
                className="text-sm font-bold text-ink-soft hover:text-ink"
              >
                Signaler une erreur
              </button>
            </div>
            {reportOpen ? (
              <div className="mt-3 rounded-lg border border-mint-line p-3">
                <label htmlFor="report" className="text-sm font-bold">
                  Décrivez le problème
                </label>
                <textarea
                  id="report"
                  className="field mt-1 min-h-20"
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                />
                {reportStatus === "sent" ? (
                  <p role="status" className="mt-2 text-sm text-ok">
                    Signalement envoyé, merci.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={submitReport}
                    className="btn btn-secondary mt-2"
                    disabled={reportMessage.trim().length < 5}
                  >
                    Envoyer
                  </button>
                )}
                {reportStatus === "error" ? (
                  <p role="alert" className="mt-2 text-sm text-alert">
                    Le message doit faire entre 5 et 2000 caractères.
                  </p>
                ) : null}
              </div>
            ) : null}
            <button ref={nextButtonRef} type="button" onClick={goNext} className="btn btn-primary mt-4">
              Question suivante
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
