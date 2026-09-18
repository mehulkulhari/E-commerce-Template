import { requireAdmin } from "@/lib/admin-auth";
import styles from "../../../admin.module.css";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Add product</h1>
          <p className={styles.sub}>Add a new item to your catalogue.</p>
        </div>
      </div>
      <ProductForm />
    </>
  );
}
