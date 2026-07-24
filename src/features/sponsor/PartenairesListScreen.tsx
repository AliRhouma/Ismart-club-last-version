import { Link, useNavigate } from "react-router-dom"
import { Search, CalendarClock, Wallet, ChevronRight, Megaphone } from "lucide-react"

import { PARTNERSHIPS, TIER_COLOR, type Partnership } from "@/features/sponsor/mock"
import { PageHeader } from "@/components/kit/PageHeader"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { Stat } from "@/features/budget/ui"
import { TierBadge } from "@/features/sponsoring/ui"

/**
 * Sponsor space — "Liste des partenaires": the clubs this sponsor backs, the
 * tier it holds at each, when the deal expires and what it costs.
 *
 * Static UI pass — every value is literal display text from features/sponsor/mock;
 * nothing is computed and nothing is stored.
 */
export function PartenairesListScreen() {
  return (
    <>
      <PageHeader
        title="Liste des partenaires"
        subtitle="Les clubs que vous sponsorisez, votre formule et son échéance."
        actions={
          <Link
            to="/sponsor/explorer"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
          >
            <Search size={16} /> Trouver un partenaire
          </Link>
        }
      />

      {/* Summary strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Clubs partenaires" value="4" />
        <Stat label="Total engagé" value="41 200 DT" />
        <Stat label="Prochaine échéance" value="15 mars" />
      </div>

      {/* Partnerships */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PARTNERSHIPS.map((p) => (
          <PartnershipCard key={p.id} partnership={p} />
        ))}
      </div>
    </>
  )
}

function PartnershipCard({ partnership: p }: { partnership: Partnership }) {
  const navigate = useNavigate()
  const tone =
    p.status === "Actif"
      ? "success"
      : p.status === "Expire bientôt"
        ? "warning"
        : "danger"

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/sponsor/campagnes?club=${p.slug}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          navigate(`/sponsor/campagnes?club=${p.slug}`)
        }
      }}
      className="group flex cursor-pointer flex-col rounded-lg border border-border transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600/50"
    >
      {/* Club identity */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <Avatar name={p.club} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-[0.9rem] text-ink">
            {p.club}
          </div>
          <div className="truncate font-body text-[0.74rem] text-ink-disabled">
            {p.city}
          </div>
        </div>
        <Badge variant={tone} dot>
          {p.status}
        </Badge>
      </div>

      {/* Tier */}
      <div className="px-4 pt-3.5">
        <TierBadge name={p.tier} color={TIER_COLOR[p.tier]} />
      </div>

      {/* Facts */}
      <div className="mt-4 flex flex-col gap-2.5 px-4">
        <Row icon={CalendarClock} label="Expire le" value={p.expires} />
        <Row icon={Wallet} label="Montant" value={p.price} />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="inline-flex items-center gap-1.5 font-ui text-[0.8rem] font-medium text-ink-muted transition-colors group-hover:text-brand-blue-600">
          <Megaphone size={14} />
          Voir les campagnes
        </span>
        <Link
          to={`/sponsor/explorer/${p.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-ui text-[0.78rem] font-medium text-ink-subtle transition-colors hover:bg-accent hover:text-ink"
        >
          Offres du club
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 font-body text-[0.78rem] text-ink-muted">
        <Icon size={14} className="text-ink-disabled" />
        {label}
      </span>
      <span className="font-body text-[0.82rem] text-ink-subtle tabular-nums">
        {value}
      </span>
    </div>
  )
}
