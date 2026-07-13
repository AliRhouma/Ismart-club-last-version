import { useMemo } from "react"
import { RotateCcw, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtShort, fmtFrDate } from "@/lib/format"
import { useData } from "@/data/useData"
import { byId, categoryPath, scopeText } from "@/features/finance/helpers"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/kit/EmptyState"

/**
 * Modal listing soft-deleted transactions with a « Restaurer » action per row
 * (docs §4.9). Kept out of the main flow — discoverable via the toolbar but not
 * cluttering the table.
 */
export function HistoriquePanel({
  open,
  onOpenChange,
  onRestored,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestored: (message: string) => void
}) {
  const { transactions, groups, subCategories, financeTeams, staff, restoreTransaction } =
    useData()

  const groupMap = useMemo(() => byId(groups), [groups])
  const subMap = useMemo(() => byId(subCategories), [subCategories])
  const teamMap = useMemo(() => byId(financeTeams), [financeTeams])
  const staffMap = useMemo(() => byId(staff), [staff])

  const deleted = useMemo(
    () =>
      transactions
        .filter((t) => t.is_deleted)
        .sort((a, b) => (b.deleted_at ?? "").localeCompare(a.deleted_at ?? "")),
    [transactions],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Historique des transactions supprimées
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-sm text-ink-muted">
              {deleted.length
                ? "Restaurez une transaction pour la réintégrer au tableau et aux analyses."
                : "Les transactions supprimées apparaîtront ici."}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-[var(--border-hover)] hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {deleted.length === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Aucune suppression"
              description="Aucune transaction n'a été supprimée cette saison."
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {deleted.map((tx) => {
                const { group, sub } = categoryPath(tx, groupMap, subMap)
                const revenu = tx.nature === "Revenu"
                return (
                  <li
                    key={tx.id}
                    className="rounded-lg border border-border bg-surface p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-body text-[0.86rem] text-ink">
                          {tx.label || sub}
                        </div>
                        <div className="mt-0.5 truncate font-body text-[0.76rem] text-ink-muted">
                          {group} → {sub}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-body text-[0.86rem] tabular-nums",
                          revenu ? "text-success" : "text-danger",
                        )}
                      >
                        {revenu ? "+" : "−"}
                        {fmtShort(tx.amount)} TND
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 font-body text-[0.72rem] text-ink-disabled">
                        {fmtFrDate(tx.date)} · {scopeText(tx, teamMap, staffMap)}
                        {tx.deleted_at
                          ? ` · supprimée le ${fmtFrDate(tx.deleted_at.slice(0, 10))}`
                          : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          restoreTransaction(tx.id)
                          onRestored("Transaction restaurée")
                        }}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 font-ui text-[0.72rem] font-medium text-ink-subtle transition-colors hover:border-[var(--border-hover)] hover:bg-accent hover:text-ink"
                      >
                        <RotateCcw size={13} /> Restaurer
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
