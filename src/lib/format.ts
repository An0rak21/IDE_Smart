// Formatage des nombres à la française : virgule décimale, espace insécable pour les milliers.
// Module client-safe : ne dépend d'aucune donnée du moteur de calcul de doses.
export function fr(value: number, maxDecimals = 2): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: maxDecimals }).format(value).replace(/ /g, " ");
}
