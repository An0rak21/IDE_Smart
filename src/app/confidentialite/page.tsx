import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Confidentialité" };

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité" updated="[date]">
      <h2>Responsable du traitement</h2>
      <p>[Prénom Nom], éditeur du site. Contact : {site.contactEmail}.</p>
      <h2>Données collectées</h2>
      <ul>
        <li>Compte : adresse e-mail, prénom, IFSI et semestre s’ils sont renseignés.</li>
        <li>Progression : réponses aux QCM, scores, exercices de calcul.</li>
        <li>Abonnement : identifiants Stripe et statut de l’abonnement. Aucune donnée bancaire n’est stockée par le site.</li>
      </ul>
      <p>Aucune donnée de santé n’est collectée.</p>
      <h2>Finalités et bases légales</h2>
      <ul>
        <li>Fournir le service et suivre la progression : exécution du contrat.</li>
        <li>Facturation : obligation légale.</li>
        <li>Mesure d’audience anonyme, sans cookie : intérêt légitime.</li>
      </ul>
      <h2>Sous-traitants</h2>
      <p>Supabase (hébergement des données, UE), Vercel (hébergement du site), Stripe (paiement), [service d’e-mails].</p>
      <h2>Durée de conservation</h2>
      <p>
        Les données du compte sont conservées tant que le compte existe, puis supprimées. Les factures sont
        conservées dix ans par Stripe au titre des obligations comptables.
      </p>
      <h2>Vos droits</h2>
      <p>
        Vous pouvez télécharger vos données et supprimer votre compte depuis la page Compte. Pour toute autre demande,
        écrivez à {site.contactEmail}. Vous pouvez saisir la CNIL si vous estimez vos droits non respectés.
      </p>
    </LegalPage>
  );
}
