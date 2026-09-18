import "server-only";

/* A request-time clock. Reading the current time is legitimate in a dynamic
   server component (it renders once per request), but doing it inline trips the
   render-purity lint rule. Centralising it here documents the intent and keeps
   the seam swappable in tests. */
export const nowMs = (): number => Date.now();
