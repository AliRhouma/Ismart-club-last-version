import { useEffect, useMemo, useRef, useState } from "react"
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { EventType, PlanEvent } from "@/data/seed/events"
import { PageHeader } from "@/components/kit/PageHeader"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Segmented, type SegOption } from "@/features/budget/ui"
import { EventFormSheet } from "@/features/planification/EventFormSheet"
import { EVENT_TYPES, TYPE_META } from "@/features/planification/eventMeta"

/* ── Date helpers — pure, no library (Sunday-first, French) ─────────────── */

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]
const WEEKDAYS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."]

const pad = (n: number) => String(n).padStart(2, "0")
const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

type Cell = { iso: string; day: number; inMonth: boolean }

/** 42 cells (6 weeks) covering `monthIndex`, padded to full weeks. */
function monthMatrix(year: number, monthIndex: number): Cell[] {
  const first = new Date(year, monthIndex, 1)
  const start = new Date(year, monthIndex, 1 - first.getDay()) // back to Sunday
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { iso: toIso(d), day: d.getDate(), inMonth: d.getMonth() === monthIndex }
  })
}

/* ── Filter values ──────────────────────────────────────────────────────── */

type Filter = EventType | "all"
const FILTER_OPTIONS: SegOption<Filter>[] = [
  { value: "all", label: "Tout" },
  { value: "seance", label: "Séances" },
  { value: "match", label: "Matchs" },
  { value: "reunion", label: "Réunions" },
]

/* ── Event chip (in a day cell) ─────────────────────────────────────────── */

function EventChip({
  event,
  onClick,
}: {
  event: PlanEvent
  onClick: () => void
}) {
  const meta = TYPE_META[event.type]
  const Icon = meta.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/chip relative flex w-full overflow-hidden rounded-md border border-border bg-surface-nested text-left transition-colors hover:border-border-strong"
    >
      <span className={cn("w-1 shrink-0", meta.rail)} aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-1.5">
        <span className="flex items-center gap-1.5">
          <Icon size={12} className={cn("shrink-0", meta.iconColor)} />
          <span className="truncate font-ui text-[0.72rem] font-medium text-ink">
            {event.title}
          </span>
        </span>
        {event.category ? (
          <span className="truncate font-body text-[0.68rem] text-ink-muted">
            {event.category}
          </span>
        ) : null}
        <span className="flex items-center gap-1 font-body text-[0.66rem] text-ink-disabled">
          <Clock size={10} className="shrink-0" />
          {event.start}
          {event.end ? ` – ${event.end}` : ""}
        </span>
      </span>
    </button>
  )
}

/* ── Detail dialog ──────────────────────────────────────────────────────── */

function EventDetail({
  event,
  onClose,
  onEdit,
  onDelete,
}: {
  event: PlanEvent
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const meta = TYPE_META[event.type]
  const Icon = meta.icon
  const [y, m, d] = event.date.split("-").map(Number)
  const dateLabel = `${d} ${MONTHS_FR[m - 1]} ${y}`

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[460px]"
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md",
              meta.tile,
            )}
          >
            <Icon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-ui text-base font-medium text-ink">
              {event.title}
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {meta.label}
              {event.category ? ` · ${event.category}` : ""}
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 px-5 py-4">
          <DetailRow icon={CalendarDays} text={dateLabel} />
          <DetailRow
            icon={Clock}
            text={`${event.start}${event.end ? ` – ${event.end}` : ""}`}
          />
          {event.location ? (
            <DetailRow icon={MapPin} text={event.location} />
          ) : null}
          {event.detail ? (
            <p className="mt-1 rounded-md border border-border px-3 py-2.5 font-body text-[0.82rem] leading-relaxed text-ink-subtle">
              {event.detail}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 size={15} /> Supprimer
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fermer
            </Button>
            <Button size="sm" onClick={onEdit}>
              <Pencil size={15} /> Modifier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({
  icon: Icon,
  text,
}: {
  icon: typeof Clock
  text: string
}) {
  return (
    <div className="flex items-center gap-2.5 font-body text-[0.86rem] text-ink-subtle">
      <Icon size={15} className="shrink-0 text-ink-disabled" />
      {text}
    </div>
  )
}

/* ── Screen ─────────────────────────────────────────────────────────────── */

export function PlanificationScreen() {
  const { events, removeEvent } = useData()
  const today = todayISO()

  // View opens on the current month (so "aujourd'hui" is visible on load).
  const [ty, tm] = today.split("-").map(Number)
  const [view, setView] = useState({ year: ty, month: tm - 1 })
  const [filter, setFilter] = useState<Filter>("all")

  const [selected, setSelected] = useState<PlanEvent | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlanEvent | null>(null)
  const [formDate, setFormDate] = useState(today)
  const [pendingDelete, setPendingDelete] = useState<PlanEvent | null>(null)

  // Lightweight inline toast (matches the app's existing pattern).
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const cells = useMemo(
    () => monthMatrix(view.year, view.month),
    [view.year, view.month],
  )

  // Events grouped by ISO day, filtered by type, sorted by start time.
  const byDay = useMemo(() => {
    const map = new Map<string, PlanEvent[]>()
    for (const e of events) {
      if (filter !== "all" && e.type !== filter) continue
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start))
    return map
  }, [events, filter])

  const monthCount = useMemo(() => {
    const prefix = `${view.year}-${pad(view.month + 1)}`
    return events.filter(
      (e) => e.date.startsWith(prefix) && (filter === "all" || e.type === filter),
    ).length
  }, [events, view, filter])

  const step = (dir: -1 | 1) =>
    setView((v) => {
      const next = new Date(v.year, v.month + dir, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  const goToday = () => setView({ year: ty, month: tm - 1 })

  const openCreate = (date: string) => {
    setEditing(null)
    setFormDate(date)
    setFormOpen(true)
  }
  const openEdit = (event: PlanEvent) => {
    setSelected(null)
    setEditing(event)
    setFormDate(event.date)
    setFormOpen(true)
  }
  const confirmDelete = () => {
    if (!pendingDelete) return
    removeEvent(pendingDelete.id)
    notify("Événement supprimé")
    setPendingDelete(null)
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Planification"
        subtitle={
          monthCount > 0
            ? `${monthCount} événement${monthCount > 1 ? "s" : ""} · ${MONTHS_FR[view.month]} ${view.year}`
            : `Aucun événement · ${MONTHS_FR[view.month]} ${view.year}`
        }
        actions={
          <Button onClick={() => openCreate(today)}>
            <Plus size={16} /> Nouvel événement
          </Button>
        }
      />

      {/* Toolbar: month nav (left) + type filter (right). */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border">
            <button
              type="button"
              aria-label="Mois précédent"
              onClick={() => step(-1)}
              className="flex size-9 items-center justify-center rounded-l-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="w-px self-stretch bg-border" aria-hidden />
            <button
              type="button"
              aria-label="Mois suivant"
              onClick={() => step(1)}
              className="flex size-9 items-center justify-center rounded-r-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <h2 className="min-w-[9.5rem] font-ui text-lg font-medium text-ink">
            {MONTHS_FR[view.month]} {view.year}
          </h2>
          <Button variant="outline" size="sm" onClick={goToday}>
            Aujourd'hui
          </Button>
        </div>

        <Segmented value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
      </div>

      {/* Legend. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {EVENT_TYPES.map((type) => {
          const meta = TYPE_META[type]
          const Icon = meta.icon
          return (
            <span
              key={type}
              className="inline-flex items-center gap-1.5 font-body text-[0.75rem] text-ink-muted"
            >
              <span className={cn("h-2.5 w-2.5 rounded-[3px]", meta.rail)} />
              <Icon size={13} className={meta.iconColor} />
              {meta.label}
            </span>
          )
        })}
      </div>

      {/* Calendar grid — static card: transparent + border. */}
      <div className="overflow-hidden rounded-lg border border-border">
        {/* Weekday header. */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS_FR.map((wd) => (
            <div
              key={wd}
              className="px-2 py-2.5 text-center font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* 6 weeks × 7 days. */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const dayEvents = byDay.get(cell.iso) ?? []
            const isToday = cell.iso === today
            const lastCol = (i + 1) % 7 === 0
            const lastRow = i >= 35
            return (
              <div
                key={cell.iso}
                className={cn(
                  "group/cell relative flex min-h-[7.5rem] flex-col gap-1 border-border p-1.5",
                  !lastCol && "border-r",
                  !lastRow && "border-b",
                  !cell.inMonth && "bg-surface-hover",
                )}
              >
                {/* Day number + inline add (reveals on hover). */}
                <div className="flex items-center justify-between px-0.5">
                  <span
                    className={cn(
                      "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-ui text-[0.76rem]",
                      isToday
                        ? "bg-brand-blue-600 font-medium text-white"
                        : cell.inMonth
                          ? "text-ink-subtle"
                          : "text-ink-disabled",
                    )}
                  >
                    {cell.day}
                  </span>
                  <button
                    type="button"
                    aria-label={`Ajouter un événement le ${cell.day}`}
                    onClick={() => openCreate(cell.iso)}
                    className="flex size-6 items-center justify-center rounded-md text-ink-disabled opacity-0 transition-[opacity,color,background] hover:bg-surface-hover hover:text-ink focus-visible:opacity-100 group-hover/cell:opacity-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Events. */}
                <div className="flex flex-col gap-1">
                  {dayEvents.map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      onClick={() => setSelected(event)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected ? (
        <EventDetail
          event={selected}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onDelete={() => {
            setPendingDelete(selected)
            setSelected(null)
          }}
        />
      ) : null}

      <EventFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
        defaultDate={formDate}
        onSaved={notify}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Supprimer cet événement ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.title} » sera retiré du planning. Cette action est irréversible.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
      />

      {toast ? (
        <div
          key={toast.id}
          role="status"
          className="animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-success/30 bg-surface px-4 py-3 shadow-deep"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={14} />
          </span>
          <span className="font-body text-[0.84rem] text-ink">{toast.msg}</span>
        </div>
      ) : null}
    </div>
  )
}
