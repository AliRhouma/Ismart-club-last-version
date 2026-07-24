import type { ReactNode } from "react"
import {
  CalendarDays,
  List,
  Trophy,
  Dumbbell,
  MessageSquare,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { SpaceKey } from "@/data/seed/sponsoring"

/**
 * Compact phone mocks for the offer form's Espaces publicitaires cards. Each
 * mock draws the club surface where a sponsor appears and drops in a coloured
 * "sponsor slot" tinted with the pack's badge colour — the same idea as the
 * gallery page (emplacementMocks), sized down to sit inside a form card.
 */

/* ── Building blocks ────────────────────────────────────────────────────── */

function Line({ w = "100%", h = 5 }: { w?: string; h?: number }) {
  return <div className="rounded bg-surface-nested" style={{ width: w, height: h }} />
}

function MiniPhone({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className="rounded-[1.4rem] border-[5px] border-border-strong bg-background p-1 shadow-deep">
      <div
        className={cn(
          "relative h-[300px] w-[168px] overflow-hidden rounded-[1.05rem]",
          dark ? "bg-background" : "bg-surface",
        )}
      >
        <div className="absolute top-1.5 left-1/2 z-10 h-1 w-10 -translate-x-1/2 rounded-full bg-border-strong" />
        <div className="h-full overflow-hidden pt-5">{children}</div>
      </div>
    </div>
  )
}

function ScreenHead({ icon: Icon, title }: { icon: typeof List; title: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
      <Icon size={12} className="text-ink-muted" />
      <span className="font-ui text-[0.66rem] font-medium text-ink">{title}</span>
    </div>
  )
}

/** The sponsor placement, tinted in the pack's colour. */
function SponsorSlot({
  color,
  label = "Sponsor",
  compact,
}: {
  color: string
  label?: string
  compact?: boolean
}) {
  return (
    <div
      className="rounded-md border px-2 py-1.5"
      style={{ borderColor: `${color}66`, backgroundColor: `${color}1f` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-ui text-[0.56rem] font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
      {compact ? null : (
        <div className="mt-1.5 flex flex-col gap-1">
          <Line w="82%" h={4} />
          <Line w="56%" h={4} />
        </div>
      )}
    </div>
  )
}

function RowCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
      {children}
    </div>
  )
}

/* ── One mock per space ─────────────────────────────────────────────────── */

/** Calendar — sponsor banner pinned above the events. */
function CalendarMock({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col px-2.5">
      <ScreenHead icon={CalendarDays} title="Calendrier" />
      <SponsorSlot color={color} label="Bannière sponsor" />
      <div className="mt-2.5 flex flex-col gap-1.5">
        {["Séance — Minime A", "Match — Séniors", "Réunion staff"].map((t) => (
          <RowCard key={t}>
            <span className="size-5 shrink-0 rounded-md bg-surface-nested" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-body text-[0.56rem] text-ink-subtle">
                {t}
              </span>
              <Line w="60%" h={4} />
            </div>
          </RowCard>
        ))}
      </div>
    </div>
  )
}

/** Match list — sponsored card slipped into the list of matches. */
function MatchListMock({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col px-2.5">
      <ScreenHead icon={List} title="Matchs" />
      <div className="flex flex-col gap-1.5">
        <MatchRow />
        <SponsorSlot color={color} label="Match sponsorisé" />
        <MatchRow />
        <MatchRow />
      </div>
    </div>
  )
}

function MatchRow() {
  return (
    <RowCard>
      <span className="size-4 shrink-0 rounded-full bg-surface-nested" />
      <div className="flex flex-1 items-center justify-between">
        <Line w="34px" h={4} />
        <span className="font-body text-[0.5rem] text-ink-disabled">vs</span>
        <Line w="34px" h={4} />
      </div>
    </RowCard>
  )
}

/** Match detail — "présenté par" strip under the score. */
function MatchDetailMock({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col px-2.5">
      <ScreenHead icon={Trophy} title="Match" />
      <div className="rounded-lg border border-border px-2.5 py-3">
        <div className="flex items-center justify-between">
          <TeamCol c="var(--team-home)" />
          <div className="text-center">
            <div className="font-display text-base font-semibold text-ink tabular-nums">
              2 — 1
            </div>
            <div className="font-body text-[0.48rem] text-ink-muted">Terminé</div>
          </div>
          <TeamCol c="var(--team-away)" />
        </div>
      </div>
      <div className="mt-2.5">
        <SponsorSlot color={color} label="Présenté par…" compact />
      </div>
    </div>
  )
}

function TeamCol({ c }: { c: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="size-6 rounded-full" style={{ backgroundColor: c, opacity: 0.5 }} />
      <Line w="26px" h={4} />
    </div>
  )
}

/** Session page — sponsored encart under the session details. */
function SessionMock({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col px-2.5">
      <ScreenHead icon={Dumbbell} title="Séance" />
      <div className="rounded-lg border border-border px-2.5 py-2.5">
        <span className="font-body text-[0.6rem] font-medium text-ink-subtle">
          Séance technique — U15
        </span>
        <div className="mt-2 flex flex-col gap-1.5">
          <Line w="90%" h={4} />
          <Line w="70%" h={4} />
          <Line w="80%" h={4} />
        </div>
      </div>
      <div className="mt-2.5">
        <SponsorSlot color={color} label="Encart sponsor" />
      </div>
    </div>
  )
}

/** Notification — sponsor card on the lock screen. */
function NotificationMock({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col items-center px-2.5">
      <div className="mt-2 text-center">
        <div className="font-display text-2xl font-semibold text-ink tabular-nums">
          20:45
        </div>
        <div className="font-body text-[0.5rem] text-ink-muted">samedi 18 octobre</div>
      </div>
      <div className="mt-6 w-full">
        <SponsorSlot color={color} label="Notification sponsor" />
      </div>
    </div>
  )
}

/** Messagerie — sponsored message in the conversation. */
function MessagerieMock({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col px-2.5">
      <ScreenHead icon={MessageSquare} title="Messagerie" />
      <div className="flex flex-col gap-1.5">
        <Bubble side="left" />
        <Bubble side="right" />
        <div
          className="max-w-[85%] self-start rounded-md rounded-bl-sm border px-2 py-1.5"
          style={{ borderColor: `${color}66`, backgroundColor: `${color}1f` }}
        >
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-ui text-[0.54rem] font-semibold" style={{ color }}>
              Message sponsor
            </span>
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            <Line w="80%" h={4} />
            <Line w="60%" h={4} />
          </div>
        </div>
        <Bubble side="left" />
      </div>
    </div>
  )
}

function Bubble({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={cn(
        "max-w-[75%] rounded-md border border-border bg-surface-nested px-2 py-1.5",
        side === "right" ? "self-end rounded-br-sm" : "self-start rounded-bl-sm",
      )}
    >
      <div className="flex flex-col gap-1">
        <Line w="70px" h={4} />
        <Line w="45px" h={4} />
      </div>
    </div>
  )
}

/* ── Registry ───────────────────────────────────────────────────────────── */

const MOCKS: Record<
  SpaceKey,
  { mock: (p: { color: string }) => ReactNode; dark?: boolean }
> = {
  calendar: { mock: CalendarMock },
  match_list: { mock: MatchListMock },
  match_detail: { mock: MatchDetailMock },
  session_detail: { mock: SessionMock },
  notification: { mock: NotificationMock, dark: true },
  messagerie: { mock: MessagerieMock },
}

/** The phone mock for a given offer space, tinted with the pack colour. */
export function OfferSpacePreview({
  spaceKey,
  color,
}: {
  spaceKey: SpaceKey
  color: string
}) {
  const { mock, dark } = MOCKS[spaceKey]
  return <MiniPhone dark={dark}>{mock({ color })}</MiniPhone>
}
