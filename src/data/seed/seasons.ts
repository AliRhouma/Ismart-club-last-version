/**
 * Past-seasons archive — seed for the season picker (SeasonSelectScreen).
 * These are clôturées / read-only summaries, shown as NON-clickable cards in
 * front of the budget configuration ("Nouvelle saison").
 *
 * The ACTIVE season is NOT seeded here — it is derived live from the budget
 * store so its prévisionnel totals stay in sync with the config screen.
 *
 * Amounts are realised totals in TND. `solde` (income − expense) is derived in
 * render, never stored. Seed rows keep readable slug ids.
 */

export type Season = {
  id: string
  label: string
  status: "archived"
  income: number
  expense: number
  teamCount: number
}

export const seasonsSeed: Season[] = [
  {
    id: "season-2025-2026",
    label: "Saison 2025–2026",
    status: "archived",
    income: 264500,
    expense: 251800,
    teamCount: 6,
  },
  {
    // edge case: a season that closed in deficit
    id: "season-2024-2025",
    label: "Saison 2024–2025",
    status: "archived",
    income: 238000,
    expense: 246400,
    teamCount: 5,
  },
  {
    id: "season-2023-2024",
    label: "Saison 2023–2024",
    status: "archived",
    income: 199000,
    expense: 191200,
    teamCount: 5,
  },
]
