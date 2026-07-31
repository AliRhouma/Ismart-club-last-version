import type { Categorie, CategorieMatch } from "@/data/seed/categories"

/** The season every catégorie screen is scoped to. */
export const SAISON = "2025 - 2026"

/** French agreement: 0 and 1 take the singular. */
export const pluriel = (n: number, mot: string, pluralise = `${mot}s`) =>
  `${n} ${n > 1 ? pluralise : mot}`

export const CATEGORIE_TABS = [
  { value: "effectif", label: "Effectif" },
  { value: "resultats", label: "Résultats" },
  { value: "seances", label: "Séances" },
  { value: "programme", label: "Programme annuel" },
] as const

export type CategorieTab = (typeof CATEGORIE_TABS)[number]["value"]

/** Post lines, in the order an effectif is read. */
export const LIGNES: { label: string; postes: string[] }[] = [
  { label: "Gardiens", postes: ["GB"] },
  { label: "Défenseurs", postes: ["LD", "DC", "LG"] },
  { label: "Milieux", postes: ["MDC", "MOC"] },
  { label: "Attaquants", postes: ["AD", "AG", "BU", "AT"] },
]

export type Bilan = {
  joues: number
  victoires: number
  nuls: number
  defaites: number
  butsPour: number
  butsContre: number
  /** Last five played matches, most recent first. */
  forme: ("V" | "N" | "D")[]
}

/** Result of a played match, from the club's point of view. */
export const issueDe = (m: CategorieMatch): "V" | "N" | "D" | null => {
  if (!m.termine || m.butsPour === null || m.butsContre === null) return null
  return m.butsPour > m.butsContre ? "V" : m.butsPour === m.butsContre ? "N" : "D"
}

/** Season record — computed from the matches, never stored. */
export function bilanDe(matchs: CategorieMatch[]): Bilan {
  const joues = matchs.filter((m) => m.termine)
  const b: Bilan = {
    joues: joues.length,
    victoires: 0,
    nuls: 0,
    defaites: 0,
    butsPour: 0,
    butsContre: 0,
    forme: [],
  }
  for (const m of joues) {
    b.butsPour += m.butsPour ?? 0
    b.butsContre += m.butsContre ?? 0
    const issue = issueDe(m)
    if (issue === "V") b.victoires++
    else if (issue === "N") b.nuls++
    else b.defaites++
  }
  b.forme = joues
    .slice()
    .sort((a, z) => z.date.localeCompare(a.date))
    .slice(0, 5)
    .map((m) => issueDe(m) ?? "N")
  return b
}

/** Attendance rate over the season, 0-100 — null when nothing was recorded. */
export const tauxDe = (presences: number, seances: number) =>
  seances > 0 ? Math.round((presences / seances) * 100) : null

/** Average attendance of a squad, 0-100 — null when nothing was recorded. */
export function tauxMoyen(cat: Categorie, groupeId?: string | null): number | null {
  const rows = cat.joueurs.filter(
    (j) => (!groupeId || j.groupeId === groupeId) && j.seances > 0,
  )
  if (!rows.length) return null
  const total = rows.reduce((n, j) => n + j.presences / j.seances, 0)
  return Math.round((total / rows.length) * 100)
}

const MOIS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
]
export const dateCourte = (iso: string) => {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
export const heureCourte = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, "0")}h${String(d.getUTCMinutes()).padStart(2, "0")}`
}
