"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { instagramUrl, orderNote, type SpecImage, type SpecProduct, type StoreSpec } from "@/lib/store-spec";

/* Pieces shared by the handicrafts and jewellery templates. */

/** Where "Order" goes. A preview never takes orders itself: it sends the
    visitor to the shop's own Instagram. A real client store uses WhatsApp. */
export function orderHref(spec: StoreSpec, p?: SpecProduct): string {
  if (spec.demo || !spec.whatsapp) return instagramUrl(spec.handle);
  return `https://wa.me/${spec.whatsapp}?text=${encodeURIComponent(orderNote(spec, p))}`;
}
export const orderLabel = (spec: StoreSpec) => (spec.demo || !spec.whatsapp ? "Order on Instagram" : "Order on WhatsApp");

/** A product photo, or a soft tinted placeholder when the shop has none. */
export function Photo({ img, alt = "", sizes, className, priority, tint = 0 }: {
  img?: SpecImage; alt?: string; sizes: string; className?: string; priority?: boolean; tint?: number;
}) {
  if (!img) return <span className={className} data-tint={tint % 6} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }} />;
  return (
    <Image
      src={img.src} alt={alt} fill sizes={sizes} preload={priority}
      placeholder={img.blur ? "blur" : "empty"} blurDataURL={img.blur}
      className={className} style={{ objectFit: "cover" }}
    />
  );
}

/** Esc to close, lock background scroll, and move focus into the dialog. */
export function useDialog(open: boolean, onClose: () => void) {
  const focusRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => focusRef.current?.focus(), 40);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; clearTimeout(t); };
  }, [open]);
  return focusRef;
}

const S = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Ico = {
  Menu: () => <svg {...S}><path d="M3 7h18M3 12h18M3 17h18" /></svg>,
  Close: () => <svg {...S}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  Search: () => <svg {...S}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  Heart: () => <svg {...S}><path d="M12 20.5S3.8 15.4 3.8 9.9A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 8.2 2.3c0 5.5-8.2 10.6-8.2 10.6z" /></svg>,
  Left: () => <svg {...S}><path d="M15 5l-7 7 7 7" /></svg>,
  Right: () => <svg {...S}><path d="M9 5l7 7-7 7" /></svg>,
  Arrow: () => <svg {...S}><path d="M7 17L17 7M9 7h8v8" /></svg>,
  Plus: () => <svg {...S}><path d="M12 5v14M5 12h14" /></svg>,
  Filter: () => <svg {...S}><path d="M4 6h16M7 12h10M10 18h4" /></svg>,
  Instagram: () => <svg {...S}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" /></svg>,
  Leaf: () => <svg {...S}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19l7-7" /></svg>,
  Hand: () => <svg {...S}><path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6 7s-5-2-6.5-4.5L3 12.5a1.5 1.5 0 0 1 2.5-1.6L8 13" /></svg>,
  Chat: () => <svg {...S}><path d="M4 5h16v11H9l-5 4z" /></svg>,
  Gift: () => <svg {...S}><rect x="3" y="9" width="18" height="12" rx="1" /><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S9 9 12 9zm0 0c2-4 6-4 6-1.5S15 9 12 9z" /></svg>,
  Gem: () => <svg {...S}><path d="M6 4h12l3 5-9 11L3 9z" /><path d="M3 9h18M9 4l3 16M15 4l-3 16" /></svg>,
  Shield: () => <svg {...S}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>,
};
