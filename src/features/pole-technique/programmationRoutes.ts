/**
 * The Programmation parcours in URL form: saison → équipe → the programme
 * annuel itself. Kept out of the screen files so both the parcours and the
 * programme can build the same links.
 *
 * There is no groupe step: a programme is written once per équipe and run by
 * all of its groupes.
 */

/** "2025 - 2026" ⇄ "2025-2026" — a saison has to survive a URL segment. */
export const saisonEnSlug = (saison: string) => saison.replace(/\s/g, "")

export const saisonDepuisSlug = (slug: string, saisons: string[]) =>
  saisons.find((s) => saisonEnSlug(s) === slug) ?? null

export const cheminSaison = (saison: string) =>
  `/pole-technique/programmation/${saisonEnSlug(saison)}`

/** The équipe *is* the programme — one URL, not two. */
export const cheminProgramme = (saison: string, categorieId: string) =>
  `${cheminSaison(saison)}/${categorieId}`

/** The four tabs of one programme, in the order they are read. */
export const PROGRAMME_TABS = [
  { value: "", label: "Programmation" },
  { value: "planification", label: "Planification" },
  { value: "stats", label: "Stats" },
  { value: "reglages", label: "Réglages" },
] as const

export type ProgrammeTab = (typeof PROGRAMME_TABS)[number]["value"]
