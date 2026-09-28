import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-mint-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm text-ink-soft sm:grid-cols-[2fr_1fr_1fr]">
        <div className="max-w-md space-y-2">
          <p className="font-display text-base font-medium text-ink">{site.name}</p>
          <p>
            Contenu à visée pédagogique pour les étudiants en soins infirmiers. Il ne remplace ni la prescription
            médicale, ni le résumé des caractéristiques du produit, ni les protocoles de votre service.
          </p>
        </div>
        <nav aria-label="Informations" className="flex flex-col gap-2">
          <Link href="/tarifs" className="hover:text-ink">Tarifs</Link>
          <Link href="/connexion" className="hover:text-ink">Se connecter</Link>
          <Link href="/contact" className="hover:text-ink">Nous écrire</Link>
        </nav>
        <nav aria-label="Mentions légales" className="flex flex-col gap-2">
          <Link href="/mentions-legales" className="hover:text-ink">Mentions légales</Link>
          <Link href="/cgu" className="hover:text-ink">Conditions d’utilisation</Link>
          <Link href="/cgv" className="hover:text-ink">Conditions de vente</Link>
          <Link href="/confidentialite" className="hover:text-ink">Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
