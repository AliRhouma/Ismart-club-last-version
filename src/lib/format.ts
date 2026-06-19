/** Number / currency formatting helpers (TND, fr-FR). */

/** Round to the nearest integer. */
export const r = (n: number) => Math.round(n)

/** "96 000 TND" */
export const fmt = (n: number) => r(n).toLocaleString("fr-FR") + " TND";

/** "96 000" (no currency suffix — for dense tables) */
export const fmtShort = (n: number) => r(n).toLocaleString("fr-FR")
