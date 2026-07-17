/**
 * Sponsor space — static display data.
 *
 * Deliberately NOT in the store and NOT computed: these screens are a static UI
 * pass (no logic, no derived values). Everything below is literal display text.
 */

/** Tier colours, mirroring the club-side offer palette. */
export const TIER_COLOR = {
  Or: "#E0A82E",
  Argent: "#9AA4B2",
  Bronze: "#C17A3F",
} as const

export type Tier = keyof typeof TIER_COLOR

export type Partnership = {
  id: string
  /** Slug of the club's page in the explorer. */
  slug: string
  club: string
  city: string
  tier: Tier
  /** Literal display date. */
  expires: string
  /** Literal display amount. */
  price: string
  status: "Actif" | "Expire bientôt" | "Expiré"
}

/** The clubs this sponsor already partners with — varied on purpose. */
export const PARTNERSHIPS: Partnership[] = [
  {
    id: "p-ismart",
    slug: "ismart-club",
    club: "iSmart Club Tunis",
    city: "Tunis",
    tier: "Or",
    expires: "30 juin 2026",
    price: "15 000 DT",
    status: "Actif",
  },
  {
    id: "p-sahel",
    slug: "etoile-sahel",
    club: "Étoile Sportive du Sahel",
    city: "Sousse",
    tier: "Or",
    expires: "31 août 2026",
    price: "15 000 DT",
    status: "Actif",
  },
  {
    id: "p-marsa",
    slug: "as-marsa",
    club: "AS La Marsa",
    city: "La Marsa",
    tier: "Argent",
    expires: "30 juin 2026",
    price: "5 000 DT",
    status: "Actif",
  },
  {
    id: "p-bizerte",
    slug: "ca-bizertin",
    club: "Club Athlétique Bizertin",
    city: "Bizerte",
    tier: "Bronze",
    expires: "15 mars 2026",
    price: "1 200 DT",
    status: "Expire bientôt",
  },
  {
    id: "p-stade",
    slug: "stade-tunisien",
    club: "Stade Tunisien",
    city: "Le Bardo",
    tier: "Argent",
    expires: "30 juin 2025",
    price: "5 000 DT",
    status: "Expiré",
  },
]

export type ClubListing = {
  slug: string
  name: string
  city: string
  sport: string
  members: string
  offers: string
  /** Cheapest entry point, as display text. */
  from: string
}

/** Clubs open to sponsoring — the "Trouver un partenaire" explorer. */
export const CLUB_LISTINGS: ClubListing[] = [
  {
    slug: "club-africain",
    name: "Club Africain",
    city: "Tunis",
    sport: "Football",
    members: "1 200 membres",
    offers: "3 offres",
    from: "à partir de 1 200 DT",
  },
  {
    slug: "esperance-tunis",
    name: "Espérance Sportive de Tunis",
    city: "Tunis",
    sport: "Football",
    members: "2 400 membres",
    offers: "3 offres",
    from: "à partir de 2 000 DT",
  },
  {
    slug: "us-monastir",
    name: "US Monastir",
    city: "Monastir",
    sport: "Basketball",
    members: "640 membres",
    offers: "2 offres",
    from: "à partir de 900 DT",
  },
  {
    slug: "cs-sfaxien",
    name: "Club Sportif Sfaxien",
    city: "Sfax",
    sport: "Football",
    members: "980 membres",
    offers: "3 offres",
    from: "à partir de 1 500 DT",
  },
  {
    slug: "ismart-club",
    name: "iSmart Club Tunis",
    city: "Tunis",
    sport: "Football",
    members: "540 membres",
    offers: "3 offres",
    from: "à partir de 1 200 DT",
  },
  {
    slug: "etoile-sahel",
    name: "Étoile Sportive du Sahel",
    city: "Sousse",
    sport: "Football",
    members: "1 800 membres",
    offers: "3 offres",
    from: "à partir de 1 400 DT",
  },
]

export type ClubOffer = {
  tier: Tier
  price: string
  seats: string
  description: string
  /** Ad spaces the offer includes — literal labels. */
  includes: string[]
}

/**
 * A club's public offers. Static and the same for every club page: this pass is
 * about the UI, not per-club data.
 */
export const CLUB_OFFERS: ClubOffer[] = [
  {
    tier: "Or",
    price: "15 000 DT",
    seats: "4 places · 2 restantes",
    description:
      "Partenaire principal du club, visibilité maximale sur toutes les pages.",
    includes: [
      "Page partenaires",
      "Bannière calendrier",
      "Fil d'accueil",
      "Page de match · 20 matchs",
      "Écran d'ouverture · 6 jours",
      "Notification push · 6 envois",
    ],
  },
  {
    tier: "Argent",
    price: "5 000 DT",
    seats: "6 places · 3 restantes",
    description:
      "Bonne visibilité sur le calendrier et le fil d'actualité du club.",
    includes: [
      "Page partenaires",
      "Bannière calendrier",
      "Fil d'accueil",
      "Page de match · 8 matchs",
      "Notification push · 2 envois",
    ],
  },
  {
    tier: "Bronze",
    price: "1 200 DT",
    seats: "12 places · 9 restantes",
    description:
      "Présence dans l'annuaire du club et sur la bannière du calendrier.",
    includes: ["Page partenaires", "Bannière calendrier"],
  },
]
