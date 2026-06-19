import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, CalendarPlus, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtShort, r } from "@/lib/format"
import { useData } from "@/data/useData"
import type { MonthStatus } from "@/data/seed/months"
import { Bar, PageHead, Panel, Stat } from "@/features/budget/ui"

const STATUS: Record<
  MonthStatus,
  { label: string; dot: string; chip: string }
> = {
  closed: {
    label: "Clôturé",
    dot: "bg-ink-disabled",
    chip: "border-border bg-accent text-ink-muted",
  },
  current: {
    label: "En cours",
    dot: "bg-brand shadow-[0_0_8px_var(--green-glow)]",
    chip: "border-brand/25 bg-brand/10 text-brand",
  },
  planned: {
    label: "Planifié",
    dot: "bg-warning",
    chip: "border-warning/25 bg-warning/10 text-warning",
  },
}

/* ── prévu vs réel line inside the detail panel ────────────────────────── */
function VsRow({
  label,
  prevu,
  reel,
  pct,
  warn,
  tone,
}: {
  label: string
  prevu: number
  reel: number
  pct: number
  warn?: boolean
  tone: "brand" | "danger"
}) {
  return (
    <div className="grid grid-cols-[110px_1fr_auto] items-center gap-3 border-b border-border py-3 last:border-0 sm:grid-cols-[130px_1fr_auto]">
      <span className="font-body text-[0.85rem] font-medium text-ink">{label}</span>
      <Bar value={pct} warn={warn} />
      <span className="text-right font-body text-[0.78rem] whitespace-nowrap text-ink-muted tabular-nums">
        <span className={tone === "brand" ? "text-brand" : "text-danger"}>
          {fmtShort(reel)}
        </span>{" "}
        / {fmtShort(prevu)}
      </span>
    </div>
  )
}

export function MonthlyPlanningScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { months } = useData()

  // Confirmation passed back from the plan screen after "Valider" — captured
  // once, auto-dismissed, and cleared from router state so a refresh won't
  // resurrect it.
  const [confirm, setConfirm] = useState<string | null>(
    () => (location.state as { planned?: string } | null)?.planned ?? null,
  )
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!confirm) return
    const t = setTimeout(() => setConfirm(null), 2800)
    return () => clearTimeout(t)
  }, [confirm])

  const current = months.find((m) => m.status === "current") ?? months[0]
  const [selId, setSelId] = useState(current?.id)
  const sel = months.find((m) => m.id === selId) ?? current

  const nextPlan = useMemo(
    () => months.find((m) => m.status === "planned"),
    [months],
  )

  if (!sel) return null

  const isPlanned = sel.status === "planned"
  const rec = isPlanned ? sel.budgetIncome : sel.income
  const dep = isPlanned ? sel.budgetExpense : sel.expense
  const solde = rec - dep
  const incPct = sel.budgetIncome ? r((sel.income / sel.budgetIncome) * 100) : 0
  const cons = sel.budgetExpense ? r((sel.expense / sel.budgetExpense) * 100) : 0
  const over = cons >= 100

  return (
    <>
      <button
        type="button"
        onClick={() => navigate("/budget/dashboard")}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-ui text-sm font-semibold text-ink transition-colors hover:border-[var(--border-hover)] hover:bg-accent"
      >
        <ArrowLeft size={15} /> Tableau de bord
      </button>

      <PageHead
        title="Planification mensuelle"
        action={
          nextPlan ? (
            <button
              type="button"
              onClick={() => navigate("/budget/mensuel/plan")}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2.5 font-ui text-sm font-bold text-ink-inverted shadow-glow transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_var(--green-glow)]"
            >
              <CalendarPlus size={16} /> Planifier {nextPlan.label}
            </button>
          ) : null
        }
      />
      <p className="-mt-3 mb-5 max-w-prose font-body text-sm text-ink-muted">
        Suivez le budget mois par mois et préparez le plan prévisionnel du mois
        à venir. Sélectionnez un mois pour voir son détail.
      </p>

      {/* ── Month selector ─────────────────────────────────────────────── */}
      <div className="mb-[1.1rem] flex gap-2.5 overflow-x-auto pb-1">
        {months.map((m) => {
          const on = m.id === sel.id
          const ms = m.status === "planned" ? m.budgetIncome - m.budgetExpense : m.income - m.expense
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelId(m.id)}
              className={cn(
                "flex min-w-[118px] shrink-0 flex-col gap-1.5 rounded-lg border px-3.5 py-3 text-left transition-[transform,box-shadow,border-color]",
                on
                  ? "border-brand/40 bg-brand/[0.04] shadow-glow"
                  : "border-border bg-surface hover:border-[var(--border-hover)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-ui text-[0.8rem] font-bold text-ink">
                  {m.short}
                </span>
                <span className={cn("size-1.5 rounded-full", STATUS[m.status].dot)} />
              </div>
              <span className="font-display text-[1.25rem] leading-none tabular-nums text-ink-subtle">
                {ms >= 0 ? "+" : "−"}
                {fmtShort(Math.abs(ms))}
              </span>
              <span className="font-ui text-[0.54rem] font-bold tracking-[0.08em] text-ink-disabled uppercase">
                {STATUS[m.status].label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Selected month header ──────────────────────────────────────── */}
      <div className="mb-[1.1rem] flex flex-wrap items-center gap-3">
        <h2 className="font-ui text-xl font-bold tracking-tight text-ink">
          {sel.label}
        </h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.62rem] font-bold tracking-[0.08em] uppercase",
            STATUS[sel.status].chip,
          )}
        >
          <span className={cn("size-1.5 rounded-full", STATUS[sel.status].dot)} />
          {STATUS[sel.status].label}
        </span>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="mb-[1.1rem] grid grid-cols-1 gap-[1.1rem] sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={isPlanned ? "Recettes prévues" : "Recettes réelles"}
          value={fmt(rec)}
          delta={isPlanned ? "Prévisionnel" : `${incPct}% du prévu`}
          dtone="up"
        />
        <Stat
          label={isPlanned ? "Dépenses prévues" : "Dépenses réelles"}
          value={fmt(dep)}
          delta={isPlanned ? "Prévisionnel" : `${cons}% du budget`}
        />
        <Stat
          label={isPlanned ? "Solde prévu" : "Solde du mois"}
          value={(solde >= 0 ? "+" : "") + fmt(solde)}
          tone={solde >= 0 ? "positive" : "negative"}
          delta={solde >= 0 ? "↑ Excédent" : "↓ Déficit"}
          dtone={solde >= 0 ? "up" : "down"}
        />
        <Stat
          label="Consommation"
          value={isPlanned ? "—" : `${cons}%`}
          delta={
            isPlanned
              ? "À planifier"
              : over
                ? "Dépassement du budget"
                : "Dans le budget"
          }
          dtone={over ? "down" : undefined}
        />
      </div>

      {/* ── Prévu vs réel ──────────────────────────────────────────────── */}
      <Panel title="Prévisionnel vs réel">
        {isPlanned ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-accent text-ink-disabled">
              <CalendarPlus size={20} />
            </span>
            <div>
              <div className="font-ui text-[0.9rem] font-bold text-ink-muted">
                Mois non démarré
              </div>
              <p className="mx-auto mt-1 max-w-xs font-body text-[0.82rem] leading-relaxed text-ink-disabled">
                Définissez le plan prévisionnel de {sel.label} : budget des
                recettes, des dépenses et estimations par poste.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/budget/mensuel/plan")}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2.5 font-ui text-sm font-bold text-ink-inverted shadow-glow transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_var(--green-glow)]"
            >
              Définir le plan <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <>
            <VsRow
              label="Recettes"
              prevu={sel.budgetIncome}
              reel={sel.income}
              pct={incPct}
              tone="brand"
            />
            <VsRow
              label="Dépenses"
              prevu={sel.budgetExpense}
              reel={sel.expense}
              pct={cons}
              warn={over}
              tone="danger"
            />
            <p className="mt-3.5 font-body text-[0.76rem] text-ink-disabled">
              Montants en TND. {sel.status === "current"
                ? "Mois en cours — chiffres partiels mis à jour au fil des saisies."
                : "Mois clôturé — chiffres définitifs."}
            </p>
          </>
        )}
      </Panel>

      {/* Confirmation toast after returning from the plan screen */}
      {confirm ? (
        <div
          role="status"
          className="animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-brand/30 bg-surface px-4 py-3 shadow-deep"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-brand/15 text-brand">
            <Check size={14} />
          </span>
          <span className="font-body text-[0.84rem] text-ink">
            Plan de {confirm} enregistré
          </span>
        </div>
      ) : null}
    </>
  )
}
