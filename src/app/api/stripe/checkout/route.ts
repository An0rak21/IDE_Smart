import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceIdFor, stripe, type Plan } from "@/lib/stripe";
import { site, siteUrl } from "@/lib/site";

// Formulaire « S'abonner » → session Stripe Checkout
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const plan: Plan = form.get("plan") === "annual" ? "annual" : "monthly";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${siteUrl}/connexion?mode=inscription&suite=/tarifs`, { status: 303 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  // Déjà abonné : on l'envoie gérer son abonnement plutôt que d'en créer un second
  if (existing && ["active", "trialing", "past_due"].includes(existing.status)) {
    return NextResponse.redirect(`${siteUrl}/compte?abonnement=existant`, { status: 303 });
  }

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("subscriptions")
      .upsert({ user_id: user.id, stripe_customer_id: customerId, status: "none" }, { onConflict: "user_id" });
  }

  // Essai gratuit uniquement pour qui n'a jamais été abonné
  const firstTime = !existing || existing.status === "none";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceIdFor(plan), quantity: 1 }],
    locale: "fr",
    allow_promotion_codes: true,
    payment_method_collection: firstTime ? "if_required" : "always",
    subscription_data: {
      metadata: { user_id: user.id },
      ...(firstTime
        ? {
            trial_period_days: site.trialDays,
            trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
          }
        : {}),
    },
    success_url: `${siteUrl}/espace?abonnement=ok`,
    cancel_url: `${siteUrl}/tarifs`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
