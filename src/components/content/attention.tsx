export function Attention({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-xl border-2 border-alert bg-alert/5 p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-alert">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor">
          <path d="M10 2 1 17h18L10 2Zm0 5.5c.5 0 .9.4.9.9v3.6a.9.9 0 1 1-1.8 0V8.4c0-.5.4-.9.9-.9Zm0 7.9a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
        </svg>
        Attention
      </p>
      <div className="mt-2 text-ink [&>p]:mt-0">{children}</div>
    </div>
  );
}
