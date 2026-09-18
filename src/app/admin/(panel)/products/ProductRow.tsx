"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, setProductFlags } from "../../actions";
import { IcoTrash } from "../../icons";
import styles from "../../admin.module.css";

export type AdminProduct = {
  id: string; name: string; price: number; mrp: number | null; category: string | null;
  in_stock: boolean; stock: number | null; low_stock_threshold: number; featured: boolean;
  images: { src: string; width?: number; height?: number }[]; sort: number;
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" className={styles.toggle} onClick={() => onChange(!on)} disabled={disabled} aria-pressed={on}>
      <span className={`${styles.toggleTrack} ${on ? styles.toggleOn : ""}`}><span className={styles.toggleKnob} /></span>
    </button>
  );
}

export default function ProductRow({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [inStock, setInStock] = useState(product.in_stock);
  const [featured, setFeatured] = useState(product.featured);
  const img = product.images?.[0]?.src;

  const flag = (patch: { in_stock?: boolean; featured?: boolean }) =>
    start(async () => { await setProductFlags(product.id, patch); router.refresh(); });

  const remove = () =>
    start(async () => {
      if (!confirm(`Delete “${product.name}”? This can’t be undone.`)) return;
      await deleteProduct(product.id);
      router.refresh();
    });

  const low = product.stock !== null && product.stock <= product.low_stock_threshold;

  return (
    <tr style={{ opacity: pending ? 0.55 : 1 }}>
      <td>
        {img
          ? <Image src={img} alt="" width={44} height={44} className={styles.rowThumb} unoptimized={img.startsWith("/catalog/")} />
          : <span className={styles.rowThumb} />}
      </td>
      <td>
        <div className={styles.cellName}>{product.name}</div>
        {product.category && <div className={styles.cellMeta}>{product.category}</div>}
      </td>
      <td>
        {inr(product.price)}
        {product.mrp && product.mrp > product.price && <div className={styles.cellMeta} style={{ textDecoration: "line-through" }}>{inr(product.mrp)}</div>}
      </td>
      <td>
        {product.stock === null
          ? <span className={styles.cellMeta}>—</span>
          : <span className={`${styles.badge} ${product.stock === 0 ? styles.badgeBad : low ? styles.badgeWarn : styles.badgeMuted}`}>{product.stock}</span>}
      </td>
      <td><Toggle on={inStock} disabled={pending} onChange={(v) => { setInStock(v); flag({ in_stock: v }); }} /></td>
      <td><Toggle on={featured} disabled={pending} onChange={(v) => { setFeatured(v); flag({ featured: v }); }} /></td>
      <td>
        <div className={styles.btnRow} style={{ justifyContent: "flex-end" }}>
          <Link href={`/admin/products/${product.id}`} className={`${styles.btn} ${styles.btnSm}`}>Edit</Link>
          <button type="button" className={`${styles.btn} ${styles.btnSm} ${styles.btnDanger}`} onClick={remove} disabled={pending} aria-label="Delete"><IcoTrash /></button>
        </div>
      </td>
    </tr>
  );
}
