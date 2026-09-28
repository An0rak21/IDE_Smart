import Link from "next/link";
import { SyringeLabel } from "@/components/syringe-label";
import { site } from "@/lib/site";

const features = [
  {
    title: "Des fiches pour chaque classe de médicaments",
    body: "Mécanisme, indications, effets indésirables, surveillance infirmière, interactions et éducation du patient, sur une page.",
  },
  {
    title: "Des QCM corrigés et expliqués",
    body: "En mode entraînement pour comprendre, en mode examen pour se tester en temps limité. Chaque erreur renvoie vers le cours.",
  },
  {
    title: "Un générateur de calculs de doses",
    body: "Débits de perfusion, seringue électrique, dilutions, doses selon le poids : des exercices sans fin, corrigés étape par étape.",
  },
];

const semesters = [
  {
    code: "S1",
    title: "Les bases",
    items: "Pharmacocinétique, pharmacodynamie, formes galéniques, antalgiques",
  },
  {
    code: "S3",
    title: "Les classes thérapeutiques",
    items: "Cardiologie, hémostase, anti-infectieux, endocrinologie, digestif",
  },
  {
    code: "S5",
    title: "L’intégration",
    items: "Surveillance des thérapeutiques, prescriptions, responsabilité infirmière",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div>
          <h1 className="max-w-xl font-display text-4xl font-extrabold leading-[1.08] text-teal sm:text-5xl">
            Réviser la pharmacologie, du partiel au premier stage.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-ink-soft">
            Fiches de révision, QCM corrigés et calculs de doses pour les étudiants en soins infirmiers. Tous les
            contenus sont relus par un formateur en pharmacologie en IFSI.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/connexion?mode=inscription" className="btn btn-primary">
              Créer mon compte gratuit
            </Link>
            <Link href="/tarifs" className="btn btn-secondary">
              Voir les tarifs
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Fiches gratuites. Premium à {site.prices.monthly.label} {site.prices.monthly.period}, sans engagement.
          </p>
        </div>
        <SyringeLabel />
      </section>

      <section aria-labelledby="contenu-titre" className="border-y border-mint-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 id="contenu-titre" className="max-w-2xl font-display text-3xl font-extrabold text-ink">
            Tout ce qu’il faut pour réviser l’UE 2.11
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="border-l-4 border-signal pl-5">
                <h3 className="font-display text-lg font-extrabold">{f.title}</h3>
                <p className="mt-2 text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="programme-titre" className="mx-auto max-w-6xl px-5 py-16">
        <h2 id="programme-titre" className="font-display text-3xl font-extrabold">
          Le programme, semestre par semestre
        </h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Les modules suivent le référentiel de formation. Les premiers arrivent bientôt : cardiologie, hémostase,
          douleur et calculs de doses.
        </p>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {semesters.map((s) => (
            <li key={s.code} className="rounded-xl border border-mint-line bg-mint/60 p-6">
              <span className="font-display text-4xl font-extrabold text-teal">{s.code}</span>
              <h3 className="mt-2 font-display text-lg font-extrabold">{s.title}</h3>
              <p className="mt-2 text-ink-soft">{s.items}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-6 rounded-2xl bg-teal px-8 py-12 text-white md:grid-cols-[2fr_1fr] md:items-center">
          <div>
            <h2 className="font-display text-3xl font-extrabold">Commencez par les fiches, gratuitement.</h2>
            <p className="mt-3 max-w-xl text-white/85">
              Créez un compte en une minute avec votre e-mail ou votre compte Google. Vous pourrez essayer
              l’offre premium pendant {site.trialDays} jours, sans carte bancaire.
            </p>
          </div>
          <Link href="/connexion?mode=inscription" className="btn bg-signal text-ink hover:bg-white md:justify-self-end">
            Créer mon compte gratuit
          </Link>
        </div>
      </section>
    </>
  );
}
