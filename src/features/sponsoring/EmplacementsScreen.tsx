import { useEffect, useState } from "react"
import { Link2, Radio, Smartphone, Timer } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { SLOT_DEFS, type SlotKey } from "@/data/seed/sponsoring"
import {
  AdSlot,
  AnnuaireMock,
  CalendarMock,
  EmplacementCard,
  FeedMock,
  MatchMock,
  NotificationEmptySlot,
  NotificationMock,
  PhoneFrame,
  SplashMock,
  WebFrame,
} from "@/features/sponsoring/emplacementMocks"
import { Creative } from "@/features/sponsoring/campaignUi"
import {
  endTone,
  RUNNING_BY_SLOT,
  type RunningAd,
} from "@/features/sponsoring/emplacementsRunningMock"

/**
 * Screen — "Espaces publicitaires". One card per ad placement, showing WHERE a
 * sponsor appears in the club app AND, now, WHAT is being served there right
 * now: the visuals in rotation, each with its share of the space, the campagne
 * and the partenaire behind it, and when it stops.
 *
 * The surfaces themselves live in emplacementMocks and are shared with the
 * campaign screens; only the slot content changes. A space with nothing running
 * falls back to the "Espace disponible" placeholder (see `splash`).
 *
 * The running data is IMAGINARY and local to this screen
 * (emplacementsRunningMock) — a display proposal, no rotation logic yet.
 */
export function EmplacementsScreen() {
  const running = SLOT_DEFS.flatMap((d) => RUNNING_BY_SLOT[d.key])
  const busySpaces = SLOT_DEFS.filter(
    (d) => RUNNING_BY_SLOT[d.key].length > 0,
  ).length

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/sponsoring/offres" label="Retour aux offres" />
      <PageHeader
        title="Espaces publicitaires"
        subtitle="Où vos sponsors apparaissent dans l'app du club — et ce qui y est diffusé en ce moment."
      />

      {/* Ce qui tourne, en une ligne — la question qu'on se pose en arrivant. */}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border px-5 py-4">
        <span className="inline-flex items-center gap-2 font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
          <Radio size={14} /> En diffusion
        </span>
        <span className="font-body text-[0.84rem] text-ink">
          {running.length} visuels
        </span>
        <span className="font-body text-[0.84rem] text-ink-muted">
          {busySpaces} / {SLOT_DEFS.length} espaces occupés
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {SLOT_DEFS.map((def) => (
          <SpaceCard key={def.key} slotKey={def.key} />
        ))}
      </div>
    </div>
  )
}

/* ── One ad space: its surface + everything running in it ───────────────── */
function SpaceCard({ slotKey }: { slotKey: SlotKey }) {
  const ads = RUNNING_BY_SLOT[slotKey]
  const [index, setIndex] = useState(0)
  // Clicking a visual pins it; until then the rotation plays on its own, so the
  // card shows what a parent actually sees over time instead of a frozen frame.
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (pinned || ads.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 2600)
    return () => clearInterval(t)
  }, [pinned, ads.length])

  const current = ads[Math.min(index, ads.length - 1)] ?? null

  return (
    <EmplacementCard
      slotKey={slotKey}
      badge={
        ads.length ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-success/25 bg-success/10 px-2 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] text-success uppercase">
            <span className="size-1.5 rounded-full bg-success" />
            {ads.length} en diffusion
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-pill border border-border bg-accent px-2 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            Libre
          </span>
        )
      }
      footer={
        ads.length ? (
          <div className="flex flex-col gap-1.5">
            {ads.map((ad, i) => (
              <AdRow
                key={ad.id}
                ad={ad}
                active={i === index}
                onSelect={() => {
                  setIndex(i)
                  setPinned(true)
                }}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border-strong px-3 py-3 text-center font-body text-[0.76rem] text-ink-muted">
            Aucun visuel diffusé — cet espace est disponible à la vente.
          </p>
        )
      }
    >
      <SlotSurface slotKey={slotKey} ad={current} />
    </EmplacementCard>
  )
}

/* ── A running visual: share, campagne · partenaire, fin ────────────────── */
function AdRow({
  ad,
  active,
  onSelect,
}: {
  ad: RunningAd
  active: boolean
  onSelect: () => void
}) {
  const tone = endTone(ad.daysLeft)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-border-strong bg-surface-nested"
          : "border-border hover:border-border-strong hover:bg-surface-hover",
      )}
    >
      <div className="flex items-center gap-2.5">
        {/* Le visuel lui-même, en miniature — on reconnaît la pub d'un coup d'œil */}
        <span
          className="size-6 shrink-0 rounded-[5px]"
          style={{
            // Sponsor artwork, not chrome — same wash as the Creative mock.
            backgroundImage: `linear-gradient(135deg, ${ad.color}, ${ad.color}99)`,
          }}
        />
        <span className="min-w-0 flex-1 truncate font-ui text-[0.8rem] font-medium text-ink">
          {ad.partner}
        </span>
        <span className="shrink-0 font-display text-[0.9rem] font-semibold text-ink tabular-nums">
          {ad.share} %
        </span>
      </div>

      <div className="mt-2 h-[5px] overflow-hidden rounded bg-accent">
        <div
          className="h-full rounded transition-[width] duration-500"
          style={{ width: `${ad.share}%`, backgroundColor: ad.color }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 truncate font-body text-[0.72rem] text-ink-muted">
          {ad.campaign}
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 font-body text-[0.72rem] tabular-nums",
            tone === "danger" && "text-danger",
            tone === "warning" && "text-warning",
            tone === "muted" && "text-ink-disabled",
          )}
          title={`Fin le ${ad.endDate}`}
        >
          <Timer size={11} /> Fin {ad.endsIn}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <Link2 size={11} className="shrink-0 text-ink-disabled" />
        <span className="min-w-0 truncate font-mono text-[0.66rem] text-ink-subtle">
          {ad.link}
        </span>
      </div>

      {ad.note ? (
        <p className="mt-1.5 font-body text-[0.68rem] text-ink-disabled">
          {ad.note}
        </p>
      ) : null}
    </button>
  )
}

/* ── The surface, with the selected visual dropped into its ad position ──── */
function SlotSurface({
  slotKey,
  ad,
}: {
  slotKey: SlotKey
  ad: RunningAd | null
}) {
  const creative = (className: string, compact?: boolean) =>
    ad ? (
      <Creative
        name={ad.partner}
        headline={ad.headline}
        color={ad.color}
        className={className}
        compact={compact}
      />
    ) : null

  switch (slotKey) {
    case "partners_page":
      return (
        <WebFrame title="ismartclub.tn — Nos partenaires">
          <AnnuaireMock
            slot={
              creative("size-full", true) ?? (
                <div className="flex size-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-info/40 bg-info/5 text-info">
                  <span className="font-ui text-[0.6rem] font-medium">
                    Disponible
                  </span>
                </div>
              )
            }
          />
        </WebFrame>
      )

    case "calendar_banner":
      return (
        <PhoneFrame>
          <CalendarMock
            slot={
              creative("h-[54px]", true) ?? <AdSlot sub="Bannière · 320×80" />
            }
          />
        </PhoneFrame>
      )

    case "home_feed":
      return (
        <PhoneFrame>
          <FeedMock
            slot={
              creative("h-[86px]") ?? (
                <AdSlot label="Carte sponsorisée" sub="Espace disponible" />
              )
            }
          />
        </PhoneFrame>
      )

    case "match_detail":
      return (
        <PhoneFrame>
          <MatchMock
            slot={
              creative("h-[52px]", true) ?? (
                <AdSlot label="Match présenté par…" sub="Espace disponible" />
              )
            }
          />
        </PhoneFrame>
      )

    case "splash":
      return (
        <PhoneFrame dark>
          <SplashMock
            slot={
              creative("h-[240px] w-full") ?? (
                <AdSlot
                  icon={Smartphone}
                  label="Écran d'ouverture"
                  sub="Plein écran · 3 s"
                  tall
                  className="w-full"
                />
              )
            }
          />
        </PhoneFrame>
      )

    case "notification":
      return (
        <PhoneFrame dark>
          <NotificationMock
            slot={
              ad ? (
                <div className="rounded-xl border border-border-strong bg-surface px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-5 items-center justify-center rounded-[4px] font-ui text-[0.45rem] font-semibold text-white"
                      style={{ backgroundColor: ad.color }}
                    >
                      {ad.partner.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate font-ui text-[0.6rem] font-medium text-ink">
                      {ad.partner}
                    </span>
                    <span className="ml-auto font-body text-[0.5rem] text-ink-disabled">
                      maintenant
                    </span>
                  </div>
                  <p className="mt-1.5 font-body text-[0.6rem] leading-snug text-ink-subtle">
                    {ad.headline}
                  </p>
                </div>
              ) : (
                <NotificationEmptySlot />
              )
            }
          />
        </PhoneFrame>
      )

    default:
      return null
  }
}
