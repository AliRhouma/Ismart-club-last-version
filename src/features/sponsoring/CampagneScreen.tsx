import type { ReactNode } from "react"
import { Navigate, useParams } from "react-router-dom"
import {
  Archive,
  CalendarRange,
  Eye,
  ImageIcon,
  MousePointerClick,
  Pencil,
} from "lucide-react"

import {
  campaignTotals,
  num,
  SLOT_BY_KEY,
  type Campaign,
  type CampaignSlot,
  type SlotKey,
} from "@/data/seed/sponsoring"
import { useData } from "@/data/useData"
import { BackButton } from "@/components/kit/BackButton"
import {
  AnnuaireMock,
  CalendarMock,
  EmplacementCard,
  FeedMock,
  MatchMock,
  NotificationMock,
  PhoneFrame,
  SplashMock,
  WebFrame,
  Line,
} from "@/features/sponsoring/emplacementMocks"
import {
  Creative,
  EditableCreative,
  IconButton,
  LinkRow,
  SlotStats,
} from "@/features/sponsoring/campaignUi"

/**
 * Screen — one campaign, in the same six-surface layout as "Espaces
 * publicitaires", but filled with the sponsor's creatives.
 *
 * Two variants of one page, because they answer two different questions:
 *   • en cours  → "what is being shown, and can I change it?" → the dates and
 *     progress lead, every creative carries its edit affordances and its link.
 *   • archivée  → "what did it do?" → the totals lead, and each surface reports
 *     its own vues / clics / CTR under the mock.
 *
 * Static: the edit buttons open nothing, the numbers are frozen seed figures.
 */
export function CampagneScreen() {
  const { id, campaignId } = useParams<{ id: string; campaignId: string }>()
  const { partners, campaigns } = useData()

  const partner = partners.find((p) => p.id === id) ?? null
  const campaign = campaigns.find((c) => c.id === campaignId) ?? null

  if (!partner) return <Navigate to="/sponsoring/partenaires" replace />
  if (!campaign) return <Navigate to={`/sponsoring/partenaires/${id}`} replace />

  const running = campaign.status === "en_cours"
  const totals = campaignTotals(campaign)

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton
        to={`/sponsoring/partenaires/${partner.id}`}
        label={`Retour à ${partner.name}`}
      />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {running ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-success/25 bg-success/10 px-2.5 py-0.5 font-ui text-[0.62rem] font-medium tracking-[0.06em] text-success uppercase">
                <span className="size-1.5 rounded-full bg-success" />
                En diffusion
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-accent px-2.5 py-0.5 font-ui text-[0.62rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                <Archive size={10} />
                Archivée
              </span>
            )}
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: campaign.color }}
            />
          </div>
          <h1 className="mt-2.5 font-ui text-2xl font-semibold text-ink">
            {campaign.name}
          </h1>
          <p className="mt-1.5 font-body text-sm text-ink-muted">
            {partner.name} · {campaign.slots.length} espaces publicitaires
          </p>
        </div>

        {running ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
            >
              <CalendarRange size={16} /> Modifier les dates
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <ImageIcon size={16} /> Remplacer les visuels
            </button>
          </div>
        ) : null}
      </div>

      {/* ── The band at the top: dates for a live one, numbers for an
             archive. Same slot on the page, different lead. ──────────── */}
      {running ? (
        <div className="mt-7 rounded-lg border border-border px-5 py-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <DateBlock label="Début" value={campaign.startDate} />
            <DateBlock label="Fin" value={campaign.endDate} align="right" />
          </div>
          <div className="mt-4 h-[6px] overflow-hidden rounded bg-accent">
            <div
              className="h-full rounded bg-info"
              style={{ width: `${campaign.progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-body text-[0.76rem]">
            <span className="text-ink-muted">{campaign.duration}</span>
            <span className="text-info tabular-nums">{campaign.remaining}</span>
          </div>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border px-5 py-[1.1rem]">
            <div className="font-body text-[0.8rem] text-ink">
              {campaign.startDate}
            </div>
            <div className="font-body text-[0.8rem] text-ink">
              → {campaign.endDate}
            </div>
            <div className="mt-2 font-ui text-[0.6rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
              {campaign.duration}
            </div>
          </div>
          <BigStat label="Vues totales" value={num(totals.views)} icon={Eye} />
          <BigStat
            label="Clics totaux"
            value={num(totals.clicks)}
            icon={MousePointerClick}
          />
          <BigStat label="CTR moyen" value={totals.ctr} />
        </div>
      )}

      {/* ── The six surfaces ──────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {campaign.slots.map((slot) => (
          <EmplacementCard
            key={slot.key}
            slotKey={slot.key}
            headerRight={
              running ? (
                <IconButton icon={Pencil} label="Modifier cet espace" />
              ) : (
                <span className="font-body text-[0.72rem] text-ink-disabled tabular-nums">
                  {num(slot.views)} vues
                </span>
              )
            }
            footer={
              running ? (
                <LinkRow link={slot.link} />
              ) : (
                <SlotStats
                  views={slot.views}
                  clicks={slot.clicks}
                  ctr={
                    slot.views
                      ? `${((slot.clicks / slot.views) * 100).toLocaleString("fr-FR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })} %`
                      : "—"
                  }
                  extra={extraFor(slot.key, campaign)}
                />
              )
            }
          >
            <SlotMock
              slot={slot}
              partnerName={partner.name}
              color={campaign.color}
              editable={running}
            />
          </EmplacementCard>
        ))}
      </div>
    </div>
  )
}

/** Booked/quota slots carry a unit line under their numbers. */
function extraFor(key: SlotKey, campaign: Campaign): string | undefined {
  const def = SLOT_BY_KEY[key]
  if (!def.unit) return undefined
  const qty = key === "match_detail" ? 20 : key === "splash" ? 6 : 6
  return `${qty} ${def.unit} · sur ${campaign.duration.split(" · ")[0]}`
}

/* ── Header pieces ──────────────────────────────────────────────────────── */
function DateBlock({
  label,
  value,
  align,
}: {
  label: string
  value: string
  align?: "right"
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className="font-ui text-[0.62rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold text-ink">
        {value}
      </div>
    </div>
  )
}

function BigStat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Eye
}) {
  return (
    <div className="rounded-lg border border-border px-5 py-[1.1rem]">
      <div className="font-display text-[1.9rem] leading-none font-semibold text-ink tabular-nums">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {Icon ? <Icon size={11} className="text-ink-disabled" /> : null}
        <span className="font-ui text-[0.6rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
          {label}
        </span>
      </div>
    </div>
  )
}

/* ── The creative, dropped into the right surface ───────────────────────── */
function SlotMock({
  slot,
  partnerName,
  color,
  editable,
}: {
  slot: CampaignSlot
  partnerName: string
  color: string
  editable: boolean
}) {
  /** Wrap a creative in its edit affordances only on a live campaign. */
  const wrap = (node: ReactNode) =>
    editable ? <EditableCreative>{node}</EditableCreative> : node

  const creative = (className: string, compact?: boolean) =>
    wrap(
      <Creative
        name={partnerName}
        headline={slot.headline}
        color={color}
        className={className}
        compact={compact}
      />,
    )

  switch (slot.key) {
    case "partners_page":
      return (
        <WebFrame title="ismartclub.tn — Nos partenaires">
          <AnnuaireMock slot={creative("size-full", true)} />
        </WebFrame>
      )

    case "calendar_banner":
      return (
        <PhoneFrame>
          <CalendarMock slot={creative("h-[54px]", true)} />
        </PhoneFrame>
      )

    case "home_feed":
      return (
        <PhoneFrame>
          <FeedMock slot={creative("h-[86px]")} />
        </PhoneFrame>
      )

    case "match_detail":
      return (
        <PhoneFrame>
          <MatchMock slot={creative("h-[52px]", true)} />
        </PhoneFrame>
      )

    case "splash":
      return (
        <PhoneFrame dark>
          <SplashMock slot={creative("h-[240px] w-full")} />
        </PhoneFrame>
      )

    case "notification":
      return (
        <PhoneFrame dark>
          <NotificationMock
            slot={wrap(
              <div className="rounded-xl border border-border-strong bg-surface px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-5 items-center justify-center rounded-[4px] font-ui text-[0.45rem] font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {partnerName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate font-ui text-[0.6rem] font-medium text-ink">
                    {partnerName}
                  </span>
                  <span className="ml-auto font-body text-[0.5rem] text-ink-disabled">
                    maintenant
                  </span>
                </div>
                <p className="mt-1.5 font-body text-[0.6rem] leading-snug text-ink-subtle">
                  {slot.headline}
                </p>
              </div>,
            )}
          />
        </PhoneFrame>
      )

    default:
      return <Line />
  }
}
