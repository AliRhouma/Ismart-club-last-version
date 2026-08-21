import { useMemo, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  Clock,
  Crosshair,
  Goal,
  Layers,
  ListChecks,
  MapPin,
  Percent,
  Shield,
  Square,
  Star,
  Swords,
  Timer,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  buildFallbackMatch,
  type ConvocationStatut,
  type MatchDetail,
  type MatchParticipant,
  type MatchTimelineEvent,
  type MyMatchStats,
  type PresenceStatut,
} from "@/data/seed/matches"
import { Avatar } from "@/components/kit/Avatar"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { AdBanner } from "@/features/planification/AdBanner"

/* ── Dates (full French, no library) ──────────────────────────────────────── */

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]
const pad = (n: number) => String(n).padStart(2, "0")

/** "2026-05-09" → "9 mai 2026". */
function frDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS_FR[m - 1]} ${y}`
}
/** "2026-05-09" → "09 mai 2026" (padded — the détails line). */
function frDatePadded(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${pad(d)} ${MONTHS_FR[m - 1]} ${y}`
}

/* ── Tabs — the set differs before vs after the match ─────────────────────── */

type Tab = { value: string; label: string }

const BEFORE_TABS: Tab[] = [
  { value: "convocation", label: "Convocation" },
  { value: "consignes", label: "Consignes" },
  { value: "composition", label: "Composition" },
]
const AFTER_TABS: Tab[] = [
  { value: "details", label: "Détails du match" },
  { value: "mes-stats", label: "Mes stats" },
  { value: "composition", label: "Compositions" },
  { value: "presences", label: "Présences" },
  { value: "evaluation", label: "Évaluation" },
  { value: "consignes", label: "Consignes" },
]

/* ── Screen ───────────────────────────────────────────────────────────────── */

export function MatchScreen() {
  const { id, tab } = useParams()
  const { events, matchDetails } = useData()

  // Prefer a seeded detail; otherwise derive one from the calendar event so any
  // match card still opens a coherent page.
  const match: MatchDetail | null = useMemo(() => {
    const seeded = matchDetails.find((m) => m.eventId === id)
    if (seeded) return seeded
    const event = events.find((e) => e.id === id && e.type === "match")
    return event ? buildFallbackMatch(event) : null
  }, [events, matchDetails, id])

  if (!match) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackButton to="/planification" label="Retour à la planification" />
        <EmptyState
          icon={Swords}
          title="Match introuvable"
          description="Ce match n'existe pas ou a été retiré du planning."
        />
      </div>
    )
  }

  const finished = match.statut === "termine"
  const tabs = finished ? AFTER_TABS : BEFORE_TABS
  const activeTab = tabs.some((t) => t.value === tab) ? tab! : tabs[0].value

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <BackButton to="/planification" label="Retour à la planification" />

      <MatchHeader match={match} />

      {/* Sponsor banner — the planification ad slot, wired to running
          campaigns (shared with the Planification calendar). */}
      <AdBanner space="match_detail" />

      <MatchTabs eventId={match.eventId} tabs={tabs} active={activeTab} />

      {/* ── Before-match tabs ── */}
      {activeTab === "convocation" ? (
        <ConvocationTab participants={match.participants} />
      ) : null}

      {/* ── Shared / after-match tabs ── */}
      {activeTab === "consignes" ? (
        <ConsignesTab match={match} />
      ) : null}
      {activeTab === "composition" ? <CompositionTab /> : null}
      {activeTab === "details" ? <DetailsTab match={match} /> : null}
      {activeTab === "mes-stats" ? <MesStatsTab stats={match.myStats} /> : null}
      {activeTab === "presences" ? (
        <PresencesTab participants={match.participants} presence={match.presence} />
      ) : null}
      {activeTab === "evaluation" ? <EvaluationTab /> : null}
    </div>
  )
}

/* ── Header ───────────────────────────────────────────────────────────────── */

function MatchHeader({ match }: { match: MatchDetail }) {
  const finished = match.statut === "termine"

  return (
    <header className="flex flex-col gap-5 rounded-lg border border-border p-6">
      {/* Overline + statut pill. */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle">
            <Swords size={18} strokeWidth={2} />
          </span>
          <span className="font-ui text-[0.7rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Match · {match.categorie}
          </span>
        </div>
        <StatutPill finished={finished} />
      </div>

      {/* Scoreline — home (green) VS / score away (red). */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border pt-5 sm:gap-6">
        <TeamName name={match.homeTeam} side="home" align="right" />

        <div className="flex flex-col items-center gap-1">
          {finished ? (
            <div className="flex items-center gap-2 font-display text-[2rem] font-semibold tabular-nums text-ink sm:gap-2.5 sm:text-5xl">
              <span className="text-team-home">{match.homeScore}</span>
              <span className="text-ink-disabled">–</span>
              <span className="text-team-away">{match.awayScore}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-display text-2xl font-semibold tabular-nums text-ink sm:text-4xl">
              {match.kickoff}
            </div>
          )}
          <span className="rounded-pill bg-surface-nested px-2.5 py-0.5 font-ui text-[0.68rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            {finished ? "Terminé" : "Coup d'envoi"}
          </span>
        </div>

        <TeamName name={match.awayTeam} side="away" align="left" />
      </div>

      {/* Date line under the scoreline. */}
      <div className="-mt-2 text-center font-body text-[0.82rem] text-ink-muted">
        {frDate(match.dateIso)}
      </div>

      {/* Détails du match — the info grid. */}
      <div className="border-t border-border pt-5">
        <p className="mb-3 font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          Détails du match
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoField
            icon={CalendarDays}
            label="Date & heure"
            value={`${frDatePadded(match.dateIso)}, ${match.kickoff}`}
          />
          <InfoField icon={Layers} label="Catégorie" value={match.categorie} />
          <InfoField icon={Users} label="Groupe" value={match.groupe} />
          {match.location ? (
            <InfoField icon={MapPin} label="Lieu" value={match.location} />
          ) : null}
        </div>
      </div>
    </header>
  )
}

function StatutPill({ finished }: { finished: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-pill border px-3 py-1 font-ui text-[0.72rem] font-medium",
        finished
          ? "border-success/30 bg-success/10 text-success"
          : "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
      )}
    >
      {finished ? "Terminé" : "À venir"}
    </span>
  )
}

function TeamName({
  name,
  side,
  align,
}: {
  name: string
  side: "home" | "away"
  align: "left" | "right"
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        align === "right" ? "justify-end" : "justify-start",
      )}
    >
      {align === "left" ? (
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            side === "home" ? "bg-team-home" : "bg-team-away",
          )}
          aria-hidden
        />
      ) : null}
      <h1
        className={cn(
          "min-w-0 font-ui text-base font-medium text-ink sm:text-xl",
          align === "right" ? "text-right" : "text-left",
        )}
      >
        {name}
      </h1>
      {align === "right" ? (
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            side === "home" ? "bg-team-home" : "bg-team-away",
          )}
          aria-hidden
        />
      ) : null}
    </div>
  )
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={15} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          {label}
        </div>
        <div className="mt-0.5 font-ui text-sm text-ink-subtle">{value}</div>
      </div>
    </div>
  )
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

function MatchTabs({
  eventId,
  tabs,
  active,
}: {
  eventId: string
  tabs: Tab[]
  active: string
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-pill border border-border p-1">
        {tabs.map((t) => {
          const on = t.value === active
          return (
            <Link
              key={t.value}
              to={`/planification/match/${eventId}/${t.value}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-pill px-4 py-1.5 font-ui text-[0.78rem] font-medium whitespace-nowrap transition-colors",
                on
                  ? "border border-border-second bg-surface-nested text-ink"
                  : "border border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ── Convocation tab ──────────────────────────────────────────────────────── */

const CONVOCATION_META: Record<
  ConvocationStatut,
  { label: string; icon: LucideIcon; pill: string }
> = {
  accepte: {
    label: "Accepté",
    icon: Check,
    pill: "border-success/30 bg-success/10 text-success",
  },
  refuse: {
    label: "Refusé",
    icon: X,
    pill: "border-team-away/30 bg-team-away/10 text-team-away",
  },
  attente: {
    label: "En attente",
    icon: Clock,
    pill: "border-warning/30 bg-warning/10 text-warning",
  },
}

function ConvocationTab({
  participants,
}: {
  participants: MatchParticipant[]
}) {
  if (participants.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Users}
          title="Aucune convocation"
          description="Les joueurs et le staff convoqués pour ce match apparaîtront ici."
        />
      </section>
    )
  }

  const counts = {
    accepte: participants.filter((p) => p.convocation === "accepte").length,
    refuse: participants.filter((p) => p.convocation === "refuse").length,
    attente: participants.filter((p) => p.convocation === "attente").length,
  }
  const joueurs = participants.filter((p) => p.kind === "joueur")
  const staff = participants.filter((p) => p.kind === "staff")

  return (
    <div className="flex flex-col gap-5">
      {/* Réponse summary. */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryChip
          label="Acceptés"
          value={counts.accepte}
          icon={Check}
          tone="success"
        />
        <SummaryChip
          label="Refusés"
          value={counts.refuse}
          icon={X}
          tone="danger"
        />
        <SummaryChip
          label="En attente"
          value={counts.attente}
          icon={Clock}
          tone="warning"
        />
      </div>

      <RosterSection title="Joueurs" count={joueurs.length}>
        {joueurs.map((p) => (
          <ConvocationRow key={p.id} participant={p} />
        ))}
      </RosterSection>

      <RosterSection title="Staff" count={staff.length}>
        {staff.map((p) => (
          <ConvocationRow key={p.id} participant={p} />
        ))}
      </RosterSection>
    </div>
  )
}

function ConvocationRow({ participant }: { participant: MatchParticipant }) {
  const meta = CONVOCATION_META[participant.convocation]
  const Icon = meta.icon
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        participant.isMe && "bg-surface-hover",
      )}
    >
      <Avatar name={participant.name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-ui text-[0.9rem] text-ink">
            {participant.name}
          </span>
          {participant.isMe ? (
            <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-1.5 py-0.5 font-ui text-[0.6rem] font-medium tracking-wide text-brand-blue-600 uppercase">
              Moi
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate font-body text-[0.76rem] text-ink-muted">
          {participant.numero != null ? (
            <span className="tabular-nums text-ink-disabled">
              N°{participant.numero} ·{" "}
            </span>
          ) : null}
          {participant.role}
          {participant.note ? (
            <span className="text-ink-disabled"> — {participant.note}</span>
          ) : null}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium",
          meta.pill,
        )}
      >
        <Icon size={13} />
        {meta.label}
      </span>
    </div>
  )
}

/* ── Présences tab ────────────────────────────────────────────────────────── */

const PRESENCE_META: Record<
  PresenceStatut,
  { label: string; icon: LucideIcon; pill: string }
> = {
  present: {
    label: "Présent",
    icon: Check,
    pill: "border-success/30 bg-success/10 text-success",
  },
  absent: {
    label: "Absent",
    icon: X,
    pill: "border-team-away/30 bg-team-away/10 text-team-away",
  },
  retard: {
    label: "En retard",
    icon: Clock,
    pill: "border-warning/30 bg-warning/10 text-warning",
  },
}

function PresencesTab({
  participants,
  presence,
}: {
  participants: MatchParticipant[]
  presence: Record<string, PresenceStatut>
}) {
  if (participants.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Users}
          title="Aucune présence enregistrée"
          description="La présence des joueurs et du staff sera enregistrée le jour du match."
        />
      </section>
    )
  }

  const statutOf = (p: MatchParticipant): PresenceStatut =>
    presence[p.id] ?? "absent"
  const counts = {
    present: participants.filter((p) => statutOf(p) === "present").length,
    absent: participants.filter((p) => statutOf(p) === "absent").length,
    retard: participants.filter((p) => statutOf(p) === "retard").length,
  }
  const joueurs = participants.filter((p) => p.kind === "joueur")
  const staff = participants.filter((p) => p.kind === "staff")

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <SummaryChip
          label="Présents"
          value={counts.present}
          icon={Check}
          tone="success"
        />
        <SummaryChip
          label="Absents"
          value={counts.absent}
          icon={X}
          tone="danger"
        />
        <SummaryChip
          label="En retard"
          value={counts.retard}
          icon={Clock}
          tone="warning"
        />
      </div>

      <RosterSection title="Joueurs" count={joueurs.length}>
        {joueurs.map((p) => (
          <PresenceRow key={p.id} participant={p} statut={statutOf(p)} />
        ))}
      </RosterSection>

      <RosterSection title="Staff" count={staff.length}>
        {staff.map((p) => (
          <PresenceRow key={p.id} participant={p} statut={statutOf(p)} />
        ))}
      </RosterSection>
    </div>
  )
}

function PresenceRow({
  participant,
  statut,
}: {
  participant: MatchParticipant
  statut: PresenceStatut
}) {
  const meta = PRESENCE_META[statut]
  const Icon = meta.icon
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        participant.isMe && "bg-surface-hover",
      )}
    >
      <Avatar name={participant.name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-ui text-[0.9rem] text-ink">
            {participant.name}
          </span>
          {participant.isMe ? (
            <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-1.5 py-0.5 font-ui text-[0.6rem] font-medium tracking-wide text-brand-blue-600 uppercase">
              Moi
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate font-body text-[0.76rem] text-ink-muted">
          {participant.numero != null ? (
            <span className="tabular-nums text-ink-disabled">
              N°{participant.numero} ·{" "}
            </span>
          ) : null}
          {participant.role}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium",
          meta.pill,
        )}
      >
        <Icon size={13} />
        {meta.label}
      </span>
    </div>
  )
}

/* ── Shared roster bits ───────────────────────────────────────────────────── */

function RosterSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
          {title}
        </h2>
        <span className="font-body text-[0.74rem] text-ink-muted tabular-nums">
          {count}
        </span>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  )
}

const SUMMARY_TONE = {
  success: "text-success",
  danger: "text-team-away",
  warning: "text-warning",
} as const

function SummaryChip({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone: keyof typeof SUMMARY_TONE
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-3 sm:px-4">
      <div className="flex items-center gap-2">
        <span className={cn("shrink-0", SUMMARY_TONE[tone])}>
          <Icon size={17} strokeWidth={2} />
        </span>
        <span
          className={cn(
            "font-display text-xl font-semibold leading-none tabular-nums",
            SUMMARY_TONE[tone],
          )}
        >
          {value}
        </span>
      </div>
      <div className="mt-1.5 font-ui text-[0.64rem] font-medium tracking-[0.05em] text-ink-muted uppercase sm:text-[0.68rem]">
        {label}
      </div>
    </div>
  )
}

/* ── Consignes tab (image + titre cards) ──────────────────────────────────── */

function ConsignesTab({ match }: { match: MatchDetail }) {
  if (match.consignes.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={ListChecks}
          title="Aucune consigne"
          description="Les consignes envoyées par le coach avant le match apparaîtront ici."
        />
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {match.consignes.map((c) => (
        <article
          key={c.id}
          className={cn(
            "group flex flex-col overflow-hidden rounded-lg border transition-colors",
            c.personal
              ? "border-brand-blue-600/40"
              : "border-border hover:border-border-strong",
          )}
        >
          <div className="aspect-video overflow-hidden border-b border-border bg-surface-nested">
            <img
              src={c.image}
              alt={`Consigne — ${c.titre}`}
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-4">
            <h3 className="font-ui text-[0.92rem] font-medium text-ink">
              {c.titre}
            </h3>
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-pill px-2 py-0.5 font-ui text-[0.66rem] font-medium",
                c.personal
                  ? "border border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                  : "bg-surface-nested text-ink-muted",
              )}
            >
              {c.audience}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

/* ── Composition tab (empty for now) ──────────────────────────────────────── */

function CompositionTab() {
  return (
    <section className="rounded-lg border border-border">
      <EmptyState
        icon={Users}
        title="Composition à venir"
        description="Le onze de départ et les remplaçants seront affichés ici une fois la composition établie."
      />
    </section>
  )
}

/* ── Évaluation tab (empty for now) ───────────────────────────────────────── */

function EvaluationTab() {
  return (
    <section className="rounded-lg border border-border">
      <EmptyState
        icon={Star}
        title="Évaluation indisponible"
        description="Les notes et le bilan individuel des joueurs seront saisis ici après analyse du match."
      />
    </section>
  )
}

/* ── Détails du match tab (timeline) ──────────────────────────────────────── */

const TIMELINE_META: Record<
  MatchTimelineEvent["kind"],
  { label: string; icon: LucideIcon; iconClass?: string }
> = {
  but: { label: "But", icon: Goal },
  jaune: { label: "Carton jaune", icon: Square, iconClass: "text-warning" },
  rouge: { label: "Carton rouge", icon: Square, iconClass: "text-team-away" },
  changement: { label: "Changement", icon: ArrowLeftRight },
}

function DetailsTab({ match }: { match: MatchDetail }) {
  if (match.timeline.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Clock}
          title="Aucun évènement"
          description="Le fil des évènements du match (buts, cartons, changements) apparaîtra ici."
        />
      </section>
    )
  }

  const events = [...match.timeline].sort((a, b) => a.minute - b.minute)

  return (
    <section className="rounded-lg border border-border p-5 sm:p-6">
      {/* Title + team legend (maps each side's colour to its team). */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          Fil du match
        </p>
        <div className="flex items-center gap-4">
          <LegendDot side="home" label={match.homeTeam} />
          <LegendDot side="away" label={match.awayTeam} />
        </div>
      </div>

      {/* Desktop — centered spine, home events left / away events right. */}
      <ol className="relative hidden flex-col gap-5 sm:flex">
        <span
          className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-border"
          aria-hidden
        />
        {events.map((e, i) => {
          const home = e.side === "home"
          return (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4"
            >
              <div className="flex justify-end">
                {home ? <TimelineCard event={e} align="right" /> : null}
              </div>
              <TimelineNode event={e} />
              <div className="flex justify-start">
                {!home ? <TimelineCard event={e} align="left" /> : null}
              </div>
            </li>
          )
        })}
      </ol>

      {/* Mobile — a single left-spine column (both teams stacked). */}
      <ol className="relative flex flex-col gap-3 sm:hidden">
        <span
          className="absolute inset-y-2 left-[1.05rem] w-px bg-border"
          aria-hidden
        />
        {events.map((e, i) => (
          <TimelineRowMobile
            key={i}
            event={e}
            teamName={e.side === "home" ? match.homeTeam : match.awayTeam}
          />
        ))}
      </ol>
    </section>
  )
}

function LegendDot({ side, label }: { side: "home" | "away"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-body text-[0.72rem] text-ink-muted">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          side === "home" ? "bg-team-home" : "bg-team-away",
        )}
        aria-hidden
      />
      {label}
    </span>
  )
}

/** The center node — an icon circle (masking the spine) with the minute below. */
function TimelineNode({ event }: { event: MatchTimelineEvent }) {
  const meta = TIMELINE_META[event.kind]
  const Icon = meta.icon
  const home = event.side === "home"
  const isGoal = event.kind === "but"
  return (
    <div className="relative z-10 flex w-12 flex-col items-center gap-1">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full border-2 bg-background",
          home
            ? "border-team-home/50 text-team-home"
            : "border-team-away/50 text-team-away",
        )}
      >
        <Icon size={15} strokeWidth={2} className={cn(!isGoal && meta.iconClass)} />
      </span>
      <span className="font-ui text-[0.72rem] font-medium tabular-nums text-ink-muted">
        {event.minute}'
      </span>
    </div>
  )
}

/** A side card (desktop) — its border tint + position tell you the team. */
function TimelineCard({
  event,
  align,
}: {
  event: MatchTimelineEvent
  align: "left" | "right"
}) {
  const meta = TIMELINE_META[event.kind]
  const home = event.side === "home"
  return (
    <div
      className={cn(
        "w-full max-w-[19rem] rounded-lg border px-3.5 py-2.5",
        home ? "border-team-home/30" : "border-team-away/30",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <span className="font-ui text-[0.68rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {meta.label}
      </span>
      <div className="mt-0.5 font-ui text-[0.9rem] text-ink">{event.player}</div>
      {event.detail ? (
        <div className="mt-0.5 font-body text-[0.76rem] text-ink-muted">
          {event.detail}
        </div>
      ) : null}
    </div>
  )
}

/** Mobile timeline row — node on a left spine, content to its right. */
function TimelineRowMobile({
  event,
  teamName,
}: {
  event: MatchTimelineEvent
  teamName: string
}) {
  const meta = TIMELINE_META[event.kind]
  const Icon = meta.icon
  const home = event.side === "home"
  const isGoal = event.kind === "but"
  return (
    <li className="relative flex items-start gap-3">
      <span
        className={cn(
          "relative z-10 mt-0.5 flex size-[2.15rem] shrink-0 items-center justify-center rounded-full border-2 bg-background",
          home
            ? "border-team-home/50 text-team-home"
            : "border-team-away/50 text-team-away",
        )}
      >
        <Icon size={15} strokeWidth={2} className={cn(!isGoal && meta.iconClass)} />
      </span>
      <div
        className={cn(
          "min-w-0 flex-1 rounded-lg border px-3 py-2.5",
          home ? "border-team-home/25" : "border-team-away/25",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="font-ui text-[0.82rem] font-medium tabular-nums text-ink">
            {event.minute}'
          </span>
          <span className="font-ui text-[0.74rem] text-ink-muted">
            {meta.label}
          </span>
          <span
            className={cn(
              "ml-auto shrink-0 rounded-pill px-2 py-0.5 font-ui text-[0.58rem] font-medium",
              home
                ? "bg-team-home/10 text-team-home"
                : "bg-team-away/10 text-team-away",
            )}
          >
            {teamName}
          </span>
        </div>
        <div className="mt-0.5 font-ui text-[0.88rem] text-ink">
          {event.player}
        </div>
        {event.detail ? (
          <div className="mt-0.5 font-body text-[0.74rem] text-ink-muted">
            {event.detail}
          </div>
        ) : null}
      </div>
    </li>
  )
}

/* ── Mes stats tab ────────────────────────────────────────────────────────── */

function MesStatsTab({ stats }: { stats?: MyMatchStats }) {
  if (!stats || !stats.played) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Timer}
          title="Tu n'as pas joué ce match"
          description="Tes statistiques individuelles s'afficheront ici après un match auquel tu as participé."
        />
      </section>
    )
  }

  const tiles: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Timer, label: "Minutes jouées", value: `${stats.minutes}'` },
    { icon: Goal, label: "Buts", value: String(stats.buts) },
    { icon: Users, label: "Passes déc.", value: String(stats.passesDecisives) },
    {
      icon: Crosshair,
      label: "Tirs (cadrés)",
      value: `${stats.tirs} (${stats.tirsCadres})`,
    },
    {
      icon: Percent,
      label: "Passes réussies",
      value: `${stats.passes} · ${stats.precisionPasses}%`,
    },
    { icon: Shield, label: "Ballons récupérés", value: String(stats.ballonsRecuperes) },
    {
      icon: Swords,
      label: "Duels gagnés",
      value: `${stats.duelsGagnes}/${stats.duelsTotal}`,
    },
    {
      icon: Square,
      label: "Cartons (J/R)",
      value: `${stats.cartonsJaunes}/${stats.cartonsRouges}`,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Summary bar — rôle · poste, and the coach's note. */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle">
            <Users size={20} strokeWidth={2} />
          </span>
          <div>
            <div className="font-ui text-base font-medium text-ink">
              {stats.role} · {stats.poste}
            </div>
            <div className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {stats.minutes} minutes jouées
            </div>
          </div>
        </div>
        {stats.note != null ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-brand-blue-600/30 bg-brand-blue-600/5 px-4 py-2.5">
            <Star size={18} className="text-brand-blue-600" />
            <div className="leading-tight">
              <span className="font-display text-2xl font-semibold tabular-nums text-ink">
                {stats.note.toLocaleString("fr-FR")}
              </span>
              <span className="font-body text-sm text-ink-muted">/10</span>
              <div className="font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
                Note du coach
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Stat tiles. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <StatTile key={t.label} icon={t.icon} label={t.label} value={t.value} />
        ))}
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3.5">
      <span className="flex size-8 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={15} strokeWidth={2} />
      </span>
      <div className="font-display text-xl font-semibold tabular-nums text-ink">
        {value}
      </div>
      <div className="font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </div>
    </div>
  )
}
