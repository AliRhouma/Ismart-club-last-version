/**
 * Budget prototype data slice — seed (initial values) + shapes.
 * A "line" is one editable row: a revenue source, an expense category, or a
 * team allocation. Amounts are in TND. `pct` is only meaningful in percentage
 * saisie mode; `threshold` is the alert seuil (% of consumption) for expenses.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

export type BudgetMode = "amount" | "percent"

export type Line = {
  id: string
  label: string
  amount: number
  pct?: number
  threshold?: number
}

export type BudgetState = {
  season: string
  mode: BudgetMode
  globalIncome: number
  globalExpense: number
  income: Line[]
  expenses: Line[]
  teams: Line[]
}

/** Which collection a line belongs to. */
export type LineList = "income" | "expenses" | "teams"

export const sumLines = (lines: Line[]) =>
  lines.reduce((total, line) => total + (line.amount || 0), 0)

const INCOME: Line[] = [
  { id: "inc-cotisations", label: "Cotisations", amount: 96000 },
  { id: "inc-subventions", label: "Subventions", amount: 60000 },
  { id: "inc-sponsors", label: "Sponsors", amount: 55000 },
  { id: "inc-billetterie", label: "Billetterie", amount: 22500 },
  { id: "inc-merchandising", label: "Merchandising", amount: 15000 },
  { id: "inc-buvette", label: "Buvette & événements", amount: 12000 },
  { id: "inc-stages", label: "Stages d'été", amount: 8000 },
]

const EXPENSES: Line[] = [
  { id: "exp-salaires", label: "Salaires & staff", amount: 110000, threshold: 95 },
  { id: "exp-location", label: "Location installations", amount: 30000, threshold: 90 },
  { id: "exp-equipement", label: "Équipement", amount: 28000, threshold: 90 },
  { id: "exp-deplacements", label: "Déplacements", amount: 24000, threshold: 80 },
  { id: "exp-medical", label: "Frais médicaux", amount: 14000, threshold: 85 },
  { id: "exp-arbitrage", label: "Arbitrage", amount: 9000, threshold: 88 },
  { id: "exp-formation", label: "Formation", amount: 7000, threshold: 90 },
  { id: "exp-admin", label: "Administratif", amount: 12000, threshold: 90 },
  { id: "exp-communication", label: "Communication", amount: 6000, threshold: 85 },
  { id: "exp-assurance", label: "Assurance", amount: 8000, threshold: 95 },
]

const TEAMS: Line[] = [
  { id: "team-seniors", label: "Séniors", amount: 110000 },
  { id: "team-u17", label: "U17", amount: 38000 },
  { id: "team-u15", label: "U15", amount: 34000 },
  { id: "team-u13", label: "U13", amount: 22000 },
  { id: "team-feminines", label: "Féminines", amount: 30000 },
  { id: "team-academie", label: "Académie U11", amount: 14000 },
]

export const budgetSeed: BudgetState = {
  season: "Saison 2026–2027",
  mode: "amount",
  globalIncome: sumLines(INCOME),
  globalExpense: sumLines(EXPENSES),
  income: INCOME,
  expenses: EXPENSES,
  teams: TEAMS,
}
