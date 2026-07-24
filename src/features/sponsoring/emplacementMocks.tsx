import type { ReactNode } from "react"
import {
  BookUser,
  CalendarDays,
  Newspaper,
  Trophy,
  Bell,
  Plus,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { SLOT_DEFS, type Allocation, type SlotKey } from "@/data/seed/sponsoring"
import { SLOT_ICON } from "@/features/sponsoring/ui"

/**
 * The six ad-space mocks, shared by every screen that shows WHERE a sponsor
 * appears in the club app:
 *
 *   • Espaces publicitaires — empty slots ("Espace disponible")
 *   • Campagne en cours     — the creative + an edit affordance
 *   • Campagne archivée     — the creative + its views/clicks
 *
 * Each mock takes a `slot` node and drops it into the ad position, so the
 * surrounding surface (calendar, feed, match, splash, notification, annuaire)
 * is drawn once and never re-styled per screen. Only the slot changes.
 */

/* ── Slot allocation badge ──────────────────────────────────────────────── */
const ALLOC_LABEL: Record<Allocation, string> = {
  cumulative: "Toujours visible",
  rotational: "En rotation",
  booked: "Réservé à l'unité",
  quota: "Quota",
}

export function AllocBadge({ allocation }: { allocation: Allocation }) {
  const tone =
    allocation === "rotational"
      ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
      : allocation === "quota"
        ? "border-warning/25 bg-warning/10 text-warning"
        : "border-border bg-accent text-ink-muted"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-pill border px-2 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] uppercase",
        tone,
      )}
    >
      {ALLOC_LABEL[allocation]}
    </span>
  )
}

/* ── Card wrapping a mock + its caption ─────────────────────────────────── */
export function EmplacementCard({
  slotKey,
  headerRight,
  footer,
  badge,
  children,
}: {
  slotKey: SlotKey
  /** Optional right-side header slot (an edit button, a stat…). */
  headerRight?: ReactNode
  /** Optional block under the mock (stats row, link row…). */
  footer?: ReactNode
  /**
   * Overrides the badge shown next to the title. `undefined` keeps the default
   * allocation badge (Toujours visible / En rotation…); pass a node to replace
   * it (e.g. a visibility percentage), or `null` to hide it.
   */
  badge?: ReactNode
  children: ReactNode
}) {
  const def = SLOT_DEFS.find((s) => s.key === slotKey)!
  const Icon = SLOT_ICON[slotKey]

  return (
    <div className="flex flex-col rounded-xl border border-border px-5 py-6">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle">
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-ui text-[0.95rem] font-medium text-ink">
              {def.label}
            </h2>
            {badge === undefined ? (
              <AllocBadge allocation={def.allocation} />
            ) : (
              badge
            )}
          </div>
          <p className="mt-0.5 font-body text-[0.8rem] leading-snug text-ink-muted">
            {def.description}
          </p>
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>

      <div className="mt-6 flex flex-1 items-center justify-center">
        {children}
      </div>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </div>
  )
}

/* ── The empty ad slot placeholder (Espaces publicitaires) ──────────────── */
export function AdSlot({
  icon: Icon = Plus,
  label = "Espace disponible",
  sub,
  className,
  tall,
}: {
  icon?: LucideIcon
  label?: string
  sub?: string
  className?: string
  tall?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-info/40 bg-info/5 px-3 text-center",
        tall ? "py-8" : "py-4",
        className,
      )}
    >
      <Icon size={tall ? 22 : 16} className="text-info/80" strokeWidth={1.75} />
      <span className="font-ui text-[0.72rem] font-medium text-info">
        {label}
      </span>
      {sub ? (
        <span className="font-body text-[0.64rem] text-ink-muted">{sub}</span>
      ) : null}
    </div>
  )
}

/* ── Neutral content skeleton piece ─────────────────────────────────────── */
export function Line({ w = "100%", h = 8 }: { w?: string; h?: number }) {
  return <div className="rounded bg-surface-nested" style={{ width: w, height: h }} />
}

/* ── Frames ─────────────────────────────────────────────────────────────── */
export function PhoneFrame({
  children,
  dark,
}: {
  children: ReactNode
  dark?: boolean
}) {
  return (
    <div className="rounded-[2rem] border-[6px] border-border-strong bg-background p-1 shadow-deep">
      <div
        className={cn(
          "relative h-[440px] w-[220px] overflow-hidden rounded-[1.5rem]",
          dark ? "bg-background" : "bg-surface",
        )}
      >
        {/* notch */}
        <div className="absolute top-2 left-1/2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-border-strong" />
        <div className="h-full overflow-hidden pt-6">{children}</div>
      </div>
    </div>
  )
}

export function WebFrame({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-lg border border-border-strong bg-surface shadow-deep">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-deep px-3 py-2">
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="ml-2 truncate font-body text-[0.62rem] text-ink-disabled">
          {title}
        </span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

/* ── Mocks — each drops `slot` into its ad position ─────────────────────── */

/** Page partenaires — annuaire grid; `slot` is the first (featured) tile. */
export function AnnuaireMock({ slot }: { slot: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <BookUser size={15} className="text-ink-muted" />
        <span className="font-ui text-[0.8rem] font-medium text-ink">
          Nos partenaires
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="aspect-square">{slot}</div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border-strong bg-surface-nested text-ink-disabled"
          >
            <Plus size={14} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-center font-body text-[0.64rem] text-ink-muted">
        Chaque partenaire dispose d'une fiche dans l'annuaire.
      </p>
    </div>
  )
}

/** Bannière calendrier — `slot` is pinned above the séances list. */
export function CalendarMock({ slot }: { slot: ReactNode }) {
  return (
    <div className="flex h-full flex-col px-3">
      <div className="flex items-center gap-2 pb-3">
        <CalendarDays size={14} className="text-ink-muted" />
        <span className="font-ui text-[0.74rem] font-medium text-ink">
          Calendrier
        </span>
      </div>
      {slot}
      <div className="mt-3 flex flex-col gap-2.5">
        {["Séance — Minime A", "Match — Séniors", "Réunion staff"].map((t) => (
          <div
            key={t}
            className="flex items-center gap-2.5 rounded-md border border-border px-2.5 py-2"
          >
            <span className="size-7 shrink-0 rounded-md bg-surface-nested" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="font-body text-[0.66rem] text-ink-subtle">{t}</span>
              <Line w="60%" h={5} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Fil d'accueil — `slot` sits between two neutral posts. */
export function FeedMock({ slot }: { slot: ReactNode }) {
  return (
    <div className="flex h-full flex-col px-3">
      <div className="flex items-center gap-2 pb-3">
        <Newspaper size={14} className="text-ink-muted" />
        <span className="font-ui text-[0.74rem] font-medium text-ink">
          Fil d'actualité
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <FeedPost />
        {slot}
        <FeedPost />
      </div>
    </div>
  )
}

function FeedPost() {
  return (
    <div className="rounded-md border border-border px-2.5 py-2.5">
      <div className="flex items-center gap-2">
        <span className="size-6 rounded-full bg-surface-nested" />
        <div className="flex flex-col gap-1">
          <Line w="70px" h={5} />
          <Line w="40px" h={4} />
        </div>
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        <Line w="100%" h={5} />
        <Line w="85%" h={5} />
      </div>
    </div>
  )
}

/** Page de match — `slot` is the "présenté par" strip under the score. */
export function MatchMock({ slot }: { slot: ReactNode }) {
  return (
    <div className="flex h-full flex-col px-3">
      <div className="flex items-center gap-2 pb-3">
        <Trophy size={14} className="text-ink-muted" />
        <span className="font-ui text-[0.74rem] font-medium text-ink">Match</span>
      </div>
      <div className="rounded-lg border border-border px-3 py-4">
        <div className="flex items-center justify-between">
          <TeamCol color="var(--team-home)" />
          <div className="text-center">
            <div className="font-display text-xl font-semibold text-ink tabular-nums">
              2 — 1
            </div>
            <div className="font-body text-[0.58rem] text-ink-muted">Terminé</div>
          </div>
          <TeamCol color="var(--team-away)" />
        </div>
      </div>
      <div className="mt-3">{slot}</div>
    </div>
  )
}

function TeamCol({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="size-8 rounded-full"
        style={{ backgroundColor: color, opacity: 0.5 }}
      />
      <Line w="34px" h={5} />
    </div>
  )
}

/** Écran d'ouverture — `slot` fills the screen under the logo. */
export function SplashMock({ slot }: { slot: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center px-4">
      <div className="mt-2 flex items-center gap-1.5">
        <span className="flex size-5 items-center justify-center rounded-[5px] bg-brand text-[0.55rem] font-bold text-ink-inverted">
          iS
        </span>
        <span className="font-ui text-[0.7rem] font-semibold tracking-wide text-ink">
          iSMART
        </span>
      </div>
      <div className="flex w-full flex-1 items-center">
        <div className="w-full">{slot}</div>
      </div>
      <div className="mb-3 h-1 w-24 overflow-hidden rounded-full bg-surface-nested">
        <div className="h-full w-1/3 rounded-full bg-info" />
      </div>
    </div>
  )
}

/** Notification push — `slot` is the lock-screen card. */
export function NotificationMock({ slot }: { slot: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center px-3">
      <div className="mt-4 text-center">
        <div className="font-display text-3xl font-semibold text-ink tabular-nums">
          20:45
        </div>
        <div className="font-body text-[0.6rem] text-ink-muted">
          samedi 18 octobre
        </div>
      </div>
      <div className="mt-8 w-full">{slot}</div>
    </div>
  )
}

/** The default lock-screen notification body, used by the empty-slot screen. */
export function NotificationEmptySlot() {
  return (
    <div className="rounded-xl border border-dashed border-info/40 bg-info/5 px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-surface-nested text-info">
          <Bell size={13} />
        </span>
        <span className="font-ui text-[0.66rem] font-medium text-info">
          Notification sponsor
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        <Line w="90%" h={5} />
        <Line w="65%" h={5} />
      </div>
      <p className="mt-2 font-body text-[0.58rem] text-ink-muted">
        Espace disponible — envoyé aux parents et joueurs.
      </p>
    </div>
  )
}
