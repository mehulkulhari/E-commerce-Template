import { requireAdmin } from "@/lib/admin-auth";
import styles from "../admin.module.css";
import Sidebar from "./Sidebar";

/* The protected shell. Every page inside this route group renders through here,
   and requireAdmin() both gates entry and hands us the owner's email. The real
   per-action authorisation still runs inside each server action. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className={styles.shell}>
      <Sidebar email={user.email ?? ""} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
