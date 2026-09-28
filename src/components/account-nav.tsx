import Link from "next/link";

export function AccountNav({ current, isAdmin }: { current: "espace" | "compte" | "admin"; isAdmin?: boolean }) {
  const link = (href: string, key: typeof current, label: string) => (
    <Link
      href={href}
      aria-current={current === key ? "page" : undefined}
      className={`rounded-lg px-3 py-2 ${current === key ? "bg-mint font-bold text-teal" : "text-ink-soft hover:text-ink"}`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Mon compte" className="flex flex-wrap items-center gap-1">
      {link("/espace", "espace", "Mon espace")}
      {link("/compte", "compte", "Compte et abonnement")}
      {isAdmin ? link("/admin", "admin", "Administration") : null}
      <form action="/deconnexion" method="post" className="ml-auto">
        <button type="submit" className="rounded-lg px-3 py-2 text-ink-soft hover:text-ink">
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
