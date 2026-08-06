import { useMemo, useState } from "react"
import { Check, Inbox, Paperclip, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtShort, fmtFrLong } from "@/lib/format"
import { useData } from "@/data/useData"
import { byId } from "@/features/finance/helpers"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * The admin side of « Demandes de transaction »: the requests submitted from
 * Finance ▸ Demander une transaction, still waiting for a decision. Valider /
 * Refuser write back to the store — the requester sees the outcome in their
 * historique. Refusing asks for a motif first, so the answer is never silent.
 */
export function DemandesModal({
  open,
  onOpenChange,
  onDecided,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDecided?: (message: string) => void
}) {
  const {
    transactionRequests,
    groups,
    subCategories,
    staff,
    decideTransactionRequest,
  } = useData()

  /** id of the request whose refusal motif is being typed, + the text. */
  const [refusing, setRefusing] = useState<{ id: string; note: string } | null>(null)

  const groupMap = useMemo(() => byId(groups), [groups])
  const subMap = useMemo(() => byId(subCategories), [subCategories])
  const staffMap = useMemo(() => byId(staff), [staff])

  const pending = useMemo(
    () =>
      transactionRequests
        .filter((d) => d.status === "en_attente")
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [transactionRequests],
  )
  const count = pending.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-background p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border p-5 text-left">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
              <Inbox className="size-5" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle className="flex items-center gap-2 font-ui text-base font-medium text-ink">
                Demandes de transaction
                {count ? (
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 font-ui text-[0.68rem] font-medium text-warning tabular-nums">
                    {count} en attente
                  </span>
                ) : null}
              </DialogTitle>
              <DialogDescription className="font-body text-sm text-ink-muted">
                Demandes soumises par le staff et les entraîneurs, à valider ou refuser.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {count === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Aucune demande en attente"
              description="Les demandes du staff et des entraîneurs apparaîtront ici."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((d) => {
                const revenu = d.nature === "Revenu"
                const member = staffMap.get(d.requester_id)
                const requester = member?.full_name ?? "—"
                const group = groupMap.get(d.group_id)?.name ?? "—"
                const sub = subMap.get(d.subcategory_id)?.name ?? "—"
                const isRefusing = refusing?.id === d.id

                return (
                  <li
                    key={d.id}
                    className="rounded-lg border border-border bg-surface p-4"
                  >
                    {/* Requester + amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar name={requester} size="md" />
                        <div className="min-w-0">
                          <span className="font-body text-[0.9rem] text-ink">
                            {requester}
                          </span>
                          <div className="mt-1 truncate font-body text-[0.78rem] text-ink-muted">
                            {group} → {sub}
                          </div>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "shrink-0 font-display text-[1.05rem] font-semibold whitespace-nowrap tabular-nums",
                          revenu ? "text-success" : "text-danger",
                        )}
                      >
                        {revenu ? "+" : "−"}
                        {fmtShort(d.amount)} TND
                      </div>
                    </div>

                    {/* Motif */}
                    <p className="mt-3 font-body text-[0.82rem] text-ink-subtle">
                      {d.motif}
                    </p>

                    {/* Meta */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-body text-[0.72rem] text-ink-disabled">
                      <span className="tabular-nums">
                        Souhaitée pour {fmtFrLong(d.date)}
                      </span>
                      {d.attachment ? (
                        <span className="inline-flex items-center gap-1 text-info">
                          <Paperclip size={12} />
                          {d.attachment}
                        </span>
                      ) : null}
                    </div>

                    {/* Refusal motif — asked for before the request is refused */}
                    {isRefusing ? (
                      <div className="mt-3.5 rounded-md border border-border bg-surface-nested p-3">
                        <label className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                          Motif du refus
                        </label>
                        <textarea
                          rows={2}
                          autoFocus
                          value={refusing.note}
                          onChange={(e) =>
                            setRefusing({ id: d.id, note: e.target.value })
                          }
                          placeholder="Expliquez la raison du refus…"
                          className="mt-1.5 w-full resize-none rounded-md border border-input bg-input-bg px-3 py-2 font-body text-[0.82rem] text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
                        />
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-border pt-3.5">
                      {isRefusing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setRefusing(null)}
                            className="inline-flex items-center rounded-md border border-input px-3 py-2 font-ui text-[0.82rem] font-medium text-ink-subtle transition-colors hover:border-[var(--border-hover)] hover:text-ink"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            disabled={!refusing.note.trim()}
                            onClick={() => {
                              decideTransactionRequest(d.id, "refusee", refusing.note)
                              setRefusing(null)
                              onDecided?.("Demande refusée")
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-danger px-4 py-2 font-ui text-[0.82rem] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <X size={15} /> Confirmer le refus
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setRefusing({ id: d.id, note: "" })}
                            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 font-ui text-[0.82rem] font-medium text-ink-subtle transition-colors hover:border-danger/40 hover:text-danger"
                          >
                            <X size={15} /> Refuser
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              decideTransactionRequest(d.id, "approuvee")
                              onDecided?.("Demande approuvée")
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-[0.82rem] font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
                          >
                            <Check size={15} /> Valider
                          </button>
                        </>
                      )}
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
