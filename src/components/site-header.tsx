import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-mint-line bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-medium tracking-tight text-ink">
          <Logo />
          {site.name}
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-1 sm:gap-3">
          <Link href="/modules" className="rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink">
            Modules
          </Link>
          <Link href="/tarifs" className="rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink">
            Tarifs
          </Link>
          {user ? (
            <Link href="/espace" className="btn btn-primary">
              Mon espace
            </Link>
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden rounded-full px-3 py-2 text-ink-soft transition-colors hover:text-ink sm:inline"
              >
                Se connecter
              </Link>
              <Link href="/connexion?mode=inscription" className="btn btn-primary">
                <span className="sm:hidden">S’inscrire</span>
                <span className="hidden sm:inline">Créer un compte</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
