/**
 * Pure comparison helpers for the Budget comparison page. All display-derived
 * arithmetic (sums, écarts, %) — no business engine. A treasurer compares two
 * budgets to answer: which scenario is healthier, and WHERE do they diverge.
 */

import type { BudgetLine, LineNature } from "@/data/seed/budget2"
import type { Group } from "@/data/seed/finance"

/** One comparison line: a category present in A, B, or both. */
export type CompareRow = {
  key: string
  label: string
  a: number
  b: number
  delta: number
}

/** Aggregate a draft's lines by referential category for one nature. */
function catMap(lines: BudgetLine[], nature: LineNature): Map<string, number> {
  const m = new Map<string, number>()
  for (const l of lines) {
    if (l.nature !== nature) continue
    m.set(l.group_id, (m.get(l.group_id) ?? 0) + l.montant_estime)
  }
  return m
}

/**
 * Merge two drafts' lines by referential category (Groupe) for one nature —
 * apples-to-apples, so scenarios with different pooled groups still align.
 * Sorted by the size of the écart (biggest movers first).
 */
export function compareCategories(
  linesA: BudgetLine[],
  linesB: BudgetLine[],
  nature: LineNature,
  groups: Map<string, Group>,
): CompareRow[] {
  const a = catMap(linesA, nature)
  const b = catMap(linesB, nature)
  const keys = new Set([...a.keys(), ...b.keys()])
  const rows: CompareRow[] = []
  for (const key of keys) {
    const av = a.get(key) ?? 0
    const bv = b.get(key) ?? 0
    rows.push({ key, label: groups.get(key)?.name ?? "—", a: av, b: bv, delta: bv - av })
  }
  return rows.sort(
    (x, y) => Math.abs(y.delta) - Math.abs(x.delta) || y.b + y.a - (x.b + x.a),
  )
}

/** Per-draft split by the four structural sections. */
export type SectionSplit = {
  generales: number
  staff: number
  equipes: number
  revenus: number
}

export function sectionSplit(lines: BudgetLine[]): SectionSplit {
  let generales = 0
  let staff = 0
  let equipes = 0
  let revenus = 0
  for (const l of lines) {
    if (l.nature === "Revenu") {
      revenus += l.montant_estime
      continue
    }
    if (l.scope_type === "general") generales += l.montant_estime
    else if (l.scope_type === "staff") staff += l.montant_estime
    else equipes += l.montant_estime // equipe | groupe
  }
  return { generales, staff, equipes, revenus }
}

/**
 * Is B's move on this metric favorable to the treasurer?
 * More revenus / higher solde = good; more dépenses = bad.
 */
export function favorable(nature: "Revenu" | "Dépense" | "Solde", delta: number) {
  if (delta === 0) return null
  if (nature === "Dépense") return delta < 0
  return delta > 0
}

/** "+24 000" / "−11 800" (sign always shown; magnitude localised). */
export function signed(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : ""
  return sign + Math.abs(Math.round(n)).toLocaleString("fr-FR")
}
