// Réglages globaux du site. Le nom est provisoire.
export const site = {
  name: "PharmaIDE",
  tagline: "La pharmacologie IFSI, de la fiche au calcul de dose",
  contactEmail: "contact@example.fr",
  prices: {
    monthly: { label: "2,99 €", period: "par mois" },
    // Proposition à valider : 10 mois d'année universitaire, remise d'un tiers environ
    annual: { label: "19,90 €", period: "par an" },
  },
  trialDays: 7,
  // Micro-entreprise en franchise en base de TVA
  vatMention: "TVA non applicable, art. 293 B du CGI",
} as const;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
