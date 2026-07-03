import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Bell,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtShort, r } from "@/lib/format"
import { useData } from "@/data/useData"
import type { Entry, EntryKind } from "@/data/seed/entries"
import {
  simulateBudget,
  type BudgetAlert,
  type Transaction,
} from "@/features/budget/simulate"
import { EntryModal } from "@/features/budget/EntryModal"
import {
  Bar,
  CatTag,
  PageHead,
  Panel,
  Segmented,
  Stat,
  TeamChip,
} from "@/features/budget/ui"

/** A transactions-table row — either simulated or a recorded entry. */
type Row = Transaction & {
  manual?: boolean
  entryId?: string
  teams?: string[]
}

const alertTone = {
  error: { dot: "bg-danger" },
  warning: { dot: "bg-warning" },
  info: { dot: "bg-info" },
} as const

function AlertRow({ a }: { a: BudgetAlert }) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", alertTone[a.type].dot)} />
      <div className="min-w-0 flex-1">
        <div className="font-body text-[0.85rem] text-ink">{a.title}</div>
        <div className="font-body text-[0.78rem] text-ink-muted">{a.desc}</div>
      </div>
      <span className="font-body text-[0.72rem] whitespace-nowrap text-ink-disabled">
        {a.time}
      </span>
    </div>
  )
}

export function BudgetDashboardScreen() {
  const navigate = useNavigate()
  const { budget } = useData()
  const [tab, setTab] = useState<"suivi" | "alertes">("suivi")
  const [entryKind, setEntryKind] = useState<EntryKind | null>(null)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)

  const sim = useMemo(() => simulateBudget(budget), [budget])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  return (
    <>
      <PageHead
        title="Pilotage du budget"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/budget/nouvelle")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-ui text-sm font-semibold text-ink transition-colors hover:border-[var(--border-hover)] hover:bg-accent"
            >
              <ArrowLeft size={15} /> Configuration
            </button>
            <button
              type="button"
              onClick={() => navigate("/budget/mensuel")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-ui text-sm font-semibold text-ink transition-colors hover:border-[var(--border-hover)] hover:bg-accent"
            >
              <CalendarRange size={15} /> Mensuel
            </button>
            <button
              type="button"
              onClick={() => setEntryKind("out")}
              className="inline-flex items-center gap-1.5 rounded-md border border-team-away/30 bg-team-away/[0.06] px-3.5 py-2 font-ui text-sm font-medium text-team-away transition-colors hover:bg-team-away/15"
            >
              <TrendingDown size={15} /> Dépense
            </button>
            <button
              type="button"
              onClick={() => setEntryKind("in")}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <TrendingUp size={15} /> Recette
            </button>
          </div>
        }
      />

      <Segmented
        className="mb-5"
        value={tab}
        onChange={setTab}
        options={[
          { value: "suivi", label: "Suivi" },
          { value: "alertes", label: "Alertes", badge: sim.alerts.length },
        ]}
      />

      <div key={tab}>
        {tab === "suivi" ? <TabSuivi sim={sim} /> : <TabAlertes sim={sim} />}
      </div>

      {entryKind ? (
        <EntryModal
          kind={entryKind}
          onClose={() => setEntryKind(null)}
          onAdded={(msg) => setToast({ id: toastId.current++, msg })}
        />
      ) : null}

      {toast ? (
        <div
          key={toast.id}
          role="status"
          className="animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-success/30 bg-surface px-4 py-3 shadow-deep"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={14} />
          </span>
          <span className="font-body text-[0.84rem] text-ink">{toast.msg}</span>
        </div>
      ) : null}
    </>
  )
}

/* ── Compact dropdown filter (category / team) ─────────────────────────── */
function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  allLabel: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "cursor-pointer appearance-none rounded-md border bg-input-bg py-1.5 pr-7 pl-3 font-ui text-[0.72rem] font-semibold outline-none transition-colors focus:border-border-focus",
          value === "all"
            ? "border-input text-ink-muted hover:text-ink"
            : "border-info/30 text-info",
        )}
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface text-ink">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-ink-disabled"
      />
    </div>
  )
}

/* ───────── Suivi ───────── */
function TabSuivi({ sim }: { sim: ReturnType<typeof simulateBudget> }) {
  const navigate = useNavigate()
  const { entries, removeEntry } = useData()
  const [showAlerts, setShowAlerts] = useState(true)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "in" | "out">("all")
  const [query, setQuery] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")

  // Merge the recorded entries into the simulated "réel" view: they lift the
  // headline stats, head the transactions list, and ripple into the per-category
  // bars and team tracking — so a saisie behaves like real data everywhere.
  const view = useMemo(() => {
    const toRow = (e: Entry): Row => ({
      date: e.date,
      label: e.label,
      cat: e.cat,
      team: e.teams[0] ?? "—",
      teams: e.teams,
      amount: e.kind === "out" ? -e.amount : e.amount,
      kind: e.kind,
      auto: true,
      manual: true,
      entryId: e.id,
    })

    let manualIn = 0
    let manualOut = 0
    const outByCat: Record<string, number> = {}
    const outByTeam: Record<string, number> = {}
    const manualByCat: Record<string, Row[]> = {}
    entries.forEach((e) => {
      if (e.kind === "in") {
        manualIn += e.amount
        return
      }
      manualOut += e.amount
      outByCat[e.cat] = (outByCat[e.cat] || 0) + e.amount
      // A dépense shared across teams splits equally between them.
      const share = e.amount / Math.max(e.teams.length, 1)
      e.teams.forEach((tm) => {
        outByTeam[tm] = (outByTeam[tm] || 0) + share
      })
      ;(manualByCat[e.cat] = manualByCat[e.cat] || []).push(toRow(e))
    })

    const expReal = sim.expReal.map((e) => {
      const add = outByCat[e.label] || 0
      if (!add) return e
      const real = e.real + add
      return { ...e, real, cons: e.amount ? r((real / e.amount) * 100) : e.cons }
    })

    const teamReal = sim.teamReal.map((t) => {
      const add = outByTeam[t.label] || 0
      if (!add) return t
      const real = t.real + add
      return {
        ...t,
        real,
        cons: t.amount ? r((real / t.amount) * 100) : t.cons,
        remaining: t.amount - real,
      }
    })

    const txByCat: Record<string, Row[]> = {}
    new Set([...Object.keys(sim.txByCat), ...Object.keys(manualByCat)]).forEach(
      (c) => {
        txByCat[c] = [...(manualByCat[c] || []), ...(sim.txByCat[c] || [])]
      },
    )

    return {
      realIncome: sim.realIncome + manualIn,
      realExpense: sim.realExpense + manualOut,
      transactions: [...entries.map(toRow), ...sim.transactions] as Row[],
      expReal,
      teamReal,
      txByCat,
    }
  }, [sim, entries])

  const incPct = sim.totalIncome ? r((view.realIncome / sim.totalIncome) * 100) : 0
  const expPct = sim.totalExpense ? r((view.realExpense / sim.totalExpense) * 100) : 0
  const realBal = view.realIncome - view.realExpense

  const counts = {
    all: view.transactions.length,
    in: view.transactions.filter((t) => t.kind === "in").length,
    out: view.transactions.filter((t) => t.kind === "out").length,
  }

  // Filter options derived from the transactions actually present.
  const cats = useMemo(
    () => Array.from(new Set(view.transactions.map((t) => t.cat))).sort(),
    [view.transactions],
  )
  const teams = useMemo(
    () =>
      Array.from(
        new Set(view.transactions.flatMap((t) => t.teams ?? [t.team])),
      ).sort(),
    [view.transactions],
  )

  const q = query.trim().toLowerCase()
  const txs = view.transactions.filter((t) => {
    if (filter !== "all" && t.kind !== filter) return false
    if (catFilter !== "all" && t.cat !== catFilter) return false
    if (teamFilter !== "all" && !(t.teams ?? [t.team]).includes(teamFilter))
      return false
    if (q && !t.label.toLowerCase().includes(q) && !t.cat.toLowerCase().includes(q))
      return false
    return true
  })

  const active =
    filter !== "all" || catFilter !== "all" || teamFilter !== "all" || q !== ""
  const resetFilters = () => {
    setFilter("all")
    setCatFilter("all")
    setTeamFilter("all")
    setQuery("")
  }

  const chip = (key: "all" | "in" | "out", label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-ui text-[0.64rem] font-medium tracking-[0.05em] uppercase transition-colors",
        filter === key
          ? "border-info/30 bg-info/10 text-info"
          : "border-border text-ink-muted hover:text-ink",
      )}
    >
      {label}
      <span className="rounded-full bg-accent px-1.5 text-[0.62rem]">
        {counts[key]}
      </span>
    </button>
  )

  return (
    <>
      {/* Dismissible alerts banner */}
      {showAlerts ? (
        <div className="mb-[1.1rem] overflow-hidden rounded-md border border-warning/20 bg-warning/[0.04]">
          <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5 text-warning">
            <Bell size={15} />
            <span className="flex-1 font-ui text-[0.74rem] font-medium tracking-[0.06em] uppercase">
              Alertes ({sim.alerts.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAlerts(false)}
              aria-label="Masquer les alertes"
              className="flex size-[26px] items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-[var(--border-hover)] hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
          <div className="px-3.5 pt-1 pb-2">
            {sim.alerts.map((a, i) => (
              <AlertRow a={a} key={i} />
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAlerts(true)}
          className="mb-[1.1rem] inline-flex items-center gap-1.5 rounded-pill border border-warning/25 bg-warning/[0.06] px-3.5 py-2 font-ui text-[0.72rem] font-medium text-warning transition-colors hover:bg-warning/10"
        >
          <Bell size={14} /> {sim.alerts.length} alertes masquées — Afficher
        </button>
      )}

      {/* Stats */}
      <div className="mb-[1.1rem] grid grid-cols-1 gap-[1.1rem] sm:grid-cols-3">
        <Stat
          label="Recettes réelles"
          value={fmt(view.realIncome)}
          delta={`${incPct}% du prévisionnel`}
          dtone="up"
        />
        <Stat
          label="Dépenses réelles"
          value={fmt(view.realExpense)}
          delta={`${expPct}% du prévisionnel`}
        />
        <Stat
          label="Solde actuel"
          value={(realBal >= 0 ? "+" : "") + fmt(realBal)}
          tone={realBal >= 0 ? "positive" : "negative"}
          delta={realBal >= 0 ? "↑ Conforme au plan" : "↓ Sous pression"}
          dtone={realBal >= 0 ? "up" : "down"}
        />
      </div>

      {/* Transactions */}
      <Panel
        title="Transactions récentes"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {chip("all", "Tout")}
            {chip("in", "Recettes")}
            {chip("out", "Dépenses")}
            <button
              type="button"
              onClick={() => navigate("/importer")}
              className="inline-flex items-center gap-1.5 font-ui text-[0.7rem] font-medium tracking-[0.05em] text-info uppercase transition-opacity hover:opacity-80"
            >
              <Upload size={13} /> Import CSV
            </button>
          </div>
        }
      >
        {/* Filter toolbar */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-disabled"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un libellé…"
              className="w-full rounded-md border border-input bg-input-bg py-1.5 pr-3 pl-8 font-body text-[0.78rem] text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus sm:w-52"
            />
          </div>
          <FilterSelect
            value={catFilter}
            onChange={setCatFilter}
            options={cats}
            allLabel="Toutes catégories"
          />
          <FilterSelect
            value={teamFilter}
            onChange={setTeamFilter}
            options={teams}
            allLabel="Toutes équipes"
          />
          {active ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-pill px-2 py-1 font-ui text-[0.66rem] font-medium tracking-[0.04em] text-ink-muted uppercase transition-colors hover:text-ink"
            >
              <X size={12} /> Réinitialiser
            </button>
          ) : null}
          <span className="ml-auto font-body text-[0.72rem] text-ink-disabled tabular-nums">
            {txs.length} transaction{txs.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Date", "Libellé", "Catégorie (IA)", "Équipe"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-border px-2.5 py-2 text-left font-ui text-[0.66rem] font-medium tracking-[0.07em] whitespace-nowrap text-ink-disabled uppercase"
                  >
                    {h}
                  </th>
                ))}
                <th className="border-b border-border px-2.5 py-2 text-right font-ui text-[0.66rem] font-medium tracking-[0.07em] whitespace-nowrap text-ink-disabled uppercase">
                  Montant
                </th>
                <th className="w-9 border-b border-border" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {txs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2.5 py-10 text-center font-body text-[0.82rem] text-ink-disabled"
                  >
                    Aucune transaction ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                txs.map((t, i) => (
                <tr
                  key={t.entryId ?? i}
                  className="group transition-colors hover:bg-accent"
                >
                  <td
                    className={cn(
                      "border-b border-border px-2.5 py-2.5 font-body text-[0.78rem] whitespace-nowrap text-ink-disabled tabular-nums",
                      t.manual && "border-l-2 border-l-info/50",
                    )}
                  >
                    {t.date}
                  </td>
                  <td className="border-b border-border px-2.5 py-2.5 font-body text-[0.85rem] text-ink">
                    {t.label}
                  </td>
                  <td className="border-b border-border px-2.5 py-2.5">
                    <CatTag flagged={!t.auto}>{t.cat}</CatTag>
                  </td>
                  <td className="border-b border-border px-2.5 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(t.teams ?? [t.team]).map((tm) => (
                        <TeamChip key={tm}>{tm}</TeamChip>
                      ))}
                    </div>
                  </td>
                  <td
                    className={cn(
                      "border-b border-border px-2.5 py-2.5 text-right font-body text-[0.85rem] tabular-nums",
                      t.kind === "in" ? "text-success" : "text-danger",
                    )}
                  >
                    {t.kind === "in" ? "+" : "−"}
                    {fmtShort(Math.abs(t.amount))} TND
                  </td>
                  <td className="border-b border-border px-1.5 py-2.5 text-right">
                    {t.manual && t.entryId ? (
                      <button
                        type="button"
                        onClick={() => removeEntry(t.entryId!)}
                        aria-label="Supprimer la saisie"
                        className="inline-flex size-6 items-center justify-center rounded-sm border border-transparent text-ink-disabled opacity-0 transition-[opacity,color,border-color] group-hover:opacity-100 hover:border-team-away/30 hover:text-team-away focus-visible:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Prévisionnel vs Réel */}
      <Panel title="Prévisionnel vs Réel — par catégorie">
        {view.expReal.map((e, idx) => {
          const open = openCat === e.id || (openCat === null && idx === 0)
          const txList = view.txByCat[e.label] || []
          const over = e.cons >= e.threshold
          return (
            <div
              key={e.id}
              className="mb-2.5 overflow-hidden rounded-md border border-border last:mb-0"
            >
              <button
                type="button"
                onClick={() => setOpenCat(open ? "" : e.id)}
                className="grid w-full grid-cols-[150px_1fr_120px_46px_18px] items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-accent sm:grid-cols-[170px_1fr_130px_48px_18px]"
              >
                <span className="truncate font-body text-[0.85rem] font-medium text-ink">
                  {e.label}
                </span>
                <Bar value={e.cons} warn={over} />
                <span className="text-right font-body text-[0.74rem] whitespace-nowrap text-ink-muted tabular-nums">
                  {fmtShort(e.real)} / {fmtShort(e.amount)}
                </span>
                <span
                  className={cn(
                    "text-right font-ui text-[0.8rem] font-medium",
                    over ? "text-warning" : "text-ink-muted",
                  )}
                >
                  {e.cons}%
                </span>
                <ChevronRight
                  size={15}
                  className={cn(
                    "text-ink-disabled transition-transform duration-200",
                    open && "rotate-90",
                  )}
                />
              </button>
              {open ? (
                <div className="bg-surface-muted px-3.5 pt-1 pb-3">
                  {txList.length ? (
                    txList.map((t, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-3 border-t border-border py-2 font-body text-[0.8rem] first:border-0"
                      >
                        <span className="font-body text-[0.78rem] text-info tabular-nums">
                          {t.date}
                        </span>
                        <span className="truncate text-ink-subtle">{t.label}</span>
                        <div className="flex flex-wrap justify-end gap-1">
                          {(t.teams ?? [t.team]).map((tm) => (
                            <TeamChip key={tm} sm>
                              {tm}
                            </TeamChip>
                          ))}
                        </div>
                        <span className="text-danger tabular-nums">
                          −{fmtShort(Math.abs(t.amount))} TND
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2.5 font-body text-[0.78rem] text-ink-disabled">
                      Aucune transaction enregistrée pour cette catégorie.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </Panel>

      {/* Teams */}
      <Panel title="Suivi par équipe">
        <div className="hidden grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_1.6fr_48px] items-center gap-3 px-1 pb-2 font-ui text-[0.62rem] font-medium tracking-[0.07em] text-ink-disabled uppercase sm:grid">
          <span>Équipe</span>
          <span>Budget</span>
          <span>Dépensé</span>
          <span>Restant</span>
          <span>Consommation</span>
          <span className="text-right">%</span>
        </div>
        {view.teamReal.map((t) => (
          <div
            key={t.id}
            className="grid grid-cols-2 items-center gap-x-3 gap-y-1 border-t border-border py-2.5 font-body text-[0.84rem] tabular-nums sm:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_1.6fr_48px]"
          >
            <span className="font-ui font-semibold text-ink">{t.label}</span>
            <span className="text-ink-subtle">{fmtShort(t.amount)}</span>
            <span className="text-danger">{fmtShort(t.real)}</span>
            <span className={t.remaining >= 0 ? "text-success" : "text-danger"}>
              {fmtShort(t.remaining)}
            </span>
            <div className="col-span-2 sm:col-span-1">
              <Bar value={t.cons} warn={t.cons >= 85} />
            </div>
            <span className="text-right font-ui font-medium text-ink-muted">
              {t.cons}%
            </span>
          </div>
        ))}
        <p className="mt-3.5 font-body text-[0.76rem] text-ink-disabled">
          Montants en TND. Le budget de chaque équipe est défini dans la
          configuration.
        </p>
      </Panel>
    </>
  )
}

/* ───────── Alertes ───────── */
const VALIDATIONS = [
  { id: 1042, label: "Achat équipement — Decathlon", amount: 1250, by: "Coach Karim" },
  { id: 1039, label: "Réparation minibus", amount: 920, by: "Logistique" },
]
const AUDIT = [
  { who: "Ahmed B.", what: "a modifié le budget Déplacements (24 000 → 26 000 TND)", time: "il y a 2j" },
  { who: "Sonia K.", what: "a approuvé la dépense #1038 (810 TND)", time: "il y a 3j" },
  { who: "Système", what: "seuil de catégorie dépassé", time: "il y a 5j" },
]

function TabAlertes({ sim }: { sim: ReturnType<typeof simulateBudget> }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-[1.1rem] lg:grid-cols-2">
        <Panel title="Alertes en temps réel">
          {sim.alerts.map((a, i) => (
            <AlertRow a={a} key={i} />
          ))}
        </Panel>
        <Panel title="File de validation">
          {VALIDATIONS.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0"
            >
              <div className="min-w-0">
                <div className="font-body text-[0.85rem] text-ink">{v.label}</div>
                <div className="font-body text-[0.76rem] text-ink-muted">
                  #{v.id} · {v.by} ·{" "}
                  <span className="text-danger">{fmt(v.amount)}</span> · &gt; seuil
                  500 TND
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="rounded-sm border border-team-away/25 bg-team-away/10 px-2.5 py-1.5 font-ui text-[0.72rem] font-semibold text-team-away transition-colors hover:bg-team-away/20"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-sm bg-brand px-2.5 py-1.5 font-ui text-[0.72rem] font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
                >
                  <Check size={14} /> Approuver
                </button>
              </div>
            </div>
          ))}
          <p className="mt-3.5 font-body text-[0.76rem] text-ink-disabled">
            Toute dépense &gt; 500 TND ou hors budget requiert une approbation.
          </p>
        </Panel>
      </div>

      <Panel title="Journal d'audit">
        {AUDIT.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-accent font-ui text-[0.7rem] font-medium text-ink-subtle">
              {a.who === "Système" ? "⚙" : a.who.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1 font-body text-[0.83rem] text-ink-subtle">
              <b className="font-semibold text-ink">{a.who}</b> {a.what}
            </div>
            <span className="font-body text-[0.72rem] whitespace-nowrap text-ink-disabled">
              {a.time}
            </span>
          </div>
        ))}
      </Panel>
    </>
  )
}
