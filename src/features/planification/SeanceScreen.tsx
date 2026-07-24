import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  Droplets,
  Dumbbell,
  Gauge,
  Layers,
  ListChecks,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Shirt,
  Timer,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  buildFallbackSeance,
  isSeanceStarted,
  type ConvocationStatut,
  type PresenceStatut,
  type Procede,
  type SeanceDetail,
  type SeanceParticipant,
} from "@/data/seed/seances"
import { Avatar } from "@/components/kit/Avatar"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { AdBanner } from "@/features/planification/AdBanner"

/* ── Tabs (route-linked, à la CategoryDetailScreen) ───────────────────────── */
//
// The tab set depends on whether the séance has started:
//   • not started (Planifiée) → Procédé · Convocation (who's invited + RSVP)
//   • started / terminée      → Procédé · Présence (attendance) · Évaluation

type SeanceTab = "procede" | "convocation" | "presence" | "evaluation"

const TAB_LABEL: Record<SeanceTab, string> = {
  procede: "Procédé",
  convocation: "Convocation",
  presence: "Présence",
  evaluation: "Évaluation",
}

function tabsFor(detail: SeanceDetail): SeanceTab[] {
  return isSeanceStarted(detail.statut)
    ? ["procede", "presence", "evaluation"]
    : ["procede", "convocation"]
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export function SeanceScreen() {
  const { id, tab } = useParams()
  const { events, seanceDetails } = useData()

  // Prefer a seeded detail; otherwise derive one from the calendar event so any
  // séance card still opens a coherent page (with an empty procédé state).
  const detail: SeanceDetail | null = useMemo(() => {
    const seeded = seanceDetails.find((s) => s.eventId === id)
    if (seeded) return seeded
    const event = events.find((e) => e.id === id && e.type === "seance")
    return event ? buildFallbackSeance(event) : null
  }, [events, seanceDetails, id])

  if (!detail) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackButton to="/planification" label="Retour à la planification" />
        <EmptyState
          icon={Dumbbell}
          title="Séance introuvable"
          description="Cette séance n'existe pas ou a été retirée du planning."
        />
      </div>
    )
  }

  const tabs = tabsFor(detail)
  // Only tabs valid for this séance's state are reachable; anything else (e.g.
  // /presence on a not-started séance) falls back to Procédé.
  const activeTab: SeanceTab = tabs.includes(tab as SeanceTab)
    ? (tab as SeanceTab)
    : "procede"

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
      <BackButton to="/planification" label="Retour à la planification" />

      <SeanceHeader detail={detail} />

      {/* Sponsor banner — the same calendar_banner ad slot, reused here. */}
      <AdBanner />

      <SeanceTabs eventId={detail.eventId} tabs={tabs} active={activeTab} />

      {activeTab === "procede" ? (
        <ProcedeTab procedes={detail.procedes} />
      ) : activeTab === "convocation" ? (
        <ConvocationTab participants={detail.participants} />
      ) : activeTab === "presence" ? (
        <PresenceTab participants={detail.participants} presence={detail.presence} />
      ) : (
        <EvaluationTab numero={detail.numero} />
      )}
    </div>
  )
}

/* ── Header ───────────────────────────────────────────────────────────────── */

const STATUT_PILL: Record<SeanceDetail["statut"], string> = {
  Terminé: "border-success/30 bg-success/10 text-success",
  "En cours": "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
  Planifiée: "border-border-second bg-surface-nested text-ink-muted",
}

function SeanceHeader({ detail }: { detail: SeanceDetail }) {
  return (
    <header className="flex flex-col gap-5 rounded-lg border border-border p-4 sm:p-6">
      {/* Title row: icon + numéro + type · statut pill. */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle sm:size-12">
            <Dumbbell size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-ui text-[0.7rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              Séance d'entraînement
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 font-ui text-xl font-semibold tracking-normal text-ink sm:gap-2.5 sm:text-2xl">
              {detail.numero}
              <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.72rem] font-medium text-brand-blue-600">
                {detail.type}
              </span>
            </h1>
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-pill border px-3 py-1 font-ui text-[0.72rem] font-medium",
            STATUT_PILL[detail.statut],
          )}
        >
          {detail.statut}
        </span>
      </div>

      {/* Info grid — the séance's descriptive fields. */}
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3 sm:pt-5 lg:grid-cols-4">
        <InfoField icon={Layers} label="Catégorie" value={detail.categorie} />
        <InfoField icon={Users} label="Groupe" value={detail.groupe} />
        <InfoField icon={Users} label="Effectif" value={detail.effectif} />
        <InfoField icon={CalendarDays} label="Date" value={detail.date} />
        <InfoField icon={Clock} label="Durée" value={`${detail.duree} min`} />
        <InfoField icon={Gauge} label="Intensité" value={detail.intensite} />
        <InfoField icon={CalendarDays} label="Saison" value={detail.saison} />
      </div>

      {/* Pre-session safety checks. */}
      <div className="flex flex-wrap gap-2.5 border-t border-border pt-4 sm:gap-3 sm:pt-5">
        <CheckChip
          icon={ShieldCheck}
          label="Sécurité vérifiée"
          done={detail.securiteVerifiee}
        />
        <CheckChip
          icon={Droplets}
          label="Hydratation vérifiée"
          done={detail.hydratationVerifiee}
        />
      </div>
    </header>
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
        <div className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          {label}
        </div>
        <div className="mt-0.5 truncate font-ui text-sm text-ink-subtle">
          {value}
        </div>
      </div>
    </div>
  )
}

function CheckChip({
  icon: Icon,
  label,
  done,
}: {
  icon: LucideIcon
  label: string
  done: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-ui text-[0.8rem]",
        done
          ? "border-success/30 bg-success/10 text-success"
          : "border-border text-ink-muted",
      )}
    >
      <Icon size={15} className="shrink-0" />
      {label}
      <span
        className={cn(
          "ml-1 rounded-pill px-1.5 py-0.5 font-ui text-[0.68rem] font-medium",
          done ? "bg-success/15 text-success" : "bg-surface-nested text-ink-muted",
        )}
      >
        {done ? "Oui" : "Non"}
      </span>
    </span>
  )
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

function SeanceTabs({
  eventId,
  tabs,
  active,
}: {
  eventId: string
  tabs: SeanceTab[]
  active: SeanceTab
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-pill border border-border p-1">
        {tabs.map((value) => {
          const on = value === active
          return (
            <Link
              key={value}
              to={`/planification/seance/${eventId}/${value}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-pill px-4 py-1.5 font-ui text-[0.78rem] font-medium whitespace-nowrap transition-colors",
                on
                  ? "border border-border-second bg-surface-nested text-ink"
                  : "border border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {TAB_LABEL[value]}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ── Procédé tab — left nav (titles) + main content ───────────────────────── */

function ProcedeTab({ procedes }: { procedes: Procede[] }) {
  const [activeId, setActiveId] = useState(procedes[0]?.id ?? "")
  const active = procedes.find((p) => p.id === activeId) ?? procedes[0]

  if (procedes.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={ClipboardList}
          title="Aucun procédé pour cette séance"
          description="Les exercices de la séance apparaîtront ici une fois le plan construit."
        />
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      {/* Left nav — the ordered procédé titles, for quick jumping. */}
      <nav className="lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
        <p className="mb-2 px-1 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
          Procédés · {procedes.length}
        </p>
        {/* Horizontal scroller on mobile, vertical list from lg up. */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0 lg:pb-0">
          {procedes.map((p, i) => {
            const on = p.id === active.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "group flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors lg:w-full",
                  on
                    ? "border-border-strong bg-surface-nested"
                    : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full font-ui text-[0.72rem] font-medium tabular-nums",
                    on
                      ? "bg-brand-blue-600/15 text-brand-blue-600"
                      : "bg-surface-nested text-ink-muted",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate font-ui text-[0.85rem]",
                      on ? "font-medium text-ink" : "",
                    )}
                  >
                    {p.titre}
                  </span>
                  {p.fifaCard ? (
                    <span className="block font-ui text-[0.68rem] text-ink-disabled">
                      FIFA CARD · {p.fifaCard}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main — the selected procédé's content. */}
      <div className="min-w-0 flex-1">
        <ProcedeContent procede={active} />
      </div>
    </div>
  )
}

function ProcedeContent({ procede }: { procede: Procede }) {
  return (
    <article className="flex flex-col gap-6 rounded-lg border border-border p-4 sm:p-6">
      {/* Procédé header: title + FIFA card, then the timing meta tiles. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-ui text-xl font-medium text-ink">{procede.titre}</h2>
          {procede.fifaCard ? (
            <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.7rem] font-medium tracking-wide text-brand-blue-600">
              FIFA CARD · {procede.fifaCard}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaTile icon={Clock} label="Durée" value={procede.duree} />
          <MetaTile icon={Repeat} label="Séquence" value={procede.sequence} />
          <MetaTile
            icon={RefreshCw}
            label="Récupération"
            value={`${procede.recuperation} s`}
          />
        </div>
      </div>

      {/* Illustration. */}
      {procede.image ? (
        <figure className="overflow-hidden rounded-lg border border-border bg-surface-nested">
          <img
            src={procede.image}
            alt={`Schéma du procédé ${procede.titre}`}
            loading="lazy"
            className="mx-auto max-h-[420px] w-full object-contain"
          />
        </figure>
      ) : null}

      {/* Rich content blocks. */}
      <div className="flex flex-col gap-6">
        {procede.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </article>
  )
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3.5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          {label}
        </div>
        <div className="mt-0.5 truncate font-ui text-sm text-ink">{value}</div>
      </div>
    </div>
  )
}

/* ── One rich-content block ───────────────────────────────────────────────── */

function BlockView({ block }: { block: Procede["blocks"][number] }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-ui text-[0.8rem] font-medium tracking-[0.04em] text-ink-subtle uppercase">
        <span className="h-3.5 w-1 rounded-full bg-brand-blue-600" aria-hidden />
        {block.heading}
      </h3>

      {block.kind === "paragraph" ? (
        <p className="font-body text-[0.9rem] leading-relaxed text-ink-muted">
          {block.text}
        </p>
      ) : null}

      {block.kind === "list" ? (
        <ul className="flex flex-col gap-1.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 font-body text-[0.9rem] leading-relaxed text-ink-muted"
            >
              <ListChecks
                size={15}
                className="mt-0.5 shrink-0 text-ink-disabled"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {block.kind === "table" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-3.5 py-2.5 font-ui text-[0.68rem] font-medium tracking-[0.06em] text-ink-muted uppercase whitespace-nowrap",
                      i === 0 ? "text-left" : "text-right tabular-nums",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-surface-hover"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "px-3.5 py-2.5 font-body text-[0.85rem] whitespace-nowrap",
                        ci === 0
                          ? "font-ui font-medium text-ink"
                          : "text-right tabular-nums text-ink-muted",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

/* ── Attendance: shared list of convoqués (Convocation + Présence tabs) ────── */

type StatusMeta = {
  label: string
  icon: LucideIcon
  /** badge/dot classes (semantic status colours). */
  chip: string
  dot: string
}

const CONVOCATION_META: Record<ConvocationStatut, StatusMeta> = {
  accepte: {
    label: "Accepté",
    icon: Check,
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  refuse: {
    label: "Refusé",
    icon: X,
    chip: "border-danger/30 bg-danger/10 text-danger",
    dot: "bg-danger",
  },
  attente: {
    label: "En attente",
    icon: Clock,
    chip: "border-border-strong text-ink-muted",
    dot: "bg-ink-disabled",
  },
}

const PRESENCE_META: Record<PresenceStatut, StatusMeta> = {
  present: {
    label: "Présent",
    icon: Check,
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  retard: {
    label: "En retard",
    icon: Timer,
    chip: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  absent: {
    label: "Absent",
    icon: X,
    chip: "border-danger/30 bg-danger/10 text-danger",
    dot: "bg-danger",
  },
}

/** Ordered status keys so the summary chips read consistently. */
const CONVOCATION_ORDER: ConvocationStatut[] = ["accepte", "refuse", "attente"]
const PRESENCE_ORDER: PresenceStatut[] = ["present", "retard", "absent"]

function ConvocationTab({
  participants,
}: {
  participants: SeanceParticipant[]
}) {
  return (
    <AttendanceList
      participants={participants}
      statusOf={(p) => p.convocation}
      meta={CONVOCATION_META}
      order={CONVOCATION_ORDER}
      emptyTitle="Aucun convoqué"
      emptyDescription="Les membres du staff et les joueurs convoqués à cette séance apparaîtront ici."
      showNotes
    />
  )
}

function PresenceTab({
  participants,
  presence,
}: {
  participants: SeanceParticipant[]
  presence: Record<string, PresenceStatut>
}) {
  return (
    <AttendanceList
      participants={participants}
      // Anyone without a recorded line is treated as absent.
      statusOf={(p) => presence[p.id] ?? "absent"}
      meta={PRESENCE_META}
      order={PRESENCE_ORDER}
      emptyTitle="Aucune présence enregistrée"
      emptyDescription="La présence du staff et des joueurs sera relevée ici le jour de la séance."
    />
  )
}

function AttendanceList<S extends string>({
  participants,
  statusOf,
  meta,
  order,
  emptyTitle,
  emptyDescription,
  showNotes = false,
}: {
  participants: SeanceParticipant[]
  statusOf: (p: SeanceParticipant) => S
  meta: Record<S, StatusMeta>
  order: S[]
  emptyTitle: string
  emptyDescription: string
  showNotes?: boolean
}) {
  if (participants.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState icon={Users} title={emptyTitle} description={emptyDescription} />
      </section>
    )
  }

  const counts = order.map((key) => ({
    key,
    meta: meta[key],
    n: participants.filter((p) => statusOf(p) === key).length,
  }))

  const staff = participants.filter((p) => p.kind === "staff")
  const joueurs = participants.filter((p) => p.kind === "joueur")

  return (
    <div className="flex flex-col gap-5">
      {/* Summary — one count chip per status. */}
      <div className="flex flex-wrap gap-2.5">
        {counts.map(({ key, meta: m, n }) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-ui text-[0.8rem] text-ink-subtle"
          >
            <span className={cn("size-2 rounded-full", m.dot)} aria-hidden />
            <span className="font-medium tabular-nums text-ink">{n}</span>
            {m.label}
          </span>
        ))}
      </div>

      {staff.length > 0 ? (
        <AttendanceGroup
          icon={UserCog}
          title="Staff"
          people={staff}
          statusOf={statusOf}
          meta={meta}
          showNotes={showNotes}
        />
      ) : null}

      {joueurs.length > 0 ? (
        <AttendanceGroup
          icon={Shirt}
          title="Joueurs"
          people={joueurs}
          statusOf={statusOf}
          meta={meta}
          showNotes={showNotes}
        />
      ) : null}
    </div>
  )
}

function AttendanceGroup<S extends string>({
  icon: Icon,
  title,
  people,
  statusOf,
  meta,
  showNotes,
}: {
  icon: LucideIcon
  title: string
  people: SeanceParticipant[]
  statusOf: (p: SeanceParticipant) => S
  meta: Record<S, StatusMeta>
  showNotes: boolean
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        <Icon size={15} className="text-ink-disabled" />
        {title}
        <span className="font-normal text-ink-disabled">· {people.length}</span>
      </h3>
      <ul className="overflow-hidden rounded-lg border border-border">
        {people.map((p, i) => {
          const m = meta[statusOf(p)]
          const StatusIcon = m.icon
          return (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-hover sm:px-4",
                i > 0 && "border-t border-border",
              )}
            >
              <Avatar name={p.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.numero != null ? (
                    <span className="font-ui text-[0.72rem] tabular-nums text-ink-disabled">
                      #{p.numero}
                    </span>
                  ) : null}
                  <span className="truncate font-ui text-[0.9rem] font-medium text-ink">
                    {p.name}
                  </span>
                </div>
                <div className="truncate font-body text-[0.78rem] text-ink-muted">
                  {p.role}
                  {showNotes && p.note ? (
                    <span className="text-ink-disabled"> · {p.note}</span>
                  ) : null}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium",
                  m.chip,
                )}
              >
                <StatusIcon size={13} className="shrink-0" />
                {m.label}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ── Évaluation — empty until the debrief is wired ────────────────────────── */

function EvaluationTab({ numero }: { numero: string }) {
  return (
    <section className="rounded-lg border border-border">
      <EmptyState
        icon={Gauge}
        title="Évaluation indisponible"
        description={`Le bilan de la séance (charges, notes des joueurs) sera saisi ici une fois la séance terminée — ${numero}.`}
      />
    </section>
  )
}
