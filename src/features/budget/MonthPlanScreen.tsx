import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Check, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, r } from "@/lib/format"
import { useData } from "@/data/useData"
import type { Line } from "@/data/seed/budget"
import { LinkBtn, NumInput, PageHead, Panel } from "@/features/budget/ui"

const textInputCls =
  "w-full rounded-md border border-border bg-input-bg px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-disabled focus:border-brand focus:shadow-[0_0_0_3px_var(--green-glow)]"
const btnXCls =
  "flex h-[30px] w-[30px] items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-team-away/30 hover:bg-team-away/10 hover:text-team-away"

type PlanLine = { id: string; label: string; amount: number }

/** Auto-fill the monthly estimate from the annual budget lines (÷ 12 ≈ ÷ 10 here). */
const monthlyFrom = (lines: Line[]): PlanLine[] =>
  lines.map((l) => ({ id: l.id, label: l.label, amount: r(l.amount / 10) }))

const sum = (lines: PlanLine[]) => lines.reduce((s, l) => s + (l.amount || 0), 0)

function PlanRows({
  lines,
  placeholder,
  onLabel,
  onAmount,
  onRemove,
}: {
  lines: PlanLine[]
  placeholder: string
  onLabel: (id: string, v: string) => void
  onAmount: (id: string, v: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <>
      {lines.map((l) => (
        <div
          key={l.id}
          className="mb-2 grid grid-cols-[1fr_150px_30px] items-center gap-2.5"
        >
          <input
            className={textInputCls}
            value={l.label}
            placeholder={placeholder}
            onChange={(e) => onLabel(l.id, e.target.value)}
          />
          <NumInput
            value={l.amount}
            suffix="TND"
            onChange={(v) => onAmount(l.id, v)}
          />
          <button
            type="button"
            onClick={() => onRemove(l.id)}
            className={btnXCls}
            aria-label="Supprimer la ligne"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </>
  )
}

/**
 * Plan du mois — visually mirrors the season config, scoped to the next planned
 * month and AUTO-FILLED from the annual budget. Kept self-contained on local
 * state (no global engine): editing is for the demo, "Valider" returns to the
 * monthly view with a confirmation.
 */
export function MonthPlanScreen() {
  const navigate = useNavigate()
  const { budget, months } = useData()

  const month = months.find((m) => m.status === "planned") ?? months[0]

  const [income, setIncome] = useState<PlanLine[]>(() =>
    monthlyFrom(budget.income),
  )
  const [expenses, setExpenses] = useState<PlanLine[]>(() =>
    monthlyFrom(budget.expenses),
  )

  const totalIncome = sum(income)
  const totalExpense = sum(expenses)
  const balance = totalIncome - totalExpense

  const editLabel =
    (set: typeof setIncome) => (id: string, v: string) =>
      set((prev) => prev.map((l) => (l.id === id ? { ...l, label: v } : l)))
  const editAmount =
    (set: typeof setIncome) => (id: string, v: number) =>
      set((prev) => prev.map((l) => (l.id === id ? { ...l, amount: v } : l)))
  const removeLine = (set: typeof setIncome) => (id: string) =>
    set((prev) => prev.filter((l) => l.id !== id))
  const addLine = (set: typeof setIncome) => () =>
    set((prev) => [...prev, { id: crypto.randomUUID(), label: "", amount: 0 }])

  return (
    <>
      <button
        type="button"
        onClick={() => navigate("/budget/mensuel")}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 font-ui text-sm font-semibold text-ink transition-colors hover:border-[var(--border-hover)] hover:bg-accent"
      >
        <ArrowLeft size={15} /> Planification mensuelle
      </button>

      <PageHead
        title={`Plan du mois — ${month?.label ?? ""}`}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-warning/25 bg-warning/10 px-3 py-1.5 font-ui text-[0.64rem] font-bold tracking-[0.08em] text-warning uppercase">
            <span className="size-1.5 rounded-full bg-warning" /> À planifier
          </span>
        }
      />
      <p className="-mt-3 mb-5 max-w-prose font-body text-sm text-ink-muted">
        Valeurs pré-remplies à partir du budget annuel de la saison. Ajustez les
        estimations du mois, puis validez le plan.
      </p>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── Forms ── */}
        <div className="min-w-0">
          <Panel
            title="Recettes estimées"
            action={
              <LinkBtn onClick={addLine(setIncome)}>
                <Plus size={13} /> Ligne
              </LinkBtn>
            }
          >
            <div className="grid grid-cols-[1fr_150px_30px] gap-2.5 px-0.5 pb-1.5 font-ui text-[0.6rem] font-bold tracking-[0.06em] text-ink-disabled uppercase">
              <span>Source</span>
              <span className="text-right">Montant mensuel</span>
              <span />
            </div>
            <PlanRows
              lines={income}
              placeholder="Source de revenu"
              onLabel={editLabel(setIncome)}
              onAmount={editAmount(setIncome)}
              onRemove={removeLine(setIncome)}
            />
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-ui text-[0.82rem] font-bold">
              <span>Total recettes</span>
              <b className="text-[0.95rem] text-brand">{fmt(totalIncome)}</b>
            </div>
          </Panel>

          <Panel
            title="Dépenses estimées"
            action={
              <LinkBtn onClick={addLine(setExpenses)}>
                <Plus size={13} /> Ligne
              </LinkBtn>
            }
          >
            <div className="grid grid-cols-[1fr_150px_30px] gap-2.5 px-0.5 pb-1.5 font-ui text-[0.6rem] font-bold tracking-[0.06em] text-ink-disabled uppercase">
              <span>Catégorie</span>
              <span className="text-right">Montant mensuel</span>
              <span />
            </div>
            <PlanRows
              lines={expenses}
              placeholder="Catégorie de dépense"
              onLabel={editLabel(setExpenses)}
              onAmount={editAmount(setExpenses)}
              onRemove={removeLine(setExpenses)}
            />
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-ui text-[0.82rem] font-bold">
              <span>Total dépenses</span>
              <b className="text-[0.95rem] text-danger">{fmt(totalExpense)}</b>
            </div>
          </Panel>
        </div>

        {/* ── Summary ── */}
        <aside className="lg:sticky lg:top-0">
          <div
            className="rounded-lg border border-brand/25 p-5 shadow-glow"
            style={{
              background:
                "linear-gradient(160deg, var(--green-glow), var(--surface))",
            }}
          >
            <div className="mb-4 font-ui text-[0.78rem] font-bold tracking-[0.06em] text-ink uppercase">
              Résumé du mois
            </div>
            <div className="flex items-center justify-between py-1.5 font-body text-[0.86rem] text-ink-muted">
              <span>Recettes estimées</span>
              <b className="font-ui text-[0.92rem] text-brand">{fmt(totalIncome)}</b>
            </div>
            <div className="flex items-center justify-between py-1.5 font-body text-[0.86rem] text-ink-muted">
              <span>Dépenses estimées</span>
              <b className="font-ui text-[0.92rem] text-danger">{fmt(totalExpense)}</b>
            </div>
            <div className="my-2.5 h-px bg-border" />
            <div className="flex items-center justify-between py-1.5 text-[0.95rem] text-ink">
              <span>Solde prévu</span>
              <b
                className={cn(
                  "font-display text-[1.7rem] leading-none",
                  balance >= 0 ? "text-brand" : "text-danger",
                )}
              >
                {balance >= 0 ? "+" : ""}
                {fmt(balance)}
              </b>
            </div>
            <div
              className={cn(
                "my-2.5 rounded-sm p-1.5 text-center font-ui text-[0.64rem] font-bold tracking-[0.07em] uppercase",
                balance >= 0 ? "bg-brand/10 text-brand" : "bg-danger/10 text-danger",
              )}
            >
              {balance >= 0 ? "Excédent projeté" : "Déficit projeté"}
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/budget/mensuel", {
                  state: { planned: month?.label },
                })
              }
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 font-ui text-sm font-bold text-ink-inverted shadow-glow transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_var(--green-glow)]"
            >
              <Check size={16} /> Valider le plan du mois
            </button>
            <p className="mt-3 text-center font-body text-[0.72rem] leading-relaxed text-ink-disabled">
              Aperçu prototype — le plan n’est pas encore relié au suivi réel.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
