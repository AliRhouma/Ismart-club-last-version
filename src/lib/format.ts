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

/** Full French months — for section headers ("Août 2025"). */
const FR_MONTHS_FULL = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

/** French weekdays, Sun→Sat to match Date.getDay(). */
const FR_WEEKDAYS = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
]

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "2025-08" or "2025-08-13" → "Août 2025" (month-group header). */
export const fmtMonthYear = (key: string) => {
  const [y, m] = key.split("-").map(Number)
  if (!y || !m) return key
  return `${cap(FR_MONTHS_FULL[m - 1] ?? "")} ${y}`
}

/** "2026-06-01" → "1 juin 2026" (long, campaign dates). */
export const fmtFrLong = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${FR_MONTHS_FULL[m - 1] ?? ""} ${y}`
}

/** "1 juin 2026" → "2026-06-01" (reverse of fmtFrLong). "" if unparsable. */
export const parseFrLong = (label: string) => {
  const m = label.trim().toLowerCase().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/)
  if (!m) return ""
  const month = FR_MONTHS_FULL.indexOf(m[2])
  if (month < 0) return ""
  const p = (x: number) => String(x).padStart(2, "0")
  return `${m[3]}-${p(month + 1)}-${p(Number(m[1]))}`
}

/** "2025-08-13" → "mercredi, 13 août" (day-group header). */
export const fmtDayLong = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  const wd = FR_WEEKDAYS[new Date(y, m - 1, d).getDay()] ?? ""
  return `${wd}, ${d} ${FR_MONTHS_FULL[m - 1] ?? ""}`
}

/** "3429.45" → "3 429,45", "3500" → "3 500" (fr-FR, decimals only when present). */
export const fmtAmount = (n: number) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })

/** Today as "2026-05-14" (local), for date-input defaults. */
export const todayISO = () => {
  const n = new Date()
  const p = (x: number) => String(x).padStart(2, "0")
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`
}
