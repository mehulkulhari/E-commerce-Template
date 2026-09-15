"use client";
/* Shopping bag: a tiny localStorage-backed store shared across the storefront.
   Read through useSyncExternalStore so server and first client render agree and
   other tabs stay in sync. Holds only { id, size, qty } — names, prices and
   images are looked up from the catalogue the page already has. */
import { useSyncExternalStore } from "react";
import { type CartLine, parseLines } from "./cart-core";

export type { CartLine };
export { SHIP_FREE_OVER, SHIP_FEE, totals } from "./cart-core";

const KEY = "impact:cart";
const MAX_QTY = 20;

let memory = "[]"; // fallback when localStorage is blocked (private mode, some in-app browsers)
let open = false;
const listeners = new Set<() => void>();

function readRaw(): string {
  try { return window.localStorage.getItem(KEY) ?? "[]"; } catch { return memory; }
}
function emit() { listeners.forEach((l) => l()); }
function write(lines: CartLine[]) {
  memory = JSON.stringify(lines);
  try { window.localStorage.setItem(KEY, memory); } catch { /* memory only */ }
  emit();
}

const same = (a: CartLine, id: string, size: string) => a.id === id && a.size === size;

export const cart = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
    window.addEventListener("storage", onStorage);
    return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
  },
  // Composite snapshot (a primitive string) so useSyncExternalStore stays stable.
  snapshot: () => `${open ? 1 : 0}:${readRaw()}`,
  lines: () => parseLines(readRaw()),
  add(id: string, size: string, qty = 1) {
    const lines = cart.lines();
    const ex = lines.find((l) => same(l, id, size));
    if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + qty);
    else lines.push({ id, size, qty: Math.min(MAX_QTY, Math.max(1, qty)) });
    open = true;
    write(lines);
  },
  setQty(id: string, size: string, qty: number) {
    let lines = cart.lines();
    if (qty <= 0) lines = lines.filter((l) => !same(l, id, size));
    else { const ex = lines.find((l) => same(l, id, size)); if (ex) ex.qty = Math.min(MAX_QTY, qty); }
    write(lines);
  },
  remove(id: string, size: string) { write(cart.lines().filter((l) => !same(l, id, size))); },
  clear() { write([]); },
  open() { open = true; emit(); },
  close() { open = false; emit(); },
};

export type CartState = {
  open: boolean;
  lines: CartLine[];
  count: number;
  add: typeof cart.add;
  setQty: typeof cart.setQty;
  remove: typeof cart.remove;
  clear: typeof cart.clear;
  openCart: () => void;
  closeCart: () => void;
};

export function useCart(): CartState {
  const snap = useSyncExternalStore(cart.subscribe, cart.snapshot, () => "0:[]");
  const isOpen = snap[0] === "1";
  const lines = parseLines(snap.slice(2));
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return {
    open: isOpen, lines, count,
    add: cart.add, setQty: cart.setQty, remove: cart.remove, clear: cart.clear,
    openCart: cart.open, closeCart: cart.close,
  };
}
