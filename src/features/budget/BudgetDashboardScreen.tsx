import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell, Check, ChevronRight, Upload, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtShort, r } from "@/lib/format"
import { useData } from "@/data/useData"
import { simulateBudget, type BudgetAlert } from "@/features/budget/simulate"
import {
  Bar,
  CatTag,
  PageHead,
  Panel,
  Segmented,
  Stat,
  TeamChip,
} from "@/features/budget/ui"

const alertTone = {
  error: { dot: "bg-danger" },
  warning: { dot: "bg-warning" },
  info: { dot: "bg-neutral" },
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

  const sim = useMemo(() => simulateBudget(budget), [budget])

  return (
    <>
      <PageHead
        eyebrow={`Tableau de bord · ${budget.season}`}
        title="Pilotage du budget"
        action={
          <button
            type="button"
            onClick={() => navigate("/budget")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-ui text-sm font-semibold text-ink transition-colors hover:border-[var(--border-hover)] hover:bg-accent"
          >
            <ArrowLeft size={15} /> Configuration
          </button>
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
    </>
  )
}

/* ───────── Suivi ───────── */
function TabSuivi({ sim }: { sim: ReturnType<typeof simulateBudget> }) {
  const navigate = useNavigate()
  const [showAlerts, setShowAlerts] = useState(true)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "in" | "out">("all")

  const incPct = sim.totalIncome ? r((sim.realIncome / sim.totalIncome) * 100) : 0
  const expPct = sim.totalExpense ? r((sim.realExpense / sim.totalExpense) * 100) : 0
  const realBal = sim.realIncome - sim.realExpense

  const counts = {
    all: sim.transactions.length,
    in: sim.transactions.filter((t) => t.kind === "in").length,
    out: sim.transactions.filter((t) => t.kind === "out").length,
  }
  const txs = sim.transactions.filter((t) =>
    filter === "all" ? true : filter === "in" ? t.kind === "in" : t.kind === "out",
  )

  const chip = (key: "all" | "in" | "out", label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-ui text-[0.64rem] font-bold tracking-[0.05em] uppercase transition-colors",
        filter === key
          ? "border-brand/25 bg-brand/10 text-brand"
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
            <span className="flex-1 font-ui text-[0.74rem] font-bold tracking-[0.06em] uppercase">
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
          className="mb-[1.1rem] inline-flex items-center gap-1.5 rounded-pill border border-warning/25 bg-warning/[0.06] px-3.5 py-2 font-ui text-[0.72rem] font-bold text-warning transition-colors hover:bg-warning/10"
        >
          <Bell size={14} /> {sim.alerts.length} alertes masquées — Afficher
        </button>
      )}

      {/* Stats */}
      <div className="mb-[1.1rem] grid grid-cols-1 gap-[1.1rem] sm:grid-cols-3">
        <Stat
          label="Recettes réelles"
          value={fmt(sim.realIncome)}
          delta={`${incPct}% du prévisionnel`}
          dtone="up"
        />
        <Stat
          label="Dépenses réelles"
          value={fmt(sim.realExpense)}
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
              className="inline-flex items-center gap-1.5 font-ui text-[0.7rem] font-bold tracking-[0.05em] text-brand uppercase transition-opacity hover:opacity-80"
            >
              <Upload size={13} /> Import CSV
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Date", "Libellé", "Catégorie (IA)", "Équipe"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-border px-2.5 py-2 text-left font-ui text-[0.66rem] font-bold tracking-[0.07em] whitespace-nowrap text-ink-disabled uppercase"
                  >
                    {h}
                  </th>
                ))}
                <th className="border-b border-border px-2.5 py-2 text-right font-ui text-[0.66rem] font-bold tracking-[0.07em] whitespace-nowrap text-ink-disabled uppercase">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t, i) => (
                <tr key={i} className="transition-colors hover:bg-accent">
                  <td className="border-b border-border px-2.5 py-2.5 font-body text-[0.78rem] whitespace-nowrap text-brand tabular-nums">
                    {t.date}
                  </td>
                  <td className="border-b border-border px-2.5 py-2.5 font-body text-[0.85rem] text-ink-subtle">
                    {t.label}
                  </td>
                  <td className="border-b border-border px-2.5 py-2.5">
                    <CatTag flagged={!t.auto}>{t.cat}</CatTag>
                  </td>
                  <td className="border-b border-border px-2.5 py-2.5">
                    <TeamChip>{t.team}</TeamChip>
                  </td>
                  <td
                    className={cn(
                      "border-b border-border px-2.5 py-2.5 text-right font-body text-[0.85rem] tabular-nums",
                      t.kind === "in" ? "text-brand" : "text-danger",
                    )}
                  >
                    {t.kind === "in" ? "+" : "−"}
                    {fmtShort(Math.abs(t.amount))} TND
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Prévisionnel vs Réel */}
      <Panel title="Prévisionnel vs Réel — par catégorie">
        {sim.expReal.map((e, idx) => {
          const open = openCat === e.id || (openCat === null && idx === 0)
          const txList = sim.txByCat[e.label] || []
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
                    "text-right font-ui text-[0.8rem] font-bold",
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
                        <span className="font-body text-[0.78rem] text-brand tabular-nums">
                          {t.date}
                        </span>
                        <span className="truncate text-ink-subtle">{t.label}</span>
                        <TeamChip sm>{t.team}</TeamChip>
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
        <div className="hidden grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_1.6fr_48px] items-center gap-3 px-1 pb-2 font-ui text-[0.62rem] font-bold tracking-[0.07em] text-ink-disabled uppercase sm:grid">
          <span>Équipe</span>
          <span>Budget</span>
          <span>Dépensé</span>
          <span>Restant</span>
          <span>Consommation</span>
          <span className="text-right">%</span>
        </div>
        {sim.teamReal.map((t) => (
          <div
            key={t.id}
            className="grid grid-cols-2 items-center gap-x-3 gap-y-1 border-t border-border py-2.5 font-body text-[0.84rem] tabular-nums sm:grid-cols-[1.3fr_0.9fr_0.9fr_0.9fr_1.6fr_48px]"
          >
            <span className="font-ui font-semibold text-ink">{t.label}</span>
            <span className="text-ink-subtle">{fmtShort(t.amount)}</span>
            <span className="text-danger">{fmtShort(t.real)}</span>
            <span className={t.remaining >= 0 ? "text-brand" : "text-danger"}>
              {fmtShort(t.remaining)}
            </span>
            <div className="col-span-2 sm:col-span-1">
              <Bar value={t.cons} warn={t.cons >= 85} />
            </div>
            <span className="text-right font-ui font-bold text-ink-muted">
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
                  className="inline-flex items-center gap-1 rounded-sm bg-brand px-2.5 py-1.5 font-ui text-[0.72rem] font-bold text-ink-inverted shadow-glow transition-[transform,box-shadow] hover:-translate-y-0.5"
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
            <span className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-accent font-ui text-[0.7rem] font-bold text-ink-subtle">
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
