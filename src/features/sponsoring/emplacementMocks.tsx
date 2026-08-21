import type { ReactNode } from "react"
import { CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { SLOT_DEFS, type Allocation, type SlotKey } from "@/data/seed/sponsoring"
import { SLOT_ICON } from "@/features/sponsoring/ui"

/**
 * The shared frame around an ad space: the card that names it, the phone the
 * mobile version is drawn in, and the neutral skeleton pieces.
 *
 * The surfaces themselves (Accueil, Planification, Matchs, Messagerie,
 * Notification — each in its web and mobile version) live in `appSurfaces`;
 * the calendar / notification mocks kept here are the ones the offer form
 * still uses through `offerSpaceMocks`.
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

/* ── Mocks — each drops `slot` into its ad position ─────────────────────── */

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
