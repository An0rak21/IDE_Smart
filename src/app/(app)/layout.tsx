import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Garde-fou côté serveur, en plus du middleware
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return <>{children}</>;
}
