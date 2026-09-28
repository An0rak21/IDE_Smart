// Pictogramme : une ampoule injectable vue de profil
export function Logo() {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true">
      <path d="M8 1h6v5l3 4v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10l3-4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M5 16h12v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="var(--color-signal)" />
      <path d="M7 7h8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
