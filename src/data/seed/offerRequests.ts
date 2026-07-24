/**
 * Custom sponsoring requests — data slice.
 *
 * A sponsor browsing a club's public offers (features/sponsor) can, instead of
 * buying a ready-made tier, ask for an "offre sur mesure": it composes exactly
 * the visibility it wants (which banners and at what share, how many push
 * notifications and messagerie messages a day, who to target) and sends the
 * request to the club. The club admin sees it in Sponsoring ▸ Demandes with the
 * sender's contact info, then accepts it — setting a price — or refuses it.
 *
 * The prototype does no real logic: percentages and rhythms are the sponsor's
 * ask (display data), never enforced, and the price is typed in by the admin.
 */

import { OFFER_SPACES, type SpaceKey } from "@/data/seed/sponsoring"

/* ── Ciblage ────────────────────────────────────────────────────────────── */

/** Who the ads reach inside the club app. */
export type AdAudience = "tous" | "parents" | "joueurs"

export const AUDIENCE_LABEL: Record<AdAudience, string> = {
  tous: "Tous les utilisateurs",
  parents: "Parents",
  joueurs: "Joueurs",
}

/**
 * The age groups a sponsor can target its ads to. A deliberately short, fixed
 * list (not the club's full Pôle-Technique catalogue): advertising is sold by
 * broad age bracket, not by internal team category.
 */
export const AD_CATEGORIES = ["U12", "U14", "U16", "U18", "Senior"] as const

/* ── Bannières ──────────────────────────────────────────────────────────── */

/**
 * The banner-style ad spaces a sponsor can pick, each with a target visibility
 * share. Mirrors the `share` spaces of the offer catalogue (calendar, match
 * list, match pages, séance pages) so the two stay in sync — notifications and
 * messagerie are handled apart, as per-day rhythms.
 */
export const BANNER_SPACES = OFFER_SPACES.filter((s) => s.kind === "share")

/** One selected banner and the visibility share the sponsor is asking for. */
export type RequestBanner = {
  key: SpaceKey
  /** Target visibility share, in %, as requested by the sponsor. */
  pct: number
}

/* ── Request ────────────────────────────────────────────────────────────── */

export type RequestStatus =
  | "en_attente"
  /** Admin accepted and set a price. */
  | "acceptee"
  /** Admin refused, with a justification. */
  | "refusee"
  /** Admin edited the config + price and sent a counter-proposal back. */
  | "contre_proposee"

export type OfferRequest = {
  id: string
  /** The club this request targets (slug + display name from the explorer). */
  clubSlug: string
  clubName: string

  /* Sender — the contact the admin gets back to. */
  company: string
  contact: string
  email: string
  phone: string
  sector: string

  /* Configuration */
  /** Requested run length, in months. */
  durationMonths: number
  /** Selected banners + their requested share. */
  banners: RequestBanner[]
  /** Push notifications per day. */
  notificationsPerDay: number
  /** Messagerie messages per day. */
  messagesPerDay: number
  audience: AdAudience
  /** Category names the sponsor wants the ads shown to (empty = all). */
  categories: string[]
  /** Free note to the club. */
  message: string

  /* Lifecycle */
  status: RequestStatus
  /** Price the admin sets on acceptance / counter-proposal, in DT — null until decided. */
  price: number | null
  /**
   * The admin's message to the sponsor: the justification for a refusal, or the
   * note explaining a counter-proposal. Empty while the request is pending.
   */
  decisionNote: string
  /** dd/mm/yyyy display date the request was sent. */
  createdAt: string
}

/** A blank request draft, pre-filled with the sender's known contact. */
export function blankRequest(
  club: { slug: string; name: string },
  contact: Partial<Pick<OfferRequest, "company" | "contact" | "email" | "sector">>,
): Omit<OfferRequest, "id" | "status" | "price" | "decisionNote" | "createdAt"> {
  return {
    clubSlug: club.slug,
    clubName: club.name,
    company: contact.company ?? "",
    contact: contact.contact ?? "",
    email: contact.email ?? "",
    phone: "",
    sector: contact.sector ?? "",
    durationMonths: 3,
    banners: [{ key: "calendar", pct: 15 }],
    notificationsPerDay: 1,
    messagesPerDay: 1,
    audience: "tous",
    categories: [],
    message: "",
  }
}

/** "3 mois" · "1 mois" · "Saison (10 mois)" for the round-season case. */
export function durationLabel(months: number): string {
  if (months >= 10) return `Saison · ${months} mois`
  return `${months} mois`
}

/**
 * Seed — two pending requests waiting on the admin, plus one already accepted,
 * so the Demandes page shows both the action and the resolved state. Varied on
 * purpose: a big telecom asking for heavy notifications, a local shop asking for
 * a modest calendar banner, and a bank whose deal is already priced.
 */
export const offerRequestsSeed: OfferRequest[] = [
  {
    id: "req-ooredoo",
    clubSlug: "ismart-club",
    clubName: "iSmart Club Tunis",
    company: "Ooredoo Tunisie",
    contact: "Karim Mansouri",
    email: "k.mansouri@ooredoo.tn",
    phone: "+216 71 123 456",
    sector: "Télécom",
    durationMonths: 6,
    banners: [
      { key: "calendar", pct: 25 },
      { key: "match_list", pct: 20 },
      { key: "match_detail", pct: 30 },
    ],
    notificationsPerDay: 3,
    messagesPerDay: 2,
    audience: "tous",
    categories: ["U16", "U18", "Senior"],
    message:
      "Lancement du forfait Jeunes. Nous visons une présence forte pendant les matchs des grandes catégories.",
    status: "en_attente",
    price: null,
    decisionNote: "",
    createdAt: "22/07/2026",
  },
  {
    id: "req-pharmacie",
    clubSlug: "ismart-club",
    clubName: "iSmart Club Tunis",
    company: "Pharmacie Centrale El Menzah",
    contact: "Dr. Hichem Aouij",
    email: "contact@pharmacie-elmenzah.tn",
    phone: "+216 71 555 220",
    sector: "Santé",
    durationMonths: 3,
    banners: [{ key: "calendar", pct: 10 }],
    notificationsPerDay: 0,
    messagesPerDay: 0,
    audience: "parents",
    categories: ["U12", "U14"],
    message: "Simple présence sur le calendrier des familles, sans notifications.",
    status: "en_attente",
    price: null,
    decisionNote: "",
    createdAt: "20/07/2026",
  },
  {
    id: "req-biat",
    clubSlug: "ismart-club",
    clubName: "iSmart Club Tunis",
    company: "BIAT",
    contact: "Amine Trabelsi",
    email: "amine.trabelsi@biat.com.tn",
    phone: "+216 71 340 733",
    sector: "Banque",
    durationMonths: 10,
    banners: [
      { key: "calendar", pct: 20 },
      { key: "session_detail", pct: 15 },
    ],
    notificationsPerDay: 1,
    messagesPerDay: 1,
    audience: "tous",
    categories: [],
    message: "Partenariat annuel institutionnel, visibilité calendaire discrète.",
    status: "acceptee",
    price: 8000,
    decisionNote: "",
    createdAt: "05/07/2026",
  },

  /* ── Délice Danone — the signed-in sponsor's own requests, one per state,
        so /sponsor/demandes shows the full lifecycle out of the box. ──────── */
  {
    id: "req-delice-sfaxien",
    clubSlug: "cs-sfaxien",
    clubName: "Club Sportif Sfaxien",
    company: "Délice Danone",
    contact: "Sonia Belhaj",
    email: "s.belhaj@delice.tn",
    phone: "+216 71 802 000",
    sector: "Agroalimentaire",
    durationMonths: 6,
    banners: [
      { key: "calendar", pct: 20 },
      { key: "match_detail", pct: 25 },
    ],
    notificationsPerDay: 2,
    messagesPerDay: 1,
    audience: "tous",
    categories: ["U14", "U16"],
    message: "Campagne Délice Juniors — visibilité sur les matchs des jeunes.",
    status: "en_attente",
    price: null,
    decisionNote: "",
    createdAt: "23/07/2026",
  },
  {
    id: "req-delice-africain",
    clubSlug: "club-africain",
    clubName: "Club Africain",
    company: "Délice Danone",
    contact: "Sonia Belhaj",
    email: "s.belhaj@delice.tn",
    phone: "+216 71 802 000",
    sector: "Agroalimentaire",
    durationMonths: 10,
    banners: [
      { key: "calendar", pct: 25 },
      { key: "match_list", pct: 15 },
    ],
    notificationsPerDay: 2,
    messagesPerDay: 1,
    audience: "tous",
    categories: [],
    message: "Partenariat saison, présence régulière sur le calendrier.",
    status: "acceptee",
    price: 6500,
    decisionNote: "",
    createdAt: "18/07/2026",
  },
  {
    id: "req-delice-esperance",
    clubSlug: "esperance-tunis",
    clubName: "Espérance Sportive de Tunis",
    company: "Délice Danone",
    contact: "Sonia Belhaj",
    email: "s.belhaj@delice.tn",
    phone: "+216 71 802 000",
    sector: "Agroalimentaire",
    durationMonths: 10,
    banners: [
      { key: "calendar", pct: 30 },
      { key: "match_list", pct: 20 },
      { key: "session_detail", pct: 15 },
    ],
    notificationsPerDay: 3,
    messagesPerDay: 2,
    audience: "tous",
    categories: [],
    message: "Saison complète, présence maximale sur toutes les bannières.",
    status: "contre_proposee",
    price: 12000,
    decisionNote:
      "Nous réduisons la bannière séances à 10 % et les notifications à 2 / jour. Tarif ajusté en conséquence.",
    createdAt: "12/07/2026",
  },
  {
    id: "req-delice-monastir",
    clubSlug: "us-monastir",
    clubName: "US Monastir",
    company: "Délice Danone",
    contact: "Sonia Belhaj",
    email: "s.belhaj@delice.tn",
    phone: "+216 71 802 000",
    sector: "Agroalimentaire",
    durationMonths: 3,
    banners: [{ key: "match_detail", pct: 40 }],
    notificationsPerDay: 4,
    messagesPerDay: 3,
    audience: "joueurs",
    categories: ["Senior"],
    message: "Forte présence sur les matchs seniors.",
    status: "refusee",
    price: null,
    decisionNote:
      "La fréquence de 4 notifications / jour dépasse notre limite. Réduisez à 2 / jour et nous réétudierons la demande.",
    createdAt: "09/07/2026",
  },
]
