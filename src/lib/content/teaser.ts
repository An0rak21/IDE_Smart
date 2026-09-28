// Extrait les 2 premiers paragraphes d'une leçon (pas les titres, tableaux, listes ni
// composants MDX), pour l'aperçu montré à un compte non premium sur une leçon payante.
// Le corps complet n'est jamais compilé ni envoyé au navigateur dans ce cas.
export function extractTeaserParagraphs(body: string, count = 2): string {
  const blocks = body.split(/\n{2,}/);
  const paragraphs = blocks.filter((block) => {
    const t = block.trim();
    if (!t) return false;
    if (/^#{1,6}\s/.test(t)) return false;
    if (t.startsWith("|")) return false;
    if (t.startsWith("<")) return false;
    if (/^[-*]\s/.test(t) || /^\d+\.\s/.test(t)) return false;
    return true;
  });
  return paragraphs.slice(0, count).join("\n\n");
}
