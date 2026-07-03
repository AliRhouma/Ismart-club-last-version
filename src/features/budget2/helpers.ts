/**
 * Pure display helpers for the Budget module (Outil Budget). Keeps the screens
 * free of repeated id→name plumbing and date/scope formatting.
 */

import type {
  FinanceTeam,
  Group,
  SubCategory,
} from "@/data/seed/finance"
import type {
  BudgetLine,
  BudgetTeamGroup,
  Budget2Scope,
  EstimationMethod,
} from "@/data/seed/budget2"

/** id → row index for any referential collection. */
export function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]))
}

/** A line's display name: sub-catégorie if set, else the groupe name. */
export function lineTitle(
  line: BudgetLine,
  groups: Map<string, Group>,
  subs: Map<string, SubCategory>,
): { title: string; sub?: string } {
  const group = groups.get(line.group_id)?.name ?? "—"
  const sub = line.subcategory_id ? subs.get(line.subcategory_id)?.name : undefined
  return sub ? { title: sub, sub: group } : { title: group }
}

/** Human label of the estimation method. */
export const METHOD_LABEL: Record<EstimationMethod, string> = {
  forfaitaire: "Forfaitaire",
  recurrent: "Récurrent",
  activite: "Basé sur activité",
}

/** Short formula caption for a line that uses the estimator. */
export function methodFormula(line: BudgetLine): string | null {
  if (line.estimation_method === "recurrent") {
    const { amount = 0, periods = 0 } = line.estimation_inputs ?? {}
    return `${amount.toLocaleString("fr-FR")} × ${periods} périodes`
  }
  if (line.estimation_method === "activite") {
    const { qty = 0, unit_cost = 0 } = line.estimation_inputs ?? {}
    return `${qty} × ${unit_cost.toLocaleString("fr-FR")}`
  }
  return null
}

/** Plain-text portée for a scope (badges rendered separately). */
export const SCOPE_LABEL: Record<Budget2Scope, string> = {
  general: "Général",
  staff: "Staff",
  equipe: "Équipe",
  groupe: "Groupe",
}

/** "2025-08-01" → "1 août 2025". */
export function fmtLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** "2025-08-01" + "2026-06-30" → "août 2025 – juin 2026". */
export function fmtDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [y, m] = iso.split("-").map(Number)
    if (!y || !m) return iso
    return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    })
  }
  return `${fmt(start)} – ${fmt(end)}`
}

/** ISO datetime → "18 juil. 2025" (feeds "dernière modification"). */
export function fmtModified(iso: string): string {
  const date = iso.slice(0, 10)
  const [y, m, d] = date.split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** The three season budget tabs (one URL each). */
export const BUDGET2_TABS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "brouillon", label: "Brouillon" },
  { value: "analyse", label: "Analyse" },
] as const

export type Budget2Tab = (typeof BUDGET2_TABS)[number]["value"]

/** Team ids used by individual (portée = équipe) dépense lines of a draft. */
export function individualTeamIds(lines: BudgetLine[]): string[] {
  const set = new Set<string>()
  for (const l of lines) {
    if (l.scope_type === "equipe" && l.team_id) set.add(l.team_id)
  }
  return [...set]
}

/** Names of a group's member teams, joined. */
export function groupMemberNames(
  teamIds: string[],
  teams: Map<string, FinanceTeam>,
): string {
  return teamIds.map((id) => teams.get(id)?.name ?? id).join(" · ")
}

/** One slice of the dépenses breakdown — a category (Groupe) or a pooled group. */
export type ExpenseSlice = {
  key: string
  label: string
  value: number
  isGroup?: boolean
}

/**
 * Dépenses breakdown by CATEGORY and GROUP (not by section):
 * pooled team-groups are aggregated as their own slice (budgeted once for the
 * cluster), and every other dépense line is aggregated by its referential
 * category (Groupe). Sorted by amount, descending.
 */
export function expenseBreakdown(
  lines: BudgetLine[],
  teamGroups: BudgetTeamGroup[],
  groups: Map<string, Group>,
): ExpenseSlice[] {
  const groupLabel = new Map(teamGroups.map((g) => [g.id, g.label]))
  const buckets = new Map<string, ExpenseSlice>()
  for (const line of lines) {
    if (line.nature !== "Dépense") continue
    let key: string
    let label: string
    let isGroup = false
    if (line.scope_type === "groupe" && line.group_ref) {
      key = `grp:${line.group_ref}`
      label = groupLabel.get(line.group_ref) ?? "Groupe"
      isGroup = true
    } else {
      key = `cat:${line.group_id}`
      label = groups.get(line.group_id)?.name ?? "—"
    }
    const cur = buckets.get(key)
    if (cur) cur.value += line.montant_estime
    else buckets.set(key, { key, label, value: line.montant_estime, isGroup })
  }
  return [...buckets.values()].sort((a, b) => b.value - a.value)
}
