import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase-server";

export type AdminSession = { user: User; sb: SupabaseClient };

/* The admin Data Access Layer. Every admin page, action and route calls
   requireAdmin() before touching data, so the check lives next to the data and
   can't be skipped. getUser() validates the JWT against Supabase's auth server
   (not just the cookie), and is_admin() confirms the account is on the owner
   allow-list. Memoised per request with React cache to avoid repeat round-trips. */
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return null;
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) return null;
  return { user, sb };
});

/** Use in admin pages and server actions: returns the session or redirects. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdmin();
  if (!session) redirect("/admin/login");
  return session;
}
