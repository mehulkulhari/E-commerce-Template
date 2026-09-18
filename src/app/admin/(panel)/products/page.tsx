import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import styles from "../../admin.module.css";
import ProductRow, { type AdminProduct } from "./ProductRow";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb
    .from("products")
    .select("id,name,price,mrp,category,in_stock,stock,low_stock_threshold,featured,images,sort")
    .order("sort", { ascending: true });
  const products = (data ?? []) as AdminProduct[];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Products</h1>
          <p className={styles.sub}>{products.length} in your catalogue.</p>
        </div>
        <Link href="/admin/products/new" className={`${styles.btn} ${styles.btnPrimary}`}>Add product</Link>
      </div>

      <div className={styles.tableWrap}>
        {products.length === 0 ? (
          <p className={styles.empty}>No products yet. Add your first one to get started.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr><th /><th>Product</th><th>Price</th><th>Stock</th><th>In stock</th><th>Featured</th><th /></tr>
            </thead>
            <tbody>
              {products.map((p) => <ProductRow key={p.id} product={p} />)}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
