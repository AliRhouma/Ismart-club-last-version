import { Link } from "react-router-dom"
import { Search, MapPin, Users, ChevronRight } from "lucide-react"

import { CLUB_LISTINGS, type ClubListing } from "@/features/sponsor/mock"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Avatar } from "@/components/kit/Avatar"

/**
 * Sponsor space — "Trouver un partenaire": browse the clubs open to sponsoring.
 * Static UI pass; the search field is a visual affordance only (no filtering).
 */
export function ExplorerScreen() {
  return (
    <>
      <BackButton to="/sponsor/partenaires" label="Retour à mes partenaires" />
      <PageHeader
        title="Trouver un partenaire"
        subtitle="Les clubs ouverts au sponsoring. Ouvrez une fiche pour voir ses offres."
      />

      {/* Search — visual only in this static pass. */}
      <div className="mt-6 max-w-sm">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-disabled"
          />
          <input
            placeholder="Rechercher un club, une ville…"
            className="w-full rounded-md border border-input bg-transparent py-2 pr-3 pl-9 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CLUB_LISTINGS.map((club) => (
          <ClubCard key={club.slug} club={club} />
        ))}
      </div>
    </>
  )
}

function ClubCard({ club }: { club: ClubListing }) {
  return (
    <Link
      to={`/sponsor/explorer/${club.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong"
    >
      {/* Fluid fill — the navigable-card reveal from the design system. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <div className="relative z-10 flex flex-col px-4 py-4">
        <div className="flex items-start gap-3">
          <Avatar name={club.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-body text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
              {club.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-body text-[0.74rem] text-ink-disabled">
              <MapPin size={12} />
              {club.city}
              <span className="text-border-strong">·</span>
              {club.sport}
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-3 font-body text-[0.74rem] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} className="text-ink-disabled" />
            {club.members}
          </span>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3">
          <div className="flex flex-col">
            <span className="font-body text-[0.78rem] text-ink-subtle">
              {club.offers}
            </span>
            <span className="font-body text-[0.7rem] text-ink-disabled">
              {club.from}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-ui text-[0.76rem] font-medium text-info">
            Voir les offres
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}
