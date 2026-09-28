import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";

// Espace de gestion Stripe : changer d'offre, moyen de paiement, factures, résiliation
export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${siteUrl}/connexion`, { status: 303 });

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sub?.stripe_customer_id) return NextResponse.redirect(`${siteUrl}/tarifs`, { status: 303 });

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl}/compte`,
    locale: "fr",
  });
  return NextResponse.redirect(portal.url, { status: 303 });
}
