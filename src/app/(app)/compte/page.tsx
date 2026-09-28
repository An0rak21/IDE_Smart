import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail } from "@/lib/account";
import { site } from "@/lib/site";
import { ProfileForm } from "./profile-form";
import { DeleteAccount } from "./delete-account";

export const metadata: Metadata = { title: "Compte et abonnement" };

const STATUS: Record<string, string> = {
  trialing: "Essai gratuit en cours",
  active: "Actif",
  past_due: "Paiement en échec : mettez à jour votre moyen de paiement",
  canceled: "Résilié",
  unpaid: "Impayé",
  incomplete: "Paiement à finaliser",
  incomplete_expired: "Paiement non finalisé",
  paused: "En pause",
  none: "Aucun abonnement",
};

type Props = { searchParams: Promise<{ abonnement?: string; erreur?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const params = await searchParams;
  const account = await getAccount();
  if (!account) redirect("/connexion");
  const { user, profile, subscription, premium } = account;
  const hasCustomer = subscription && subscription.status !== "none";
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <AccountNav current="compte" isAdmin={isAdminEmail(user.email)} />
      <h1 className="mt-8 font-display text-3xl font-normal tracking-tight text-ink">Compte et abonnement</h1>
      {params.erreur === "suppression" ? (
        <p role="alert" className="mt-4 rounded-lg border border-alert/40 bg-alert/5 p-4 text-sm text-alert">
          Le compte n’a pas pu être supprimé. Réessayez, ou écrivez-nous si le problème continue.
        </p>
      ) : null}

      <section aria-labelledby="profil" className="mt-8 rounded-xl border border-mint-line bg-white p-6">
        <h2 id="profil" className="font-display text-xl font-extrabold">Profil</h2>
        <p className="mt-1 mb-5 text-sm text-ink-soft">Connecté avec {user.email}</p>
        <ProfileForm profile={profile} />
      </section>

      <section aria-labelledby="abonnement" className="mt-6 rounded-xl border border-mint-line bg-white p-6">
        <h2 id="abonnement" className="font-display text-xl font-extrabold">Abonnement</h2>
        {params.abonnement === "existant" ? (
          <p role="status" className="mt-3 text-sm text-ink-soft">
            Vous avez déjà un abonnement. Changez d’offre depuis le bouton ci-dessous.
          </p>
        ) : null}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          <dt className="text-ink-soft">Offre</dt>
          <dd className="font-bold">
            {premium ? (subscription?.plan === "annual" ? "Premium annuel" : "Premium mensuel") : "Gratuite"}
          </dd>
          <dt className="text-ink-soft">Statut</dt>
          <dd>{STATUS[subscription?.status ?? "none"] ?? subscription?.status}</dd>
          {subscription?.current_period_end && premium ? (
            <>
              <dt className="text-ink-soft">{subscription.cancel_at_period_end ? "Prend fin le" : "Prochaine échéance"}</dt>
              <dd>{date(subscription.current_period_end)}</dd>
            </>
          ) : null}
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          {hasCustomer ? (
            <form action="/api/stripe/portal" method="post">
              <button type="submit" className="btn btn-secondary">Gérer l’abonnement et les factures</button>
            </form>
          ) : null}
          {!premium ? (
            <Link href="/tarifs" className="btn btn-primary">Passer en premium</Link>
          ) : null}
        </div>
        <p className="mt-4 text-xs text-ink-soft">{site.vatMention}.</p>
      </section>

      <section aria-labelledby="donnees" className="mt-6 rounded-xl border border-mint-line bg-white p-6">
        <h2 id="donnees" className="font-display text-xl font-extrabold">Mes données</h2>
        <p className="mt-2 text-ink-soft">
          Téléchargez une copie de vos données ou supprimez votre compte. Détails dans la{" "}
          <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
        </p>
        <div className="mt-5 flex flex-wrap items-start gap-3">
          <a href="/api/compte/export" className="btn btn-secondary" download>
            Télécharger mes données
          </a>
          <DeleteAccount />
        </div>
      </section>
    </div>
  );
}
