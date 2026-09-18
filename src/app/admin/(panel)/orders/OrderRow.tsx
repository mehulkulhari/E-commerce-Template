"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOrderStatus, type OrderStatus } from "../../actions";
import styles from "../../admin.module.css";

type Item = { name: string; size?: string; qty: number; price: number; code?: number | null };
export type AdminOrder = {
  id: string; order_no: number; created_at: string;
  customer_name: string; customer_phone: string; address: string; pincode: string;
  items: Item[]; subtotal: number; shipping: number; discount: number; total: number;
  payment_method: string; payment_status: string; status: OrderStatus;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const STATUSES: OrderStatus[] = ["new", "packed", "shipped", "delivered", "cancelled"];

export default function OrderRow({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const items = Array.isArray(order.items) ? order.items : [];
  const date = new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const change = (s: OrderStatus) => {
    setStatus(s);
    start(async () => { await setOrderStatus(order.id, s); router.refresh(); });
  };

  const badge =
    status === "new" ? styles.badgeAccent :
    status === "delivered" ? styles.badgeGood :
    status === "cancelled" ? styles.badgeBad : styles.badgeWarn;

  return (
    <>
      <tr style={{ opacity: pending ? 0.55 : 1, cursor: "pointer" }} onClick={() => setOpen((v) => !v)}>
        <td className={styles.cellName}>#{order.order_no}<div className={styles.cellMeta}>{date}</div></td>
        <td>{order.customer_name}<div className={styles.cellMeta}>{order.customer_phone}</div></td>
        <td className={styles.cellMeta}>{items.reduce((s, i) => s + i.qty, 0)} item{items.length === 1 ? "" : "s"}</td>
        <td>{inr(order.total)}</td>
        <td className={styles.cellMeta}>{order.payment_method.toUpperCase()}<div><span className={`${styles.badge} ${order.payment_status === "paid" ? styles.badgeGood : styles.badgeMuted}`}>{order.payment_status}</span></div></td>
        <td onClick={(e) => e.stopPropagation()}>
          <select className={`${styles.select} ${badge}`} value={status} disabled={pending} onChange={(e) => change(e.target.value as OrderStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} style={{ background: "#fafbfc" }}>
            <div style={{ display: "grid", gap: ".6rem", padding: ".3rem 0" }}>
              <div>
                <strong>Deliver to:</strong> {order.customer_name}, {order.customer_phone}<br />
                {order.address}{order.pincode ? ` — ${order.pincode}` : ""}
              </div>
              <div>
                {items.map((i, k) => (
                  <div key={k} className={styles.cellMeta}>
                    {i.name}{i.code ? ` (#${i.code})` : ""}{i.size ? ` · ${i.size}` : ""} × {i.qty} = {inr(i.price * i.qty)}
                  </div>
                ))}
              </div>
              <div className={styles.cellMeta}>
                Subtotal {inr(order.subtotal)} · Shipping {order.shipping === 0 ? "Free" : inr(order.shipping)}
                {order.discount ? ` · Discount −${inr(order.discount)}` : ""} · <strong>Total {inr(order.total)}</strong>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
