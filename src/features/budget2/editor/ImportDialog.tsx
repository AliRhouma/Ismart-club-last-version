import { useEffect, useMemo, useState } from "react"
import { Check, Import, Layers } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt } from "@/lib/format"
import { useData } from "@/data/useData"
import { draftLines, draftTotals } from "@/data/seed/budget2"
import { StatusBadge } from "@/features/budget2/ui"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Mode = "replace" | "append"

/**
 * "Importer une saison antérieure" (docs §3.1). Lists the budgets of OTHER
 * seasons; the chosen one's lines (and estimator inputs) are cloned into the
 * current draft as starting estimates — either replacing its content or added
 * to it.
 */
export function ImportDialog({
  open,
  onOpenChange,
  targetDraftId,
  currentSeasonId,
  targetHasLines,
  onImported,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDraftId: string
  currentSeasonId: string
  targetHasLines: boolean
  onImported: (msg: string) => void
}) {
  const { budget2, importBudget2FromDraft } = useData()
  const [sourceId, setSourceId] = useState("")
  const [mode, setMode] = useState<Mode>("replace")

  useEffect(() => {
    if (open) {
      setSourceId("")
      // Import onto an empty draft usually means "replace"; otherwise "append".
      setMode(targetHasLines ? "append" : "replace")
    }
  }, [open, targetHasLines])

  const seasonLabel = useMemo(
    () => new Map(budget2.seasons.map((s) => [s.id, s.label])),
    [budget2.seasons],
  )

  // Candidate sources: every draft from a DIFFERENT season that has lines.
  const candidates = useMemo(
    () =>
      budget2.drafts
        .filter(
          (d) =>
            d.season_id !== currentSeasonId &&
            draftLines(budget2.lines, d.id).length > 0,
        )
        .map((d) => ({
          draft: d,
          totals: draftTotals(budget2.lines, d.id),
          count: draftLines(budget2.lines, d.id).length,
        }))
        // validated references first
        .sort((a, b) => {
          if (a.draft.status === "valide" && b.draft.status !== "valide") return -1
          if (b.draft.status === "valide" && a.draft.status !== "valide") return 1
          return b.draft.updated_at.localeCompare(a.draft.updated_at)
        }),
    [budget2.drafts, budget2.lines, currentSeasonId],
  )

  const submit = () => {
    if (!sourceId) return
    importBudget2FromDraft(sourceId, targetDraftId, mode)
    const src = candidates.find((c) => c.draft.id === sourceId)
    onImported(
      `${src?.count ?? 0} ligne(s) importée(s) depuis « ${src?.draft.label ?? ""} »`,
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-border bg-card sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="font-ui text-base font-medium text-ink">
            Importer une saison antérieure
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-ink-muted">
            Reprenez le budget d'une autre saison comme point de départ, puis
            ajustez les estimations.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <div className="rounded-md border border-border px-4 py-8 text-center">
            <Layers size={22} className="mx-auto text-ink-disabled" />
            <p className="mt-2 font-body text-[0.84rem] text-ink-muted">
              Aucune autre saison ne contient de budget à importer.
            </p>
          </div>
        ) : (
          <>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto py-1">
              {candidates.map(({ draft, totals, count }) => {
                const on = draft.id === sourceId
                return (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => setSourceId(draft.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                      on
                        ? "border-brand-blue-600/40 bg-brand-blue-600/10"
                        : "border-border hover:border-border-strong hover:bg-surface-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border",
                        on
                          ? "border-brand-blue-600 bg-brand-blue-600 text-ink-inverted"
                          : "border-border-strong",
                      )}
                    >
                      {on ? <Check size={11} /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-ui text-sm font-medium text-ink">
                          {seasonLabel.get(draft.season_id)}
                        </span>
                        <StatusBadge status={draft.status} />
                      </div>
                      <div className="mt-0.5 font-body text-[0.76rem] text-ink-muted">
                        « {draft.label} » · {count} lignes · solde{" "}
                        <span className={totals.solde >= 0 ? "text-success" : "text-danger"}>
                          {(totals.solde >= 0 ? "+" : "") + fmt(totals.solde)}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Replace vs append */}
            <div className="mt-1 flex flex-col gap-2">
              <span className="font-ui text-[0.68rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                Mode d'import
              </span>
              <div className="inline-flex gap-1 rounded-pill border border-border p-1">
                {(
                  [
                    { value: "replace", label: "Remplacer le contenu" },
                    { value: "append", label: "Ajouter au contenu" },
                  ] as const
                ).map((m) => {
                  const on = m.value === mode
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMode(m.value)}
                      className={cn(
                        "flex-1 rounded-pill px-4 py-1.5 font-ui text-[0.74rem] font-medium transition-colors",
                        on
                          ? "border border-border-second bg-surface-nested text-ink"
                          : "border border-transparent text-ink-muted hover:text-ink",
                      )}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" onClick={submit} disabled={!sourceId}>
            <Import size={16} /> Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
