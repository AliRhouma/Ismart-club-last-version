import { useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  UserCog,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { ParentEnfant, ParentEvent } from "@/data/seed/parent"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { Avatar } from "@/components/kit/Avatar"
import { Button } from "@/components/ui/button"
import {
  MONTHS_FR,
  parentEventPath,
  parentPlanningPath,
} from "@/features/parent/shared"

/**
 * Espace parent — Séances.
 *
 * Built on the club's own séances list (`pole-technique/SeancesScreen`): same
 * stat rail, same month sections, same compact row with its date block, thème
 * and facts line. Here the list spans the WHOLE family — one filter chip per
 * child (a link, like everywhere else in this space) and a child chip on every
 * row, so a parent scanning the season always knows whose séance he is reading.
 * Presence lives on the séance's fiche, not here: this page is a reading tool.
 */

/* ── Date & durée helpers — display only, same shapes as the club's list ─── */

/** "2026-07-14" → "juillet 2026". */
const moisDe = (iso: string) => {
  const [y, m] = iso.split("-").map(Number)
  return `${MONTHS_FR[m - 1].toLowerCase()} ${y}`
}
/** "2026-07-14" → "14". */
const jourDe = (iso: string) => iso.split("-")[2]
/** "2026-07-14" → "juil". */
const moisCourtDe = (iso: string) => {
  const m = Number(iso.split("-")[1])
  return MONTHS_FR[m - 1].toLowerCase().slice(0, 4)
}
/** "17:30" → "17h30". */
const heureDe = (hhmm: string) => hhmm.replace(":", "h")
/** "17:30" + "19:00" → 90 — minutes, or null when the séance has no end. */
function dureeDe(event: ParentEvent): number | null {
  if (!event.end) return null
  const min = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }
  const total = min(event.end) - min(event.start)
  return total > 0 ? total : null
}

/* ── Screen ─────────────────────────────────────────────────────────────── */

export function ParentSeancesScreen() {
  const navigate = useNavigate()
  const { enfantId } = useParams()
  const { parentEvents, parentEnfants } = useData()
  const today = todayISO()

  /** The child the list is filtered on — null = toute la famille. */
  const enfantFiltre =
    parentEnfants.find((c) => c.id === enfantId) ?? null

  /** Every séance of the family, chronological, with its child attached. */
  const seances = useMemo(() => {
    return parentEvents
      .filter((e) => e.type === "seance")
      .sort(
        (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
      )
      .flatMap((event) => {
        const enfant = parentEnfants.find((c) => c.id === event.enfantId)
        return enfant ? [{ event, enfant }] : []
      })
  }, [parentEvents, parentEnfants])

  const visible = useMemo(
    () =>
      enfantFiltre
        ? seances.filter((r) => r.enfant.id === enfantFiltre.id)
        : seances,
    [seances, enfantFiltre],
  )

  const aVenir = visible.filter((r) => r.event.date >= today).length
  const passees = visible.length - aVenir
  const moisCourant = today.slice(0, 7)
  const ceMois = visible.filter((r) => r.event.date.startsWith(moisCourant)).length

  /** Grouped by month, in season order — how a family scans the year. */
  const parMois = useMemo(() => {
    const map = new Map<string, typeof visible>()
    for (const row of visible) {
      const k = moisDe(row.event.date)
      const arr = map.get(k) ?? map.set(k, []).get(k)!
      arr.push(row)
    }
    return [...map.entries()].map(([mois, rows]) => ({ mois, rows }))
  }, [visible])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Séances"
        subtitle={
          enfantFiltre
            ? `Les entraînements de ${enfantFiltre.nom} · ${enfantFiltre.categorie} — ${enfantFiltre.groupe}`
            : `Les entraînements de vos ${parentEnfants.length} enfants`
        }
        actions={
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                parentPlanningPath(
                  (enfantFiltre ?? parentEnfants[0]).id,
                ),
              )
            }
          >
            <CalendarDays /> Calendrier
          </Button>
        }
      />

      {/* Season line — derived in render, never stored. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Séances" value={visible.length} />
        <Stat label="À venir" value={aVenir} />
        <Stat label="Déjà passées" value={passees} />
        <Stat label="Ce mois-ci" value={ceMois} />
      </div>

      {/* Filtre enfant — des liens, comme partout dans cet espace. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-pill border border-border p-1">
          <FiltreChip to="/parent/seances" actif={!enfantFiltre} label="Tous" />
          {parentEnfants.map((enfant) => (
            <FiltreChip
              key={enfant.id}
              to={`/parent/${enfant.id}/seances`}
              actif={enfantFiltre?.id === enfant.id}
              label={enfant.nom.split(" ")[0]}
              enfant={enfant}
            />
          ))}
        </div>

        {enfantFiltre ? (
          <Link
            to="/parent/seances"
            className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
          >
            <X size={13} /> Voir tous les enfants
          </Link>
        ) : null}

        <p className="ml-auto font-body text-sm text-ink-muted">
          <span className="text-ink">{visible.length}</span> séance
          {visible.length > 1 ? "s" : ""}
        </p>
      </div>

      {parMois.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={CalendarDays}
            title="Aucune séance"
            description={
              enfantFiltre
                ? `Les entraînements de ${enfantFiltre.nom.split(" ")[0]} apparaîtront ici dès que l'éducateur publie le programme.`
                : "Les entraînements apparaîtront ici dès que le club publie le programme."
            }
            action={
              enfantFiltre ? (
                <Button variant="outline" asChild>
                  <Link to="/parent/seances">
                    <X /> Voir tous les enfants
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    navigate(parentPlanningPath(parentEnfants[0].id))
                  }
                >
                  <CalendarDays /> Ouvrir le calendrier
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {parMois.map(({ mois, rows }) => (
            <section key={mois} className="flex flex-col gap-2">
              <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                {mois}
              </h2>
              <div className="flex flex-col gap-2">
                {rows.map(({ event, enfant }) => (
                  <SeanceRow
                    key={event.id}
                    event={event}
                    enfant={enfant}
                    aVenir={event.date >= today}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function FiltreChip({
  to,
  actif,
  label,
  enfant,
}: {
  to: string
  actif: boolean
  label: string
  enfant?: ParentEnfant
}) {
  return (
    <Link
      to={to}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-pill border font-ui text-[0.76rem] font-medium transition-colors",
        enfant ? "py-1 pr-3.5 pl-1" : "px-3.5 py-1.5",
        actif
          ? "border-border-second bg-surface-nested text-ink"
          : "border-transparent text-ink-muted hover:text-ink",
      )}
    >
      {enfant ? <Avatar name={enfant.nom} size="sm" /> : null}
      {label}
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3.5">
      <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </span>
      <span className="font-ui text-xl font-semibold text-ink tabular-nums">
        {value}
      </span>
    </div>
  )
}

/**
 * One séance row — the club's list anatomy (fluid-fill navigable card, date
 * block, thème, facts line), plus the child it belongs to on the right edge:
 * with three agendas mixed, that chip is what makes the list readable.
 */
function SeanceRow({
  event,
  enfant,
  aVenir,
}: {
  event: ParentEvent
  enfant: ParentEnfant
  aVenir: boolean
}) {
  const info = event.seance
  const duree = dureeDe(event)

  return (
    <Link
      to={parentEventPath(event)}
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-background p-3.5 transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      {/* Date block — the anchor a family scans down the list. */}
      <span
        className={cn(
          "relative z-10 flex size-12 shrink-0 flex-col items-center justify-center rounded-md border bg-surface-nested",
          aVenir ? "border-brand-blue-600/30" : "border-border",
        )}
      >
        <span className="font-ui text-[0.95rem] leading-none text-ink tabular-nums">
          {jourDe(event.date)}
        </span>
        <span className="mt-0.5 font-ui text-[0.6rem] text-ink-disabled">
          {moisCourtDe(event.date)}
        </span>
      </span>

      <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-ui text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
          {event.title}
        </span>
        <span className="truncate font-ui text-[0.78rem] text-ink-muted">
          {event.detail || "Thème à définir"}
        </span>
        {/* Facts drop off progressively as the row narrows. */}
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1 font-ui text-[0.7rem] text-ink-disabled">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={11} /> {heureDe(event.start)}
            {duree ? ` · ${duree} min` : ""}
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Users size={11} /> {event.categorie}
          </span>
          {info?.educateur ? (
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <UserCog size={11} /> {info.educateur}
            </span>
          ) : null}
          {event.location ? (
            <span className="hidden items-center gap-1.5 lg:inline-flex">
              <MapPin size={11} /> {event.location}
            </span>
          ) : null}
        </span>
      </span>

      {/* De quel enfant parle cette séance. */}
      <span className="relative z-10 flex shrink-0 items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-pill border border-border py-1 pr-3 pl-1">
          <Avatar name={enfant.nom} size="sm" />
          <span className="font-ui text-[0.74rem] text-ink-muted">
            {enfant.nom.split(" ")[0]}
          </span>
        </span>
        <ChevronRight size={16} className="hidden text-ink-disabled sm:block" />
      </span>
    </Link>
  )
}
