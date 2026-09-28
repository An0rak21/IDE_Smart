// Instant UTC correspondant à minuit heure de Paris, pour une date donnée.
// Fonctionne été comme hiver : le changement d'heure en France a toujours lieu
// à 2 h ou 3 h du matin, jamais à minuit, donc minuit n'est ni ambigu ni absent.
export function parisMidnightUTC(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;

  // Estimation en UTC de cette même date, puis correction par le décalage réel de Paris ce jour-là.
  const guess = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00Z`);
  const offsetMinutes = parisOffsetMinutes(guess);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

function parisOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);

  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return (asUTC - date.getTime()) / 60_000;
}
