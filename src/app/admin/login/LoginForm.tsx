"use client";

import { useActionState } from "react";
import { signIn, type ActionResult } from "../actions";
import styles from "../admin.module.css";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(
    (_prev: ActionResult | undefined, fd: FormData) => signIn(_prev, fd),
    undefined,
  );

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={styles.input} />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={styles.input} />
      </div>
      {state?.error && <p className={`${styles.notice} ${styles.noticeErr}`}>{state.error}</p>}
      <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
