import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabase = () => Boolean(url && anon);
export const hasServiceRole = () => Boolean(url && service);

/** Public read client (RLS limits it to public data). Safe for server or browser. */
export function supabaseAnon(): SupabaseClient | null {
  if (!url || !anon) return null;
  return createClient(url, anon, { auth: { persistSession: false } });
}

/** Elevated server client — bypasses RLS. Use ONLY in server routes/actions,
    never in code that reaches the browser, and never log the key. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
}
