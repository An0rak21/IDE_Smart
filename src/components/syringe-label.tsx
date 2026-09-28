"use client";

import { useState } from "react";

// Étiquette de seringue électrique : un vrai calcul à résoudre, avec correction.
export function SyringeLabel() {
  const [shown, setShown] = useState(false);

  return (
    <figure className="relative mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[6px_6px_0_var(--color-teal)]">
        <div className="flex items-center justify-between bg-signal px-4 py-2 text-sm font-bold text-ink">
          <span>Seringue électrique</span>
          <span>50 ml</span>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-4 py-4 text-sm">
          <dt className="text-ink-soft">Prescription</dt>
          <dd className="font-bold">Héparine sodique 20 000 UI / 24 h</dd>
          <dt className="text-ink-soft">Flacon</dt>
          <dd>25 000 UI dans 5 ml</dd>
          <dt className="text-ink-soft">Préparation</dt>
          <dd>20 000 UI complétées à 48 ml de NaCl 0,9 %</dd>
        </dl>

        <div className="border-t-2 border-dashed border-mint-line px-4 py-4">
          <p className="font-display text-xl font-extrabold">Quel débit programmer ?</p>

          {shown ? (
            <ol className="mt-3 space-y-1 text-sm" aria-live="polite">
              <li>
                Volume d’héparine : 20 000 × 5 / 25 000 = <strong>4 ml</strong>
              </li>
              <li>
                Seringue : 4 ml d’héparine + 44 ml de NaCl = <strong>48 ml</strong>
              </li>
              <li>
                Débit : 48 ml / 24 h = <strong className="text-lg text-teal">2 ml/h</strong>
              </li>
            </ol>
          ) : (
            <button type="button" onClick={() => setShown(true)} className="btn btn-secondary mt-3">
              Afficher la correction
            </button>
          )}
        </div>

        <div className="flex h-8 items-end gap-[3px] border-t border-mint-line px-4 pb-1" aria-hidden="true">
          {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3].map((w, i) => (
            <span key={i} className="h-5 bg-ink" style={{ width: w }} />
          ))}
        </div>
      </div>
      <figcaption className="mt-4 text-center text-sm text-ink-soft">
        Un exercice du générateur de calculs de doses
      </figcaption>
    </figure>
  );
}
