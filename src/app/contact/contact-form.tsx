"use client";

import { useState } from "react";
import { site } from "@/lib/site";

export function ContactForm() {
  const [envoye, setEnvoye] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nom = String(form.get("nom") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");

    const corps = `${message}\n\n—\n${nom} (${email})`;
    const lien = `mailto:${site.contactEmail}?subject=${encodeURIComponent(
      `Message depuis ${site.name}`
    )}&body=${encodeURIComponent(corps)}`;

    window.location.href = lien;
    setEnvoye(true);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="nom" className="block font-bold">
            Nom
          </label>
          <input id="nom" name="nom" type="text" autoComplete="name" required className="field" />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block font-bold">
            Adresse e-mail
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="field" />
        </div>

        <div className="space-y-1">
          <label htmlFor="message" className="block font-bold">
            Message
          </label>
          <textarea id="message" name="message" rows={6} required className="field" />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Envoyer le message
        </button>
      </form>

      {envoye ? (
        <p role="status" className="rounded-lg border border-mint-line bg-mint/60 p-4 text-sm text-ink">
          Votre messagerie va s’ouvrir avec le message pré-rempli. Si rien ne se passe, écrivez-nous directement à{" "}
          <a href={`mailto:${site.contactEmail}`} className="underline">
            {site.contactEmail}
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
