"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { type CartLine, SHIP_FREE_OVER, totals, useCart } from "@/lib/cart";
import styles from "./sample.module.css";

/* Minimal product shape the cart needs (Storefront's Item satisfies it). */
export type ShopItem = {
  id: string; name: string; price: number; code?: number; category: string;
  images: { src: string; blur?: string }[];
};

type Config = { brand: string; phone: string; wa: (msg: string) => string; upiVpa: string | null; upiName: string | null };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const RZP_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

const S = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconClose = () => <svg {...S}><path d="M6 6l12 12M18 6L6 18" /></svg>;
const IconBack = () => <svg {...S}><path d="M15 5l-7 7 7 7" /></svg>;
const IconBag = () => <svg {...S}><path d="M6 7h12l1 14H5z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>;
const IconCheck = () => <svg {...S} strokeWidth="2"><path d="M4 12.5l5 5 11-11" /></svg>;
const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.06 24l1.68-6.16A11.9 11.9 0 0 1 .16 11.9C.16 5.33 5.5 0 12.06 0a11.8 11.8 0 0 1 8.4 3.49 11.8 11.8 0 0 1 3.48 8.42c0 6.57-5.34 11.9-11.9 11.9a11.9 11.9 0 0 1-5.7-1.45L.06 24zM6.6 20.13c1.67.99 3.27 1.58 5.44 1.58 5.45 0 9.9-4.43 9.9-9.88a9.86 9.86 0 0 0-9.88-9.9C6.6 1.93 2.16 6.36 2.16 11.8c0 2.28.67 3.99 1.79 5.79l-1 3.63 3.65-.99z" /></svg>
);

type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string; description?: string;
  prefill?: { name?: string; contact?: string }; theme?: { color?: string };
  handler: (r: RzpResponse) => void; modal?: { ondismiss?: () => void };
};
type RzpInstance = { open: () => void; on: (e: string, cb: (x: unknown) => void) => void };
declare global {
  interface Window { Razorpay?: new (o: RzpOptions) => RzpInstance }
}
function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type Method = "online" | "upi" | "cod";
const digits = (s: string) => s.replace(/\D/g, "");

export default function Cart({ items, config }: { items: ShopItem[]; config: Config }) {
  const { open, lines, closeCart, setQty, remove, clear } = useCart();
  const { upiVpa, upiName } = config;
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const priceOf = (id: string) => byId.get(id)?.price;
  const { subtotal, shipping, total } = totals(lines, priceOf);

  const methods: Method[] = [
    ...(RZP_KEY ? (["online"] as Method[]) : []),
    ...(upiVpa ? (["upi"] as Method[]) : []),
    "cod",
  ];
  const [step, setStep] = useState<"bag" | "checkout" | "done">("bag");
  const [method, setMethod] = useState<Method>(methods[0]);
  const [form, setForm] = useState({ name: "", phone: "", pincode: "", address: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ title: string; note: string } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close and reset the flow, so the next open starts fresh at the bag.
  function handleClose() { setStep("bag"); setError(null); setBusy(false); setMethod(methods[0]); closeCart(); }
  const closeFnRef = useRef(handleClose);
  useEffect(() => { closeFnRef.current = handleClose; });

  // Esc + background scroll lock while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeFnRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeRef.current?.focus(), 50);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; clearTimeout(t); };
  }, [open]);

  if (!open) return null;

  const resolved = lines
    .map((l) => ({ line: l, item: byId.get(l.id) }))
    .filter((x): x is { line: CartLine; item: ShopItem } => Boolean(x.item));

  const freeLeft = SHIP_FREE_OVER - subtotal;

  function orderText(pay: string, paidNote?: string) {
    const rows = resolved.map(({ line, item }) =>
      `• ${item.name}${item.code ? ` (#${item.code})` : ""} — size ${line.size} × ${line.qty} = ${inr(item.price * line.qty)}`);
    return [
      `New order — ${config.brand}`,
      "",
      ...rows,
      "",
      `Subtotal: ${inr(subtotal)}`,
      `Shipping: ${shipping === 0 ? "Free" : inr(shipping)}`,
      `Total: ${inr(total)}`,
      "",
      `Payment: ${pay}`,
      ...(paidNote ? [paidNote] : []),
      "",
      "Deliver to:",
      form.name,
      `Phone: ${form.phone}`,
      `${form.address}`,
      `PIN: ${form.pincode}`,
    ].join("\n");
  }

  const sendWhatsApp = (pay: string, paidNote?: string) => {
    window.open(config.wa(orderText(pay, paidNote)), "_blank", "noopener,noreferrer");
  };

  // Save the order to the database (best-effort — the WhatsApp message always
  // carries the order, so a save failure never loses it). No-op until the
  // Supabase service role key is configured on the server.
  const persistOrder = (m: Method, extra: { paymentId?: string; paymentStatus?: string } = {}) =>
    fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, customer: form, method: m, ...extra }),
    }).catch(() => null);

  function validate(): string | null {
    if (!form.name.trim()) return "Please enter your name.";
    if (digits(form.phone).length < 10) return "Please enter a valid 10-digit phone number.";
    if (digits(form.pincode).length !== 6) return "Please enter a valid 6-digit PIN code.";
    if (form.address.trim().length < 10) return "Please enter your full delivery address.";
    return null;
  }

  async function placeOrder() {
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);

    if (method === "cod") {
      await persistOrder("cod");
      sendWhatsApp("Cash on delivery");
      finish("Order placed", "We’ve opened WhatsApp with your order. Send it to confirm, and we’ll be in touch about delivery.");
      return;
    }
    if (method === "upi") {
      await persistOrder("upi");
      const note = `Order for ${config.brand}`;
      const link = `upi://pay?pa=${encodeURIComponent(upiVpa!)}&pn=${encodeURIComponent(upiName || config.brand)}&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`;
      window.location.assign(link); // opens the customer's UPI app
      setTimeout(() => sendWhatsApp("UPI", "I’m paying now by UPI and will send the payment screenshot."), 600);
      finish("Finish paying in your UPI app", "Approve the payment, then send us the screenshot on WhatsApp so we can confirm and dispatch.");
      return;
    }
    // Online (Razorpay)
    setBusy(true);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      if (!res.ok) throw new Error(res.status === 503 ? "Online payments aren’t set up yet." : "Could not start the payment.");
      const { orderId, amount, keyId } = (await res.json()) as { orderId: string; amount: number; keyId: string };
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error("Could not reach the payment gateway. Check your connection.");

      const rzp = new window.Razorpay({
        key: keyId, order_id: orderId, amount: amount * 100, currency: "INR",
        name: config.brand, description: `${resolved.length} item${resolved.length === 1 ? "" : "s"}`,
        prefill: { name: form.name, contact: digits(form.phone) },
        theme: { color: "#141414" },
        handler: async (r) => {
          try {
            const vr = await fetch("/api/razorpay/verify", {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r),
            });
            const { ok: verified } = (await vr.json()) as { ok: boolean };
            if (!verified) { setBusy(false); setError("We couldn’t verify that payment. If you were charged, message us on WhatsApp."); return; }
            await persistOrder("online", { paymentId: r.razorpay_payment_id, paymentStatus: "paid" });
            sendWhatsApp("Paid online", `Payment ID: ${r.razorpay_payment_id}`);
            finish("Payment received", "Thank you — your order is confirmed. We’ve shared the details with the store and will dispatch shortly.");
          } catch {
            setBusy(false);
            setError("Payment went through but confirmation failed. Please message us on WhatsApp with your payment ID.");
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try Cash on Delivery.");
    }
  }

  function finish(title: string, note: string) {
    clear();
    setBusy(false);
    setDone({ title, note });
    setStep("done");
  }

  const methodLabel: Record<Method, { title: string; sub: string }> = {
    online: { title: "Pay online", sub: "UPI, credit / debit card, netbanking" },
    upi: { title: "Pay by UPI", sub: `To ${upiVpa ?? ""} — approve in your UPI app` },
    cod: { title: "Cash on delivery", sub: "Pay when your order arrives" },
  };

  return (
    <div className={styles.cartOverlay} role="dialog" aria-modal="true" aria-label="Your bag"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <aside className={styles.cartPanel}>
        <header className={styles.cartHead}>
          {step === "checkout" && (
            <button className={styles.cartIcon} onClick={() => setStep("bag")} aria-label="Back to bag"><IconBack /></button>
          )}
          <span className={styles.cartTitle}>{step === "checkout" ? "Checkout" : step === "done" ? "Thank you" : "Your bag"}</span>
          <button ref={closeRef} className={styles.cartIcon} onClick={handleClose} aria-label="Close bag"><IconClose /></button>
        </header>

        {step === "done" && done ? (
          <div className={styles.cartDone}>
            <span className={styles.doneMark}><IconCheck /></span>
            <h3>{done.title}</h3>
            <p>{done.note}</p>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleClose}>Continue shopping</button>
          </div>
        ) : resolved.length === 0 ? (
          <div className={styles.cartEmpty}>
            <IconBag />
            <p>Your bag is empty.</p>
            <button className={`${styles.btn} ${styles.btnLine}`} onClick={handleClose}>Browse the drop</button>
          </div>
        ) : step === "bag" ? (
          <>
            <div className={styles.cartBody}>
              {subtotal < SHIP_FREE_OVER && (
                <p className={styles.cartFreeNote}>Add {inr(freeLeft)} more for free shipping.</p>
              )}
              {resolved.map(({ line, item }) => (
                <div className={styles.cartLine} key={`${line.id}-${line.size}`}>
                  <div className={styles.cartThumb}>
                    {item.images[0]
                      ? <Image src={item.images[0].src} alt={item.name} fill sizes="72px" placeholder={item.images[0].blur ? "blur" : "empty"} blurDataURL={item.images[0].blur} className={styles.photo} />
                      : null}
                  </div>
                  <div className={styles.cartLineInfo}>
                    <p className={styles.cartLineName}>{item.name}</p>
                    <p className={styles.cartLineMeta}>Size {line.size}</p>
                    <div className={styles.cartQty}>
                      <button className={styles.qtyBtn} onClick={() => setQty(line.id, line.size, line.qty - 1)} aria-label="Decrease quantity">–</button>
                      <span aria-live="polite">{line.qty}</span>
                      <button className={styles.qtyBtn} onClick={() => setQty(line.id, line.size, line.qty + 1)} aria-label="Increase quantity">+</button>
                      <button className={styles.cartRemove} onClick={() => remove(line.id, line.size)}>Remove</button>
                    </div>
                  </div>
                  <span className={styles.cartLinePrice}>{inr(item.price * line.qty)}</span>
                </div>
              ))}
            </div>
            <footer className={styles.cartFoot}>
              <div className={styles.cartRow}><span>Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className={styles.cartRow}><span>Shipping</span><span>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
              <div className={`${styles.cartRow} ${styles.cartTotal}`}><span>Total</span><span>{inr(total)}</span></div>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setStep("checkout")}>Checkout</button>
            </footer>
          </>
        ) : (
          <>
            <div className={styles.cartBody}>
              <span className={styles.label}>Delivery details</span>
              <div className={styles.field}>
                <label htmlFor="co-name">Full name</label>
                <input id="co-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="co-phone">Phone</label>
                  <input id="co-phone" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-pin">PIN code</label>
                  <input id="co-pin" inputMode="numeric" autoComplete="postal-code" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="co-addr">Address</label>
                <textarea id="co-addr" rows={3} autoComplete="street-address" placeholder="House / flat, street, area, city, state"
                  value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <span className={styles.label} style={{ marginTop: ".4rem" }}>Payment</span>
              <div className={styles.payOptions} role="radiogroup" aria-label="Payment method">
                {methods.map((m) => (
                  <button key={m} role="radio" aria-checked={method === m}
                    className={`${styles.payOpt} ${method === m ? styles.payOptOn : ""}`} onClick={() => setMethod(m)}>
                    <span className={styles.payRadio} />
                    <span>
                      <b>{methodLabel[m].title}</b>
                      <small>{methodLabel[m].sub}</small>
                    </span>
                  </button>
                ))}
              </div>
              {error && <p className={styles.cartError}>{error}</p>}
            </div>
            <footer className={styles.cartFoot}>
              <div className={`${styles.cartRow} ${styles.cartTotal}`}><span>Total</span><span>{inr(total)}</span></div>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={placeOrder} disabled={busy}>
                {busy ? "Please wait…" : method === "cod" ? "Place order" : method === "upi" ? "Pay by UPI" : "Pay now"}
              </button>
              <p className={styles.cartFinePrint}>
                {method === "online"
                  ? "Secure payment via Razorpay. Card details are entered on the gateway, never on this site."
                  : method === "upi"
                    ? "You’ll approve the payment in your own UPI app, then send us the screenshot."
                    : "Pay in cash when your order is delivered."}
              </p>
              <a className={styles.cartWaLink} href={config.wa("Hello Impact Store, I have a question about my order.")} target="_blank" rel="noopener noreferrer">
                <IconWhatsApp /> Questions? Chat with us
              </a>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
