/* Pure cart helpers shared by the client store and the server payment routes.
   No React, no "use client" — safe to import anywhere. */

export type CartLine = { id: string; size: string; qty: number };

/** Free shipping at or above this order value, else a flat fee. */
export const SHIP_FREE_OVER = 1999;
export const SHIP_FEE = 99;
const MAX_QTY = 20;

export function parseLines(raw: string): CartLine[] {
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is CartLine =>
        !!x && typeof x === "object" &&
        typeof (x as CartLine).id === "string" &&
        typeof (x as CartLine).size === "string" &&
        Number.isFinite((x as CartLine).qty))
      .map((x) => ({ id: x.id, size: x.size, qty: Math.max(1, Math.min(MAX_QTY, Math.round(x.qty))) }));
  } catch {
    return [];
  }
}

/** Order totals. `priceOf` returns a unit price, or undefined if the item is gone. */
export function totals(lines: CartLine[], priceOf: (id: string) => number | undefined) {
  const subtotal = lines.reduce((sum, l) => sum + (priceOf(l.id) ?? 0) * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= SHIP_FREE_OVER ? 0 : SHIP_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}
