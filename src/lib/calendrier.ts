/**
 * Month-grid helpers — pure, no library, Sunday-first, French labels. The
 * Planification screen has carried its own copy since it was the only calendar
 * in the app; the programme's planification tab is the second one, so the maths
 * lives here.
 */

export const MOIS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

export const JOURS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."]

/** Single letters for the narrow (mobile) grid, where "dim." won't fit. */
export const JOURS_MIN_FR = ["D", "L", "M", "M", "J", "V", "S"]

const pad = (n: number) => String(n).padStart(2, "0")

export const versIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The date part of a stored ISO date-time, which is how séances key by day. */
export const jourDeIso = (iso: string) => iso.slice(0, 10)

export type CelluleMois = { iso: string; jour: number; dansLeMois: boolean }

/** 42 cells (6 weeks) covering `mois`, padded out to whole weeks. */
export function grilleDuMois(annee: number, mois: number): CelluleMois[] {
  const premier = new Date(annee, mois, 1)
  const debut = new Date(annee, mois, 1 - premier.getDay()) // back to Sunday
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(
      debut.getFullYear(),
      debut.getMonth(),
      debut.getDate() + i,
    )
    return { iso: versIso(d), jour: d.getDate(), dansLeMois: d.getMonth() === mois }
  })
}

/** "mar. 24 juil." — the compact label a day list uses as its heading. */
export function libelleJourCourt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const jour = new Date(y, m - 1, d).getDay()
  return `${JOURS_FR[jour]} ${d} ${MOIS_FR[m - 1].slice(0, 4).toLowerCase()}.`
}
