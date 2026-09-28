import type { Metadata } from "next";
import { site } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Nous écrire" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-3xl font-normal tracking-tight text-ink">Nous écrire</h1>
      <p className="mt-2 text-ink-soft">
        Une question, une suggestion, un souci technique ? Écrivez-nous, nous répondons rapidement. Vous pouvez aussi
        nous joindre directement à{" "}
        <a href={`mailto:${site.contactEmail}`} className="underline">
          {site.contactEmail}
        </a>
        .
      </p>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
