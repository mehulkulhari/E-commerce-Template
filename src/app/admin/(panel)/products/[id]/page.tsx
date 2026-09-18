import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import type { ProductImage } from "../../../actions";
import styles from "../../../admin.module.css";
import ProductForm, { type ProductFormData } from "../ProductForm";

export const dynamic = "force-dynamic";

type Row = {
  id: string; name: string; price: number; mrp: number | null; code: number | null;
  category: string | null; colour: string | null; tag: string | null; description: string | null;
  sizes: string[] | null; stock: number | null; low_stock_threshold: number;
  in_stock: boolean; featured: boolean; images: ProductImage[] | null;
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireAdmin();
  const { data } = await sb
    .from("products")
    .select("id,name,price,mrp,code,category,colour,tag,description,sizes,stock,low_stock_threshold,in_stock,featured,images")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const r = data as Row;

  const product: ProductFormData = {
    id: r.id, name: r.name, price: r.price, mrp: r.mrp, code: r.code,
    category: r.category, colour: r.colour, tag: r.tag, description: r.description,
    sizes: r.sizes ?? [], stock: r.stock, low_stock_threshold: r.low_stock_threshold,
    in_stock: r.in_stock, featured: r.featured, images: Array.isArray(r.images) ? r.images : [],
  };

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>Edit product</h1>
          <p className={styles.sub}>{r.name}</p>
        </div>
      </div>
      <ProductForm product={product} />
    </>
  );
}
