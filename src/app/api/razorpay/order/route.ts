import { NextResponse } from "next/server";
import { catalog } from "@/lib/catalog";
import { parseLines, totals } from "@/lib/cart-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Authoritative prices — the amount is computed here, never taken from the client.
const priceOf = (() => {
  const map = new Map(catalog.products.map((p) => [p.id, p.price]));
  return (id: string) => map.get(id);
})();

export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const rawLines = (body as { lines?: unknown })?.lines ?? [];
  const lines = parseLines(JSON.stringify(rawLines));
  const { total } = totals(lines, priceOf);
  if (lines.length === 0 || total <= 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  let res: Response;
  try {
    res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: total * 100, // Razorpay works in paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: { items: lines.map((l) => `${l.id} x${l.qty} [${l.size}]`).join(", ").slice(0, 480) },
      }),
    });
  } catch {
    return NextResponse.json({ error: "gateway_unreachable" }, { status: 502 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "gateway_error" }, { status: 502 });
  }
  const order = (await res.json()) as { id: string };
  return NextResponse.json({ orderId: order.id, amount: total, keyId });
}
