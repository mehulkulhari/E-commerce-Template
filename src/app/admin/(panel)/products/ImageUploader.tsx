"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { ProductImage } from "../../actions";
import styles from "../../admin.module.css";

const MAX_EDGE = 1600;
const BLUR_EDGE = 16;
const MAX_IMAGES = 8;

/* Processes a photo in the browser (right-side-up, downscaled, WebP) to match
   the seeded catalogue, uploads it to the product-images bucket as the signed-in
   owner, and returns the stored image metadata. Keeps big originals off the
   server and avoids any upload size limit on server actions. */
async function processAndUpload(file: File): Promise<ProductImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/webp", 0.82),
  );

  // Tiny blurred preview (data URL) shown while the full photo loads.
  const bw = Math.max(1, Math.round(BLUR_EDGE * (w >= h ? 1 : w / h)));
  const bh = Math.max(1, Math.round(BLUR_EDGE * (h >= w ? 1 : h / w)));
  const bc = document.createElement("canvas");
  bc.width = bw; bc.height = bh;
  bc.getContext("2d")!.drawImage(bitmap, 0, 0, bw, bh);
  let blur = bc.toDataURL("image/webp", 0.4);
  if (!blur.startsWith("data:image/webp")) blur = bc.toDataURL("image/jpeg", 0.4);
  bitmap.close();

  const path = `${crypto.randomUUID()}.webp`;
  const sb = supabaseBrowser();
  const { error } = await sb.storage.from("product-images").upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from("product-images").getPublicUrl(path);
  return { src: data.publicUrl, width: w, height: h, blur };
}

export default function ImageUploader({ value, onChange }: { value: ProductImage[]; onChange: (v: ProductImage[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr(null);
    setBusy(true);
    try {
      const room = MAX_IMAGES - value.length;
      const picked = Array.from(files).slice(0, Math.max(0, room));
      const done: ProductImage[] = [];
      for (const f of picked) {
        if (!f.type.startsWith("image/")) continue;
        done.push(await processAndUpload(f));
      }
      onChange([...value, ...done]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn’t upload that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const removeAt = (i: number) => onChange(value.filter((_, j) => j !== i));
  const toggleModel = (i: number) => onChange(value.map((im, j) => (j === i ? { ...im, model: !im.model } : im)));

  return (
    <div className={styles.uploader}>
      {value.length > 0 && (
        <div className={styles.thumbs}>
          {value.map((im, i) => (
            <div className={styles.thumb} key={im.src}>
              <Image src={im.src} alt="" width={96} height={96} unoptimized={im.src.startsWith("/catalog/")} />
              {i === 0 && !im.model && <span className={styles.thumbFirst}>MAIN</span>}
              <button type="button" className={`${styles.thumbModel} ${im.model ? styles.thumbModelOn : ""}`} onClick={() => toggleModel(i)}
                aria-pressed={Boolean(im.model)} title="Mark as a photo of someone wearing it (shows as On model)">
                {im.model ? "ON MODEL" : "Model?"}
              </button>
              <button type="button" className={styles.thumbDel} onClick={() => removeAt(i)} aria-label="Remove image">×</button>
            </div>
          ))}
        </div>
      )}
      {value.length < MAX_IMAGES && (
        <div className={styles.drop} onClick={() => inputRef.current?.click()}>
          {busy ? "Uploading…" : "Click to add photos (the first one is the main image)"}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {err && <p className={`${styles.notice} ${styles.noticeErr}`}>{err}</p>}
    </div>
  );
}
