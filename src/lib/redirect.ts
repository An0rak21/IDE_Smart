// N'accepte que les chemins internes, pour éviter les redirections ouvertes
export function safeNext(value: string | null | undefined, fallback = "/espace") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
