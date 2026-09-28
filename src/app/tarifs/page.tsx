import type { Metadata } from "next";
import Link from "next/link";
import { getAccount } from "@/lib/account";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Tarifs" };

const rows: { label: string; free: string; premium: string }[] = [
  { label: "Fiches de révision", free: "Toutes", premium: "Toutes, avec export PDF" },
  { label: "Leçons de cours", free: "La première de chaque module", premium: "Toutes" },
  { label: "QCM", free: "Une série découverte par module", premium: "Toute la banque, mode examen" },
  { label: "Calculs de doses", free: "5 exercices par jour", premium: "Illimités" },
  { label: "Cas cliniques et examens blancs", free: "Non", premium: "Oui" },
  { label: "Suivi de progression", free: "Score simple", premium: "Complet, avec la série de vos erreurs" },
];

export default async function PricingPage() {
  const account = await getAccount();

  const cta = (plan: "monthly" | "annual", primary: boolean) =>
    account ? (
      account.premium ? (
        <Link href="/compte" className="btn btn-secondary w-full">
          Gérer mon abonnement
        </Link>
      ) : (
        <form action="/api/stripe/checkout" method="post">
          <input type="hidden" name="plan" value={plan} />
          <button type="submit" className={`btn w-full ${primary ? "btn-primary" : "btn-secondary"}`}>
            {plan === "annual" ? "Choisir l’offre annuelle" : "Choisir l’offre mensuelle"}
          </button>
        </form>
      )
    ) : (
      <Link
        href="/connexion?mode=inscription&suite=/tarifs"
        className={`btn w-full ${primary ? "btn-primary" : "btn-secondary"}`}
      >
        Créer un compte pour s’abonner
      </Link>
    );

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-display text-4xl font-normal tracking-tight text-ink">Tarifs</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Les fiches sont gratuites. L’offre premium ajoute l’entraînement illimité et le suivi complet. Essai de{" "}
        {site.trialDays} jours sans carte bancaire, résiliation en deux clics.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-mint-line p-7">
          <h2 className="font-display text-xl font-medium text-ink">Gratuit</h2>
          <p className="mt-4 font-display text-4xl font-normal text-ink">0 €</p>
          <p className="mt-1 text-sm text-ink-soft">pour toujours</p>
          <div className="mt-6">
            {account ? (
              <Link href="/espace" className="btn btn-secondary w-full">Aller à mon espace</Link>
            ) : (
              <Link href="/connexion?mode=inscription" className="btn btn-secondary w-full">Créer mon compte gratuit</Link>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-mint-line p-7">
          <h2 className="font-display text-xl font-medium text-ink">Premium mensuel</h2>
          <p className="mt-4 font-display text-4xl font-normal text-ink">{site.prices.monthly.label}</p>
          <p className="mt-1 text-sm text-ink-soft">{site.prices.monthly.period}, sans engagement</p>
          <div className="mt-6">{cta("monthly", false)}</div>
        </div>

        <div className="relative rounded-2xl border border-ink p-7">
          <span className="absolute -top-3 left-7 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">
            Recommandé
          </span>
          <h2 className="font-display text-xl font-medium text-ink">Premium annuel</h2>
          <p className="mt-4 font-display text-4xl font-normal text-ink">{site.prices.annual.label}</p>
          <p className="mt-1 text-sm text-ink-soft">{site.prices.annual.period}, l’année universitaire complète</p>
          <div className="mt-6">{cta("annual", true)}</div>
        </div>
      </div>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <caption className="sr-only">Comparaison des offres gratuite et premium</caption>
          <thead>
            <tr className="border-b border-ink">
              <th scope="col" className="py-3 pr-4 font-medium">Fonctionnalité</th>
              <th scope="col" className="py-3 pr-4 font-medium">Gratuit</th>
              <th scope="col" className="py-3 font-medium">Premium</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-mint-line">
                <th scope="row" className="py-3 pr-4 font-medium">{r.label}</th>
                <td className="py-3 pr-4 text-ink-soft">{r.free}</td>
                <td className="py-3">{r.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Prix en euros. {site.vatMention}. Paiement sécurisé par Stripe : vos coordonnées bancaires ne sont jamais
        stockées sur nos serveurs.
      </p>
    </div>
  );
}
