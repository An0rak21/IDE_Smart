export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="prose-legal mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-3xl font-extrabold text-teal">{title}</h1>
      <p className="mt-2 text-sm">Dernière mise à jour : {updated}</p>
      <p className="mt-6 rounded-lg border border-signal bg-signal/15 p-4 text-sm text-ink">
        Modèle à compléter et à faire relire avant la mise en ligne. Les passages entre crochets sont à remplacer.
      </p>
      {children}
    </article>
  );
}
