/**
 * Pure lookup + display helpers for the Finance / Transactions screen.
 * Keeps the screen and drawer free of repeated id→name plumbing.
 */

import type {
  FinanceTeam,
  Group,
  StaffMember,
  SubCategory,
  Transaction,
} from "@/data/seed/finance"

/** id → name index for any referential collection. */
export function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]))
}

/** "Groupe → Sous-catégorie" for a transaction. */
export function categoryPath(
  tx: Transaction,
  groups: Map<string, Group>,
  subs: Map<string, SubCategory>,
): { group: string; sub: string } {
  return {
    group: groups.get(tx.group_id)?.name ?? "—",
    sub: subs.get(tx.subcategory_id)?.name ?? "—",
  }
}

/** Plain-text portée for exports / tooltips (badges rendered separately). */
export function scopeText(
  tx: Transaction,
  teams: Map<string, FinanceTeam>,
  staff: Map<string, StaffMember>,
): string {
  if (tx.scope === "general") return "Général"
  if (tx.scope === "equipe") {
    const names = tx.team_ids.map((id) => teams.get(id)?.name ?? id)
    return names.length ? names.join(", ") : "Équipe"
  }
  // staff
  const parts = ["Staff"]
  if (tx.staff_category) parts.push(tx.staff_category)
  const member = tx.staff_member_id ? staff.get(tx.staff_member_id) : undefined
  if (member) parts.push(member.full_name)
  return parts.join(" — ")
}
