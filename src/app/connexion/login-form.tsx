"use client";

import { useActionState } from "react";
import { sendMagicLink, signInWithGoogle, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="rounded-xl border border-mint-line bg-mint/60 p-6" role="status">
        <p className="font-display text-lg font-extrabold">Vérifiez votre boîte mail</p>
        <p className="mt-2 text-ink-soft">
          Un lien de connexion a été envoyé à <strong className="text-ink">{state.email}</strong>. Il est valable une
          heure. Pensez à regarder dans les courriers indésirables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form action={signInWithGoogle}>
        <input type="hidden" name="suite" value={next} />
        <button type="submit" className="btn btn-secondary w-full">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          Continuer avec Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-sm text-ink-soft" aria-hidden="true">
        <span className="h-px flex-1 bg-mint-line" />
        ou par e-mail
        <span className="h-px flex-1 bg-mint-line" />
      </div>

      <form action={action} className="space-y-3" noValidate>
        <input type="hidden" name="suite" value={next} />
        <label htmlFor="email" className="block font-bold">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "email-erreur" : "email-aide"}
          className="field"
        />
        {state.status === "error" ? (
          <p id="email-erreur" className="text-sm text-alert">
            {state.message}
          </p>
        ) : (
          <p id="email-aide" className="text-sm text-ink-soft">
            Vous recevrez un lien pour vous connecter, sans mot de passe.
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Envoi du lien…" : "Recevoir mon lien de connexion"}
        </button>
      </form>
    </div>
  );
}
