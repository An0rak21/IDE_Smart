import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions de vente" };

export default function Page() {
  return (
    <LegalPage title="Conditions générales de vente" updated="[date]">
      <h2>Offres et prix</h2>
      <p>
        Premium mensuel : {site.prices.monthly.label} {site.prices.monthly.period}. Premium annuel :{" "}
        {site.prices.annual.label} {site.prices.annual.period}. Prix en euros. {site.vatMention}.
      </p>
      <h2>Essai gratuit</h2>
      <p>
        Un essai de {site.trialDays} jours est proposé lors du premier abonnement, sans carte bancaire. Sans moyen de
        paiement enregistré à la fin de l’essai, l’abonnement s’arrête automatiquement.
      </p>
      <h2>Paiement et renouvellement</h2>
      <p>
        Le paiement est traité par Stripe. L’abonnement est renouvelé automatiquement à chaque échéance, jusqu’à sa
        résiliation.
      </p>
      <h2>Résiliation</h2>
      <p>
        La résiliation se fait à tout moment depuis la page Compte. Elle prend effet à la fin de la période déjà payée.
      </p>
      <h2>Droit de rétractation</h2>
      <p>
        [À valider : conditions de renonciation au droit de rétractation pour un contenu numérique fourni
        immédiatement, avec l’accord exprès de l’utilisateur au moment de la souscription.]
      </p>
      <h2>Médiation</h2>
      <p>[Nom et coordonnées du médiateur de la consommation choisi.]</p>
    </LegalPage>
  );
}
