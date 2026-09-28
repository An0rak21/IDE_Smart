import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client à privilèges élevés (contourne la RLS). Uniquement côté serveur :
// webhook Stripe, correction des QCM, suppression de compte, page admin.
export function createAdminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
