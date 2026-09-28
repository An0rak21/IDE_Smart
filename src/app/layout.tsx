import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource/bricolage-grotesque/latin-600.css";
import "@fontsource/bricolage-grotesque/latin-800.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} : ${site.tagline}`, template: `%s | ${site.name}` },
  description:
    "Fiches de révision, QCM corrigés et générateur de calculs de doses pour les étudiants en soins infirmiers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html lang="fr">
      <body className="flex min-h-dvh flex-col">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-white focus:p-2">
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {plausible ? (
          <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
