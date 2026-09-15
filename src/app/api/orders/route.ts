import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { parseLines, totals } from "@/lib/cart-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  lines?: unknown;
  customer?: { name?: string; phone?: string; pincode?: string; address?: string };
  method?: string;
  paymentId?: string;
  paymentStatus?: string;
};
type ProductRow = { id: string; name: string; code: number | null; price: number };

/** Saves a customer order. Prices are recomputed from the database here — the
    amount and item details are never trusted from the client. */
export async function POST(req: Request) {
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const lines = parseLines(JSON.stringify(body.lines ?? []));
  const c = body.customer ?? {};
  const name = String(c.name ?? "").trim();
  const phone = String(c.phone ?? "").replace(/\D/g, "");
  const address = String(c.address ?? "").trim();
  const pincode = String(c.pincode ?? "").replace(/\D/g, "");
  const method = ["cod", "upi", "online"].includes(String(body.method)) ? String(body.method) : "cod";

  if (lines.length === 0) return NextResponse.json({ ok: false, error: "empty_cart" }, { status: 400 });
  if (!name || phone.length < 10 || address.length < 6) {
    return NextResponse.json({ ok: false, error: "invalid_details" }, { status: 400 });
  }

  const ids = [...new Set(lines.map((l) => l.id))];
  const { data, error } = await sb.from("products").select("id,name,code,price").in("id", ids);
  if (error || !data) return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });
  const map = new Map((data as ProductRow[]).map((p) => [p.id, p]));

  const items = lines
    .filter((l) => map.has(l.id))
    .map((l) => { const p = map.get(l.id)!; return { product_id: l.id, name: p.name, code: p.code, size: l.size, qty: l.qty, price: p.price }; });
  if (items.length === 0) return NextResponse.json({ ok: false, error: "empty_cart" }, { status: 400 });

  const { subtotal, shipping, total } = totals(lines, (id) => map.get(id)?.price);
  const payment_status = body.paymentStatus === "paid" ? "paid" : method === "cod" ? "cod" : "pending";

  const { data: order, error: insErr } = await sb
    .from("orders")
    .insert({
      customer_name: name, customer_phone: phone, address, pincode: pincode || null,
      items, subtotal, shipping, discount: 0, total,
      payment_method: method, payment_status, payment_id: body.paymentId ?? null, status: "new",
    })
    .select("order_no")
    .single();
  if (insErr || !order) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, orderNo: order.order_no });
}
