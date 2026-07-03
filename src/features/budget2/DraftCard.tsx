import { useState } from "react"
import {
  Archive,
  Copy,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtShort } from "@/lib/format"
import type { Budget2Draft, DraftTotals } from "@/data/seed/budget2"
import { fmtModified } from "@/features/budget2/helpers"
import { StatusBadge, Figure } from "@/features/budget2/ui"

type Actions = {
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onValidate: () => void
  onArchive: () => void
  onDelete: () => void
}

/**
 * A draft card (docs §2.4): name, status badge, totals, dernière modification
 * and an actions menu. The `valide` card is highlighted as the season's active
 * reference.
 */
export function DraftCard({
  draft,
  totals,
  actions,
}: {
  draft: Budget2Draft
  totals: DraftTotals
  actions: Actions
}) {
  const [menu, setMenu] = useState(false)
  const validated = draft.status === "valide"
  const deficit = totals.solde < 0

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-lg border p-5 transition-colors",
        validated
          ? "border-success/30 shadow-card"
          : "border-border hover:border-border-strong",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <StatusBadge status={draft.status} />
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            type="button"
            aria-label="Actions du brouillon"
            onClick={() => setMenu((v) => !v)}
            className="inline-flex size-8 items-center justify-center rounded-sm border border-transparent text-ink-muted transition-colors hover:border-border hover:bg-surface-hover hover:text-ink"
          >
            <MoreHorizontal size={16} />
          </button>
          {menu ? (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setMenu(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-background py-1 text-left shadow-deep">
                <Item icon={FolderOpen} onClick={() => run(setMenu, actions.onOpen)}>
                  Ouvrir
                </Item>
                <Item icon={Pencil} onClick={() => run(setMenu, actions.onRename)}>
                  Renommer
                </Item>
                <Item icon={Copy} onClick={() => run(setMenu, actions.onDuplicate)}>
                  Dupliquer
                </Item>
                {draft.status !== "valide" ? (
                  <Item
                    icon={CheckCheck}
                    onClick={() => run(setMenu, actions.onValidate)}
                  >
                    Valider
                  </Item>
                ) : null}
                <div className="my-1 border-t border-border" />
                {draft.status !== "archive" ? (
                  <Item icon={Archive} onClick={() => run(setMenu, actions.onArchive)}>
                    Archiver
                  </Item>
                ) : null}
                <Item icon={Trash2} danger onClick={() => run(setMenu, actions.onDelete)}>
                  Supprimer
                </Item>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={actions.onOpen}
        className="mt-3 text-left"
      >
        <h3 className="font-ui text-[1.15rem] font-medium leading-tight text-ink transition-colors hover:text-brand-blue-600">
          {draft.label}
        </h3>
      </button>
      <p className="mt-1 font-body text-[0.74rem] text-ink-disabled">
        Modifié le {fmtModified(draft.updated_at)}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Figure label="Dépenses" value={fmtShort(totals.depenses)} tone="negative" />
        <Figure label="Revenus" value={fmtShort(totals.revenus)} tone="positive" />
        <Figure
          label="Solde prév."
          value={(totals.solde >= 0 ? "+" : "") + fmtShort(totals.solde)}
          tone={deficit ? "negative" : "positive"}
        />
      </div>
      <p className="mt-2 text-right font-body text-[0.62rem] text-ink-disabled">
        montants en TND
      </p>
    </article>
  )
}

function run(setMenu: (v: boolean) => void, fn: () => void) {
  setMenu(false)
  fn()
}

function Item({
  icon: Icon,
  children,
  onClick,
  danger,
}: {
  icon: typeof Copy
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left font-body text-[0.82rem] transition-colors",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-ink-subtle hover:bg-surface-hover hover:text-ink",
      )}
    >
      <Icon size={14} /> {children}
    </button>
  )
}
