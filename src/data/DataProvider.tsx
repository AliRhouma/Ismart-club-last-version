import {
  createContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react"

import { r } from "@/lib/format"
import {
  budgetSeed,
  sumLines,
  type BudgetMode,
  type BudgetState,
  type Line,
  type LineList,
} from "@/data/seed/budget"
import { seasonsSeed, type Season } from "@/data/seed/seasons"
import { entriesSeed, type Entry } from "@/data/seed/entries"
import { monthsSeed, type Month } from "@/data/seed/months"

/**
 * App-root in-memory store (plain React Context + useReducer — no library).
 * Seeded from src/data/seed on first render; screens read and mutate through
 * the useData() hook. State lives only in memory and resets on refresh.
 *
 * For now it holds the budget config; future entities extend the same store.
 */

type Action =
  | { type: "setSeason"; season: string }
  | { type: "setMode"; mode: BudgetMode }
  | { type: "setGlobalIncome"; value: number }
  | { type: "setGlobalExpense"; value: number }
  | { type: "updateLine"; list: LineList; id: string; patch: Partial<Line> }
  | { type: "addLine"; list: LineList; line: Line }
  | { type: "removeLine"; list: LineList; id: string }

const globalFor = (state: BudgetState, list: LineList) =>
  list === "income" ? state.globalIncome : state.globalExpense

/** Recompute each line's amount from its pct against a global total. */
const fromPct = (lines: Line[], global: number): Line[] =>
  lines.map((line) => ({ ...line, amount: r(((line.pct ?? 0) / 100) * global) }))

/** Recompute each line's pct from its amount against a total. */
const toPct = (lines: Line[], total: number): Line[] =>
  lines.map((line) => ({ ...line, pct: total ? r((line.amount / total) * 100) : 0 }))

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case "setSeason":
      return { ...state, season: action.season }

    case "setMode": {
      if (action.mode === state.mode) return state
      if (action.mode === "percent") {
        const ti = sumLines(state.income)
        const te = sumLines(state.expenses)
        return {
          ...state,
          mode: "percent",
          globalIncome: ti,
          globalExpense: te,
          income: toPct(state.income, ti),
          expenses: toPct(state.expenses, te),
          teams: toPct(state.teams, te),
        }
      }
      // percent -> amount: lock in the derived amounts
      return {
        ...state,
        mode: "amount",
        income: fromPct(state.income, state.globalIncome),
        expenses: fromPct(state.expenses, state.globalExpense),
        teams: fromPct(state.teams, state.globalExpense),
      }
    }

    case "setGlobalIncome":
      return {
        ...state,
        globalIncome: action.value,
        income: fromPct(state.income, action.value),
      }

    case "setGlobalExpense":
      return {
        ...state,
        globalExpense: action.value,
        expenses: fromPct(state.expenses, action.value),
        teams: fromPct(state.teams, action.value),
      }

    case "updateLine": {
      const global = globalFor(state, action.list)
      const next = state[action.list].map((line) => {
        if (line.id !== action.id) return line
        const merged = { ...line, ...action.patch }
        // editing the pct re-derives the amount from the relevant global
        if (action.patch.pct !== undefined) {
          merged.amount = r(((action.patch.pct ?? 0) / 100) * global)
        }
        return merged
      })
      return { ...state, [action.list]: next }
    }

    case "addLine":
      return { ...state, [action.list]: [...state[action.list], action.line] }

    case "removeLine":
      return {
        ...state,
        [action.list]: state[action.list].filter((line) => line.id !== action.id),
      }

    default:
      return state
  }
}

export type DataContextValue = {
  budget: BudgetState
  /** Past, clôturée seasons shown (read-only) in the season picker. */
  seasons: Season[]
  /** Recorded recettes & dépenses (newest first). */
  entries: Entry[]
  /** Month-by-month planning preview (read-only). */
  months: Month[]
  setSeason: (season: string) => void
  setMode: (mode: BudgetMode) => void
  setGlobalIncome: (value: number) => void
  setGlobalExpense: (value: number) => void
  updateLine: (list: LineList, id: string, patch: Partial<Line>) => void
  addLine: (list: LineList, line?: Partial<Line>) => void
  removeLine: (list: LineList, id: string) => void
  addEntry: (entry: Omit<Entry, "id">) => void
  removeEntry: (id: string) => void
}

export const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [budget, dispatch] = useReducer(reducer, budgetSeed)
  // Archived seasons are read-only for now (no screen mutates them), so they
  // live in plain in-memory state rather than the budget reducer.
  const [seasons] = useState<Season[]>(seasonsSeed)
  // Recorded entries only ever add/remove (no per-field edit), so plain state
  // is enough — no reducer. New entries go to the front (most recent first).
  const [entries, setEntries] = useState<Entry[]>(entriesSeed)
  // Monthly planning preview is read-only for now (the plan screen is
  // auto-filled and self-contained), so it stays in plain in-memory state.
  const [months] = useState<Month[]>(monthsSeed)

  const value = useMemo<DataContextValue>(
    () => ({
      budget,
      seasons,
      entries,
      months,
      setSeason: (season) => dispatch({ type: "setSeason", season }),
      setMode: (mode) => dispatch({ type: "setMode", mode }),
      setGlobalIncome: (value) => dispatch({ type: "setGlobalIncome", value }),
      setGlobalExpense: (value) => dispatch({ type: "setGlobalExpense", value }),
      updateLine: (list, id, patch) =>
        dispatch({ type: "updateLine", list, id, patch }),
      addLine: (list, line) =>
        dispatch({
          type: "addLine",
          list,
          line: {
            id: crypto.randomUUID(),
            label: "",
            amount: 0,
            pct: 0,
            ...line,
          },
        }),
      removeLine: (list, id) => dispatch({ type: "removeLine", list, id }),
      addEntry: (entry) =>
        setEntries((prev) => [{ id: crypto.randomUUID(), ...entry }, ...prev]),
      removeEntry: (id) =>
        setEntries((prev) => prev.filter((entry) => entry.id !== id)),
    }),
    [budget, seasons, entries, months],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
