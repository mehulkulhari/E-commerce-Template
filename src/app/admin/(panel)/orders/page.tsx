import { requireAdmin } from "@/lib/admin-auth";
import styles from "../../admin.module.css";
import OrderRow, { type AdminOrder } from "./OrderRow";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb
    .from("orders")
    .select("id,order_no,created_at,customer_name,customer_phone,address,pincode,items,subtotal,shipping,discount,total,payment_method,payment_status,status")
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = (data ?? []) as AdminOrder[];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Orders</h1>
          <p className={styles.sub}>{orders.length} order{orders.length === 1 ? "" : "s"}.</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {orders.length === 0 ? (
          <p className={styles.empty}>No orders yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => <OrderRow key={o.id} order={o} />)}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
