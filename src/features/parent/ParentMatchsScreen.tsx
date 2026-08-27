import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Swords, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { ParentEnfant, ParentEvent } from "@/data/seed/parent"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast, useToast } from "@/components/kit/Toast"
import { Segmented, type SegOption } from "@/features/budget/ui"
import {
  EnfantChip,
  EnfantFilter,
  ISSUE_META,
  ReponseControl,
  issueOf,
  parentEventPath,
  shortDay,
  useFamilyEvents,
} from "@/features/parent/shared"

type Tab = "avenir" | "resultats"

/**
 * Espace parent — Matchs.
 *
 * Toute la fratrie sur la même page : les convocations et les résultats des
 * trois enfants se lisent d'affilée, chaque carte disant à qui elle appartient,
 * et une rangée de puces réduit la liste à un enfant quand c'est ce qu'on veut.
 * Deux questions, deux onglets : « sera-t-il convoqué samedi ? » (à venir, avec
 * la réponse de présence sur la carte) et « comment s'est passé son match ? »
 * (résultats — le score, sa ligne, et le mot de l'éducateur). Une carte ouvre la
 * fiche du match, la même page que celle vers laquelle le calendrier route.
 */
export function ParentMatchsScreen() {
  const navigate = useNavigate()
  const { parentEnfants } = useData()
  const familyEvents = useFamilyEvents()
  const { toast, notify } = useToast()
  const today = todayISO()

  const [tab, setTab] = useState<Tab>("avenir")
  /** "all" = toute la famille — le défaut ; sinon l'id d'un enfant. */
  const [qui, setQui] = useState<string>("all")

  const enfantById = useMemo(() => {
    const map = new Map<string, ParentEnfant>()
    for (const c of parentEnfants) map.set(c.id, c)
    return map
  }, [parentEnfants])

  const enfantFiltre = qui === "all" ? undefined : enfantById.get(qui)

  /* La saison de la fratrie (ou d'un enfant), dérivée en render — jamais
     stockée : les mêmes règles que `useParentAgenda`, sur plusieurs enfants. */
  const { avenir, resultats, joues, minutes, buts, passes } = useMemo(() => {
    const matchs = familyEvents.filter(
      (e) => e.type === "match" && (qui === "all" || e.enfantId === qui),
    )
    const joues = matchs.filter((e) => e.match?.termine && e.match.joue)

    return {
      avenir: matchs.filter((e) => e.date >= today),
      resultats: matchs
        .filter((e) => e.match?.termine)
        .sort((a, b) => b.date.localeCompare(a.date)),
      joues: joues.length,
      minutes: joues.reduce((total, e) => total + (e.match?.minutes ?? 0), 0),
      buts: joues.reduce((total, e) => total + (e.match?.buts ?? 0), 0),
      passes: joues.reduce((total, e) => total + (e.match?.passes ?? 0), 0),
    }
  }, [familyEvents, qui, today])

  const options: SegOption<Tab>[] = useMemo(
    () => [
      { value: "avenir", label: "À venir", badge: avenir.length },
      { value: "resultats", label: "Résultats", badge: resultats.length },
    ],
    [avenir.length, resultats.length],
  )

  const list = tab === "avenir" ? avenir : resultats

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Matchs"
        subtitle={
          enfantFiltre
            ? `Convocations et résultats de ${enfantFiltre.nom} · ${enfantFiltre.categorie}`
            : `Convocations et résultats des ${parentEnfants.length} enfants`
        }
        actions={<Segmented value={tab} onChange={setTab} options={options} />}
      />

      {/* Qui ? — le seul découpage de la page. */}
      <EnfantFilter value={qui} onChange={setQui} enfants={parentEnfants} />

      {/* Season line — derived, never stored. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile label="Matchs joués" value={joues} />
        <SummaryTile label="Minutes" value={minutes} />
        <SummaryTile label="Buts · passes" value={`${buts} · ${passes}`} />
      </div>

      {list.length ? (
        <div className="flex flex-col gap-4">
          {list.map((event) =>
            tab === "avenir" ? (
              <UpcomingCard
                key={event.id}
                event={event}
                enfant={enfantById.get(event.enfantId)}
                onOpen={() => navigate(parentEventPath(event))}
                onAnswer={(r) =>
                  notify(
                    r === "present"
                      ? `Présence confirmée — ${event.match?.adversaire}`
                      : `Absence signalée — ${event.match?.adversaire}`,
                  )
                }
              />
            ) : (
              <ResultCard
                key={event.id}
                event={event}
                enfant={enfantById.get(event.enfantId)}
                onOpen={() => navigate(parentEventPath(event))}
              />
            ),
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={tab === "avenir" ? Swords : Trophy}
            title={
              tab === "avenir"
                ? "Aucun match programmé"
                : "Aucun match joué cette saison"
            }
            description={
              enfantFiltre
                ? `Rien pour ${enfantFiltre.nom.split(" ")[0]} — affichez toute la famille pour voir les matchs de ses frères.`
                : tab === "avenir"
                  ? "Les prochaines convocations apparaîtront ici dès que le club les publie."
                  : "Le score et la feuille de match s'afficheront ici après la première rencontre."
            }
          />
        </div>
      )}

      <Toast toast={toast} />
    </div>
  )
}

/* ── Tiles & cards ──────────────────────────────────────────────────────── */

function SummaryTile({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border px-5 py-4">
      <span className="font-display text-[1.6rem] leading-none font-semibold text-ink">
        {value}
      </span>
      <span className="font-ui text-[0.68rem] tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </span>
    </div>
  )
}

/** Date block reused by both card kinds. */
function DateBlock({ event }: { event: ParentEvent }) {
  const [, m, d] = event.date.split("-").map(Number)
  const MONTH_ABBR = [
    "janv", "févr", "mars", "avr", "mai", "juin",
    "juil", "août", "sept", "oct", "nov", "déc",
  ]
  return (
    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-md bg-surface-nested">
      <span className="font-display text-lg leading-none font-semibold text-ink">
        {d}
      </span>
      <span className="mt-0.5 font-ui text-[0.62rem] tracking-[0.06em] text-ink-muted uppercase">
        {MONTH_ABBR[m - 1]}
      </span>
    </div>
  )
}

function UpcomingCard({
  event,
  enfant,
  onOpen,
  onAnswer,
}: {
  event: ParentEvent
  /** À qui la convocation appartient — la liste mélange la fratrie. */
  enfant?: ParentEnfant
  onOpen: () => void
  onAnswer: (reponse: string) => void
}) {
  const info = event.match
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border px-5 py-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <DateBlock event={event} />
        <div className="min-w-0">
          {enfant ? <EnfantChip enfant={enfant} className="mb-1.5" /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-ui text-[0.98rem] font-medium text-ink">
              {event.categorie.split(" · ")[0]} vs {info?.adversaire}
            </h3>
            <Badge variant={info?.domicile ? "home" : "away"}>
              {info?.domicile ? "Domicile" : "Extérieur"}
            </Badge>
          </div>
          <p className="mt-1 truncate font-body text-[0.8rem] text-ink-muted">
            {shortDay(event.date)} · {event.start}
            {event.location ? ` · ${event.location}` : ""}
          </p>
          {info?.competition ? (
            <p className="mt-1 font-body text-[0.76rem] text-ink-disabled">
              {info.competition}
            </p>
          ) : null}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <ReponseControl event={event} onDone={onAnswer} />
        {event.reponse === "attente" ? (
          <span className="font-body text-[0.74rem] text-warning">
            Réponse attendue
          </span>
        ) : null}
      </div>
    </div>
  )
}

function ResultCard({
  event,
  enfant,
  onOpen,
}: {
  event: ParentEvent
  /** À qui le match appartient — la liste mélange la fratrie. */
  enfant?: ParentEnfant
  onOpen: () => void
}) {
  const info = event.match
  const issue = issueOf(event)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
    >
      {/* Navigable card — fluid fill reveals on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <div className="relative z-10 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
        <DateBlock event={event} />

        <div className="min-w-0 flex-1">
          {enfant ? <EnfantChip enfant={enfant} className="mb-1.5" /> : null}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-ui text-[0.98rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
              {event.categorie.split(" · ")[0]} vs {info?.adversaire}
            </h3>
            {issue ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-pill border px-2.5 py-0.5 font-ui text-[0.65rem] font-medium tracking-[0.08em] uppercase",
                  ISSUE_META[issue].tone,
                )}
              >
                {ISSUE_META[issue].label}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate font-body text-[0.8rem] text-ink-muted">
            {info?.competition} · {info?.domicile ? "Domicile" : "Extérieur"}
            {event.location ? ` · ${event.location}` : ""}
          </p>

          {/* Sa ligne — or the honest "resté sur le banc". */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {info?.joue ? (
              <>
                <Stat label="min" value={info.minutes ?? 0} />
                <Stat label="but" value={info.buts ?? 0} />
                <Stat label="passe D." value={info.passes ?? 0} />
                {info.note != null ? (
                  <Stat label="note" value={`${info.note}/10`} accent />
                ) : null}
              </>
            ) : (
              <span className="font-body text-[0.78rem] text-ink-disabled">
                Resté sur le banc
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="font-display text-2xl font-semibold whitespace-nowrap">
            <span className="text-team-home">{info?.butsPour}</span>
            <span className="mx-1.5 text-ink-disabled">–</span>
            <span className="text-team-away">{info?.butsContre}</span>
          </span>
          <p className="mt-1 font-body text-[0.72rem] text-ink-disabled">
            Score final
          </p>
        </div>
      </div>
    </button>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span
        className={cn(
          "font-ui text-[0.9rem] font-medium",
          accent ? "text-info" : "text-ink",
        )}
      >
        {value}
      </span>
      <span className="font-body text-[0.72rem] text-ink-muted">{label}</span>
    </span>
  )
}


