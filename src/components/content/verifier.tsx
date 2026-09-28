import Link from "next/link";
import { getAccount } from "@/lib/account";
import { createAdminClient } from "@/lib/supabase/admin";
import { toPublicQuestion } from "@/lib/qcm/public-question";
import { VerifierClient } from "./verifier-client";

export async function Verifier({ refs }: { refs: string[] }) {
  const account = await getAccount();
  if (!account) {
    return (
      <div className="my-8 rounded-xl border border-mint-line bg-mint/60 p-5">
        <p className="font-display text-lg font-medium text-ink">Vérifiez vos connaissances</p>
        <p className="mt-2 text-ink-soft">
          <Link href="/connexion" className="font-bold text-teal underline">
            Créez un compte gratuit
          </Link>{" "}
          pour répondre aux questions de vérification de cette leçon.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: questions } = await admin
    .from("questions")
    .select("id, ref, type, prompt, context, level, is_free, lesson_slug, is_published")
    .in("ref", refs)
    .eq("is_published", true);

  const visible = (questions ?? []).filter((q) => account.premium || q.is_free);
  if (visible.length === 0) return null;

  const { data: options } = await admin
    .from("question_options")
    .select("id, question_id, label, position")
    .in(
      "question_id",
      visible.map((q) => q.id),
    );

  const publicQuestions = visible
    .sort((a, b) => refs.indexOf(a.ref) - refs.indexOf(b.ref))
    .map((q) => toPublicQuestion(q, options ?? []));

  return <VerifierClient questions={publicQuestions} />;
}
