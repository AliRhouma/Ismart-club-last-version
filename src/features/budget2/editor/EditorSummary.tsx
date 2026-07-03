import { CheckCheck, Copy, Import } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, r } from "@/lib/format"
import type { Budget2Status, DraftTotals } from "@/data/seed/budget2"
import type { ExpenseSlice } from "@/features/budget2/helpers"
import { Bar } from "@/features/budget/ui"
import { Button } from "@/components/ui/button"

/** How many category/group slices to list before bundling into "Autres". */
const TOP_SLICES = 6

/**
 * Sticky right-side summary of the work-plan editor — mirrors the "Résumé
 * prévisionnel" panel of the legacy budget/nouvelle screen: revenus, dépenses,
 * the solde prévisionnel with an excédent/déficit tag, the dépenses split by
 * section, and the primary actions (import / validate). The équilibre is never
 * forced, so a déficit is flagged calmly, not as an error.
 */
export function EditorSummary({
  totals,
  breakdown,
  status,
  readOnly,
  onImport,
  onValidate,
  onDuplicate,
}: {
  totals: DraftTotals
  breakdown: ExpenseSlice[]
  status: Budget2Status
  readOnly: boolean
  onImport: () => void
  onValidate: () => void
  onDuplicate: () => void
}) {
  const surplus = totals.solde >= 0

  // Show the biggest categories/groups, bundling the tail into "Autres".
  const top = breakdown.slice(0, TOP_SLICES)
  const rest = breakdown.slice(TOP_SLICES)
  const restTotal = rest.reduce((sum, s) => sum + s.value, 0)
  const rows: ExpenseSlice[] = restTotal
    ? [...top, { key: "autres", label: "Autres", value: restTotal }]
    : top

  return (
    <aside className="lg:sticky lg:top-0">
      <div className="rounded-lg border border-border p-5 shadow-card">
        <div className="mb-4 font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink uppercase">
          Résumé prévisionnel
        </div>

        <div className="flex items-center justify-between py-1.5 font-body text-[0.86rem] text-ink-muted">
          <span>Revenus</span>
          <b className="font-ui text-[0.92rem] font-medium text-success tabular-nums">
            {fmt(totals.revenus)}
          </b>
        </div>
        <div className="flex items-center justify-between py-1.5 font-body text-[0.86rem] text-ink-muted">
          <span>Dépenses</span>
          <b className="font-ui text-[0.92rem] font-medium text-danger tabular-nums">
            {fmt(totals.depenses)}
          </b>
        </div>

        <div className="my-2.5 h-px bg-border" />

        <div className="flex items-center justify-between gap-2 py-1 text-[0.9rem] text-ink">
          <span>Solde prévisionnel</span>
          <b
            className={cn(
              "font-display text-[1.55rem] font-semibold leading-none tabular-nums",
              surplus ? "text-success" : "text-danger",
            )}
          >
            {surplus ? "+" : ""}
            {fmt(totals.solde)}
          </b>
        </div>
        <div
          className={cn(
            "my-2.5 rounded-sm p-1.5 text-center font-ui text-[0.62rem] font-medium tracking-[0.07em] uppercase",
            surplus ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
          )}
        >
          {surplus ? "Excédent projeté" : "Déficit projeté"}
        </div>
        <p className="mb-1 text-center font-body text-[0.68rem] leading-relaxed text-ink-disabled">
          L'équilibre n'est pas imposé — un excédent ou un déficit prévu est
          autorisé.
        </p>

        {/* Répartition des dépenses par catégorie & groupe */}
        {totals.depenses > 0 && rows.length ? (
          <>
            <div className="mt-4 mb-3 font-ui text-[0.62rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
              Répartition des dépenses
            </div>
            {rows.map((item) => {
              const pct = totals.depenses ? r((item.value / totals.depenses) * 100) : 0
              return (
                <div className="mb-2.5" key={item.key}>
                  <div className="mb-1 flex items-center justify-between gap-2 font-body text-[0.76rem] text-ink-subtle">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{item.label}</span>
                      {item.isGroup ? (
                        <span className="shrink-0 rounded-sm border border-brand-blue-600/30 bg-brand-blue-600/10 px-1 py-px font-ui text-[0.52rem] font-medium tracking-[0.04em] text-brand-blue-600 uppercase">
                          Groupe
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 font-ui font-medium text-info tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <Bar value={pct} sm />
                </div>
              )
            })}
          </>
        ) : null}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          {readOnly ? (
            <Button variant="outline" className="w-full" onClick={onDuplicate}>
              <Copy size={16} /> Dupliquer pour modifier
            </Button>
          ) : (
            <>
              {status === "brouillon" ? (
                <button
                  type="button"
                  onClick={onValidate}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
                >
                  <CheckCheck size={16} /> Valider le budget
                </button>
              ) : null}
              <Button variant="outline" className="w-full" onClick={onImport}>
                <Import size={16} /> Importer une saison antérieure
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
