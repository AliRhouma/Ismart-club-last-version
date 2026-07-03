/**
 * Budget module — Outil Budget (docs: "Module Finance — Outil Budget").
 *
 * A season-scoped budget PREPARATION tool, independent of the legacy Budget
 * screens. Navigation is three levels:
 *   1. Season cards            → Budget2Season (global, date range)
 *   2. Season page (3 tabs)    → Budget2Draft cards (several per season)
 *   3. Work-plan editor        → BudgetLine sections + BudgetTeamGroup blocks
 *
 * A season holds SEVERAL drafts ("Prudent", "Optimiste", "v2"); at most one is
 * `valide` (the reference). Validating a new draft archives the previous one.
 *
 * The category referential (Group → SubCategory) and the scope (portée) are the
 * SAME ones the Transactions module uses — reused here, never duplicated. This
 * file only models the budget-specific entities on top of that referential.
 *
 * Grouping is POOLED: a `groupe` line carries ONE set of amounts for a cluster
 * of teams, counted once (the opposite of the Transactions duplication rule).
 *
 * All amounts are positive magnitudes in TND; the sign/colour is derived from
 * `nature`. Seed rows keep readable slug ids; runtime rows get crypto UUIDs.
 */

export type Budget2Status = "brouillon" | "valide" | "archive"
export type Budget2Scope = "general" | "staff" | "equipe" | "groupe"
export type StaffDepartment = "Technique" | "Administratif"
export type EstimationMethod = "forfaitaire" | "recurrent" | "activite"
export type LineNature = "Dépense" | "Revenu"

/** Season — a GLOBAL entity (shared with Transactions, Équipes…). */
export type Budget2Season = {
  id: string
  label: string
  /** ISO yyyy-mm-dd — the season's date range. */
  start_date: string
  end_date: string
}

/** A budget draft — several per season, at most one `valide`. */
export type Budget2Draft = {
  id: string
  season_id: string
  /** Name on the card ("Prudent", "v2"…). */
  label: string
  status: Budget2Status
  /** Set when it becomes `valide` (reference timestamp). */
  validated_at?: string
  /** Feeds the card's "dernière modification". */
  updated_at: string
}

/** A pooled cluster of teams inside a draft (portée = groupe). */
export type BudgetTeamGroup = {
  id: string
  draft_id: string
  /** e.g. "Jeunes U11–U15". */
  label: string
  /** Member teams (finance team ids); the amount is pooled across them. */
  team_ids: string[]
}

/** Estimator entries — kept alongside the result so imports can recompute. */
export type EstimationInputs = {
  /** récurrent: montant × nb périodes */
  amount?: number
  periods?: number
  /** activité: quantité × coût unitaire */
  qty?: number
  unit_cost?: number
}

/** One budget line. group (+ subcategory) + scope + estimated amount. */
export type BudgetLine = {
  id: string
  draft_id: string
  nature: LineNature
  /** Same referential as Transactions. */
  group_id: string
  /** Optional — a line can stay at the Groupe level. */
  subcategory_id?: string
  scope_type: Budget2Scope
  /** if scope=staff */
  staff_department?: StaffDepartment
  /** if scope=equipe */
  team_id?: string
  /** if scope=groupe → BudgetTeamGroup id */
  group_ref?: string
  /** Estimated amount (pooled → counted once for a group line). */
  montant_estime: number
  estimation_method: EstimationMethod
  /** Kept for the estimator + import (récurrent / activité entries). */
  estimation_inputs?: EstimationInputs
}

/* ── Status metadata (labels + badge variants) ──────────────────────────── */
export const STATUS_META: Record<
  Budget2Status,
  { label: string; badge: "info" | "success" | "default" }
> = {
  brouillon: { label: "Brouillon", badge: "info" },
  valide: { label: "Validé", badge: "success" },
  archive: { label: "Archivé", badge: "default" },
}

/* ── Estimation ─────────────────────────────────────────────────────────── */
/** Compute a line's amount from its estimator inputs (falls back to `stored`). */
export function computeEstimate(
  method: EstimationMethod,
  inputs: EstimationInputs | undefined,
  stored: number,
): number {
  if (method === "recurrent") {
    return Math.round((inputs?.amount ?? 0) * (inputs?.periods ?? 0))
  }
  if (method === "activite") {
    return Math.round((inputs?.qty ?? 0) * (inputs?.unit_cost ?? 0))
  }
  return stored
}

/* ── Derived selectors (computed in render, never stored) ───────────────── */
export const draftLines = (lines: BudgetLine[], draftId: string) =>
  lines.filter((l) => l.draft_id === draftId)

export const draftGroups = (groups: BudgetTeamGroup[], draftId: string) =>
  groups.filter((g) => g.draft_id === draftId)

export type DraftTotals = { depenses: number; revenus: number; solde: number }

/** Total revenus / dépenses / solde of a draft (pooled lines counted once). */
export function draftTotals(lines: BudgetLine[], draftId: string): DraftTotals {
  let depenses = 0
  let revenus = 0
  for (const l of lines) {
    if (l.draft_id !== draftId) continue
    if (l.nature === "Revenu") revenus += l.montant_estime
    else depenses += l.montant_estime
  }
  return { depenses, revenus, solde: revenus - depenses }
}

export const sumLines = (lines: BudgetLine[]) =>
  lines.reduce((acc, l) => acc + l.montant_estime, 0)

/**
 * Non-overlap guard. A (team, category) couple must be budgeted EITHER
 * individually OR via a group — never both. Returns the offending couples so
 * the editor can warn. `category` = group_id (the budget granularity).
 */
export type Conflict = { teamId: string; groupId: string; groupLabel: string }

export function detectConflicts(
  lines: BudgetLine[],
  groups: BudgetTeamGroup[],
  draftId: string,
): Conflict[] {
  const dep = lines.filter((l) => l.draft_id === draftId && l.nature === "Dépense")
  const indiv = dep.filter((l) => l.scope_type === "equipe" && l.team_id)
  const pooled = dep.filter((l) => l.scope_type === "groupe" && l.group_ref)
  const groupById = new Map(groups.map((g) => [g.id, g]))

  const out: Conflict[] = []
  const seen = new Set<string>()
  for (const gl of pooled) {
    const grp = groupById.get(gl.group_ref!)
    if (!grp) continue
    for (const il of indiv) {
      if (il.group_id !== gl.group_id) continue
      if (!grp.team_ids.includes(il.team_id!)) continue
      const key = `${il.team_id}:${gl.group_id}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ teamId: il.team_id!, groupId: gl.group_id, groupLabel: grp.label })
    }
  }
  return out
}

/* ─────────────────────────────────────────────────────────────────────────
   SEED
   ───────────────────────────────────────────────────────────────────────── */

/** group / sub id helpers — mirror the finance referential ids. */
const g = (slug: string) => `grp-${slug}`
const s = (slug: string, n: number) => `sub-${slug}-${n}`

export const budget2SeasonsSeed: Budget2Season[] = [
  {
    id: "s2-2025-2026",
    label: "Saison 2025 / 2026",
    start_date: "2025-08-01",
    end_date: "2026-06-30",
  },
  {
    id: "s2-2026-2027",
    label: "Saison 2026 / 2027",
    start_date: "2026-08-01",
    end_date: "2027-06-30",
  },
]

export const budget2DraftsSeed: Budget2Draft[] = [
  {
    id: "d2-reference",
    season_id: "s2-2025-2026",
    label: "Référence",
    status: "valide",
    validated_at: "2025-07-18T10:30:00",
    updated_at: "2025-07-18T10:30:00",
  },
  {
    id: "d2-prudent",
    season_id: "s2-2025-2026",
    label: "Prudent",
    status: "brouillon",
    updated_at: "2025-06-28T16:12:00",
  },
  {
    id: "d2-optimiste",
    season_id: "s2-2025-2026",
    label: "Optimiste (v1)",
    status: "archive",
    updated_at: "2025-06-10T09:05:00",
  },
]

export const budget2GroupsSeed: BudgetTeamGroup[] = [
  {
    id: "btg-jeunes-ref",
    draft_id: "d2-reference",
    label: "Jeunes U11–U15",
    team_ids: ["team-u15", "team-u13", "team-u11"],
  },
]

/* ── Line builder (keeps the seed compact + consistent) ─────────────────── */
let seq = 0
type LineExtra = Partial<
  Pick<
    BudgetLine,
    | "subcategory_id"
    | "staff_department"
    | "team_id"
    | "group_ref"
    | "estimation_method"
    | "estimation_inputs"
  >
>
function ln(
  draftId: string,
  nature: LineNature,
  scope: Budget2Scope,
  groupSlug: string,
  subN: number | null,
  amount: number,
  extra: LineExtra = {},
): BudgetLine {
  return {
    id: `l2-${++seq}`,
    draft_id: draftId,
    nature,
    group_id: g(groupSlug),
    subcategory_id: subN ? s(groupSlug, subN) : undefined,
    scope_type: scope,
    montant_estime: amount,
    estimation_method: "forfaitaire",
    ...extra,
  }
}

/* Reference draft — the full §10 example (solde prévisionnel −7 000). */
const REF = "d2-reference"
const referenceLines: BudgetLine[] = [
  /* 1 — Dépenses générales (Général) → 38 500 */
  ln(REF, "Dépense", "general", "loyer", 1, 12000),
  ln(REF, "Dépense", "general", "admin", 2, 3500), // Assurance
  ln(REF, "Dépense", "general", "charges", 1, 4000), // Eau & énergie
  ln(REF, "Dépense", "general", "entretien", 1, 5000),
  ln(REF, "Dépense", "general", "admin", 1, 6000), // Frais administratifs
  ln(REF, "Dépense", "general", "competition", 1, 8000), // Frais de compétition

  /* 2 — Staff (Staff) → Technique 40 500 + Administratif 30 000 = 70 500 */
  ln(REF, "Dépense", "staff", "salaires", 1, 36000, {
    staff_department: "Technique",
    estimation_method: "recurrent",
    estimation_inputs: { amount: 3000, periods: 12 },
  }),
  ln(REF, "Dépense", "staff", "primes", 1, 3000, { staff_department: "Technique" }),
  ln(REF, "Dépense", "staff", "equipement", 3, 1500, { staff_department: "Technique" }),
  ln(REF, "Dépense", "staff", "salaires", 2, 22000, { staff_department: "Administratif" }),
  ln(REF, "Dépense", "staff", "salaires", 3, 8000, { staff_department: "Administratif" }), // Charges (URSSAF)

  /* 3 — Équipes → [Groupe] Jeunes 17 500 + Séniors 30 500 = 48 000 */
  ln(REF, "Dépense", "groupe", "equipement", 1, 6000, { group_ref: "btg-jeunes-ref" }),
  ln(REF, "Dépense", "groupe", "transport", 1, 5000, { group_ref: "btg-jeunes-ref" }),
  ln(REF, "Dépense", "groupe", "hebergement", 1, 2000, { group_ref: "btg-jeunes-ref" }),
  ln(REF, "Dépense", "groupe", "restauration", 1, 3000, { group_ref: "btg-jeunes-ref" }),
  ln(REF, "Dépense", "groupe", "primes", 1, 1500, { group_ref: "btg-jeunes-ref" }),

  ln(REF, "Dépense", "equipe", "equipement", 1, 4000, { team_id: "team-seniors" }),
  ln(REF, "Dépense", "equipe", "transport", 1, 8000, {
    team_id: "team-seniors",
    estimation_method: "activite",
    estimation_inputs: { qty: 20, unit_cost: 400 },
  }),
  ln(REF, "Dépense", "equipe", "hebergement", 1, 6000, { team_id: "team-seniors" }),
  ln(REF, "Dépense", "equipe", "restauration", 1, 4000, { team_id: "team-seniors" }),
  ln(REF, "Dépense", "equipe", "primes", 1, 6000, { team_id: "team-seniors" }),
  ln(REF, "Dépense", "equipe", "competition", 3, 2500, {
    team_id: "team-seniors",
    estimation_method: "activite",
    estimation_inputs: { qty: 10, unit_cost: 250 },
  }),

  /* 4 — Revenus (Général) → 150 000 */
  ln(REF, "Revenu", "general", "sponsor", 3, 30000), // Subvention communale
  ln(REF, "Revenu", "general", "sponsor", 4, 10000), // Subvention CNDS
  ln(REF, "Revenu", "general", "sponsor", 1, 45000), // Sponsor principal
  ln(REF, "Revenu", "general", "sponsor", 2, 15000), // Sponsors secondaires
  ln(REF, "Revenu", "general", "supporteurs", 1, 30000), // Cotisations
  ln(REF, "Revenu", "general", "supporteurs", 2, 8000), // Billetterie
  ln(REF, "Revenu", "general", "collecte", 1, 12000), // Collecte
]

/* Prudent draft — a lighter work-in-progress (fewer lines, tighter figures). */
const PRU = "d2-prudent"
const prudentLines: BudgetLine[] = [
  ln(PRU, "Dépense", "general", "loyer", 1, 12000),
  ln(PRU, "Dépense", "general", "admin", 2, 3200),
  ln(PRU, "Dépense", "general", "charges", 1, 3600),
  ln(PRU, "Dépense", "staff", "salaires", 1, 30000, {
    staff_department: "Technique",
    estimation_method: "recurrent",
    estimation_inputs: { amount: 2500, periods: 12 },
  }),
  ln(PRU, "Dépense", "staff", "salaires", 2, 20000, { staff_department: "Administratif" }),
  ln(PRU, "Dépense", "equipe", "transport", 1, 6000, { team_id: "team-seniors" }),
  ln(PRU, "Revenu", "general", "sponsor", 1, 40000),
  ln(PRU, "Revenu", "general", "supporteurs", 1, 28000),
  ln(PRU, "Revenu", "general", "sponsor", 3, 25000),
]

/* Optimiste (archived) — a stretch scenario with stronger revenus. */
const OPT = "d2-optimiste"
const optimisteLines: BudgetLine[] = [
  ln(OPT, "Dépense", "general", "loyer", 1, 12000),
  ln(OPT, "Dépense", "staff", "salaires", 1, 42000, { staff_department: "Technique" }),
  ln(OPT, "Dépense", "equipe", "transport", 1, 9000, { team_id: "team-seniors" }),
  ln(OPT, "Revenu", "general", "sponsor", 1, 60000),
  ln(OPT, "Revenu", "general", "sponsor", 2, 25000),
  ln(OPT, "Revenu", "general", "supporteurs", 1, 32000),
]

export const budget2LinesSeed: BudgetLine[] = [
  ...referenceLines,
  ...prudentLines,
  ...optimisteLines,
]
