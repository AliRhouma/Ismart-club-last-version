import { Link, useParams } from "react-router-dom"
import { MapPin, Users, Check, ChevronRight } from "lucide-react"

import {
  CLUB_LISTINGS,
  CLUB_OFFERS,
  type ClubOffer,
} from "@/features/sponsor/mock"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Avatar } from "@/components/kit/Avatar"

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

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CLUB_OFFERS.map((offer) => (
          <OfferCard key={offer.tier} offer={offer} />
        ))}

        {/* Custom offer — same card shape, compose your own package. */}
        <CustomOfferCard slug={club.slug} />
      </div>
    </div>
  )
}

function OfferCard({ offer }: { offer: ClubOffer }) {
  return (
    <div className="flex flex-col rounded-lg border border-border transition-colors hover:border-border-strong">
      <div className="px-4 pt-4">
        <h3 className="font-ui text-base font-medium text-ink">{offer.name}</h3>
      </div>

      <div className="px-4 pt-3">
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

      {/* Included bannières publicitaires */}
      <div className="mt-4 flex flex-1 flex-col gap-2 border-t border-border px-4 pt-3.5">
        <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          Bannières incluses
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

/** The "sur mesure" option, drawn as a fourth offer card so it sits inline with
 *  the fixed packs instead of a separate banner. */
function CustomOfferCard({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-border transition-colors hover:border-border-strong">
      <div className="px-4 pt-4">
        <h3 className="font-ui text-base font-medium text-ink">Sur mesure</h3>
      </div>

      <div className="px-4 pt-3">
        <div className="font-display text-2xl font-semibold text-ink">
          Sur devis
        </div>
        <div className="mt-1 font-body text-[0.74rem] text-ink-muted">
          Tarif fixé par le club
        </div>
      </div>

      <p className="mt-3 px-4 font-body text-[0.78rem] leading-relaxed text-ink-muted">
        Aucune formule ne vous convient ? Composez votre propre pack.
      </p>

      {/* What you compose yourself */}
      <div className="mt-4 flex flex-1 flex-col gap-2 border-t border-border px-4 pt-3.5">
        <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          À composer
        </span>
        {[
          "Vos bannières et leur visibilité",
          "Votre fréquence de notifications",
          "Votre ciblage par audience",
        ].map((item) => (
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
        <Link
          to={`/sponsor/explorer/${slug}/sur-mesure`}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 font-ui text-[0.82rem] font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
        >
          Demander une offre sur mesure
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  )
}
