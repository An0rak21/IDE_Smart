import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24">
      <h1 className="font-display text-3xl font-normal tracking-tight text-ink">Cette page n’existe pas</h1>
      <p className="mt-3 text-ink-soft">Le lien est peut-être incomplet ou la page a été déplacée.</p>
      <Link href="/" className="btn btn-primary mt-6">Revenir à l’accueil</Link>
    </div>
  );
}
