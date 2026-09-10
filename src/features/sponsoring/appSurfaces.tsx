import { Logo } from "@/components/kit/Logo"
import type { ReactNode } from "react"
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Trophy,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { initials } from "@/lib/tint"
import { SLOT_BY_KEY, type SlotKey } from "@/data/seed/sponsoring"
import { Line, PhoneFrame } from "@/features/sponsoring/emplacementMocks"

/**
 * Where an ad space actually sits in the product — drawn twice, once per
 * version of the app.
 *
 * The two versions are drawn at the shape of the real thing: the web version
 * inside a 16:9 browser window (1920 × 1080), sidebar and topbar included; the
 * mobile version inside the phone. The same ad space therefore reads very
 * differently in each, which is exactly why it takes two artworks.
 *
 * The five surfaces are the real ones: Accueil, Planification, Matchs,
 * Messagerie and the push notification. Two of them (messagerie, notification)
 * carry no artwork at all: they borrow the app's own message structure, so the
 * sponsor writes a text and the mock renders it exactly as a parent reads it —
 * a row in the conversation list, a card under the bell.
 *
 * `ad` null = the space is empty (or switched off): the mock shows the dashed
 * "Espace disponible" placeholder in its place instead.
 */
export type SurfaceAd = {
  sponsor: string
  /** Raw hex — the sponsor's artwork colour (product data, not chrome). */
  color: string
  /** Drawn on a visuel; read as the message on messagerie / notification. */
  headline: string
}

export type SurfaceView = "web" | "mobile"

/* ── The two versions, side by side ─────────────────────────────────────── */
export function SurfacePair({
  slotKey,
  ad,
  placed,
  onEdit,
}: {
  slotKey: SlotKey
  ad: SurfaceAd | null
  /**
   * Which versions carry their artwork. Each version has its own file at its
   * own dimension, so one can be ready while the other is still empty.
   * Omitted = both, as soon as `ad` is there.
   */
  placed?: { web: boolean; mobile: boolean }
  onEdit?: (view: SurfaceView) => void
}) {
  const def = SLOT_BY_KEY[slotKey]
  const webAd = ad && (placed?.web ?? true) ? ad : null
  const mobileAd = ad && (placed?.mobile ?? true) ? ad : null
  return (
    <div className="flex w-full flex-wrap items-start justify-center gap-6">
      <SurfaceColumn
        caption={def.webContext}
        size={def.webSize}
        version="Version web"
      >
        <AppSurface
          slotKey={slotKey}
          view="web"
          ad={webAd}
          onEdit={onEdit ? () => onEdit("web") : undefined}
        />
      </SurfaceColumn>
      <SurfaceColumn
        caption={def.mobileContext}
        size={def.mobileSize}
        version="Version mobile"
      >
        <AppSurface
          slotKey={slotKey}
          view="mobile"
          ad={mobileAd}
          onEdit={onEdit ? () => onEdit("mobile") : undefined}
        />
      </SurfaceColumn>
    </div>
  )
}

function SurfaceColumn({
  caption,
  size,
  version,
  children,
}: {
  caption: string
  size?: string
  version: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex flex-col items-center gap-1">
        <span className="font-ui text-[0.62rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
          {version}
        </span>
        <span className="font-body text-[0.68rem] text-ink-disabled">
          {size ?? caption}
        </span>
      </div>
      {children}
    </div>
  )
}

/* ── One surface, in one version ────────────────────────────────────────── */
export function AppSurface({
  slotKey,
  view,
  ad,
  onEdit,
}: {
  slotKey: SlotKey
  view: SurfaceView
  ad: SurfaceAd | null
  onEdit?: () => void
}) {
  const body = surfaceBody(slotKey, view, ad, onEdit)
  return view === "web" ? (
    <BrowserFrame slotKey={slotKey}>{body}</BrowserFrame>
  ) : (
    <PhoneFrame>{body}</PhoneFrame>
  )
}

/* ── The web version: a 16:9 window, with the app's own chrome ──────────── */

/** The app's sidebar, in order — the active one lights up per surface. */
const NAV: { key: SlotKey; label: string; icon: typeof Bell }[] = [
  { key: "accueil", label: "Accueil", icon: LayoutDashboard },
  { key: "planification", label: "Planning", icon: CalendarDays },
  { key: "match_detail", label: "Matchs", icon: Trophy },
  { key: "messagerie", label: "Messages", icon: MessageSquare },
]

function BrowserFrame({
  slotKey,
  children,
}: {
  slotKey: SlotKey
  children: ReactNode
}) {
  const active = slotKey === "notification" ? "accueil" : slotKey

  return (
    <div className="w-[460px] max-w-full overflow-hidden rounded-lg border border-border-strong bg-surface shadow-deep">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-deep px-3 py-2">
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="size-2 rounded-full bg-border-strong" />
        <span className="ml-2 truncate font-body text-[0.62rem] text-ink-disabled">
          app.ismartclub.tn
        </span>
      </div>

      {/* the window itself — 1920 × 1080 */}
      <div className="flex aspect-video w-full overflow-hidden bg-background">
        {/* sidebar */}
        <div className="flex w-[62px] shrink-0 flex-col gap-1 border-r border-border bg-surface px-1.5 py-2">
          <div className="flex items-center gap-1 px-1 pb-1.5">
            <Logo alt="" className="h-3" />
          </div>
          {NAV.map((n) => (
            <div
              key={n.key}
              className={cn(
                "flex items-center gap-1 rounded-sm px-1 py-1",
                n.key === active
                  ? "bg-surface-nested text-ink"
                  : "text-ink-disabled",
              )}
            >
              <n.icon size={9} className="shrink-0" />
              <span className="truncate font-ui text-[0.46rem] font-medium">
                {n.label}
              </span>
            </div>
          ))}
        </div>

        {/* page */}
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}

/** The topbar of a web page: its title, the bell, the avatar. */
function WebTopbar({
  title,
  bellActive,
}: {
  title: string
  bellActive?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-2.5 py-1.5">
      <span className="truncate font-ui text-[0.6rem] font-medium text-ink">
        {title}
      </span>
      <span className="ml-auto flex items-center gap-1.5">
        <Bell
          size={10}
          className={bellActive ? "text-info" : "text-ink-disabled"}
        />
        <span className="size-3.5 rounded-full bg-surface-nested" />
      </span>
    </div>
  )
}

function surfaceBody(
  slotKey: SlotKey,
  view: SurfaceView,
  ad: SurfaceAd | null,
  onEdit?: () => void,
): ReactNode {
  const banner = (h: number) => (
    <BannerCreative ad={ad} height={h} onEdit={onEdit} />
  )

  switch (slotKey) {
    case "accueil":
      return <AccueilMock view={view} slot={banner(view === "web" ? 40 : 52)} />
    case "planification":
      return (
        <PlanificationMock view={view} slot={banner(view === "web" ? 36 : 46)} />
      )
    case "match_detail":
      return <MatchMock view={view} slot={banner(view === "web" ? 34 : 48)} />
    case "messagerie":
      return (
        <MessagerieMock
          view={view}
          slot={<SponsoredConversationRow ad={ad} onEdit={onEdit} />}
        />
      )
    case "notification":
      return (
        <NotificationsMock
          view={view}
          slot={<SponsoredNotification ad={ad} onEdit={onEdit} />}
        />
      )
    default:
      return <Line />
  }
}

/* ── The artwork (visuel spaces) ────────────────────────────────────────── */
function BannerCreative({
  ad,
  height,
  onEdit,
}: {
  ad: SurfaceAd | null
  height: number
  onEdit?: () => void
}) {
  if (!ad) {
    return (
      <Placeholder onEdit={onEdit} height={height}>
        <span className="font-ui text-[0.58rem] font-medium text-info">
          Espace disponible
        </span>
      </Placeholder>
    )
  }

  const body = (
    <div
      className="relative flex w-full flex-col justify-between overflow-hidden rounded-md px-2 py-1.5"
      style={{
        height,
        // Sponsor artwork, not chrome — the sanctioned use of a gradient fill.
        backgroundImage: `linear-gradient(135deg, ${ad.color}, ${ad.color}99)`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 -right-5 size-14 rounded-full bg-white/15"
      />
      <div className="relative flex items-center gap-1.5">
        <span
          className="flex size-3.5 items-center justify-center rounded-[3px] bg-white/90 font-ui text-[0.4rem] font-semibold"
          style={{ color: ad.color }}
        >
          {initials(ad.sponsor)}
        </span>
        <span className="truncate font-ui text-[0.46rem] font-medium text-white/80">
          Sponsorisé · {ad.sponsor}
        </span>
      </div>
      <p className="relative truncate font-ui text-[0.56rem] font-medium text-white">
        {ad.headline}
      </p>
    </div>
  )

  return onEdit ? (
    <button type="button" onClick={onEdit} className="block w-full text-left">
      {body}
    </button>
  ) : (
    body
  )
}

/* ── The message spaces, drawn as the app really draws them ─────────────── */
function SponsorChip({ ad, size = 22 }: { ad: SurfaceAd; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md font-ui font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        backgroundImage: `linear-gradient(135deg, ${ad.color}, ${ad.color}cc)`,
      }}
    >
      {initials(ad.sponsor)}
    </span>
  )
}

function SponsoredPill() {
  return (
    <span className="shrink-0 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-1 py-px font-ui text-[0.42rem] font-medium tracking-[0.06em] text-brand-blue-600 uppercase">
      Sponsorisé
    </span>
  )
}

/** Messagerie — a row in the conversation list, never a thread. */
function SponsoredConversationRow({
  ad,
  onEdit,
}: {
  ad: SurfaceAd | null
  onEdit?: () => void
}) {
  if (!ad) {
    return (
      <Placeholder onEdit={onEdit} height={38}>
        <span className="font-ui text-[0.54rem] font-medium text-info">
          Conversation sponsorisée
        </span>
      </Placeholder>
    )
  }

  const body = (
    <div className="flex w-full items-center gap-1.5 rounded-md border border-brand-blue-600/25 bg-brand-blue-600/[0.06] px-1.5 py-1.5">
      <SponsorChip ad={ad} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1">
          <span className="truncate font-ui text-[0.56rem] font-medium text-ink">
            {ad.sponsor}
          </span>
          <span className="ml-auto">
            <SponsoredPill />
          </span>
        </span>
        <span className="truncate font-body text-[0.5rem] text-ink-muted">
          {ad.headline}
        </span>
      </span>
    </div>
  )

  return onEdit ? (
    <button type="button" onClick={onEdit} className="block w-full text-left">
      {body}
    </button>
  ) : (
    body
  )
}

/** Notification push — the card under the bell. */
function SponsoredNotification({
  ad,
  onEdit,
}: {
  ad: SurfaceAd | null
  onEdit?: () => void
}) {
  if (!ad) {
    return (
      <Placeholder onEdit={onEdit} height={44}>
        <span className="font-ui text-[0.54rem] font-medium text-info">
          Notification sponsorisée
        </span>
      </Placeholder>
    )
  }

  const body = (
    <div className="flex w-full items-start gap-1.5 rounded-md border border-brand-blue-600/25 bg-brand-blue-600/[0.06] px-1.5 py-1.5">
      <SponsorChip ad={ad} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate font-ui text-[0.56rem] font-semibold text-ink">
            {ad.sponsor}
          </span>
          <span className="ml-auto">
            <SponsoredPill />
          </span>
        </span>
        <span className="mt-0.5 block font-body text-[0.5rem] leading-snug text-ink-muted">
          {ad.headline}
        </span>
        <span className="mt-0.5 block font-ui text-[0.46rem] font-medium text-info">
          Découvrir →
        </span>
      </span>
    </div>
  )

  return onEdit ? (
    <button type="button" onClick={onEdit} className="block w-full text-left">
      {body}
    </button>
  ) : (
    body
  )
}

/** The dashed "not filled yet" block, at the height of the real creative. */
function Placeholder({
  onEdit,
  height,
  children,
}: {
  onEdit?: () => void
  height: number
  children: ReactNode
}) {
  const body = (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-md border border-dashed border-info/40 bg-info/5 px-2 text-center",
        onEdit && "transition-colors hover:bg-info/10",
      )}
      style={{ height }}
    >
      {children}
    </div>
  )
  return onEdit ? (
    <button type="button" onClick={onEdit} className="block w-full">
      {body}
    </button>
  ) : (
    body
  )
}

/* ── The surfaces themselves ────────────────────────────────────────────── */

/** The phone's own page header (the web version gets the topbar instead). */
function PhoneHeader({
  icon: Icon,
  title,
}: {
  icon: typeof Bell
  title: string
}) {
  return (
    <div className="flex items-center gap-2 pb-3">
      <Icon size={13} className="text-ink-muted" />
      <span className="font-ui text-[0.72rem] font-medium text-ink">
        {title}
      </span>
    </div>
  )
}

/** Accueil — the banner sits at the top of the tableau de bord. */
function AccueilMock({ view, slot }: { view: SurfaceView; slot: ReactNode }) {
  const tiles = (
    <div className="grid grid-cols-3 gap-1.5">
      {["Joueurs", "Séances", "Recettes"].map((t) => (
        <div key={t} className="rounded-md border border-border px-1.5 py-1">
          <div className="font-display text-[0.62rem] font-semibold text-ink">
            —
          </div>
          <div className="mt-px truncate font-body text-[0.44rem] text-ink-muted">
            {t}
          </div>
        </div>
      ))}
    </div>
  )

  const rows = (count: number) => (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-1.5"
        >
          <span className="size-5 shrink-0 rounded-md bg-surface-nested" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Line w="70%" h={4} />
            <Line w="45%" h={3} />
          </div>
        </div>
      ))}
    </div>
  )

  if (view === "mobile") {
    return (
      <div className="flex h-full flex-col px-3">
        <PhoneHeader icon={LayoutDashboard} title="Accueil" />
        {tiles}
        <div className="mt-2.5">{slot}</div>
        <div className="mt-2.5">{rows(2)}</div>
      </div>
    )
  }

  return (
    <>
      <WebTopbar title="Accueil" />
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
        {tiles}
        {slot}
        {rows(2)}
      </div>
    </>
  )
}

/** Planification — the banner above the week's séances. */
function PlanificationMock({
  view,
  slot,
}: {
  view: SurfaceView
  slot: ReactNode
}) {
  const week = (
    <div className="flex items-center justify-between gap-1">
      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d, i) => (
        <span
          key={i}
          className={cn(
            "flex flex-1 items-center justify-center rounded-md py-0.5 font-ui text-[0.44rem]",
            i === 2
              ? "bg-info text-ink-inverted"
              : "bg-surface-nested text-ink-muted",
          )}
        >
          {d}
        </span>
      ))}
    </div>
  )

  const events = (
    <div className="flex flex-col gap-1.5">
      {["Séance — U13", "Match — Séniors", "Réunion staff"].map((t) => (
        <div
          key={t}
          className="flex items-center gap-1.5 rounded-md border border-border px-1.5 py-1"
        >
          <span className="h-5 w-1 shrink-0 rounded-full bg-surface-nested" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-body text-[0.5rem] text-ink-subtle">
              {t}
            </span>
            <Line w="50%" h={3} />
          </div>
        </div>
      ))}
    </div>
  )

  if (view === "mobile") {
    return (
      <div className="flex h-full flex-col px-3">
        <PhoneHeader icon={CalendarDays} title="Planification" />
        {week}
        <div className="mt-2.5">{slot}</div>
        <div className="mt-2.5">{events}</div>
      </div>
    )
  }

  return (
    <>
      <WebTopbar title="Planification" />
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
        {week}
        {slot}
        {events}
      </div>
    </>
  )
}

/** Match — the "présenté par" strip under the score. */
function MatchMock({ view, slot }: { view: SurfaceView; slot: ReactNode }) {
  const score = (
    <div className="rounded-lg border border-border px-3 py-2">
      <div className="flex items-center justify-between">
        <TeamCol color="var(--team-home)" />
        <div className="text-center">
          <div className="font-display text-base font-semibold text-ink tabular-nums">
            2 — 1
          </div>
          <div className="font-body text-[0.46rem] text-ink-muted">Terminé</div>
        </div>
        <TeamCol color="var(--team-away)" />
      </div>
    </div>
  )

  if (view === "mobile") {
    return (
      <div className="flex h-full flex-col px-3">
        <PhoneHeader icon={Trophy} title="Feuille de match" />
        {score}
        <div className="mt-2.5">{slot}</div>
        <div className="mt-2.5 flex flex-col gap-1.5">
          <Line w="100%" h={5} />
          <Line w="80%" h={5} />
        </div>
      </div>
    )
  }

  return (
    <>
      <WebTopbar title="Match — U15 vs Étoile" />
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
        {score}
        {slot}
        <div className="flex flex-col gap-1.5">
          <Line w="100%" h={4} />
          <Line w="70%" h={4} />
        </div>
      </div>
    </>
  )
}

function TeamCol({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="size-6 rounded-full"
        style={{ backgroundColor: color, opacity: 0.5 }}
      />
      <Line w="28px" h={4} />
    </div>
  )
}

/**
 * Messagerie — the ad is a row in the conversation list, and nothing else:
 * opening it never leads to a fake thread.
 */
function MessagerieMock({ view, slot }: { view: SurfaceView; slot: ReactNode }) {
  const list = (
    <div className="flex flex-col gap-1">
      {slot}
      {["Staff U13", "Parents U11", "Bureau"].map((t) => (
        <div key={t} className="flex items-center gap-1.5 px-1 py-1">
          <span className="size-5 shrink-0 rounded-md bg-surface-nested" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-body text-[0.5rem] text-ink-subtle">
              {t}
            </span>
            <Line w="60%" h={3} />
          </div>
        </div>
      ))}
    </div>
  )

  if (view === "mobile") {
    return (
      <div className="flex h-full flex-col px-3">
        <PhoneHeader icon={MessageSquare} title="Messagerie" />
        {list}
      </div>
    )
  }

  // Web: the two-pane messagerie — the ad lives in the left list only.
  return (
    <>
      <WebTopbar title="Messagerie" />
      <div className="flex min-h-0 flex-1 gap-1.5 p-2">
        <div className="w-[48%] shrink-0 overflow-hidden rounded-md border border-border p-1">
          {list}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between rounded-md border border-border p-1.5">
          <div className="flex flex-col gap-1.5">
            <Line w="80%" h={4} />
            <Line w="55%" h={4} />
            <Line w="70%" h={4} />
          </div>
          <div className="h-4 rounded-md bg-surface-nested" />
        </div>
      </div>
    </>
  )
}

/** Notifications — the card at the top of the bell's feed. */
function NotificationsMock({
  view,
  slot,
}: {
  view: SurfaceView
  slot: ReactNode
}) {
  const feed = (
    <div className="flex flex-col gap-1">
      {slot}
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-1.5 px-1 py-1">
          <span className="size-5 shrink-0 rounded-md bg-surface-nested" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Line w="75%" h={4} />
            <Line w="50%" h={3} />
          </div>
        </div>
      ))}
    </div>
  )

  if (view === "mobile") {
    return (
      <div className="flex h-full flex-col px-3">
        <PhoneHeader icon={Bell} title="Notifications" />
        {feed}
      </div>
    )
  }

  // Web: the panel hanging under the bell, over the page it was opened from.
  return (
    <>
      <WebTopbar title="Accueil" bellActive />
      <div className="relative flex min-h-0 flex-1 flex-col gap-1.5 p-2">
        <div className="flex flex-col gap-1.5 opacity-40">
          <Line w="60%" h={5} />
          <div className="h-8 rounded-md border border-border" />
          <div className="h-8 rounded-md border border-border" />
        </div>
        <div className="absolute top-1 right-2 w-[62%] rounded-md border border-border-strong bg-surface p-1.5 shadow-deep">
          <div className="flex items-center justify-between pb-1">
            <span className="font-ui text-[0.56rem] font-medium text-ink">
              Notifications
            </span>
            <span className="font-body text-[0.46rem] text-ink-muted">
              Tout lire
            </span>
          </div>
          {feed}
        </div>
      </div>
    </>
  )
}
