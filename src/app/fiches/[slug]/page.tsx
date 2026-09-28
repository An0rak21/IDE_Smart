import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccount, isAdminEmail } from "@/lib/account";
import { getContent, findFiche } from "@/lib/content/render";
import { PrintButton } from "./print-button";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { modules } = getContent();
  const found = findFiche(modules, slug);
  return { title: found?.fiche.title ?? "Fiche" };
}

export default async function FichePage({ params }: Props) {
  const { slug } = await params;
  const account = await getAccount();
  const isAdmin = isAdminEmail(account?.user.email);

  const { modules } = getContent();
  const found = findFiche(modules, slug);
  if (!found) notFound();
  const { mod, fiche } = found;
  if ((mod.status === "brouillon" || fiche.status === "brouillon") && !isAdmin) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 print:max-w-none print:px-8">
      {mod.status === "brouillon" || fiche.status === "brouillon" ? (
        <p
          role="status"
          className="mb-6 inline-block rounded-lg border border-signal bg-signal/10 px-4 py-2 text-sm font-bold text-signal print:hidden"
        >
          Brouillon, non publié
        </p>
      ) : null}

      <p className="text-sm font-bold text-teal">{fiche.classe}</p>
      <h1 className="mt-1 font-display text-3xl font-normal tracking-tight text-ink">{fiche.title}</h1>

      <FicheSection title="Molécules">
        <ul className="space-y-1 text-ink-soft">
          {fiche.molecules.map((m) => (
            <li key={m.dci}>
              <strong className="font-medium text-ink">{m.dci}</strong>
              {m.specialites.length > 0 ? ` — ${m.specialites.join(", ")}` : ""}
            </li>
          ))}
        </ul>
      </FicheSection>

      <FicheSection title="Mécanisme">
        <p className="text-ink-soft">{fiche.mecanisme}</p>
      </FicheSection>

      <FicheList title="Indications" items={fiche.indications} />
      <FicheList title="Contre-indications" items={fiche.contre_indications} />
      <FicheList title="Effets indésirables" items={fiche.effets_indesirables} />
      <FicheList title="Surveillance" items={fiche.surveillance} />
      {fiche.interactions.length > 0 ? <FicheList title="Interactions" items={fiche.interactions} /> : null}
      <FicheList title="Éducation du patient" items={fiche.education} />

      <section className="mt-6 rounded-xl bg-mint p-5 print:border print:border-mint-line print:bg-transparent">
        <h2 className="font-display text-lg font-extrabold text-ink">À retenir</h2>
        <ul className="mt-2 space-y-1">
          {fiche.a_retenir.map((a, i) => (
            <li key={i} className="text-ink">
              • {a}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 print:hidden">
        <PrintButton premium={account?.premium ?? false} />
      </div>
    </div>
  );
}

function FicheSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function FicheList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </section>
  );
}
