import { Check, Inbox, Paperclip, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtShort, fmtFrDate } from "@/lib/format"
import type { Nature } from "@/data/seed/finance"
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
 * Read-only demo of the « Demandes de transaction » review flow: requests
 * submitted by the staff / coaches, waiting for an admin to validate or refuse.
 * UI-only prototype — the Valider / Refuser actions are intentionally inert.
 */
type Demande = {
  id: string
  requester: string
  role: string
  nature: Nature
  category: string
  amount: number
  date: string
  motif: string
  attachment?: string
}

const DEMANDES: Demande[] = [
  {
    id: "dem-ballons",
    requester: "Karim Belhadj",
    role: "Entraîneur principal",
    nature: "Dépense",
    category: "Biens & Équipement → Ballons",
    amount: 850,
    date: "2026-06-28",
    motif: "Renouvellement du lot de ballons pour la reprise des U17.",
    attachment: "devis-ballons.pdf",
  },
  {
    id: "dem-pharmacie",
    requester: "Mehdi Traoui",
    role: "Préparateur physique",
    nature: "Dépense",
    category: "Santé → Pharmacie & soins",
    amount: 320,
    date: "2026-06-30",
    motif: "Réassort de la trousse de premiers soins avant le tournoi.",
  },
  {
    id: "dem-bus-sousse",
    requester: "Karim Belhadj",
    role: "Entraîneur principal",
    nature: "Dépense",
    category: "Transport → Bus déplacement",
    amount: 1600,
    date: "2026-07-01",
    motif: "Bus pour le tournoi national U15 à Sousse (aller-retour).",
    attachment: "devis-transport-sousse.pdf",
  },
  {
    id: "dem-fournitures",
    requester: "Sonia Khelifi",
    role: "Secrétaire générale",
    nature: "Dépense",
    category: "Frais Administratifs → Fournitures de bureau",
    amount: 145,
    date: "2026-07-01",
    motif: "Cartouches d'encre et ramettes de papier pour le secrétariat.",
  },
  {
    id: "dem-buvette",
    requester: "Ahmed Ben Salah",
    role: "Trésorier",
    nature: "Revenu",
    category: "Collecte → Buvette",
    amount: 1240,
    date: "2026-07-02",
    motif: "Recette de la buvette — tournoi de fin de saison.",
    attachment: "recette-buvette.pdf",
  },
]

export function DemandesModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const count = DEMANDES.length

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
              {DEMANDES.map((d) => {
                const revenu = d.nature === "Revenu"
                return (
                  <li
                    key={d.id}
                    className="rounded-lg border border-border bg-surface p-4"
                  >
                    {/* Requester + amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar name={d.requester} size="md" />
                        <div className="min-w-0">
                          <span className="font-body text-[0.9rem] text-ink">
                            {d.requester}
                          </span>
                          <div className="mt-1 truncate font-body text-[0.78rem] text-ink-muted">
                            {d.category}
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
                      <span className="tabular-nums">{fmtFrDate(d.date)}</span>
                      {d.attachment ? (
                        <span className="inline-flex items-center gap-1 text-info">
                          <Paperclip size={12} />
                          {d.attachment}
                        </span>
                      ) : null}
                    </div>

                    {/* Actions — UI only */}
                    <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-border pt-3.5">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 font-ui text-[0.82rem] font-medium text-ink-subtle transition-colors hover:border-danger/40 hover:text-danger"
                      >
                        <X size={15} /> Refuser
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-[0.82rem] font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
                      >
                        <Check size={15} /> Valider
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

/** Count exposed for the toolbar badge (kept in sync with the demo list). */
export const DEMANDES_COUNT = DEMANDES.length
