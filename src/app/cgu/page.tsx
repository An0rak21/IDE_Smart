import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions d’utilisation" };

export default function Page() {
  return (
    <LegalPage title="Conditions générales d’utilisation" updated="28/09/2026">
      <h2>Objet</h2>
      <p>
        {site.name} propose aux étudiants en soins infirmiers des fiches de révision, des QCM et des exercices de
        calculs de doses. L’inscription vaut acceptation des présentes conditions.
      </p>
      <h2>Compte</h2>
      <p>
        Le compte est personnel. L’utilisateur s’engage à ne pas partager ses accès ni à extraire massivement les
        contenus.
      </p>
      <h2>Usage des contenus</h2>
      <p>
        Les contenus sont réservés à un usage personnel de révision. Ils ne constituent pas un avis médical et ne
        dispensent pas de vérifier les prescriptions, les RCP et les protocoles en vigueur.
      </p>
      <h2>Signalement d’erreurs</h2>
      <p>Chaque question peut être signalée. Les contenus sont corrigés après vérification.</p>
      <h2>Suspension et suppression</h2>
      <p>
        L’utilisateur peut supprimer son compte à tout moment depuis la page Compte. L’éditeur peut suspendre un
        compte en cas d’usage contraire aux présentes conditions.
      </p>
      <h2>Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français.</p>
    </LegalPage>
  );
}
