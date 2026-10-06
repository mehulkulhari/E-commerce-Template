"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseServer } from "@/lib/supabase-server";

/* All admin mutations live here. Every one (except signIn) calls requireAdmin()
   first, and writes go through the owner's cookie-bound client so the database's
   is_admin() Row-Level Security is the real gate. After a change we revalidate
   the storefront so edits appear within seconds instead of on the next rebuild. */

export type ActionResult = { ok: boolean; error?: string };

export type ProductImage = { src: string; width: number; height: number; blur?: string; model?: boolean };
export type ProductInput = {
  id?: string;
  name: string;
  price: number;
  mrp?: number | null;
  code?: number | null;
  category?: string | null;
  colour?: string | null;
  tag?: string | null;
  description?: string | null;
  sizes: string[];
  stock?: number | null;
  lowStockThreshold?: number;
  inStock: boolean;
  featured: boolean;
  images: ProductImage[];
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item";

const storagePrefix = () => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/product-images/`;
};

/** Only allow image URLs we control: the product-images bucket, or seeded /catalog files. */
function cleanImages(images: ProductImage[]): ProductImage[] {
  const prefix = storagePrefix();
  return (Array.isArray(images) ? images : [])
    .filter((im) => im && typeof im.src === "string" && (im.src.startsWith(prefix) || im.src.startsWith("/catalog/")))
    .slice(0, 8)
    .map((im) => ({
      src: im.src,
      width: Math.max(1, Math.round(Number(im.width) || 1000)),
      height: Math.max(1, Math.round(Number(im.height) || 1000)),
      ...(typeof im.blur === "string" && im.blur.startsWith("data:") ? { blur: im.blur } : {}),
      ...(im.model === true ? { model: true } : {}),
    }));
}

function refreshStore() {
  revalidatePath("/sample");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

// ---- Auth ---------------------------------------------------------------

export async function signIn(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "The store database isn’t configured yet." };

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Wrong email or password." };

  // Signed in — but only owners may enter. Non-admins are signed straight out.
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (!isAdmin) {
    await sb.auth.signOut();
    return { ok: false, error: "This account isn’t an admin for the store." };
  }
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut(): Promise<void> {
  const sb = await supabaseServer();
  if (sb) await sb.auth.signOut();
  redirect("/admin/login");
}

// ---- Products -----------------------------------------------------------

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  const { sb } = await requireAdmin();

  const name = input.name?.trim();
  if (!name || name.length < 2) return { ok: false, error: "Product needs a name." };
  const price = Math.round(Number(input.price));
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: "Enter a valid price." };

  const row = {
    name,
    price,
    mrp: input.mrp ? Math.round(Number(input.mrp)) : null,
    code: input.code ? Math.round(Number(input.code)) : null,
    category: input.category?.trim() || null,
    colour: input.colour?.trim() || null,
    tag: input.tag?.trim() || null,
    description: input.description?.trim() || null,
    sizes: (input.sizes ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 30),
    stock: input.stock === null || input.stock === undefined || !Number.isFinite(Number(input.stock)) ? null : Math.max(0, Math.round(Number(input.stock))),
    low_stock_threshold: Math.max(0, Math.round(Number(input.lowStockThreshold ?? 3))),
    in_stock: Boolean(input.inStock),
    featured: Boolean(input.featured),
    images: cleanImages(input.images),
  };

  if (input.id) {
    const { error } = await sb.from("products").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
  } else {
    let slug = slugify(name);
    let { error } = await sb.from("products").insert({ ...row, slug });
    if (error?.code === "23505") {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      ({ error } = await sb.from("products").insert({ ...row, slug }));
    }
    if (error) return { ok: false, error: error.message };
  }
  refreshStore();
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshStore();
  return { ok: true };
}

export async function setProductFlags(
  id: string,
  patch: { in_stock?: boolean; featured?: boolean; stock?: number | null },
): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  const { error } = await sb.from("products").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshStore();
  return { ok: true };
}

export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  // Persist the given order as the `sort` column, one row at a time.
  for (let i = 0; i < ids.length; i++) {
    const { error } = await sb.from("products").update({ sort: i }).eq("id", ids[i]);
    if (error) return { ok: false, error: error.message };
  }
  refreshStore();
  return { ok: true };
}

// ---- Orders -------------------------------------------------------------

const ORDER_STATUSES = ["new", "packed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export async function setOrderStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
  const { error } = await sb.from("orders").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/orders");
  return { ok: true };
}

// ---- Settings -----------------------------------------------------------

export type SettingsInput = {
  brand: string;
  whatsapp_phone: string;
  upi_vpa: string | null;
  upi_name: string | null;
  instagram: string | null;
  announcements: string[];
  free_ship_over: number;
  ship_fee: number;
};

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  const brand = input.brand?.trim();
  if (!brand) return { ok: false, error: "The store needs a name." };
  const phone = String(input.whatsapp_phone ?? "").replace(/\D/g, "");
  if (phone.length < 10) return { ok: false, error: "Enter a valid WhatsApp number with country code." };

  const row = {
    id: 1,
    brand,
    whatsapp_phone: phone,
    upi_vpa: input.upi_vpa?.trim() || null,
    upi_name: input.upi_name?.trim() || null,
    instagram: input.instagram?.trim() || null,
    announcements: (input.announcements ?? []).map((a) => a.trim()).filter(Boolean).slice(0, 8),
    free_ship_over: Math.max(0, Math.round(Number(input.free_ship_over) || 0)),
    ship_fee: Math.max(0, Math.round(Number(input.ship_fee) || 0)),
  };
  const { error } = await sb.from("settings").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/sample");
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ---- Discount codes -----------------------------------------------------

export type DiscountInput = {
  id?: string;
  code: string;
  kind: "percent" | "flat";
  value: number;
  min_order: number;
  active: boolean;
  usage_limit: number | null;
  expires_at: string | null;
};

export async function saveDiscount(input: DiscountInput): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  const code = input.code?.trim().toUpperCase();
  if (!code || code.length < 3) return { ok: false, error: "Code needs at least 3 characters." };
  const kind = input.kind === "flat" ? "flat" : "percent";
  const value = Math.round(Number(input.value));
  if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "Enter a discount value." };
  if (kind === "percent" && value > 90) return { ok: false, error: "Percent discount can’t exceed 90%." };

  const row = {
    code,
    kind,
    value,
    min_order: Math.max(0, Math.round(Number(input.min_order) || 0)),
    active: Boolean(input.active),
    usage_limit: input.usage_limit ? Math.max(1, Math.round(Number(input.usage_limit))) : null,
    expires_at: input.expires_at || null,
  };

  if (input.id) {
    const { error } = await sb.from("discount_codes").update(row).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb.from("discount_codes").insert(row);
    if (error?.code === "23505") return { ok: false, error: "That code already exists." };
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function toggleDiscount(id: string, active: boolean): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  const { error } = await sb.from("discount_codes").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/discounts");
  return { ok: true };
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
  const { sb } = await requireAdmin();
  const { error } = await sb.from("discount_codes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/discounts");
  return { ok: true };
}
