/**
 * Monthly planning slice — seed (preview only) for the monthly view.
 *
 * Each row is one month of the active season with its prévisionnel (budget*)
 * and its réel (income / expense). Closed months are realised, the current
 * month is partially consumed, and planned months are not started yet (réel 0)
 * — they are the ones the user sets a plan for.
 *
 * This is preview data: derived values (solde, consommation, % du prévu) are
 * computed in render, never stored. No engine — the plan screen is auto-filled.
 */

export type MonthStatus = "closed" | "current" | "planned"

export type Month = {
  id: string
  key: string
  label: string
  short: string
  status: MonthStatus
  budgetIncome: number
  budgetExpense: number
  income: number
  expense: number
}

export const monthsSeed: Month[] = [
  { id: "m-2027-01", key: "2027-01", label: "Janvier 2027", short: "Jan", status: "closed", budgetIncome: 24000, budgetExpense: 21000, income: 23200, expense: 20100 },
  { id: "m-2027-02", key: "2027-02", label: "Février 2027", short: "Fév", status: "closed", budgetIncome: 22000, budgetExpense: 20000, income: 22600, expense: 19400 },
  // edge case: a month that closed over budget (dépassement)
  { id: "m-2027-03", key: "2027-03", label: "Mars 2027", short: "Mar", status: "closed", budgetIncome: 26000, budgetExpense: 22000, income: 24800, expense: 22900 },
  { id: "m-2027-04", key: "2027-04", label: "Avril 2027", short: "Avr", status: "closed", budgetIncome: 23000, budgetExpense: 20500, income: 23500, expense: 19200 },
  { id: "m-2027-05", key: "2027-05", label: "Mai 2027", short: "Mai", status: "current", budgetIncome: 25000, budgetExpense: 21500, income: 14200, expense: 13050 },
  { id: "m-2027-06", key: "2027-06", label: "Juin 2027", short: "Juin", status: "planned", budgetIncome: 27000, budgetExpense: 23000, income: 0, expense: 0 },
  { id: "m-2027-07", key: "2027-07", label: "Juillet 2027", short: "Juil", status: "planned", budgetIncome: 18000, budgetExpense: 16000, income: 0, expense: 0 },
]
