import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { planFromPriceId, stripe } from "@/lib/stripe";

// Recopie l'état d'un abonnement Stripe dans la table subscriptions
export async function syncSubscription(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  let userId = sub.metadata?.user_id;
  if (!userId) {
    const { data } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) throw new Error(`Aucun utilisateur pour le client Stripe ${customerId}`);

  const item = sub.items.data[0];
  // Selon la version de l'API Stripe, la fin de période est sur l'abonnement ou sur l'item
  const periodEnd =
    (item as Stripe.SubscriptionItem & { current_period_end?: number })?.current_period_end ??
    (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan: planFromPriceId(item?.price.id),
      status: sub.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
