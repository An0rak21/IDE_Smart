"use client";

import { useState } from "react";

// Étiquette de seringue électrique : un vrai calcul à résoudre, avec correction.
export function SyringeLabel() {
  const [shown, setShown] = useState(false);

  return (
    <figure className="relative mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-mint-line bg-white shadow-[0_1px_2px_rgba(28,28,26,0.04),0_16px_40px_-24px_rgba(28,28,26,0.35)]">
        <div className="flex items-center justify-between border-b border-mint-line px-5 py-3 text-sm">
          <span className="font-medium text-ink">Seringue électrique</span>
          <span className="text-ink-soft">50 ml</span>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-5 py-5 text-sm">
          <dt className="text-ink-soft">Prescription</dt>
          <dd className="font-medium">Héparine sodique 20 000 UI / 24 h</dd>
          <dt className="text-ink-soft">Flacon</dt>
          <dd>25 000 UI dans 5 ml</dd>
          <dt className="text-ink-soft">Préparation</dt>
          <dd>20 000 UI complétées à 48 ml de NaCl 0,9 %</dd>
        </dl>

        <div className="border-t border-mint-line px-5 py-5">
          <p className="font-display text-xl font-normal text-ink">Quel débit programmer ?</p>

          {shown ? (
            <ol className="mt-4 space-y-1.5 text-sm text-ink-soft" aria-live="polite">
              <li>
                Volume d’héparine : 20 000 × 5 / 25 000 = <strong className="font-medium text-ink">4 ml</strong>
              </li>
              <li>
                Seringue : 4 ml d’héparine + 44 ml de NaCl = <strong className="font-medium text-ink">48 ml</strong>
              </li>
              <li>
                Débit : 48 ml / 24 h ={" "}
                <strong className="font-display text-lg font-medium text-teal">2 ml/h</strong>
              </li>
            </ol>
          ) : (
            <button type="button" onClick={() => setShown(true)} className="btn btn-secondary mt-4">
              Afficher la correction
            </button>
          )}
        </div>

        <div className="flex h-8 items-end gap-[3px] border-t border-mint-line bg-mint/50 px-5 pb-1.5" aria-hidden="true">
          {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3].map((w, i) => (
            <span key={i} className="h-4 bg-ink/70" style={{ width: w }} />
          ))}
        </div>
      </div>
      <figcaption className="mt-4 text-center text-sm text-ink-soft">
        Un exercice du générateur de calculs de doses
      </figcaption>
    </figure>
  );
}
