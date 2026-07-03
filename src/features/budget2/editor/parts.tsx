import { useState, type ReactNode } from "react"
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt } from "@/lib/format"
import type { Group, SubCategory } from "@/data/seed/finance"
import type { BudgetLine } from "@/data/seed/budget2"
import { lineTitle, methodFormula, METHOD_LABEL } from "@/features/budget2/helpers"

/* ── Collapsible section / block shell ──────────────────────────────────── */
export function EditorSection({
  title,
  scope,
  subtotal,
  icon,
  accent,
  headerExtra,
  defaultOpen = true,
  children,
}: {
  title: ReactNode
  scope?: ReactNode
  subtotal: number
  icon?: ReactNode
  /** Small badge/label shown next to the title (e.g. a scope pill). */
  headerExtra?: ReactNode
  accent?: "group"
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border",
        accent === "group" ? "border-brand-blue-600/25" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-hover"
      >
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-ink-muted transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
        {icon ? <span className="shrink-0 text-ink-muted">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-ui text-[0.95rem] font-medium text-ink">
              {title}
            </h3>
            {headerExtra}
          </div>
          {scope ? (
            <div className="mt-0.5 font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
              {scope}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[1.05rem] font-semibold tabular-nums text-ink">
            {fmt(subtotal)}
          </div>
          <div className="font-ui text-[0.56rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Sous-total
          </div>
        </div>
      </button>
      {open ? <div className="border-t border-border">{children}</div> : null}
    </section>
  )
}

/* ── A single line row ──────────────────────────────────────────────────── */
export function LineRow({
  line,
  groups,
  subs,
  readOnly,
  onEdit,
  onRemove,
}: {
  line: BudgetLine
  groups: Map<string, Group>
  subs: Map<string, SubCategory>
  readOnly?: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const { title, sub } = lineTitle(line, groups, subs)
  const formula = methodFormula(line)
  return (
    <div className="group/row flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 hover:bg-surface-hover">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-body text-[0.86rem] text-ink">{title}</span>
          {line.estimation_method !== "forfaitaire" ? (
            <span
              title={`${METHOD_LABEL[line.estimation_method]}${formula ? ` — ${formula}` : ""}`}
              className="inline-flex shrink-0 items-center rounded-sm border border-border-second bg-surface-nested px-1.5 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.03em] text-ink-muted"
            >
              {formula}
            </span>
          ) : null}
        </div>
        {sub ? (
          <div className="truncate font-body text-[0.7rem] text-ink-disabled">{sub}</div>
        ) : null}
      </div>

      <div className="shrink-0 font-body text-[0.88rem] tabular-nums text-ink">
        {fmt(line.montant_estime)}
      </div>

      {readOnly ? null : (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
          <button
            type="button"
            aria-label="Modifier la ligne"
            onClick={onEdit}
            className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            aria-label="Supprimer la ligne"
            onClick={onRemove}
            className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ── "+ Ajouter une ligne" row ──────────────────────────────────────────── */
export function AddLineRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-1.5 px-4 py-2.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover"
    >
      <Plus size={14} /> Ajouter une ligne
    </button>
  )
}

/* ── Empty hint inside a section/block with no lines yet ─────────────────── */
export function EmptyLines({ label }: { label: string }) {
  return (
    <p className="px-4 py-3 font-body text-[0.78rem] text-ink-disabled">{label}</p>
  )
}
