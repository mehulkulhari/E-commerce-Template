import type { Metadata } from "next";
import "../../app/globals.css";
import styles from "./legal.module.css";

export const metadata: Metadata = {
  title: "Legal — DM to Store",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.back}>← DM to Store</a>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <a href="/legal/privacy-policy">Privacy Policy</a>
        <a href="/legal/terms">Terms of Service</a>
        <a href="/legal/refund">Refund Policy</a>
        <span>© {new Date().getFullYear()} DM to Store · Jodhpur, Rajasthan</span>
      </footer>
    </div>
  );
}
