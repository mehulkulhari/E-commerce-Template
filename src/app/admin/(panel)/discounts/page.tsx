import { requireAdmin } from "@/lib/admin-auth";
import styles from "../../admin.module.css";
import DiscountsManager, { type AdminDiscount } from "./DiscountsManager";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const { sb } = await requireAdmin();
  const { data } = await sb
    .from("discount_codes")
    .select("id,code,kind,value,min_order,active,usage_limit,used,expires_at")
    .order("created_at", { ascending: false });
  const codes = (data ?? []) as AdminDiscount[];

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Discount codes</h1>
          <p className={styles.sub}>Create codes customers can apply at checkout.</p>
        </div>
      </div>
      <DiscountsManager codes={codes} />
    </>
  );
}
