import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { GENRES, type StoreSpec } from "@/lib/store-spec";

/* Prospect previews live in the private `demos` table (RLS on, no public
   policies), so the list of shops can't be enumerated with the public key.
   A preview is read one slug at a time, server-side, with the service role. */

const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,80}$/;

export async function getDemo(slug: string): Promise<StoreSpec | null> {
  if (!SLUG_RE.test(slug)) return null;
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("demos")
    .select("slug,genre,status,spec")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data || data.status === "removed") return null;
  const spec = data.spec as StoreSpec;
  if (!GENRES.includes(data.genre) || !spec || !Array.isArray(spec.products)) return null;
  // The row's slug and genre are authoritative; the spec always renders as a preview.
  return {
    ...spec,
    slug: data.slug,
    genre: data.genre,
    demo: spec.demo ?? { preparedFor: spec.handle ?? spec.brand, createdAt: new Date(0).toISOString() },
  };
}
