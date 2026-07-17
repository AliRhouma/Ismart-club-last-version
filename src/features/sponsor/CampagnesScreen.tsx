import { Link } from "react-router-dom"
import { Megaphone, Plus, ChevronRight, Layers, Target } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { TierBadge } from "@/features/sponsoring/ui"
import { TIER_COLOR } from "@/features/sponsor/mock"
import {
  SPONSOR_CAMPAIGNS,
  type SponsorCampaign,
} from "@/features/sponsor/campagneMock"

/**
 * Sponsor space — "Gérer les campagnes". The company's own campaign list, and
 * the entry point of the creation flow (club → période → objectif → visuels).
 *
 * Static UI pass: the cards are seed data and creating a campaign walks the
 * wizard without persisting anything.
 */
export function CampagnesScreen() {
  const campaigns = SPONSOR_CAMPAIGNS

  return (
    <>
      <PageHeader
        title="Gérer les campagnes"
        subtitle="Vos visuels et leur diffusion dans les espaces publicitaires du club."
        actions={
          <Link
            to="/sponsor/campagnes/nouvelle"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
          >
            <Plus size={16} /> Nouvelle campagne
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne"
            description="Une fois qu'un club vous attribue une offre, vous pourrez créer vos campagnes et suivre leurs vues et leurs clics ici."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </>
  )
}

function CampaignCard({ campaign }: { campaign: SponsorCampaign }) {
  return (
    <Link
      to={`/sponsor/campagnes/${campaign.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong"
    >
      {/* Fluid fill — the navigable-card reveal from the design system. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {/* The campaign's creative colour, as its identity chip. */}
            <span
              className="mt-0.5 size-9 shrink-0 rounded-md"
              style={{ backgroundColor: campaign.color, opacity: 0.85 }}
            />
            <div className="min-w-0">
              <div className="truncate font-body text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
                {campaign.name}
              </div>
              <div className="mt-0.5 truncate font-body text-[0.74rem] text-ink-disabled">
                {campaign.club}
              </div>
            </div>
          </div>
          <StatusPill status={campaign.status} />
        </div>

        <div className="mt-3.5 flex flex-col gap-1.5 font-body text-[0.74rem] text-ink-muted">
          <span>{campaign.period}</span>
          <span className="inline-flex items-center gap-1.5">
            <Target size={12} className="text-ink-disabled" />
            {campaign.objectif}
          </span>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2.5">
            <TierBadge
              name={campaign.tier}
              color={TIER_COLOR[campaign.tier]}
              size="sm"
            />
            <span className="inline-flex items-center gap-1.5 font-body text-[0.72rem] text-ink-disabled">
              <Layers size={12} />
              {campaign.filled}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-ui text-[0.76rem] font-medium text-info">
            Ouvrir
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Real status → semantic colour; anything else stays neutral. */
function StatusPill({ status }: { status: SponsorCampaign["status"] }) {
  const live = status === "En diffusion"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] uppercase",
        live
          ? "border-success/25 bg-success/10 text-success"
          : status === "Programmée"
            ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
            : "border-border bg-accent text-ink-muted",
      )}
    >
      {live ? <span className="size-1.5 rounded-full bg-success" /> : null}
      {status}
    </span>
  )
}
