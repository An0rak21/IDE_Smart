import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AccountNav } from "@/components/account-nav";
import { getAccount, isAdminEmail } from "@/lib/account";
import { getContent, findModule } from "@/lib/content/render";
import { QcmStartClient } from "./qcm-start-client";

export const metadata: Metadata = { title: "Lancer un QCM" };

type Props = { params: Promise<{ slug: string }> };

export default async function QcmStartPage({ params }: Props) {
  const { slug } = await params;
  const account = await getAccount();
  if (!account) redirect(`/connexion?suite=/modules/${slug}/qcm`);

  const { modules } = getContent();
  const mod = findModule(modules, slug);
  if (!mod || mod.status === "brouillon") notFound();

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <AccountNav current="modules" isAdmin={isAdminEmail(account.user.email)} />
      <h1 className="mt-8 font-display text-3xl font-normal tracking-tight text-ink">QCM — {mod.title}</h1>
      <p className="mt-3 text-ink-soft">Choisissez le mode et le nombre de questions.</p>
      <QcmStartClient moduleSlug={slug} premium={account.premium} />
    </div>
  );
}
