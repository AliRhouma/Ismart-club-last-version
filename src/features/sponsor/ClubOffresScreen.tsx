import { useParams } from "react-router-dom"
import { MapPin, Users, Check } from "lucide-react"

import {
  CLUB_LISTINGS,
  CLUB_OFFERS,
  TIER_COLOR,
  type ClubOffer,
} from "@/features/sponsor/mock"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Avatar } from "@/components/kit/Avatar"
import { TierBadge } from "@/features/sponsoring/ui"

/**
 * Sponsor space — a club's public offers page. Reached from the explorer or
 * from a partnership card.
 *
 * Static UI pass: the offers are the same literal list for every club, and
 * "Demander cette offre" is a visual affordance (the request flow is not built).
 */
export function ClubOffresScreen() {
  const { slug } = useParams()
  const club =
    CLUB_LISTINGS.find((c) => c.slug === slug) ?? CLUB_LISTINGS[0]

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/sponsor/explorer" label="Retour à l'exploration" />

      {/* Club header */}
      <div className="flex items-start gap-4 rounded-xl border border-border px-5 py-5">
        <Avatar name={club.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-ui text-xl font-semibold text-ink">
            {club.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[0.78rem] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-ink-disabled" />
              {club.city}
            </span>
            <span className="text-border-strong">·</span>
            <span>{club.sport}</span>
            <span className="text-border-strong">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} className="text-ink-disabled" />
              {club.members}
            </span>
          </div>
        </div>
      </div>

      <PageHeader
        className="mt-8"
        title="Offres de sponsoring"
        subtitle="Les formules proposées par ce club et les espaces qu'elles donnent."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {CLUB_OFFERS.map((offer) => (
          <OfferCard key={offer.tier} offer={offer} />
        ))}
      </div>
    </div>
  )
}

function OfferCard({ offer }: { offer: ClubOffer }) {
  return (
    <div className="flex flex-col rounded-lg border border-border transition-colors hover:border-border-strong">
      <div className="px-4 pt-4">
        <TierBadge name={offer.tier} color={TIER_COLOR[offer.tier]} />
      </div>

      <div className="px-4 pt-3.5">
        <div className="font-display text-2xl font-semibold text-ink tabular-nums">
          {offer.price}
          <span className="ml-1 font-body text-[0.72rem] font-normal text-ink-disabled">
            / saison
          </span>
        </div>
        <div className="mt-1 font-body text-[0.74rem] text-ink-muted">
          {offer.seats}
        </div>
      </div>

      <p className="mt-3 px-4 font-body text-[0.78rem] leading-relaxed text-ink-muted">
        {offer.description}
      </p>

      {/* Included ad spaces */}
      <div className="mt-4 flex flex-1 flex-col gap-2 border-t border-border px-4 pt-3.5">
        <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          Espaces inclus
        </span>
        {offer.includes.map((item) => (
          <span
            key={item}
            className="flex items-start gap-2 font-body text-[0.78rem] text-ink-subtle"
          >
            <Check size={13} className="mt-0.5 shrink-0 text-info" />
            {item}
          </span>
        ))}
      </div>

      <div className="mt-4 px-4 pb-4">
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input px-3 py-2 font-ui text-[0.82rem] font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
        >
          Demander cette offre
        </button>
      </div>
    </div>
  )
}
