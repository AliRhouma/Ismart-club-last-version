import { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { EventType } from "@/data/seed/events"
import type { ParentEnfant, ParentEvent } from "@/data/seed/parent"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { Segmented, type SegOption } from "@/features/budget/ui"
import { AdBanner } from "@/features/planification/AdBanner"
import { EVENT_TYPES, TYPE_META } from "@/features/planification/eventMeta"
import {
  EnfantChip,
  EnfantFilter,
  MONTHS_FR,
  ReponseControl,
  parentEventPath,
  prenom,
  TypeTile,
  WEEKDAYS_FR,
  WEEKDAYS_MIN_FR,
  longDay,
  monthMatrix,
  pad,
  toIso,
  useFamilyEvents,
} from "@/features/parent/shared"

/* ── Filters ────────────────────────────────────────────────────────────── */

type Filter = EventType | "all"
const FILTER_OPTIONS: SegOption<Filter>[] = [
  { value: "all", label: "Tout" },
  { value: "seance", label: "Séances" },
  { value: "match", label: "Matchs" },
  { value: "reunion", label: "Réunions" },
]

/**
 * Espace parent — Planification.
 *
 * ONE calendar for the whole family: a parent juggles three schedules, so the
 * screen never scopes itself to a single child — every event sits on the same
 * grid, each card says whose it is, and a chip row narrows to one child when
 * that's what you want. The club's own calendar is an editing tool; this one
 * is a reading tool, so the grid is compact (a dot per event) and the picked
 * day gets a full agenda panel beside it — where the Présent / Absent answer
 * lives. Referenced the club's PlanificationScreen for the grid mechanics and
 * the Budget screens for the panel density.
 */
export function ParentPlanificationScreen() {
  const { parentEnfants } = useData()
  const familyEvents = useFamilyEvents()
  const { toast, notify } = useToast()
  const today = todayISO()

  const [ty, tm] = today.split("-").map(Number)
  const [view, setView] = useState({ year: ty, month: tm - 1 })
  const [filter, setFilter] = useState<Filter>("all")
  /** "all" = toute la famille — le défaut ; sinon l'id d'un enfant. */
  const [qui, setQui] = useState<string>("all")
  const [selectedDay, setSelectedDay] = useState(today)

  const enfantById = useMemo(() => {
    const map = new Map<string, ParentEnfant>()
    for (const c of parentEnfants) map.set(c.id, c)
    return map
  }, [parentEnfants])

  const enfantFiltre = qui === "all" ? undefined : enfantById.get(qui)

  /**
   * Sur mobile la grille et l'agenda sont empilés, et le panneau tombe sous le
   * pli : taper un jour a l'air de ne rien faire. On amène donc l'agenda à
   * l'écran. Sur large écran il est déjà à côté de la grille — on ne bouge pas.
   */
  const agendaRef = useRef<HTMLElement>(null)
  const revealAgenda = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) return
    // Après le rendu du jour choisi, sinon on vise l'ancienne hauteur.
    requestAnimationFrame(() =>
      agendaRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      }),
    )
  }

  const cells = useMemo(
    () => monthMatrix(view.year, view.month),
    [view.year, view.month],
  )

  const visible = useMemo(
    () =>
      familyEvents.filter(
        (e) =>
          (filter === "all" || e.type === filter) &&
          (qui === "all" || e.enfantId === qui),
      ),
    [familyEvents, filter, qui],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, ParentEvent[]>()
    for (const e of visible) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [visible])

  const monthPrefix = `${view.year}-${pad(view.month + 1)}`
  const monthEvents = visible.filter((e) => e.date.startsWith(monthPrefix))
  const dayEvents = byDay.get(selectedDay) ?? []
  const enAttente = visible.filter(
    (e) => e.date >= today && e.reponse === "attente",
  )

  const step = (dir: -1 | 1) =>
    setView((v) => {
      const next = new Date(v.year, v.month + dir, 1)
      // Point the agenda at the new month (today when it's the current one).
      setSelectedDay(
        next.getFullYear() === ty && next.getMonth() === tm - 1
          ? today
          : toIso(next),
      )
      return { year: next.getFullYear(), month: next.getMonth() }
    })

  const goToday = () => {
    setView({ year: ty, month: tm - 1 })
    setSelectedDay(today)
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Planification"
        subtitle={
          enfantFiltre
            ? `${enfantFiltre.nom} · ${enfantFiltre.categorie} — ${enfantFiltre.groupe}`
            : `Le calendrier de la famille — ${parentEnfants.length} enfants réunis`
        }
        actions={
          enAttente.length ? (
            <Badge variant="warning" dot>
              {enAttente.length} sans réponse
            </Badge>
          ) : (
            <Badge variant="success" dot>
              Tout est confirmé
            </Badge>
          )
        }
      />

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

        <Segmented
          value={filter}
          onChange={setFilter}
          options={FILTER_OPTIONS}
          className="max-w-full overflow-x-auto"
        />
      </div>

      {/* Qui ? — le seul découpage du calendrier familial. */}
      <EnfantFilter value={qui} onChange={setQui} enfants={parentEnfants} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        {/* Month grid — read-only, a dot per event. */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-lg border border-border">
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

            <div className="grid grid-cols-7">
              {cells.map((cell, i) => {
                const events = byDay.get(cell.iso) ?? []
                const isToday = cell.iso === today
                const isSelected = cell.iso === selectedDay
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      setSelectedDay(cell.iso)
                      // Tapping a spill-over day follows it into its month,
                      // so the agenda panel never sits outside the grid shown.
                      if (!cell.inMonth) {
                        const [y, m] = cell.iso.split("-").map(Number)
                        setView({ year: y, month: m - 1 })
                      }
                      revealAgenda()
                    }}
                    aria-current={isSelected ? "date" : undefined}
                    className={cn(
                      "flex min-h-[4.5rem] flex-col items-center gap-1.5 px-1 py-2 text-center transition-colors sm:min-h-[5.5rem]",
                      i % 7 !== 0 && "border-l border-border",
                      i >= 7 && "border-t border-border",
                      !cell.inMonth && "opacity-45",
                      isSelected
                        ? "bg-surface-nested"
                        : "hover:bg-surface-hover",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-pill font-ui text-[0.78rem]",
                        isToday
                          ? "bg-info/15 text-info"
                          : isSelected
                            ? "text-ink"
                            : "text-ink-muted",
                      )}
                    >
                      {cell.day}
                    </span>

                    {/* One dot per event, colour-coded by type. */}
                    <span className="flex flex-wrap items-center justify-center gap-1">
                      {events.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          title={e.title}
                          className={cn(
                            "size-1.5 rounded-full",
                            TYPE_META[e.type].rail,
                          )}
                        />
                      ))}
                    </span>

                    {/* On a wide grid the first event's title fits too. */}
                    {events[0] ? (
                      <span className="hidden w-full truncate font-body text-[0.68rem] text-ink-muted lg:block">
                        {events.length > 1
                          ? `${events.length} événements`
                          : qui === "all"
                            ? `${prenom(enfantById.get(events[0].enfantId))} · ${events[0].title}`
                            : events[0].title}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend + month count. */}
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {EVENT_TYPES.map((type) => {
                const meta = TYPE_META[type]
                const Icon = meta.icon
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 font-body text-[0.75rem] text-ink-muted"
                  >
                    <span className={cn("size-2 rounded-full", meta.rail)} />
                    <Icon size={13} className={meta.iconColor} />
                    {meta.label}
                  </span>
                )
              })}
            </div>
            <span className="font-body text-[0.75rem] text-ink-disabled">
              {monthEvents.length
                ? `${monthEvents.length} événement${monthEvents.length > 1 ? "s" : ""} ce mois-ci`
                : "Aucun événement ce mois-ci"}
            </span>
          </div>
        </div>

        {/* Day agenda — where the parent answers. */}
        <aside
          ref={agendaRef}
          className="flex scroll-mt-4 flex-col gap-3 lg:sticky lg:top-0 lg:self-start"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-ui text-[0.95rem] font-medium text-ink">
              {longDay(selectedDay)}
            </h3>
            {selectedDay === today ? (
              <Badge variant="info">Aujourd'hui</Badge>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            {dayEvents.length ? (
              dayEvents.map((event) => (
                <DayEventCard
                  key={event.id}
                  event={event}
                  enfant={enfantById.get(event.enfantId)}
                  onAnswer={(r) =>
                    notify(
                      r === "present"
                        ? `Présence confirmée — ${event.title}`
                        : `Absence signalée — ${event.title}`,
                    )
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-border">
                <EmptyState
                  icon={CalendarDays}
                  title="Journée libre"
                  description={
                    enfantFiltre
                      ? `Rien de prévu pour ${prenom(enfantFiltre)} ce jour-là — affichez toute la famille, ou choisissez une autre date.`
                      : "Rien de prévu pour ce jour. Choisissez une autre date dans le calendrier."
                  }
                />
              </div>
            )}
          </div>
        </aside>
      </div>

      <Toast toast={toast} />
    </div>
  )
}

/* ── One event of the selected day ──────────────────────────────────────── */

function DayEventCard({
  event,
  enfant,
  onAnswer,
}: {
  event: ParentEvent
  /** À qui l'événement appartient — le calendrier mélange les trois enfants. */
  enfant?: ParentEnfant
  onAnswer: (reponse: string) => void
}) {
  const meta = TYPE_META[event.type]
  return (
    <div className="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-background px-4 py-4 transition-colors hover:border-border-strong">
      {/* Fluid fill of a navigable card — the head opens the fiche. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      {enfant ? <EnfantChip enfant={enfant} className="relative z-10" /> : null}

      <Link
        to={parentEventPath(event)}
        className="relative z-10 flex items-start gap-3"
      >
        <TypeTile type={event.type} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-[0.92rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
            {event.title}
          </p>
          <p className="mt-0.5 font-body text-[0.78rem] text-ink-muted">
            {meta.label} · {event.categorie}
          </p>
        </div>
        <ArrowUpRight
          size={15}
          className="mt-0.5 shrink-0 text-ink-disabled transition-colors group-hover:text-brand-blue-600"
        />
      </Link>

      {event.detail ? (
        <p className="relative z-10 font-body text-[0.82rem] leading-relaxed text-ink-subtle">
          {event.detail}
        </p>
      ) : null}

      <div className="relative z-10 flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 font-body text-[0.8rem] text-ink-subtle">
          <Clock size={14} className="shrink-0 text-ink-muted" />
          {event.start}
          {event.end ? ` – ${event.end}` : ""}
        </span>
        {event.location ? (
          <span className="inline-flex items-center gap-1.5 font-body text-[0.8rem] text-ink-subtle">
            <MapPin size={14} className="shrink-0 text-ink-muted" />
            {event.location}
          </span>
        ) : null}
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <ReponseControl event={event} onDone={onAnswer} />
        <Link
          to={parentEventPath(event)}
          className="font-ui text-[0.72rem] tracking-[0.06em] text-info uppercase transition-colors hover:text-ink"
        >
          Voir la fiche
        </Link>
      </div>
    </div>
  )
}
