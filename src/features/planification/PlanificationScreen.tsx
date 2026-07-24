import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
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
import { AdBanner } from "@/features/planification/AdBanner"

/* ── Date helpers — pure, no library (Sunday-first, French) ─────────────── */

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]
const WEEKDAYS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."]
// Single-letter header used on the narrow (mobile) grid where "dim." won't fit.
const WEEKDAYS_MIN_FR = ["D", "L", "M", "M", "J", "V", "S"]
const WEEKDAYS_LONG_FR = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
]

const pad = (n: number) => String(n).padStart(2, "0")
const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "Mardi 24 juillet" — full readable label for the mobile agenda header. */
function longDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  const wd = new Date(y, m - 1, d).getDay()
  return `${WEEKDAYS_LONG_FR[wd]} ${d} ${MONTHS_FR[m - 1].toLowerCase()}`
}

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

/* ── View mode (calendar vs. list) ──────────────────────────────────────── */

type ViewMode = "month" | "list"
const VIEW_OPTIONS: SegOption<ViewMode>[] = [
  {
    value: "month",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays size={14} /> Mois
      </span>
    ),
  },
  {
    value: "list",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <List size={14} /> Liste
      </span>
    ),
  },
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

/* ── Event row (list view) ──────────────────────────────────────────────── */

function EventRow({
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
      className="group/row relative flex w-full items-stretch gap-3 overflow-hidden rounded-lg border border-border text-left transition-colors hover:border-border-strong sm:gap-4"
    >
      <span className={cn("w-1 shrink-0", meta.rail)} aria-hidden />

      {/* Time — start over end, right-aligned so times line up down the list. */}
      <span className="flex w-14 shrink-0 flex-col items-end justify-center py-3 font-body text-[0.78rem] leading-tight text-ink-subtle sm:w-16">
        <span>{event.start}</span>
        {event.end ? (
          <span className="text-ink-disabled">{event.end}</span>
        ) : null}
      </span>

      <span className="my-3 w-px shrink-0 self-stretch bg-border" aria-hidden />

      {/* Type tile. */}
      <span
        className={cn(
          "my-auto flex size-8 shrink-0 items-center justify-center rounded-md sm:size-9",
          meta.tile,
        )}
      >
        <Icon size={16} />
      </span>

      {/* Title + meta. */}
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-3">
        <span className="truncate font-ui text-[0.9rem] font-medium text-ink">
          {event.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[0.75rem] text-ink-muted">
          <span>{meta.label}</span>
          {event.category ? (
            <span className="truncate before:mr-2 before:text-ink-disabled before:content-['·']">
              {event.category}
            </span>
          ) : null}
          {event.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="shrink-0 text-ink-disabled" />
              {event.location}
            </span>
          ) : null}
        </span>
      </span>

      <ChevronRight
        size={16}
        className="my-auto mr-3 shrink-0 text-ink-disabled transition-colors group-hover/row:text-ink-muted"
      />
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
  const navigate = useNavigate()
  const today = todayISO()

  // A séance opens its session page and a match opens its match page (both
  // route-based); a réunion opens the quick detail dialog in place.
  const openEvent = (event: PlanEvent) => {
    if (event.type === "seance") {
      navigate(`/planification/seance/${event.id}`)
    } else if (event.type === "match") {
      navigate(`/planification/match/${event.id}`)
    } else {
      setSelected(event)
    }
  }

  // View opens on the current month (so "aujourd'hui" is visible on load).
  const [ty, tm] = today.split("-").map(Number)
  const [view, setView] = useState({ year: ty, month: tm - 1 })
  const [filter, setFilter] = useState<Filter>("all")
  const [mode, setMode] = useState<ViewMode>("month")
  // Day whose events the mobile agenda shows (desktop ignores this).
  const [activeDay, setActiveDay] = useState(today)

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

  // List view: the month's events grouped by day, chronological, then by start.
  const monthGroups = useMemo(() => {
    const prefix = `${view.year}-${pad(view.month + 1)}`
    const list = events
      .filter(
        (e) => e.date.startsWith(prefix) && (filter === "all" || e.type === filter),
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))

    const groups: { date: string; items: PlanEvent[] }[] = []
    const index = new Map<string, number>()
    for (const e of list) {
      let i = index.get(e.date)
      if (i === undefined) {
        i = groups.length
        index.set(e.date, i)
        groups.push({ date: e.date, items: [] })
      }
      groups[i].items.push(e)
    }
    return groups
  }, [events, view, filter])

  const step = (dir: -1 | 1) =>
    setView((v) => {
      const next = new Date(v.year, v.month + dir, 1)
      // Point the mobile agenda at the new month (today if it's the current one).
      setActiveDay(
        next.getFullYear() === ty && next.getMonth() === tm - 1
          ? today
          : toIso(next),
      )
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  const goToday = () => {
    setView({ year: ty, month: tm - 1 })
    setActiveDay(today)
  }

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

      {/* Sponsor banner — the calendar_banner ad slot, wired to running campaigns. */}
      <AdBanner />

      {/* Toolbar: month nav (left) + type filter (right). */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 items-center rounded-md border border-border">
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
          <h2 className="min-w-0 flex-1 truncate font-ui text-lg font-medium text-ink sm:min-w-[9.5rem] sm:flex-none">
            {MONTHS_FR[view.month]} {view.year}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="shrink-0"
          >
            Aujourd'hui
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={FILTER_OPTIONS}
            className="max-w-full overflow-x-auto"
          />
          <Segmented value={mode} onChange={setMode} options={VIEW_OPTIONS} />
        </div>
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

      {mode === "month" ? (
      <>
      {/* Calendar grid — static card: transparent + border. */}
      <div className="overflow-hidden rounded-lg border border-border">
        {/* Weekday header — single letters on mobile, short labels from sm up. */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS_FR.map((wd, i) => (
            <div
              key={wd + i}
              className="px-1 py-2 text-center font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase sm:px-2 sm:py-2.5"
            >
              <span className="sm:hidden">{WEEKDAYS_MIN_FR[i]}</span>
              <span className="hidden sm:inline">{wd}</span>
            </div>
          ))}
        </div>

        {/* 6 weeks × 7 days. */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const dayEvents = byDay.get(cell.iso) ?? []
            const isToday = cell.iso === today
            const isActive = cell.iso === activeDay
            const lastCol = (i + 1) % 7 === 0
            const lastRow = i >= 35
            return (
              <div
                key={cell.iso}
                className={cn(
                  "group/cell relative flex min-h-[3.5rem] flex-col gap-1 border-border p-1 sm:min-h-[7.5rem] sm:p-1.5",
                  !lastCol && "border-r",
                  !lastRow && "border-b",
                  !cell.inMonth && "bg-surface-hover",
                  // Mobile-only selected-day highlight (desktop uses the agenda-less grid).
                  isActive && "bg-surface-hover ring-1 ring-border-strong ring-inset sm:bg-transparent sm:ring-0",
                )}
              >
                {/* Day number + inline add (reveals on hover; add is desktop-only). */}
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
                    className="hidden size-6 items-center justify-center rounded-md text-ink-disabled opacity-0 transition-[opacity,color,background] hover:bg-surface-hover hover:text-ink focus-visible:opacity-100 group-hover/cell:opacity-100 sm:flex"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Desktop: full event chips. */}
                <div className="hidden flex-col gap-1 sm:flex">
                  {dayEvents.map((event) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      onClick={() => openEvent(event)}
                    />
                  ))}
                </div>

                {/* Mobile: compact colored dots (up to 4, then +N). */}
                {dayEvents.length > 0 ? (
                  <div className="mt-auto flex flex-wrap items-center gap-1 px-0.5 pb-0.5 sm:hidden">
                    {dayEvents.slice(0, 4).map((event) => (
                      <span
                        key={event.id}
                        className={cn("size-1.5 rounded-full", TYPE_META[event.type].rail)}
                        aria-hidden
                      />
                    ))}
                    {dayEvents.length > 4 ? (
                      <span className="font-body text-[0.6rem] leading-none text-ink-muted">
                        +{dayEvents.length - 4}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {/* Mobile: whole-cell tap target — selects the day for the agenda below. */}
                <button
                  type="button"
                  aria-label={`Voir le ${cell.day}`}
                  onClick={() => setActiveDay(cell.iso)}
                  className="absolute inset-0 sm:hidden"
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile agenda — the selected day's events in full, since the compact
          grid only shows dots. Hidden from sm up where the grid shows chips. */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate font-ui text-sm font-medium text-ink first-letter:uppercase">
            {longDateLabel(activeDay)}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCreate(activeDay)}
            className="shrink-0"
          >
            <Plus size={15} /> Ajouter
          </Button>
        </div>

        {(() => {
          const dayEvents = byDay.get(activeDay) ?? []
          if (dayEvents.length === 0) {
            return (
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <CalendarDays size={22} className="text-ink-disabled" />
                <p className="font-body text-[0.82rem] text-ink-muted">
                  Aucun événement ce jour.
                </p>
              </div>
            )
          }
          return (
            <div className="flex flex-col gap-2">
              {dayEvents.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  onClick={() => openEvent(event)}
                />
              ))}
            </div>
          )
        })()}
      </div>
      </>
      ) : (
        /* ── List view — the month's events, grouped by day. ────────────── */
        <div className="flex flex-col gap-6">
          {monthGroups.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 rounded-lg border border-dashed border-border px-6 py-16 text-center">
              <CalendarDays size={26} className="text-ink-disabled" />
              <p className="font-ui text-sm font-medium text-ink first-letter:uppercase">
                Aucun événement en {MONTHS_FR[view.month].toLowerCase()}.
              </p>
              <p className="max-w-xs font-body text-[0.8rem] text-ink-muted">
                Ajoutez une séance, un match ou une réunion à ce mois.
              </p>
              <Button size="sm" className="mt-1" onClick={() => openCreate(today)}>
                <Plus size={15} /> Nouvel événement
              </Button>
            </div>
          ) : (
            monthGroups.map((group) => {
              const isToday = group.date === today
              return (
                <div key={group.date} className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-ui text-sm font-medium text-ink first-letter:uppercase">
                        {longDateLabel(group.date)}
                      </span>
                      {isToday ? (
                        <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.66rem] font-medium text-brand-blue-600">
                          Aujourd'hui
                        </span>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-body text-[0.75rem] text-ink-muted">
                      {group.items.length} événement{group.items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.items.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        onClick={() => openEvent(event)}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

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
