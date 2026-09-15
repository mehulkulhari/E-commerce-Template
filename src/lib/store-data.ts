import { catalog as staticCatalog, type Catalog, type CatalogProduct } from "@/lib/catalog";
import { supabaseAnon } from "@/lib/supabase";

/* Server-side loaders for the storefront. When Supabase isn't configured yet
   (or a query fails), they fall back to the built-in catalogue and defaults,
   so the site never breaks. Called from server components with ISR. */

export type StoreSettings = {
  brand: string;
  whatsappPhone: string;
  upiVpa: string | null;
  upiName: string | null;
  instagram: string;
  announcements: string[];
  freeShipOver: number;
  shipFee: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  brand: "Impact Store",
  whatsappPhone: "910000000000",
  upiVpa: null,
  upiName: null,
  instagram: "https://www.instagram.com/impact.store/",
  announcements: [
    "Free shipping across India above ₹1,999",
    "New drops every week",
    "Easy 7-day returns",
    "100% authentic",
  ],
  freeShipOver: 1999,
  shipFee: 99,
};

type ProductRow = {
  id: string; code: number | null; slug: string; name: string; price: number; mrp: number | null;
  category: string | null; sizes: string[] | null; tag: string | null; colour: string | null;
  description: string | null; in_stock: boolean; featured: boolean;
  images: { src: string; width: number; height: number; blur?: string }[] | null;
};

export async function getCatalog(): Promise<Catalog> {
  const sb = supabaseAnon();
  if (!sb) return staticCatalog;
  const { data, error } = await sb
    .from("products")
    .select("id,code,slug,name,price,mrp,category,sizes,tag,colour,description,in_stock,featured,images")
    .order("sort", { ascending: true });
  if (error || !data) return staticCatalog;
  const rows = data as ProductRow[];
  const products: CatalogProduct[] = rows.map((r) => ({
    id: r.id,
    code: r.code ?? undefined,
    slug: r.slug,
    name: r.name,
    price: r.price,
    mrp: r.mrp ?? undefined,
    category: r.category ?? undefined,
    colour: r.colour ?? undefined,
    description: r.description ?? undefined,
    sizes: r.sizes ?? [],
    tag: r.tag ?? undefined,
    inStock: r.in_stock,
    featured: r.featured,
    images: Array.isArray(r.images) ? r.images : [],
  }));
  return { version: 1, generatedAt: null, products, site: { hero: null, story: null, looks: [] } };
}

export async function getSettings(): Promise<StoreSettings> {
  const sb = supabaseAnon();
  if (!sb) return DEFAULT_SETTINGS;
  const { data, error } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return {
    brand: data.brand || DEFAULT_SETTINGS.brand,
    whatsappPhone: data.whatsapp_phone || DEFAULT_SETTINGS.whatsappPhone,
    upiVpa: data.upi_vpa || null,
    upiName: data.upi_name || null,
    instagram: data.instagram || DEFAULT_SETTINGS.instagram,
    announcements: Array.isArray(data.announcements) && data.announcements.length ? data.announcements : DEFAULT_SETTINGS.announcements,
    freeShipOver: data.free_ship_over ?? DEFAULT_SETTINGS.freeShipOver,
    shipFee: data.ship_fee ?? DEFAULT_SETTINGS.shipFee,
  };
}
