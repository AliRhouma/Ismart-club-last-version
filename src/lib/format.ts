/** Number / currency formatting helpers (TND, fr-FR). */

/** Round to the nearest integer. */
export const r = (n: number) => Math.round(n)

/** "96 000 TND" */
export const fmt = (n: number) => r(n).toLocaleString("fr-FR") + " TND";

/** "96 000" (no currency suffix — for dense tables) */
export const fmtShort = (n: number) => r(n).toLocaleString("fr-FR")

/** Abbreviated French months — matches the seed transaction dates ("14 Mai"). */
const FR_MONTHS = [
  "Janv", "Févr", "Mars", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
]

/** "2026-05-14" → "14 Mai" (the short date style used across the dashboard). */
export const fmtFrDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${String(d).padStart(2, "0")} ${FR_MONTHS[m - 1] ?? ""}`
}

/** Today as "2026-05-14" (local), for date-input defaults. */
export const todayISO = () => {
  const n = new Date()
  const p = (x: number) => String(x).padStart(2, "0")
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`
}
