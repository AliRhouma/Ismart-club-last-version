/**
 * Recorded budget entries (saisie des recettes & dépenses).
 *
 * Unlike the simulated "réel" transactions (derived deterministically from the
 * config in src/features/budget/simulate.ts), these are the entries a user
 * records live on the dashboard — they persist in the store and ripple into the
 * stats, the transactions table, the per-category bars and team tracking.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 * `cat` matches a recette source label (kind "in") or a dépense category label
 * (kind "out") from the config. `teams` is one or more affected teams — for a
 * dépense the amount is split equally between them. Amounts are positive
 * magnitudes in TND; the sign is derived from kind.
 */

export type EntryKind = "in" | "out"

export type Entry = {
  id: string
  date: string
  label: string
  cat: string
  teams: string[]
  amount: number
  kind: EntryKind
}

/** A couple of recent saisies so the feature reads on first load (newest first). */
export const entriesSeed: Entry[] = [
  {
    id: "entry-sponsor-delice",
    date: "16 Mai",
    label: "Sponsor Délice — acompte",
    cat: "Sponsors",
    teams: ["Club"],
    amount: 6000,
    kind: "in",
  },
  {
    id: "entry-ballons-decathlon",
    date: "15 Mai",
    label: "Achat ballons — Decathlon",
    cat: "Équipement",
    teams: ["U15", "U17"],
    amount: 740,
    kind: "out",
  },
]
