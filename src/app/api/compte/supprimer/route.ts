import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  if (form.get("confirm") !== "oui") return NextResponse.redirect(`${siteUrl}/compte`, { status: 303 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${siteUrl}/connexion`, { status: 303 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  // Résilier l'abonnement Stripe avant d'effacer le compte
  if (sub?.stripe_subscription_id && !["canceled", "incomplete_expired"].includes(sub.status)) {
    try {
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } catch (err) {
      console.error("Résiliation Stripe impossible :", err);
      return NextResponse.redirect(`${siteUrl}/compte?erreur=suppression`, { status: 303 });
    }
  }

  // Les tables liées sont effacées en cascade. Le client Stripe est conservé
  // pour les obligations comptables (factures).
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.redirect(`${siteUrl}/compte?erreur=suppression`, { status: 303 });

  await supabase.auth.signOut();
  return NextResponse.redirect(`${siteUrl}/?compte=supprime`, { status: 303 });
}
