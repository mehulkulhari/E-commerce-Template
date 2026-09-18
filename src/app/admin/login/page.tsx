import { hasSupabase } from "@/lib/supabase";
import styles from "../admin.module.css";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const configured = hasSupabase();
  return (
    <div className={styles.login}>
      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>Impact Store</div>
        <p className={styles.loginSub}>Owner sign in</p>
        {configured ? (
          <LoginForm next={next ?? "/admin"} />
        ) : (
          <p className={styles.notice + " " + styles.noticeErr}>
            The store database isn’t connected yet, so sign-in is unavailable.
          </p>
        )}
      </div>
    </div>
  );
}
