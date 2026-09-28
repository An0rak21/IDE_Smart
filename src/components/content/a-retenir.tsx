export function ARetenir({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-xl bg-mint p-5">
      <p className="text-sm font-bold text-teal">À retenir</p>
      <div className="mt-2 text-ink [&>p]:mt-0">{children}</div>
    </div>
  );
}
