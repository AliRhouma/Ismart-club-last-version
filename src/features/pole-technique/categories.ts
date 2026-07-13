/**
 * Shared catalogue of Pôle-Technique categories. Static UI-only reference data
 * (no store, no logic) — the Catégories grid and the per-category detail page
 * both read from here so a card and its page can never drift apart.
 *
 * Each category belongs to a season and carries its at-a-glance member counts:
 * joueurs (players), educateurs (coaches), groupes (sub-groups within the
 * category), and staff (team staff). Counts are shown as-is; nothing is derived.
 */

export const CATEGORY_SEASON = "2024-2025"

export type Category = {
  /** url-safe id used in the detail route */
  slug: string
  name: string
  joueurs: number
  educateurs: number
  groupes: number
  staff: number
}

export const CATEGORIES: Category[] = [
  { slug: "attaquant", name: "Attaquant", joueurs: 4, educateurs: 0, groupes: 2, staff: 1 },
  { slug: "cadet", name: "Cadet", joueurs: 21, educateurs: 2, groupes: 3, staff: 4 },
  { slug: "cat-123", name: "Cat 123", joueurs: 0, educateurs: 0, groupes: 0, staff: 1 },
  { slug: "cat-2026", name: "Cat 2026", joueurs: 0, educateurs: 0, groupes: 0, staff: 1 },
  { slug: "cat-t", name: "Cat T", joueurs: 0, educateurs: 0, groupes: 0, staff: 1 },
  { slug: "cat-test", name: "Cat test", joueurs: 0, educateurs: 0, groupes: 0, staff: 1 },
  { slug: "cat-test1", name: "cat test1", joueurs: 3, educateurs: 0, groupes: 1, staff: 1 },
  { slug: "defenseur", name: "Défenseur", joueurs: 4, educateurs: 0, groupes: 2, staff: 1 },
  { slug: "ecole", name: "Ecole", joueurs: 28, educateurs: 2, groupes: 4, staff: 5 },
  { slug: "ecole-a", name: "Ecole A", joueurs: 1, educateurs: 2, groupes: 1, staff: 2 },
  { slug: "gardien-de-but", name: "Gardien de but", joueurs: 4, educateurs: 0, groupes: 1, staff: 1 },
  { slug: "junior", name: "Junior", joueurs: 25, educateurs: 2, groupes: 3, staff: 5 },
  { slug: "lateral-droit", name: "Latéral droit", joueurs: 4, educateurs: 0, groupes: 2, staff: 1 },
  { slug: "milieu", name: "Milieu", joueurs: 4, educateurs: 0, groupes: 2, staff: 1 },
  { slug: "minime", name: "Minime", joueurs: 29, educateurs: 4, groupes: 4, staff: 6 },
  { slug: "senior", name: "Senior", joueurs: 24, educateurs: 1, groupes: 3, staff: 6 },
]

export function findCategory(slug: string | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

/* ── Tabs on a category's detail page ─────────────────────────────────────── */
export const CATEGORY_TABS = [
  { value: "resultats", label: "Résultats" },
  { value: "groupes", label: "Groupes" },
  { value: "seances", label: "Séances" },
  { value: "analyse", label: "Analyse" },
  { value: "progression", label: "Progression" },
  { value: "programme-annuel", label: "Programme annuel" },
] as const

export type CategoryTab = (typeof CATEGORY_TABS)[number]["value"]
