import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function Page() {
  return (
    <LegalPage title="Mentions légales" updated="[date]">
      <h2>Éditeur du site</h2>
      <p>
        [Prénom Nom], entrepreneur individuel (micro-entreprise). SIRET : [numéro]. Adresse : [adresse]. Contact :{" "}
        {site.contactEmail}. Directeur de la publication : [Prénom Nom].
      </p>
      <p>{site.vatMention}.</p>
      <h2>Hébergement</h2>
      <p>Site hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
      <p>Données des comptes hébergées par Supabase, sur des serveurs situés dans l’Union européenne.</p>
      <h2>Contenu pédagogique</h2>
      <p>
        Les contenus sont proposés à des fins de formation. Ils ne remplacent ni la prescription médicale, ni le
        résumé des caractéristiques du produit, ni les protocoles des établissements de santé.
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, schémas, questions et exercices du site sont des créations originales. Toute reproduction sans
        autorisation est interdite.
      </p>
    </LegalPage>
  );
}
