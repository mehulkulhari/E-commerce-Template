import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { nowMs } from "@/lib/request-time";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

type OrderRow = { id: string; order_no: number; created_at: string; customer_name: string; total: number; status: string; payment_method: string; payment_status: string };
type ProdRow = { id: string; name: string; in_stock: boolean; stock: number | null; low_stock_threshold: number };

export default async function Dashboard() {
  const { sb } = await requireAdmin();

  const [{ data: products }, { data: orders }] = await Promise.all([
    sb.from("products").select("id,name,in_stock,stock,low_stock_threshold"),
    sb.from("orders").select("id,order_no,created_at,customer_name,total,status,payment_method,payment_status").order("created_at", { ascending: false }),
  ]);

  const prods = (products ?? []) as ProdRow[];
  const ords = (orders ?? []) as OrderRow[];

  const outOfStock = prods.filter((p) => !p.in_stock).length;
  const lowStock = prods.filter((p) => p.in_stock && p.stock !== null && p.stock <= p.low_stock_threshold);

  const live = ords.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + (o.total || 0), 0);
  const now = nowMs();
  const last30 = live.filter((o) => now - new Date(o.created_at).getTime() < 30 * 864e5);
  const revenue30 = last30.reduce((s, o) => s + (o.total || 0), 0);
  const newOrders = ords.filter((o) => o.status === "new").length;
  const recent = ords.slice(0, 8);

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Dashboard</h1>
          <p className={styles.sub}>An overview of your store.</p>
        </div>
        <Link href="/admin/products/new" className={`${styles.btn} ${styles.btnPrimary}`}>Add product</Link>
      </div>

      <div className={`${styles.grid} ${styles.stats}`}>
        <div className={`${styles.card} ${styles.stat}`}>
          <div className={styles.statLabel}>Total sales</div>
          <div className={styles.statValue}>{inr(revenue)}</div>
          <div className={styles.statNote}>{inr(revenue30)} in the last 30 days</div>
        </div>
        <div className={`${styles.card} ${styles.stat}`}>
          <div className={styles.statLabel}>Orders</div>
          <div className={styles.statValue}>{ords.length}</div>
          <div className={styles.statNote}>{newOrders} awaiting action</div>
        </div>
        <div className={`${styles.card} ${styles.stat}`}>
          <div className={styles.statLabel}>Products</div>
          <div className={styles.statValue}>{prods.length}</div>
          <div className={styles.statNote}>{outOfStock} out of stock</div>
        </div>
        <div className={`${styles.card} ${styles.stat}`}>
          <div className={styles.statLabel}>Low stock</div>
          <div className={styles.statValue}>{lowStock.length}</div>
          <div className={styles.statNote}>at or below threshold</div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Low-stock alerts</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Product</th><th>Stock left</th><th /></tr></thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.cellName}>{p.name}</td>
                    <td><span className={`${styles.badge} ${p.stock === 0 ? styles.badgeBad : styles.badgeWarn}`}>{p.stock} left</span></td>
                    <td style={{ textAlign: "right" }}><Link href={`/admin/products/${p.id}`} className={`${styles.btn} ${styles.btnSm}`}>Update</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className={styles.sectionTitle}>Recent orders</h2>
      <div className={styles.tableWrap}>
        {recent.length === 0 ? (
          <p className={styles.empty}>No orders yet. They’ll appear here as customers check out.</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td className={styles.cellName}>#{o.order_no}</td>
                  <td>{o.customer_name}</td>
                  <td>{inr(o.total)}</td>
                  <td className={styles.cellMeta}>{o.payment_method.toUpperCase()} · {o.payment_status}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {recent.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <Link href="/admin/orders" className={styles.btn}>View all orders</Link>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "new" ? styles.badgeAccent :
    status === "delivered" ? styles.badgeGood :
    status === "cancelled" ? styles.badgeBad :
    styles.badgeWarn;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}
