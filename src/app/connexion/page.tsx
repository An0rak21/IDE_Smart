import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/redirect";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

type Props = { searchParams: Promise<{ suite?: string; mode?: string; erreur?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = safeNext(params.suite);
  const signup = params.mode === "inscription";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-3xl font-normal tracking-tight text-ink">
        {signup ? "Créer votre compte" : "Se connecter"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {signup
          ? "Gratuit, sans carte bancaire. Les fiches de révision sont accessibles dès l’inscription."
          : "Utilisez le même moyen de connexion qu’à votre inscription."}
      </p>

      {params.erreur ? (
        <p role="alert" className="mt-6 rounded-lg border border-alert/40 bg-alert/5 p-4 text-sm text-alert">
          {params.erreur === "lien"
            ? "Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau ci-dessous."
            : "La connexion n’a pas abouti. Réessayez ou utilisez votre adresse e-mail."}
        </p>
      ) : null}

      <div className="mt-8">
        <LoginForm next={next} />
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        En continuant, vous acceptez les{" "}
        <Link href="/cgu" className="underline">
          conditions d’utilisation
        </Link>{" "}
        et la{" "}
        <Link href="/confidentialite" className="underline">
          politique de confidentialité
        </Link>
        .
      </p>
    </div>
  );
}
