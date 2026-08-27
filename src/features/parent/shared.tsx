import { useMemo } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { Check, Users, X, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { ParentEnfant, ParentEvent, ParentReponse } from "@/data/seed/parent"
import { Avatar } from "@/components/kit/Avatar"
import { Segmented, type SegOption } from "@/features/budget/ui"
import { TYPE_META } from "@/features/planification/eventMeta"

/**
 * Shared pieces of the espace parent (Accueil · Planification · Matchs).
 * Referenced the club's Planification calendar and the Budget screens for
 * density, the eventMeta type colours for the séance/match/réunion split.
 */

/* ── Dates — pure helpers, no library (French, Sunday-first) ───────────── */

export const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]
export const WEEKDAYS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."]
export const WEEKDAYS_MIN_FR = ["D", "L", "M", "M", "J", "V", "S"]
const WEEKDAYS_LONG_FR = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
]

export const pad = (n: number) => String(n).padStart(2, "0")
export const toIso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "Samedi 29 août" — the day header of the agenda panel. */
export function longDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  const wd = new Date(y, m - 1, d).getDay()
  return `${WEEKDAYS_LONG_FR[wd]} ${d} ${MONTHS_FR[m - 1].toLowerCase()}`
}

/** "sam. 29 août" — compact, for cards and rows. */
export function shortDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  const wd = new Date(y, m - 1, d).getDay()
  return `${WEEKDAYS_FR[wd]} ${d} ${MONTHS_FR[m - 1].toLowerCase()}`
}

/** 42 cells (6 weeks) covering `monthIndex`, padded to full weeks. */
export type Cell = { iso: string; day: number; inMonth: boolean }
export function monthMatrix(year: number, monthIndex: number): Cell[] {
  const first = new Date(year, monthIndex, 1)
  const start = new Date(year, monthIndex, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return {
      iso: toIso(d),
      day: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
    }
  })
}

/* ── Réponse (présence) ─────────────────────────────────────────────────── */

export const REPONSE_META: Record<
  ParentReponse,
  { label: string; pastLabel: string; icon: LucideIcon; tone: string }
> = {
  present: {
    label: "Présent",
    pastLabel: "Présent",
    icon: Check,
    tone: "border-success/30 bg-success/10 text-success",
  },
  absent: {
    label: "Absent",
    pastLabel: "Absent",
    icon: X,
    tone: "border-danger/30 bg-danger/10 text-danger",
  },
  attente: {
    label: "Sans réponse",
    pastLabel: "Non renseigné",
    icon: X,
    tone: "border-warning/30 bg-warning/10 text-warning",
  },
}

/**
 * The one thing a parent does in this space: say whether the child will be
 * there. A past event shows the recorded présence instead (read-only) — you
 * can't change what already happened.
 */
export function ReponseControl({
  event,
  onDone,
  className,
}: {
  event: ParentEvent
  onDone?: (reponse: ParentReponse) => void
  className?: string
}) {
  const { repondreParentEvent } = useData()
  const past = event.date < todayISO()

  if (past) {
    const meta = REPONSE_META[event.reponse]
    const Icon = meta.icon
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.68rem] font-medium tracking-[0.06em] uppercase",
          meta.tone,
          className,
        )}
      >
        <Icon size={12} />
        {meta.pastLabel}
      </span>
    )
  }

  const answer = (reponse: ParentReponse) => {
    repondreParentEvent(event.id, reponse)
    onDone?.(reponse)
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-pill border border-border p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => answer("present")}
        aria-pressed={event.reponse === "present"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-ui text-[0.72rem] font-medium transition-colors",
          event.reponse === "present"
            ? "border border-success/30 bg-success/10 text-success"
            : "border border-transparent text-ink-muted hover:text-ink",
        )}
      >
        <Check size={13} /> Présent
      </button>
      <button
        type="button"
        onClick={() => answer("absent")}
        aria-pressed={event.reponse === "absent"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-ui text-[0.72rem] font-medium transition-colors",
          event.reponse === "absent"
            ? "border border-danger/30 bg-danger/10 text-danger"
            : "border border-transparent text-ink-muted hover:text-ink",
        )}
      >
        <X size={13} /> Absent
      </button>
    </div>
  )
}

/* ── Derived reading of the agenda (never stored — CLAUDE.md) ───────────── */

export type ParentAgenda = {
  today: string
  /** Chronological, oldest first. */
  all: ParentEvent[]
  past: ParentEvent[]
  upcoming: ParentEvent[]
  /** The next thing on the calendar — undefined once the season is over. */
  next?: ParentEvent
  /** Convocations still waiting on the parent. */
  enAttente: ParentEvent[]
  matchsAVenir: ParentEvent[]
  /** Played matches, newest first. */
  resultats: ParentEvent[]
  seancesPassees: number
  seancesPresent: number
  /** 0-100 — séances honoured over séances held. */
  tauxPresence: number
  matchsJoues: number
  minutes: number
  buts: number
  passes: number
  bilan: { v: number; n: number; d: number }
}

export function useParentAgenda(): ParentAgenda {
  const { parentEvents } = useData()
  const enfant = useEnfantActif()
  const today = todayISO()
  const enfantId = enfant.id

  return useMemo(() => {
    const all = parentEvents
      .filter((e) => e.enfantId === enfantId)
      .sort(
      (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
    )
    const past = all.filter((e) => e.date < today)
    const upcoming = all.filter((e) => e.date >= today)
    const seances = past.filter((e) => e.type === "seance")
    const seancesPresent = seances.filter((e) => e.reponse === "present").length
    const resultats = all
      .filter((e) => e.type === "match" && e.match?.termine)
      .sort((a, b) => b.date.localeCompare(a.date))

    const bilan = { v: 0, n: 0, d: 0 }
    let minutes = 0
    let buts = 0
    let passes = 0
    let matchsJoues = 0
    for (const m of resultats) {
      const info = m.match
      if (!info) continue
      const pour = info.butsPour ?? 0
      const contre = info.butsContre ?? 0
      if (pour > contre) bilan.v += 1
      else if (pour === contre) bilan.n += 1
      else bilan.d += 1
      if (info.joue) {
        matchsJoues += 1
        minutes += info.minutes ?? 0
        buts += info.buts ?? 0
        passes += info.passes ?? 0
      }
    }

    return {
      today,
      all,
      past,
      upcoming,
      next: upcoming[0],
      enAttente: upcoming.filter((e) => e.reponse === "attente"),
      matchsAVenir: upcoming.filter((e) => e.type === "match"),
      resultats,
      seancesPassees: seances.length,
      seancesPresent,
      tauxPresence: seances.length
        ? Math.round((seancesPresent / seances.length) * 100)
        : 0,
      matchsJoues,
      minutes,
      buts,
      passes,
      bilan,
    }
  }, [parentEvents, enfantId, today])
}

/* ── The family's calendar — every child, one list ──────────────────────── */

/**
 * Every event of every child, chronological. The parent's Planification reads
 * ONE calendar for the whole family and filters it by child in-screen, so the
 * scoping hook (`useParentAgenda`) isn't what it wants.
 */
export function useFamilyEvents(): ParentEvent[] {
  const { parentEvents } = useData()

  return useMemo(
    () =>
      [...parentEvents].sort(
        (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
      ),
    [parentEvents],
  )
}

/* ── The family's day — the one read that crosses every child ───────────── */

export type FamilyRow = { event: ParentEvent; enfant: ParentEnfant }

/**
 * Every child's events on one day, chronological. This is the ONLY place the
 * space reads across children: the accueil asks "où dois-je être aujourd'hui,
 * pour lequel de mes trois enfants ?".
 */
export function useFamilyDay(iso: string): FamilyRow[] {
  const { parentEvents, parentEnfants } = useData()

  return useMemo(
    () =>
      parentEvents
        .filter((e) => e.date === iso)
        .sort((a, b) => a.start.localeCompare(b.start))
        .flatMap((event) => {
          const enfant = parentEnfants.find((c) => c.id === event.enfantId)
          return enfant ? [{ event, enfant }] : []
        }),
    [parentEvents, parentEnfants, iso],
  )
}

/**
 * Every convocation still waiting on the parent, all children mixed,
 * chronological — the list behind the accueil's "sans réponse" block.
 */
export function useFamilyEnAttente(): FamilyRow[] {
  const { parentEvents, parentEnfants } = useData()
  const today = todayISO()

  return useMemo(
    () =>
      parentEvents
        .filter((e) => e.date >= today && e.reponse === "attente")
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
        )
        .flatMap((event) => {
          const enfant = parentEnfants.find((c) => c.id === event.enfantId)
          return enfant ? [{ event, enfant }] : []
        }),
    [parentEvents, parentEnfants, today],
  )
}

/** How many convocations still wait on the parent, for one child. */
export function useEnAttenteParEnfant(): Record<string, number> {
  const { parentEvents } = useData()
  const today = todayISO()

  return useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of parentEvents) {
      if (e.date < today || e.reponse !== "attente") continue
      counts[e.enfantId] = (counts[e.enfantId] ?? 0) + 1
    }
    return counts
  }, [parentEvents, today])
}

/**
 * Unread messages per child, across the family inbox — the accueil's "mes
 * enfants" cards use it to point at the messagerie filtered on that child.
 */
export function useMessagesNonLusParEnfant(): Record<string, number> {
  const { parentConversations } = useData()

  return useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of parentConversations) {
      if (!c.unread) continue
      counts[c.enfantId] = (counts[c.enfantId] ?? 0) + c.unread
    }
    return counts
  }, [parentConversations])
}

/** La messagerie familiale, filtrée sur un enfant. */
export const parentMessageriePath = (enfantId?: string) =>
  enfantId ? `/parent/messagerie/${enfantId}` : "/parent/messagerie"

/** The next event of one child — used by the "mes enfants" cards. */
export function useProchainParEnfant(): Record<string, ParentEvent> {
  const { parentEvents } = useData()
  const today = todayISO()

  return useMemo(() => {
    const next: Record<string, ParentEvent> = {}
    for (const e of [...parentEvents].sort(
      (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
    )) {
      if (e.date < today) continue
      if (!next[e.enfantId]) next[e.enfantId] = e
    }
    return next
  }, [parentEvents, today])
}

/* ── L'enfant ouvert — lu dans l'URL, jamais dans un state ──────────────── */

/**
 * The child a screen is about: `/parent/:enfantId/…`. Falls back to the first
 * child so a bare URL never breaks (the accueil is the only screen without an
 * enfantId, and it reads the whole family).
 */
export function useEnfantActif(): ParentEnfant {
  const { parentEnfants } = useData()
  const { enfantId } = useParams()
  return parentEnfants.find((c) => c.id === enfantId) ?? parentEnfants[0]
}

/** Legacy /parent/planification & /parent/matchs → the first child's space. */
export function ParentSpaceRedirect({ sub }: { sub: string }) {
  const { parentEnfants } = useData()
  return <Navigate to={`/parent/${parentEnfants[0].id}/${sub}`} replace />
}

export const parentPlanningPath = (enfantId: string) =>
  `/parent/${enfantId}/planification`
export const parentMatchsPath = (enfantId: string) =>
  `/parent/${enfantId}/matchs`
export const parentSeancesPath = (enfantId: string) =>
  `/parent/${enfantId}/seances`

/* ── Fiches ─────────────────────────────────────────────────────────────── */

/**
 * The fiche of an event, mirroring the club's own URLs
 * (/planification/seance/:id) one level under the parent's calendar.
 */
export function parentEventPath(event: ParentEvent): string {
  return `/parent/${event.enfantId}/planification/${event.type}/${event.id}`
}

/* ── Filtre par enfant ──────────────────────────────────────────────────── */

export const prenom = (enfant?: ParentEnfant) => enfant?.nom.split(" ")[0] ?? ""

/**
 * "Toute la famille" + une puce par enfant. Des puces, pas un select : à trois
 * enfants tout le choix se lit d'un coup, et les avatars disent de qui on parle
 * avant même qu'on lise un mot. C'est ce qui remplace, sur les écrans qui lisent
 * toute la famille, la bannière « vous êtes connecté au compte de… ».
 */
export function EnfantFilter({
  value,
  onChange,
  enfants,
}: {
  /** "all" = toute la famille, sinon l'id d'un enfant. */
  value: string
  onChange: (value: string) => void
  enfants: ParentEnfant[]
}) {
  const options: SegOption<string>[] = [
    { value: "all", label: "Toute la famille" },
    ...enfants.map((enfant) => ({
      value: enfant.id,
      label: (
        <span className="inline-flex items-center gap-1.5">
          <Avatar
            name={enfant.nom}
            size="sm"
            className="size-5 text-[0.55rem]"
          />
          {prenom(enfant)}
        </span>
      ),
    })),
  ]

  return (
    <Segmented
      value={value}
      onChange={onChange}
      options={options}
      className="max-w-full self-start overflow-x-auto"
    />
  )
}

/** L'enfant d'un événement, en puce — sur les listes qui mélangent la fratrie. */
export function EnfantChip({
  enfant,
  className,
}: {
  enfant: ParentEnfant
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-pill border border-border py-0.5 pr-2.5 pl-0.5 font-ui text-[0.72rem] text-ink-subtle",
        className,
      )}
    >
      <Avatar name={enfant.nom} size="sm" className="size-5 text-[0.55rem]" />
      {enfant.nom}
    </span>
  )
}

/* ── Bannière de compte — "vous êtes connecté au compte de…" ────────────── */

/**
 * Every child-scoped screen opens with this: whose account you are reading,
 * and one link per sibling to jump to the same screen for them. It replaces
 * any in-app "active child" state — the URL is the only source of truth.
 */
export function EnfantBanner({
  enfant,
  /** Same screen for the other children — "planification" | "matchs". */
  sub = "planification",
}: {
  enfant: ParentEnfant
  sub?: string
}) {
  const { parentEnfants } = useData()
  const enAttente = useEnAttenteParEnfant()
  const autres = parentEnfants.filter((c) => c.id !== enfant.id)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-strong px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={enfant.nom} size="md" />
        <div className="min-w-0">
          <p className="truncate font-ui text-[0.86rem] text-ink">
            Vous êtes connecté au compte de {enfant.nom}
          </p>
          <p className="mt-0.5 truncate font-body text-[0.78rem] text-ink-muted">
            {enfant.categorie} · {enfant.groupe} — n° {enfant.numero}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {autres.map((autre) => {
          const attente = enAttente[autre.id] ?? 0
          return (
            <Link
              key={autre.id}
              to={`/parent/${autre.id}/${sub}`}
              className="inline-flex items-center gap-2 rounded-pill border border-border py-1 pr-3 pl-1 font-ui text-[0.78rem] text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
            >
              <Avatar name={autre.nom} size="sm" />
              {autre.nom.split(" ")[0]}
              {attente ? (
                <span className="inline-flex size-4 items-center justify-center rounded-pill bg-warning/15 font-ui text-[0.62rem] text-warning">
                  {attente}
                </span>
              ) : null}
            </Link>
          )
        })}
        <Link
          to="/parent"
          className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 font-ui text-[0.78rem] text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
        >
          <Users size={14} />
          Mes enfants
        </Link>
      </div>
    </div>
  )
}

/* ── Small shared bits ──────────────────────────────────────────────────── */

/** Square type tile (séance blue / match green rail / réunion neutral). */
export function TypeTile({
  type,
  size = "md",
}: {
  type: ParentEvent["type"]
  /** "xs" tient dans une ligne de texte secondaire (badge de type inline). */
  size?: "xs" | "sm" | "md"
}) {
  const meta = TYPE_META[type]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-sm",
        meta.tile,
        size === "xs" ? "size-5" : size === "sm" ? "size-8 rounded-md" : "size-10 rounded-md",
      )}
    >
      <Icon size={size === "xs" ? 11 : size === "sm" ? 15 : 18} />
    </span>
  )
}

/** Result of a played match, from our side. */
export function issueOf(event: ParentEvent): "V" | "N" | "D" | null {
  const info = event.match
  if (!info?.termine) return null
  const pour = info.butsPour ?? 0
  const contre = info.butsContre ?? 0
  return pour > contre ? "V" : pour === contre ? "N" : "D"
}

export const ISSUE_META = {
  V: { label: "Victoire", tone: "border-success/30 bg-success/10 text-success" },
  N: { label: "Nul", tone: "border-border-strong bg-transparent text-ink-muted" },
  D: { label: "Défaite", tone: "border-danger/30 bg-danger/10 text-danger" },
} as const
