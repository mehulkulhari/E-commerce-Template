"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProduct, type ProductImage, type ProductInput } from "../../actions";
import styles from "../../admin.module.css";
import ImageUploader from "./ImageUploader";

export type ProductFormData = {
  id?: string;
  name: string; price: number; mrp: number | null; code: number | null;
  category: string | null; colour: string | null; tag: string | null; description: string | null;
  sizes: string[]; stock: number | null; low_stock_threshold: number;
  in_stock: boolean; featured: boolean; images: ProductImage[];
};

export default function ProductForm({ product }: { product?: ProductFormData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [f, setF] = useState({
    name: product?.name ?? "",
    price: product?.price?.toString() ?? "",
    mrp: product?.mrp?.toString() ?? "",
    code: product?.code?.toString() ?? "",
    category: product?.category ?? "",
    colour: product?.colour ?? "",
    tag: product?.tag ?? "",
    description: product?.description ?? "",
    sizes: (product?.sizes ?? []).join(", "),
    stock: product?.stock?.toString() ?? "",
    lowStockThreshold: (product?.low_stock_threshold ?? 3).toString(),
    inStock: product?.in_stock ?? true,
    featured: product?.featured ?? false,
  });
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit() {
    setErr(null);
    const input: ProductInput = {
      id: product?.id,
      name: f.name,
      price: Number(f.price),
      mrp: f.mrp ? Number(f.mrp) : null,
      code: f.code ? Number(f.code) : null,
      category: f.category || null,
      colour: f.colour || null,
      tag: f.tag || null,
      description: f.description || null,
      sizes: f.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      stock: f.stock === "" ? null : Number(f.stock),
      lowStockThreshold: Number(f.lowStockThreshold) || 0,
      inStock: f.inStock,
      featured: f.featured,
      images,
    };
    start(async () => {
      const r = await saveProduct(input);
      if (r.ok) { router.push("/admin/products"); router.refresh(); }
      else setErr(r.error ?? "Couldn’t save the product.");
    });
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label>Photos</label>
        <ImageUploader value={images} onChange={setImages} />
      </div>

      <div className={styles.field}>
        <label htmlFor="p-name">Name</label>
        <input id="p-name" className={styles.input} value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="p-price">Price (₹)</label>
          <input id="p-price" className={styles.input} inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="p-mrp">MRP (₹) <span className={styles.hint}>optional, shown struck-through</span></label>
          <input id="p-mrp" className={styles.input} inputMode="numeric" value={f.mrp} onChange={(e) => set("mrp", e.target.value)} />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="p-cat">Category</label>
          <input id="p-cat" className={styles.input} value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="Shoes, Jerseys, Tees…" />
        </div>
        <div className={styles.field}>
          <label htmlFor="p-colour">Colour <span className={styles.hint}>optional</span></label>
          <input id="p-colour" className={styles.input} value={f.colour} onChange={(e) => set("colour", e.target.value)} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="p-sizes">Sizes <span className={styles.hint}>comma-separated, e.g. S, M, L, XL</span></label>
        <input id="p-sizes" className={styles.input} value={f.sizes} onChange={(e) => set("sizes", e.target.value)} />
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="p-stock">Stock quantity <span className={styles.hint}>leave blank if not tracking</span></label>
          <input id="p-stock" className={styles.input} inputMode="numeric" value={f.stock} onChange={(e) => set("stock", e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="p-low">Low-stock alert at</label>
          <input id="p-low" className={styles.input} inputMode="numeric" value={f.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} />
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="p-tag">Badge <span className={styles.hint}>optional, e.g. New, Bestseller</span></label>
          <input id="p-tag" className={styles.input} value={f.tag} onChange={(e) => set("tag", e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="p-code">Product code <span className={styles.hint}>optional number</span></label>
          <input id="p-code" className={styles.input} inputMode="numeric" value={f.code} onChange={(e) => set("code", e.target.value)} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="p-desc">Description <span className={styles.hint}>optional</span></label>
        <textarea id="p-desc" className={styles.textarea} value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className={styles.checkRow}>
        <input id="p-instock" type="checkbox" checked={f.inStock} onChange={(e) => set("inStock", e.target.checked)} />
        <label htmlFor="p-instock">In stock (available to buy)</label>
      </div>
      <div className={styles.checkRow}>
        <input id="p-featured" type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
        <label htmlFor="p-featured">Featured on the homepage</label>
      </div>

      {err && <p className={`${styles.notice} ${styles.noticeErr}`}>{err}</p>}

      <div className={styles.btnRow}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={submit} disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
        <button type="button" className={styles.btn} onClick={() => router.push("/admin/products")} disabled={pending}>Cancel</button>
      </div>
    </div>
  );
}
