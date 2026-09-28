import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions de vente" };

export default function Page() {
  return (
    <LegalPage title="Conditions générales de vente" updated="28/09/2026">
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
        Conformément aux articles L. 221-18 et suivants du Code de la consommation, tout consommateur dispose en
        principe d’un délai de 14 jours francs à compter de la conclusion du contrat pour exercer son droit de
        rétractation, sans avoir à justifier de motif ni à supporter de pénalités.
      </p>
      <p>
        Toutefois, en application de l’article L. 221-28, 13° du Code de la consommation, ce droit ne peut être
        exercé pour les contrats de fourniture d’un contenu numérique non fourni sur un support matériel dont
        l’exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de
        rétractation.
      </p>
      <p>
        En souscrivant à un abonnement {site.name} et en validant sa commande, l’utilisateur demande expressément à
        bénéficier du service dès son activation (y compris pendant la période d’essai gratuit de {site.trialDays}{" "}
        jours) et reconnaît, en cochant la case prévue à cet effet, renoncer expressément à son droit de
        rétractation une fois l’exécution du service commencée. Cette renonciation ne prive l’utilisateur d’aucun
        autre droit, notamment celui de résilier son abonnement à tout moment conformément à l’article « Résiliation »
        ci-dessus.
      </p>
      <p>
        À défaut d’une telle demande et renonciation expresses, l’utilisateur peut exercer son droit de rétractation
        dans le délai légal de 14 jours en adressant une déclaration dénuée d’ambiguïté à {site.contactEmail}, par
        exemple au moyen du modèle ci-dessous :
      </p>
      <p>
        « Je notifie par la présente ma rétractation du contrat portant sur la fourniture de l’abonnement{" "}
        {site.name}, souscrit le [date], au nom de [nom, prénom du consommateur]. »
      </p>
      <h2>Médiation</h2>
      <p>Sébastien SALIQUES -- {site.contactEmail}</p>
    </LegalPage>
  );
}
