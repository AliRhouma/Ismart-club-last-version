import { fmt, r } from "@/lib/format"
import { sumLines, type BudgetState, type Line } from "@/data/seed/budget"

/**
 * Deterministic "réel" simulation derived from the budget config. This is
 * display-only mock data (a prototype, not a real finance engine): given the
 * same config it always produces the same transactions, consumption rates and
 * alerts, so the dashboard feels alive without any backend.
 */

export type TxKind = "in" | "out"

export type Transaction = {
  date: string
  label: string
  cat: string
  team: string
  amount: number
  kind: TxKind
  /** false = AI-uncategorised (flagged for review) */
  auto: boolean
}

export type ExpenseReal = Line & { real: number; cons: number; threshold: number }
export type TeamReal = Line & { real: number; cons: number; remaining: number }

export type AlertType = "warning" | "error" | "info"
export type BudgetAlert = { type: AlertType; title: string; desc: string; time: string }
export type Reco = { tone: "warn" | "info" | "good"; text: string }

export type BudgetSim = {
  totalIncome: number
  totalExpense: number
  realIncome: number
  realExpense: number
  balance: number
  expReal: ExpenseReal[]
  teamReal: TeamReal[]
  transactions: Transaction[]
  txByCat: Record<string, Transaction[]>
  alerts: BudgetAlert[]
  recos: Reco[]
  breaches: ExpenseReal[]
}

// Consumed % per line — fixed for the seeded set, deterministic fallback after.
const EXP_FACTOR = [62, 68, 55, 86, 71, 90, 48, 58, 64, 50]
const TEAM_FACTOR = [64, 58, 72, 49, 67, 55]
const expCons = (i: number) => EXP_FACTOR[i] ?? 45 + ((i * 23) % 45)
const teamCons = (i: number) => TEAM_FACTOR[i] ?? 40 + ((i * 17) % 45)
const incFactor = (i: number) => 0.55 + ((i * 31) % 30) / 100

const DATES = [
  "14 Mai", "13 Mai", "12 Mai", "11 Mai", "10 Mai", "09 Mai", "08 Mai", "07 Mai",
  "06 Mai", "05 Mai", "04 Mai", "03 Mai", "02 Mai", "01 Mai", "29 Avr", "27 Avr",
  "25 Avr", "23 Avr",
]

const vendorFor = (l: string) => {
  const s = l.toLowerCase()
  if (s.includes("équip") || s.includes("equip")) return "Decathlon Sousse"
  if (s.includes("place")) return "Carburant — déplacement Sfax"
  if (s.includes("loc") || s.includes("install")) return "Facture STEG (électricité)"
  if (s.includes("dical") || s.includes("médic") || s.includes("medic")) return "Séance physio — A. Mejri"
  if (s.includes("salair")) return "Virement salaires — Avril"
  if (s.includes("arbitr")) return "Indemnité arbitrage — J12"
  if (s.includes("format")) return "Stage entraîneurs FTF"
  if (s.includes("commun")) return "Sponsoring réseaux sociaux"
  if (s.includes("admin")) return "Logiciel de gestion"
  if (s.includes("assur")) return "Prime assurance — T2"
  return l
}
const vendorAlt = (l: string) => {
  const s = l.toLowerCase()
  if (s.includes("équip") || s.includes("equip")) return "Tunisia Sport Equip"
  if (s.includes("place")) return "Location bus — Trans Sahel"
  if (s.includes("loc") || s.includes("install")) return "Facture SONEDE (eau)"
  if (s.includes("dical") || s.includes("médic")) return "Pharmacie El Manar"
  if (s.includes("salair")) return "Prime de match — staff"
  if (s.includes("arbitr")) return "Frais commissaire"
  if (s.includes("format")) return "Atelier vidéo-analyse"
  if (s.includes("commun")) return "Impression flyers"
  if (s.includes("admin")) return "Frais bancaires"
  if (s.includes("assur")) return "Assurance joueurs"
  return l
}

export function simulateBudget(state: BudgetState): BudgetSim {
  const { income, expenses, teams } = state
  const totalIncome = sumLines(income)
  const totalExpense = sumLines(expenses)

  const realIncome = r(income.reduce((s, it, i) => s + it.amount * incFactor(i), 0))

  const expReal: ExpenseReal[] = expenses.map((e, i) => {
    const cons = expCons(i)
    return { ...e, real: r((e.amount * cons) / 100), cons, threshold: e.threshold ?? 90 }
  })
  const realExpense = expReal.reduce((s, e) => s + e.real, 0)

  const teamReal: TeamReal[] = teams.map((t, i) => {
    const cons = teamCons(i)
    const real = r((t.amount * cons) / 100)
    return { ...t, real, cons, remaining: t.amount - real }
  })

  const incTx: Transaction[] = [
    { date: DATES[0], label: "Sponsor Tunisie Telecom — T2", cat: income[2]?.label || "Sponsors", team: "Club", amount: 13750, kind: "in", auto: true },
    { date: DATES[1], label: "Subvention municipale — T1", cat: income[1]?.label || "Subventions", team: "Club", amount: 18000, kind: "in", auto: true },
    { date: DATES[2], label: `Cotisations ${teams[2]?.label || "U15"} (mars)`, cat: income[0]?.label || "Cotisations", team: teams[2]?.label || "U15", amount: 4800, kind: "in", auto: true },
    { date: DATES[3], label: "Billetterie — match amical", cat: income[3]?.label || "Billetterie", team: teams[0]?.label || "Séniors", amount: 3200, kind: "in", auto: true },
  ]

  let di = 4
  const expTx: Transaction[] = []
  expenses.forEach((e, i) => {
    const t1 = teams[i % Math.max(teams.length, 1)]?.label || "Club"
    expTx.push({
      date: DATES[di++ % DATES.length],
      label: vendorFor(e.label),
      cat: e.label,
      team: t1,
      amount: -r(e.amount * 0.05 + 150),
      kind: "out",
      auto: !/dical|médic|medic/i.test(e.label),
    })
    if (i % 2 === 0) {
      const t2 = teams[(i + 2) % Math.max(teams.length, 1)]?.label || "Club"
      expTx.push({
        date: DATES[di++ % DATES.length],
        label: vendorAlt(e.label),
        cat: e.label,
        team: t2,
        amount: -r(e.amount * 0.03 + 100),
        kind: "out",
        auto: true,
      })
    }
  })

  const transactions = [...incTx, ...expTx]
  const txByCat: Record<string, Transaction[]> = {}
  expTx.forEach((t) => {
    ;(txByCat[t.cat] = txByCat[t.cat] || []).push(t)
  })

  const breaches = expReal.filter((e) => e.cons >= e.threshold)
  const alerts: BudgetAlert[] = [
    ...breaches.map((e) => ({
      type: "warning" as const,
      title: `${e.label} à ${e.cons}% du budget alloué`,
      desc: `Seuil fixé à ${e.threshold}% · ${fmt(e.real)} / ${fmt(e.amount)}`,
      time: "il y a 1h",
    })),
    { type: "error", title: "Cotisations impayées — 12 membres", desc: "Retard moyen 23 jours · 5 760 TND attendus.", time: "il y a 4h" },
    { type: "info", title: "3 transactions non catégorisées", desc: "À classer pour mettre à jour le tableau de bord.", time: "il y a 1j" },
  ]

  const sorted = [...expReal].sort((a, b) => b.cons - a.cons)
  const hot = sorted[0]
  const cool = sorted[sorted.length - 1]
  const balance = totalIncome - totalExpense
  const recos: Reco[] = [
    hot && {
      tone: "warn" as const,
      text: `Surveiller « ${hot.label} » : ${hot.cons}% consommé${hot.cons >= hot.threshold ? ", seuil dépassé" : ""}.`,
    },
    cool && {
      tone: "info" as const,
      text: `Sous-utilisation de « ${cool.label} » (${cool.cons}%). Envisager une réallocation.`,
    },
    balance >= 0
      ? { tone: "good" as const, text: `Excédent projeté de ${fmt(balance)} : possibilité de constituer une réserve.` }
      : { tone: "warn" as const, text: `Déficit projeté de ${fmt(-balance)} : réduire les postes non essentiels.` },
  ].filter((x): x is Reco => Boolean(x))

  return {
    totalIncome,
    totalExpense,
    realIncome,
    realExpense,
    balance,
    expReal,
    teamReal,
    transactions,
    txByCat,
    alerts,
    recos,
    breaches,
  }
}
