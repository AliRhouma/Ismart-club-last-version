/**
 * Pure suivi (tracking) helpers for the Budget 2 dashboard. Joins the season's
 * VALIDATED plan (prévu, from the reference draft's lines) with the REAL
 * transactions (réel, from the Finance module) by referential category (Groupe)
 * — apples-to-apples, since both modules share the same referential ids.
 *
 * All display-derived arithmetic only (sums, écarts, ratios) — no business
 * engine. A treasurer reads it to answer: where is the real spend against what
 * we planned, and which categories are drifting over.
 */

import type { BudgetLine, BudgetTeamGroup } from "@/data/seed/budget2"
import type { FinanceTeam, Group, Transaction } from "@/data/seed/finance"

export type SuiviNature = "Dépense" | "Revenu"

/** Alert threshold — a dépense category ≥ 80 % consumed is flagged. */
export const SUIVI_SEUIL = 0.8

/** One category's plan-vs-real line. */
export type SuiviRow = {
  groupId: string
  label: string
  nature: SuiviNature
  /** Planned amount (validated draft). */
  prevu: number
  /** Realised amount (transactions). */
  reel: number
  /**
   * Signed écart, favourable-positive:
   *  · Dépense → prévu − réel (positive = under budget)
   *  · Revenu  → réel − prévu (positive = target met / exceeded)
   */
  ecart: number
  /** réel / prévu, or null when there is no plan (prévu = 0). */
  ratio: number | null
  /** Is the écart in the treasurer's favour? */
  favorable: boolean
}

export type AlertLevel = "danger" | "warning"

export type SuiviAlert = SuiviRow & {
  level: AlertLevel
  /** "Dépassement" | "Proche du seuil" | "Hors budget". */
  reason: string
}

export type SuiviTotals = {
  prevuDep: number
  reelDep: number
  prevuRev: number
  reelRev: number
  soldePrevu: number
  soldeReel: number
}

export type SuiviData = {
  depenses: SuiviRow[]
  revenus: SuiviRow[]
  totals: SuiviTotals
  alerts: SuiviAlert[]
  /** Count of transactions that fed the réel figures. */
  txCount: number
}

/** Aggregate a keyed amount map for one nature. */
function sumBy<T>(
  rows: T[],
  nature: SuiviNature,
  natureOf: (r: T) => SuiviNature,
  keyOf: (r: T) => string,
  amountOf: (r: T) => number,
): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    if (natureOf(r) !== nature) continue
    m.set(keyOf(r), (m.get(keyOf(r)) ?? 0) + amountOf(r))
  }
  return m
}

/** Build the per-category plan-vs-real rows for one nature. */
function rowsFor(
  nature: SuiviNature,
  planLines: BudgetLine[],
  realTx: Transaction[],
  groups: Map<string, Group>,
): SuiviRow[] {
  const plan = sumBy(planLines, nature, (l) => l.nature, (l) => l.group_id, (l) => l.montant_estime)
  const real = sumBy(realTx, nature, (t) => t.nature, (t) => t.group_id, (t) => t.amount)

  const rows: SuiviRow[] = []
  for (const groupId of new Set([...plan.keys(), ...real.keys()])) {
    const prevu = plan.get(groupId) ?? 0
    const reel = real.get(groupId) ?? 0
    const ecart = nature === "Dépense" ? prevu - reel : reel - prevu
    rows.push({
      groupId,
      label: groups.get(groupId)?.name ?? "—",
      nature,
      prevu,
      reel,
      ecart,
      ratio: prevu > 0 ? reel / prevu : null,
      favorable: ecart >= 0,
    })
  }
  // Most-consumed first (no-plan spend — ratio null — bubbles to the very top).
  return rows.sort(
    (a, b) => (b.ratio ?? Infinity) - (a.ratio ?? Infinity) || b.reel - a.reel,
  )
}

/**
 * Join the validated plan lines and the realised transactions into the full
 * suivi model consumed by the dashboard.
 */
export function buildSuivi(
  planLines: BudgetLine[],
  realTx: Transaction[],
  groups: Map<string, Group>,
): SuiviData {
  const depenses = rowsFor("Dépense", planLines, realTx, groups)
  const revenus = rowsFor("Revenu", planLines, realTx, groups)

  const total = (arr: SuiviRow[], k: "prevu" | "reel") =>
    arr.reduce((s, r) => s + r[k], 0)
  const prevuDep = total(depenses, "prevu")
  const reelDep = total(depenses, "reel")
  const prevuRev = total(revenus, "prevu")
  const reelRev = total(revenus, "reel")

  // Alerts focus on dépenses drift: over budget, near the seuil, or spent with
  // no line at all. (Revenue shortfall mid-season is expected, not an alert.)
  const alerts: SuiviAlert[] = []
  for (const r of depenses) {
    if (r.prevu === 0 && r.reel > 0) {
      alerts.push({ ...r, level: "danger", reason: "Hors budget" })
    } else if (r.ratio != null && r.ratio > 1) {
      alerts.push({ ...r, level: "danger", reason: "Dépassement" })
    } else if (r.ratio != null && r.ratio >= SUIVI_SEUIL) {
      alerts.push({ ...r, level: "warning", reason: "Proche du seuil" })
    }
  }
  const sev = (lvl: AlertLevel) => (lvl === "danger" ? 0 : 1)
  alerts.sort(
    (a, b) => sev(a.level) - sev(b.level) || (b.ratio ?? Infinity) - (a.ratio ?? Infinity),
  )

  return {
    depenses,
    revenus,
    totals: {
      prevuDep,
      reelDep,
      prevuRev,
      reelRev,
      soldePrevu: prevuRev - prevuDep,
      soldeReel: reelRev - reelDep,
    },
    alerts,
    txCount: realTx.length,
  }
}

/** "+124 280" / "−2 000" (sign always shown; magnitude localised). */
export function signed(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : ""
  return sign + Math.abs(Math.round(n)).toLocaleString("fr-FR")
}

/** ratio → integer percent (null-safe). */
export const pctOf = (ratio: number | null) =>
  ratio == null ? null : Math.round(ratio * 100)

/* ─────────────────────────────────────────────────────────────────────────
   Réel vs prévu BY TEAM (portée = équipe) and by pooled team-group (groupe)
   ───────────────────────────────────────────────────────────────────────── */

/** One team's (or team-group's) plan-vs-real dépense line. */
export type TeamSuiviRow = {
  key: string
  label: string
  /** Pooled team-group (portée = groupe) vs a single team (portée = équipe). */
  isGroup: boolean
  /** "U15 · U13 · U11" — member teams of a group row (empty for a single team). */
  memberNames: string
  prevu: number
  reel: number
  /** prévu − réel (positive = under budget). */
  ecart: number
  ratio: number | null
  favorable: boolean
  /** réel spent with no plan line for this team. */
  noPlan: boolean
}

/**
 * Dépenses réel vs prévu BY TEAM (portée = équipe) and by pooled team-group
 * (portée = groupe). Prévu comes from the validated draft's team-scoped lines;
 * réel from the équipe-scoped transactions (multi-team = full amount to each,
 * per the Finance duplication rule — so a shared movement counts for every team
 * it touches). A team spent-against with no plan line surfaces as "hors budget".
 */
export function buildTeamSuivi(
  planLines: BudgetLine[],
  teamGroups: BudgetTeamGroup[],
  realTx: Transaction[],
  teams: Map<string, FinanceTeam>,
): TeamSuiviRow[] {
  const groupById = new Map(teamGroups.map((g) => [g.id, g]))
  const teamName = (id: string) => teams.get(id)?.name ?? id

  // Only équipe-scoped dépense movements are attributable to a team.
  const teamTx = realTx.filter(
    (t) => t.nature === "Dépense" && t.scope === "equipe" && t.team_ids.length > 0,
  )
  // réel of a set of teams — a movement counts once if it touches ≥1 member.
  const reelOf = (members: string[]): number => {
    const set = new Set(members)
    return teamTx.reduce(
      (s, t) => (t.team_ids.some((id) => set.has(id)) ? s + t.amount : s),
      0,
    )
  }

  type Bucket = { key: string; label: string; isGroup: boolean; members: string[]; prevu: number }
  const buckets = new Map<string, Bucket>()
  const ensure = (key: string, label: string, isGroup: boolean, members: string[]) => {
    let b = buckets.get(key)
    if (!b) buckets.set(key, (b = { key, label, isGroup, members, prevu: 0 }))
    return b
  }

  // Prévu — team-scoped dépense lines of the validated plan.
  for (const l of planLines) {
    if (l.nature !== "Dépense") continue
    if (l.scope_type === "equipe" && l.team_id) {
      ensure(`team:${l.team_id}`, teamName(l.team_id), false, [l.team_id]).prevu += l.montant_estime
    } else if (l.scope_type === "groupe" && l.group_ref) {
      const grp = groupById.get(l.group_ref)
      if (grp) ensure(`grp:${grp.id}`, grp.label, true, grp.team_ids).prevu += l.montant_estime
    }
  }

  // Teams already budgeted (individually or inside a group).
  const covered = new Set<string>()
  for (const b of buckets.values()) b.members.forEach((id) => covered.add(id))

  const toRow = (b: Bucket): TeamSuiviRow => {
    const reel = reelOf(b.members)
    const ecart = b.prevu - reel
    return {
      key: b.key,
      label: b.label,
      isGroup: b.isGroup,
      memberNames: b.isGroup ? b.members.map(teamName).join(" · ") : "",
      prevu: b.prevu,
      reel,
      ecart,
      ratio: b.prevu > 0 ? reel / b.prevu : null,
      favorable: ecart >= 0,
      noPlan: b.prevu === 0 && reel > 0,
    }
  }
  const rows = [...buckets.values()].map(toRow)

  // Hors budget — teams spent-against with no plan line at all.
  const orphans = new Set<string>()
  for (const t of teamTx) for (const id of t.team_ids) if (!covered.has(id)) orphans.add(id)
  for (const id of orphans) {
    rows.push(toRow({ key: `team:${id}`, label: teamName(id), isGroup: false, members: [id], prevu: 0 }))
  }

  // Most-consumed first; hors-budget (null ratio) bubbles to the top.
  return rows.sort(
    (a, b) => (b.ratio ?? Infinity) - (a.ratio ?? Infinity) || b.reel - a.reel,
  )
}
