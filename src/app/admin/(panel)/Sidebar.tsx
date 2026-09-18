"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../actions";
import { IcoBag, IcoBox, IcoCog, IcoDash, IcoOut, IcoStore, IcoTag } from "../icons";
import styles from "../admin.module.css";

const LINKS = [
  { href: "/admin", label: "Dashboard", Icon: IcoDash, exact: true },
  { href: "/admin/products", label: "Products", Icon: IcoBox },
  { href: "/admin/orders", label: "Orders", Icon: IcoBag },
  { href: "/admin/discounts", label: "Discounts", Icon: IcoTag },
  { href: "/admin/settings", label: "Settings", Icon: IcoCog },
];

export default function Sidebar({ email }: { email: string }) {
  const path = usePathname();
  const active = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(href + "/"));

  return (
    <aside className={styles.side}>
      <div className={styles.brand}><span className={styles.brandDot} /> Impact Store</div>
      {LINKS.map(({ href, label, Icon, exact }) => (
        <Link key={href} href={href} className={`${styles.navLink} ${active(href, exact) ? styles.navLinkOn : ""}`}>
          <span className={styles.navIcon}><Icon /></span>
          <span className={styles.navLabel}>{label}</span>
        </Link>
      ))}
      <div className={styles.sideFoot}>
        <div className={styles.sideUser}>{email}</div>
        <a href="/sample" target="_blank" rel="noreferrer" className={`${styles.navLink}`}>
          <span className={styles.navIcon}><IcoStore /></span>
          <span className={styles.navLabel}>View store</span>
        </a>
        <form action={signOut}>
          <button type="submit" className={`${styles.navLink}`} style={{ width: "100%", border: "none", background: "none", cursor: "pointer" }}>
            <span className={styles.navIcon}><IcoOut /></span>
            <span className={styles.navLabel}>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
