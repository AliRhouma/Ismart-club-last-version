import { useEffect, useState } from "react"
import { Navigate, useLocation, useParams } from "react-router-dom"
import {
  Eye,
  FileDown,
  Images,
  MousePointerClick,
  Pencil,
  SlidersHorizontal,
  Target,
} from "lucide-react"

import {
  audienceSummary,
  campaignTotals,
  creativeLabel,
  num,
  SLOT_BY_KEY,
  slotCreatives,
  type Campaign,
  type CampaignSlot,
  type SlotCreative,
  type SlotKey,
} from "@/data/seed/sponsoring"
import { useData } from "@/data/useData"
import { BackButton } from "@/components/kit/BackButton"
import { EmplacementCard } from "@/features/sponsoring/emplacementMocks"
import { cn } from "@/lib/utils"
import { SurfacePair } from "@/features/sponsoring/appSurfaces"
import {
  IconButton,
  LinkRow,
  SlotStats,
} from "@/features/sponsoring/campaignUi"
import { Toast } from "@/features/sponsoring/ui"
import { CampagneConfigModal } from "@/features/sponsoring/CampagneConfigModal"
import { EmplacementModal } from "@/features/sponsoring/EmplacementModal"
import { exportCampaignKpisPdf } from "@/features/sponsoring/campaignPdf"

/**
 * Screen — one campaign, in the same six-surface layout as "Espaces
 * publicitaires", but filled with the sponsor's creatives.
 *
 * Two variants of one page, because they answer two different questions:
 *   • en cours  → "what is being shown, and can I change it?" → the période
 *     leads, then the figures it has already made; the pen on a card opens that
 *     ONE space (its visuels et son lien), never the whole configuration.
 *   • archivée  → "what did it do?" → the totals lead.
 *
 * Both report vues / clics / CTR, in the header and space by space, and both
 * export the same bilan PDF. The figures are frozen seed values — nothing is
 * counted here.
 */
export function CampagneScreen() {
  const { id, campaignId } = useParams<{ id: string; campaignId: string }>()
  const { partners, campaigns } = useData()

  // Landing here straight after "Créer la campagne" carries its confirmation.
  const { state } = useLocation() as { state: { toast?: string } | null }
  const [toast, setToast] = useState<string | null>(state?.toast ?? null)
  const [editing, setEditing] = useState(false)
  /** The one ad space the pen opened, if any. */
  const [editingSlot, setEditingSlot] = useState<SlotKey | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

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
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: campaign.color }}
            />
            <h1 className="font-ui text-2xl font-semibold text-ink">
              {campaign.name}
            </h1>
          </div>
          <p className="mt-1.5 font-body text-sm text-ink-muted">
            {partner.name} · {campaign.slots.length} espaces publicitaires ·{" "}
            <span className="text-ink">
              {campaign.price !== null
                ? `${campaign.price.toLocaleString("fr-FR")} DT`
                : "Échange / institutionnel"}
            </span>
          </p>
        </div>

        {/* On an archive the numbers are the whole point, so exporting them
            takes the primary slot and the config drops to secondary. */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={
              running
                ? "inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
                : "inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
            }
          >
            <SlidersHorizontal size={16} /> Modifier la configuration
          </button>
          <button
            type="button"
            onClick={() => {
              const file = exportCampaignKpisPdf(campaign, partner.name)
              setToast(`Rapport exporté — ${file}`)
            }}
            className={
              running
                ? "inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
                : "inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            }
          >
            <FileDown size={16} /> Exporter le rapport (PDF)
          </button>
        </div>
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
      ) : null}

      {/* ── What it has made so far / what it made in the end ─────────── */}
      {running ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BigStat label="Vues" value={num(totals.views)} icon={Eye} />
          <BigStat
            label="Clics"
            value={num(totals.clicks)}
            icon={MousePointerClick}
          />
          <BigStat label="CTR moyen" value={totals.ctr} />
        </div>
      ) : null}

      {running && totals.views === 0 ? (
        <p className="mt-2 font-body text-[0.76rem] text-ink-disabled">
          Aucune diffusion mesurée pour l'instant — les chiffres apparaîtront
          dès que la campagne aura tourné.
        </p>
      ) : null}

      {!running ? (
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
      ) : null}

      {/* ── Ciblage — only when the campaign was given one ─────────────── */}
      {campaign.audience?.enabled ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-border px-4 py-3">
          <Target size={14} className="shrink-0 text-ink-disabled" />
          <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            Ciblage
          </span>
          <span className="font-body text-[0.84rem] text-ink">
            {audienceSummary(campaign.audience)}
          </span>
          {campaign.audience.address ? (
            <span className="font-body text-[0.76rem] text-ink-disabled">
              · {campaign.audience.address}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* ── The surfaces the campaign occupies ────────────────────────── */}
      <div className="mt-8 flex flex-col gap-6">
        {campaign.slots.map((slot) => (
          <SlotCard
            key={slot.key}
            campaign={campaign}
            slot={slot}
            partnerName={partner.name}
            running={running}
            onEdit={() => setEditingSlot(slot.key)}
          />
        ))}
      </div>

      {editing ? (
        <CampagneConfigModal
          campaign={campaign}
          partnerName={partner.name}
          onClose={() => setEditing(false)}
          onSaved={setToast}
        />
      ) : null}

      {editingSlot ? (
        <EmplacementModal
          campaign={campaign}
          slotKey={editingSlot}
          partnerName={partner.name}
          onClose={() => setEditingSlot(null)}
          onSaved={setToast}
        />
      ) : null}

      {toast ? <Toast msg={toast} /> : null}
    </div>
  )
}

/**
 * One ad space on the campaign page.
 *
 * A space rarely runs the same visual from start to finish — the club swaps it
 * mid-campaign. So when several creatives have occupied it, the card carries a
 * switcher: "Total" plus one entry per visual, each with the window it ran in
 * and the figures IT made. Picking one also re-draws the mocks with what that
 * creative actually carried, missing artwork included.
 */
function SlotCard({
  campaign,
  slot,
  partnerName,
  running,
  onEdit,
}: {
  campaign: Campaign
  slot: CampaignSlot
  partnerName: string
  running: boolean
  onEdit: () => void
}) {
  const creatives = slotCreatives(slot, campaign)
  const several = creatives.length > 1
  /** null = the whole space; otherwise the index of the creative shown. */
  const [shown, setShown] = useState<number | null>(null)
  const current = shown === null ? null : creatives[shown]

  const figures = current ?? slot
  const isMessage = SLOT_BY_KEY[slot.key].medium === "message"

  return (
    <EmplacementCard
      slotKey={slot.key}
      badge={
        several ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-info/25 bg-info/10 px-2 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] text-info uppercase">
            <Images size={10} />
            {creatives.length} visuels
          </span>
        ) : null
      }
      headerRight={
        running ? (
          <IconButton
            icon={Pencil}
            label={`Modifier ${SLOT_BY_KEY[slot.key].label}`}
            onClick={onEdit}
          />
        ) : (
          <span className="font-body text-[0.72rem] text-ink-disabled tabular-nums">
            {num(slot.views)} vues
          </span>
        )
      }
      footer={
        <div className="flex flex-col gap-2.5">
          {running ? (
            /* Always the live destination: the pen edits what is on air, not
               a creative that has already stopped. */
            <LinkRow link={slot.link} onEdit={onEdit} />
          ) : null}

          {several ? (
            <CreativeSwitcher
              creatives={creatives}
              shown={shown}
              onShow={setShown}
            />
          ) : null}

          <SlotStats
            views={figures.views}
            clicks={figures.clicks}
            ctr={ctrOf(figures.views, figures.clicks)}
            extra={
              current
                ? `${creativeLabel(shown!)} · ${current.from} → ${current.to || "en cours"}`
                : extraFor(slot.key, campaign)
            }
          />
        </div>
      }
    >
      <SurfacePair
        slotKey={slot.key}
        ad={{
          sponsor: partnerName,
          color: campaign.color,
          headline: current?.headline ?? slot.headline,
        }}
        placed={
          isMessage
            ? { web: true, mobile: true }
            : {
                web: Boolean(current ? current.webImage : slot.webImage),
                mobile: Boolean(current ? current.mobileImage : slot.mobileImage),
              }
        }
      />
    </EmplacementCard>
  )
}

/** Total, then one tab per creative — the club compares, it doesn't average. */
function CreativeSwitcher({
  creatives,
  shown,
  onShow,
}: {
  creatives: SlotCreative[]
  shown: number | null
  onShow: (index: number | null) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface-nested px-2 py-2">
      <span className="mr-1 font-ui text-[0.62rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        Visuels diffusés
      </span>
      <Tab label="Total" active={shown === null} onClick={() => onShow(null)} />
      {creatives.map((c, i) => (
        <Tab
          key={c.id}
          label={creativeLabel(i)}
          hint={c.to ? `${c.from} → ${c.to}` : `depuis le ${c.from}`}
          live={!c.to}
          active={shown === i}
          onClick={() => onShow(i)}
        />
      ))}
    </div>
  )
}

function Tab({
  label,
  hint,
  live,
  active,
  onClick,
}: {
  label: string
  hint?: string
  live?: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-ui text-[0.72rem] font-medium transition-colors",
        active
          ? "bg-info text-ink-inverted"
          : "text-ink-muted hover:bg-surface-hover hover:text-ink",
      )}
    >
      {label}
      {live ? (
        <span
          className={cn(
            "size-1.5 rounded-full",
            active ? "bg-ink-inverted" : "bg-success",
          )}
        />
      ) : null}
    </button>
  )
}

/** One space's CTR, formatted like the header's. */
function ctrOf(views: number, clicks: number): string {
  if (!views) return "—"
  return `${((clicks / views) * 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`
}

/** Booked/quota slots carry a unit line under their numbers. */
function extraFor(key: SlotKey, campaign: Campaign): string | undefined {
  const def = SLOT_BY_KEY[key]
  if (!def.unit) return undefined
  const qty = key === "match_detail" ? 20 : 6
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
