import { useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sunrise,
  UserRoundCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { ParentEnfant, ParentEvent } from "@/data/seed/parent"
import { PageHeader } from "@/components/kit/PageHeader"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { AdBanner } from "@/features/planification/AdBanner"
import {
  ReponseControl,
  TypeTile,
  longDay,
  parentEventPath,
  parentMessageriePath,
  parentPlanningPath,
  shortDay,
  toIso,
  useEnAttenteParEnfant,
  useFamilyDay,
  useFamilyEnAttente,
  useMessagesNonLusParEnfant,
  useProchainParEnfant,
} from "@/features/parent/shared"

/**
 * Espace parent — Accueil.
 *
 * A parent signs in for the whole family, and the page answers exactly two
 * questions: pour quel enfant suis-je connecté (les cartes « mes enfants »,
 * qui scopent tout le reste de l'espace), et où dois-je être aujourd'hui
 * (chaque rendez-vous de chaque enfant, avec sa réponse et sa fiche). Le
 * détail d'un enfant vit dans Planification et Matchs, pas ici.
 */
export function ParentAccueilScreen() {
  const { parentEnfants } = useData()
  const [openAttente, setOpenAttente] = useState(false)
  const { toast, notify } = useToast()

  const today = todayISO()
  const [day, setDay] = useState(today)
  const familyDay = useFamilyDay(day)
  const enAttenteParEnfant = useEnAttenteParEnfant()
  const nonLusParEnfant = useMessagesNonLusParEnfant()
  const prochainParEnfant = useProchainParEnfant()

  const attente = useFamilyEnAttente()

  const stepDay = (delta: number) => setDay((iso) => shiftIso(iso, delta))
  const dayLabel = relativeDay(day, today)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        title={`Famille ${parentEnfants[0].nom.split(" ").slice(-1)[0]}`}
        subtitle={`${parentEnfants.length} enfants au club — ouvrez le compte de celui que vous suivez`}
        actions={
          <div className="flex items-center -space-x-2">
            {parentEnfants.map((enfant) => (
              <Avatar
                key={enfant.id}
                name={enfant.nom}
                size="lg"
                className="ring-2 ring-background"
              />
            ))}
          </div>
        }
      />

      <AdBanner space="accueil" />

      {/* Le jour — première lecture de la page : où dois-je être, pour lequel
          de mes enfants. Les flèches déplacent la journée d'un jour. */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2.5">
            <SectionTitle>{dayLabel}</SectionTitle>
            {/* La date longue n'accompagne que « Hier / Aujourd'hui / Demain » —
                au-delà, le titre EST déjà la date. */}
            {dayLabel !== longDay(day) ? (
              <span className="truncate font-body text-[0.75rem] text-ink-disabled">
                {longDay(day)}
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {day !== today ? (
              <Button variant="outline" size="sm" onClick={() => setDay(today)}>
                Aujourd'hui
              </Button>
            ) : null}
            <div className="flex items-center rounded-md border border-border">
              <button
                type="button"
                aria-label="Jour précédent"
                onClick={() => stepDay(-1)}
                className="flex size-8 items-center justify-center rounded-l-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="w-px self-stretch bg-border" aria-hidden />
              <button
                type="button"
                aria-label="Jour suivant"
                onClick={() => stepDay(1)}
                className="flex size-8 items-center justify-center rounded-r-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-lg border border-border">
          {familyDay.length ? (
            familyDay.map((row, i) => (
              <EventRow
                key={row.event.id}
                event={row.event}
                enfant={row.enfant}
                when={
                  <span className="font-display text-[0.95rem] font-medium text-ink tabular-nums">
                    {row.event.start}
                  </span>
                }
                first={i === 0}
                onAnswer={(r) =>
                  notify(
                    r === "present"
                      ? `Présence confirmée — ${row.enfant.nom.split(" ")[0]}`
                      : `Absence signalée — ${row.enfant.nom.split(" ")[0]}`,
                  )
                }
              />
            ))
          ) : (
            <EmptyState
              icon={Sunrise}
              title={
                day === today
                  ? "Aucun rendez-vous aujourd'hui"
                  : `Aucun rendez-vous ${dayLabel.toLowerCase()}`
              }
              description="Ni séance, ni match, ni réunion pour vos enfants. Profitez-en."
            />
          )}
        </div>
      </section>

      {/* Réponses en attente — la vraie liste, dépliable sur place : le
          parent répond ici, sans passer par le calendrier. */}
      {attente.length ? (
        <section className="overflow-hidden rounded-lg border border-warning/30">
          <button
            type="button"
            onClick={() => setOpenAttente((v) => !v)}
            aria-expanded={openAttente}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-hover"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
              <AlertTriangle size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-ui text-[0.88rem] font-medium text-ink">
                {attente.length} convocation{attente.length > 1 ? "s" : ""} sans
                réponse
              </p>
              <p className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
                {openAttente
                  ? "Répondez directement dans la liste."
                  : "Ouvrez la liste pour indiquer au club si vos enfants seront présents."}
              </p>
            </div>
            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 text-ink-muted transition-transform duration-200",
                openAttente && "rotate-180",
              )}
            />
          </button>

          {openAttente ? (
            <div className="flex flex-col border-t border-warning/20">
              {attente.map((row, i) => (
                <EventRow
                  key={row.event.id}
                  event={row.event}
                  enfant={row.enfant}
                  when={
                    // Volontairement discret : dans cette liste, c'est le nom
                    // de l'enfant qui doit sauter aux yeux, pas la date.
                    <span className="flex flex-col">
                      <span className="font-ui text-[0.78rem] whitespace-nowrap text-ink-muted">
                        {shortDay(row.event.date)}
                      </span>
                      <span className="font-body text-[0.75rem] text-ink-disabled tabular-nums">
                        {row.event.start}
                      </span>
                    </span>
                  }
                  first={i === 0}
                  emphasis="enfant"
                  onAnswer={(r) =>
                    notify(
                      r === "present"
                        ? `Présence confirmée — ${row.enfant.nom.split(" ")[0]}`
                        : `Absence signalée — ${row.enfant.nom.split(" ")[0]}`,
                    )
                  }
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Mes enfants — the switch that scopes the whole space. */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle>Mes enfants</SectionTitle>
          <span className="font-body text-[0.75rem] text-ink-disabled">
            Ouvrez le compte de l'enfant que vous suivez
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {parentEnfants.map((enfant) => (
            <EnfantCard
              key={enfant.id}
              enfant={enfant}
              enAttente={enAttenteParEnfant[enfant.id] ?? 0}
              nonLus={nonLusParEnfant[enfant.id] ?? 0}
              prochain={prochainParEnfant[enfant.id]}
            />
          ))}
        </div>
      </section>

      <Toast toast={toast} />
    </div>
  )
}

/* ── Dates ──────────────────────────────────────────────────────────────── */

/** "2026-08-21" + n jours, sans librairie. */
function shiftIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  return toIso(new Date(y, m - 1, d + delta))
}

/** "Aujourd'hui" · "Demain" · "Hier" · sinon le jour long ("Samedi 29 août"). */
function relativeDay(iso: string, today: string): string {
  if (iso === today) return "Aujourd'hui"
  if (iso === shiftIso(today, 1)) return "Demain"
  if (iso === shiftIso(today, -1)) return "Hier"
  return longDay(iso)
}

/* ── Building blocks ────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
      {children}
    </h2>
  )
}

/**
 * One child of the family. The card opens HIS space — the button is a plain
 * link to /parent/<id>/planification, so "se connecter en tant que…" is a
 * navigation, never an app state.
 */
function EnfantCard({
  enfant,
  enAttente,
  nonLus,
  prochain,
}: {
  enfant: ParentEnfant
  enAttente: number
  nonLus: number
  prochain?: ParentEvent
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border px-5 py-[1.15rem] transition-colors hover:border-border-strong">
      <div className="flex items-start gap-3">
        <Avatar name={enfant.nom} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-ui text-[0.95rem] font-medium text-ink">
            {enfant.nom}
          </p>
          <p className="mt-0.5 truncate font-body text-[0.78rem] text-ink-muted">
            {enfant.categorie} · {enfant.groupe} — n° {enfant.numero}
          </p>
          <p className="mt-0.5 truncate font-body text-[0.75rem] text-ink-disabled">
            {enfant.posteLabel} · {enfant.educateur}
          </p>
        </div>
        {enAttente ? (
          <Badge variant="warning">{enAttente} à répondre</Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0 text-ink-muted" />
          <span className="min-w-0 flex-1 truncate font-body text-[0.78rem] text-ink-muted">
            {prochain
              ? `${shortDay(prochain.date)} · ${prochain.start} — ${prochain.title}`
              : "Rien de prévu pour l'instant"}
          </span>
        </div>

        {/* Vers la boîte familiale, déjà filtrée sur cet enfant. */}
        <Link
          to={parentMessageriePath(enfant.id)}
          className="group/msg flex items-center gap-2 text-ink-muted transition-colors hover:text-ink"
        >
          <MessageSquare size={14} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate font-body text-[0.78rem]">
            {nonLus
              ? `${nonLus} message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}`
              : "Conversations avec le club"}
          </span>
          {nonLus ? (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-brand-blue-600 px-1 font-ui text-[0.62rem] font-medium text-white">
              {nonLus}
            </span>
          ) : (
            <ArrowUpRight
              size={13}
              className="shrink-0 text-ink-disabled transition-colors group-hover/msg:text-info"
            />
          )}
        </Link>
      </div>

      <Button variant="outline" size="sm" asChild className="w-full">
        <Link to={parentPlanningPath(enfant.id)}>
          <UserRoundCheck size={15} />
          Se connecter en tant que {enfant.nom.split(" ")[0]}
        </Link>
      </Button>
    </div>
  )
}

/**
 * One rendez-vous, for any of the children — used by "aujourd'hui" (left
 * column = l'heure) and by the convocations list (left column = le jour).
 */
function EventRow({
  event,
  enfant,
  when,
  first,
  emphasis = "event",
  onAnswer,
}: {
  event: ParentEvent
  enfant: ParentEnfant
  /** Left column: "17:30", or "ven. 21 août" over the time. */
  when: React.ReactNode
  first: boolean
  /**
   * Ce que la ligne met en avant. "event" pour la journée (on sait déjà pour
   * qui on répond, on cherche QUOI) ; "enfant" pour les convocations sans
   * réponse, où la question est d'abord POUR QUEL ENFANT je réponds.
   */
  emphasis?: "event" | "enfant"
  onAnswer: (reponse: string) => void
}) {
  const parEnfant = emphasis === "enfant"

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4",
        !first && "border-t border-border",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <span className="relative z-10 w-12 shrink-0 sm:w-32">{when}</span>

      <Link
        to={parentEventPath(event)}
        className="relative z-10 flex min-w-0 flex-1 items-center gap-3"
      >
        {parEnfant ? (
          <Avatar name={enfant.nom} size="md" />
        ) : (
          <TypeTile type={event.type} size="sm" />
        )}
        <div className="min-w-0 flex-1">
          {parEnfant ? (
            <>
              <p className="flex min-w-0 items-center gap-2">
                <span className="truncate font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
                  {enfant.nom}
                </span>
                <span className="shrink-0 font-body text-[0.72rem] text-ink-disabled">
                  {enfant.categorie}
                </span>
              </p>
              <p className="mt-0.5 flex min-w-0 items-center gap-1.5 font-body text-[0.78rem] text-ink-muted">
                <TypeTile type={event.type} size="xs" />
                <span className="truncate">
                  {event.title}
                  {event.location ? ` · ${event.location}` : ""}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="truncate font-ui text-[0.88rem] text-ink transition-colors group-hover:text-brand-blue-600">
                {event.title}
              </p>
              <p className="mt-0.5 truncate font-body text-[0.78rem] text-ink-muted">
                {enfant.nom.split(" ")[0]} · {event.categorie}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </>
          )}
        </div>
        <ArrowUpRight
          size={15}
          className="shrink-0 text-ink-disabled transition-colors group-hover:text-brand-blue-600"
        />
      </Link>

      <div className="relative z-10 shrink-0 pl-12 sm:pl-0">
        <ReponseControl event={event} onDone={onAnswer} />
      </div>
    </div>
  )
}
