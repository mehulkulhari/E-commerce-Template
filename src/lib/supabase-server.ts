import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* Cookie-bound Supabase client for the admin area. It carries the signed-in
   owner's session, so Row-Level Security (the is_admin() policies) governs
   every read and write — the service-role key is never used here. Returns null
   when Supabase isn't configured, so callers can degrade gracefully. */
export async function supabaseServer(): Promise<SupabaseClient | null> {
  if (!url || !anon) return null;
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) {
            store.set(name, value, options as CookieOptions);
          }
        } catch {
          // Called from a Server Component render, where cookies are read-only.
          // The proxy (proxy.ts) refreshes the session cookie instead.
        }
      },
    },
  });
}
