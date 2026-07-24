import type { SlotKey } from "@/data/seed/sponsoring"
import { PARTNERSHIPS, type Tier } from "@/features/sponsor/mock"

/**
 * Sponsor space — campaign display data.
 *
 * Like `mock.ts`, this is a static UI pass: no store, no logic. The creation
 * wizard builds a `CampaignDraft` in local state and hands it to the editor
 * through the router's `state`, so the flow clicks end to end without any
 * persistence layer. Refreshing the editor falls back to a seeded example.
 */

/** The ad spaces each tier grants — mirrors CLUB_OFFERS.includes. */
export const TIER_SLOTS: Record<Tier, SlotKey[]> = {
  Or: [
    "partners_page",
    "calendar_banner",
    "home_feed",
    "match_detail",
    "splash",
    "notification",
  ],
  Argent: [
    "partners_page",
    "calendar_banner",
    "home_feed",
    "match_detail",
    "notification",
  ],
  Bronze: ["partners_page", "calendar_banner"],
}

/** What the sponsor wants out of the campaign — drives nothing, it's a label. */
export const OBJECTIFS = [
  {
    key: "notoriete",
    label: "Notoriété",
    hint: "Être vu le plus souvent possible par les familles du club.",
  },
  {
    key: "trafic",
    label: "Trafic",
    hint: "Amener les visiteurs vers votre site ou votre boutique.",
  },
  {
    key: "produit",
    label: "Lancement produit",
    hint: "Pousser une nouveauté sur une période courte.",
  },
  {
    key: "recrutement",
    label: "Recrutement",
    hint: "Faire connaître vos offres d'emploi et vos stages.",
  },
] as const

export type ObjectifKey = (typeof OBJECTIFS)[number]["key"]

/**
 * The visual dimension each ad space expects — the rule shown next to every
 * slot so the sponsor sends artwork at the right size. Literal display text
 * (the prototype never validates an upload).
 */
export const SLOT_DIMENSIONS: Record<SlotKey, string> = {
  partners_page: "400 × 400 px · logo carré",
  calendar_banner: "1200 × 300 px · format 4:1",
  home_feed: "1200 × 675 px · format 16:9",
  match_detail: "1080 × 340 px · bannière",
  splash: "1080 × 1920 px · plein écran vertical",
  notification: "256 × 256 px · icône carrée",
}

/**
 * The visibility share a sponsor gets on each ad space — the display percentage
 * that replaces the space's allocation label on the review page. Literal text
 * (the prototype computes nothing).
 */
export const SLOT_SHARE: Record<SlotKey, string> = {
  partners_page: "100 %",
  calendar_banner: "20 %",
  home_feed: "16 %",
  match_detail: "25 %",
  splash: "50 %",
  notification: "10 %",
}

/** One ad space of a draft: the visual and the link behind it. */
export type DraftSlot = {
  key: SlotKey
  /** Headline drawn on the mock creative — stands in for the uploaded image. */
  headline: string
  /** Filename of the "uploaded" visual, or "" while the slot is empty. */
  image: string
  link: string
}

export type CampaignDraft = {
  name: string
  /** Slug of the club, from PARTNERSHIPS. */
  clubSlug: string
  club: string
  tier: Tier
  /** Literal display dates — the prototype does no date math. */
  startDate: string
  endDate: string
  duration: string
  objectif: ObjectifKey
  /** Creative colour (raw hex — product data, like the tier colours). */
  color: string
  slots: DraftSlot[]
}

/** Creative colour presets offered in the wizard. */
export const DRAFT_COLORS = [
  "#0091ff",
  "#7f77dd",
  "#14b8a6",
  "#e5844b",
  "#e5484d",
  "#e0a82e",
]

export function blankDraft(): CampaignDraft {
  return {
    name: "",
    clubSlug: "",
    club: "",
    tier: "Or",
    startDate: "",
    endDate: "",
    duration: "",
    objectif: "notoriete",
    color: DRAFT_COLORS[0],
    slots: [],
  }
}

/** Fill a draft's slots from the tier it was signed on. */
export function slotsForTier(tier: Tier): DraftSlot[] {
  return TIER_SLOTS[tier].map((key) => ({
    key,
    headline: "",
    image: "",
    link: "",
  }))
}

/** The clubs a campaign can be created against — the sponsor's live deals. */
export const SELECTABLE_CLUBS = PARTNERSHIPS.filter((p) => p.status !== "Expiré")

/* ── Existing campaigns (list screen) ───────────────────────────────────── */

export type SponsorCampaign = {
  id: string
  name: string
  club: string
  tier: Tier
  period: string
  objectif: string
  color: string
  status: "En diffusion" | "Programmée" | "Terminée"
  /** How many of the tier's spaces carry a visual — literal display text. */
  filled: string
}

/**
 * Rebuild an editable draft from an existing campaign, so opening one from the
 * list lands on the same visuals editor as the creation flow. `headlines` fills
 * the first slots — the rest stay empty, which is what "2/6 espaces" means.
 */
export function draftFromCampaign(
  campaign: SponsorCampaign,
  headlines: string[],
): CampaignDraft {
  const [startDate, endDate] = campaign.period.split(" → ")
  return {
    name: campaign.name,
    clubSlug: "",
    club: campaign.club,
    tier: campaign.tier,
    startDate: startDate ?? "",
    endDate: endDate ?? "",
    duration: campaign.period,
    objectif:
      (OBJECTIFS.find((o) => o.label === campaign.objectif)?.key ??
        "notoriete") as ObjectifKey,
    color: campaign.color,
    slots: slotsForTier(campaign.tier).map((s, i) =>
      headlines[i]
        ? {
            ...s,
            headline: headlines[i],
            image: `${s.key}-visuel.png`,
            link: "https://delice.tn/campagne",
          }
        : s,
    ),
  }
}

/** Creatives already placed, per campaign — literal display text. */
export const CAMPAIGN_HEADLINES: Record<string, string[]> = {
  "sc-ete-2026": [
    "Délice Danone — Partenaire officiel",
    "Bien grandir, bien jouer",
    "Délice Zéro — nouveau",
    "Match présenté par Délice",
    "L'énergie des champions",
    "Un yaourt offert après chaque victoire",
  ],
  "sc-rentree-sahel": ["Délice Danone — Partenaire officiel", "La rentrée des champions"],
  "sc-marsa-hiver": [
    "Délice Danone — Partenaire officiel",
    "L'hiver au chaud",
    "Nos recettes d'hiver",
    "Match présenté par Délice",
    "Recette du jour",
  ],
}

/**
 * Varied on purpose: one running, one still missing visuals, one finished.
 */
export const SPONSOR_CAMPAIGNS: SponsorCampaign[] = [
  {
    id: "sc-ete-2026",
    name: "Campagne Été 2026",
    club: "iSmart Club Tunis",
    tier: "Or",
    period: "1 juin → 31 août 2026",
    objectif: "Notoriété",
    color: "#0091ff",
    status: "En diffusion",
    filled: "6/6 espaces",
  },
  {
    id: "sc-rentree-sahel",
    name: "Rentrée sportive",
    club: "Étoile Sportive du Sahel",
    tier: "Or",
    period: "1 sept → 31 oct 2026",
    objectif: "Lancement produit",
    color: "#14b8a6",
    status: "Programmée",
    filled: "2/6 espaces",
  },
  {
    id: "sc-marsa-hiver",
    name: "Hiver 2025",
    club: "AS La Marsa",
    tier: "Argent",
    period: "1 déc 2025 → 28 fév 2026",
    objectif: "Trafic",
    color: "#e5844b",
    status: "Terminée",
    filled: "5/5 espaces",
  },
]

/* ── Demandes de campagne (côté club / admin) ───────────────────────────── */

/**
 * A campaign request = what a sponsor sends when it finishes the "Demande de
 * campagne" flow. The club reviews it before anything goes live: it sees every
 * visual and its resources, then approves or refuses (with a justification).
 *
 * Static UI pass, like the rest of the sponsor mock: the seed below is what the
 * club's "Demandes de campagne" inbox opens on. Approving / refusing updates
 * local screen state only — nothing persists.
 */
export type RequestStatus = "en_attente" | "approuvee" | "refusee"

/** One requested ad space: its visual (filename), accroche and link. */
export type RequestSlot = {
  key: SlotKey
  headline: string
  /** Filename of the sent visual, or "" if the sponsor left it empty. */
  image: string
  link: string
}

export type CampaignRequest = {
  id: string
  /** Requesting company. */
  sponsor: string
  sector: string
  club: string
  tier: Tier
  name: string
  period: string
  /** Literal display date the request was sent. */
  submittedAt: string
  /** Creative colour (raw hex — product data, like the tier colours). */
  color: string
  slots: RequestSlot[]
  status: RequestStatus
  /** Filled when the club refuses — the reason sent back to the sponsor. */
  justification?: string
}

/** Build a request's slots from the tier, filling the given headlines. */
function requestSlots(
  tier: Tier,
  filled: { headline: string; link: string }[],
): RequestSlot[] {
  return TIER_SLOTS[tier].map((key, i) =>
    filled[i]
      ? {
          key,
          headline: filled[i].headline,
          image: `${key}-visuel.png`,
          link: filled[i].link,
        }
      : { key, headline: "", image: "", link: "" },
  )
}

/**
 * The club's inbox — varied on purpose: three awaiting review (a full Or, a
 * partial Argent, a two-space Bronze), one already approved and one refused
 * with its justification, so both terminal states show.
 */
export const CAMPAIGN_REQUESTS: CampaignRequest[] = [
  {
    id: "req-ooredoo-jeunes",
    sponsor: "Ooredoo Tunisie",
    sector: "Télécom",
    club: "iSmart Club Tunis",
    tier: "Or",
    name: "Forfait Jeunes 2026",
    period: "15 juin → 15 sept 2026",
    submittedAt: "20 juillet 2026",
    color: "#e5484d",
    status: "en_attente",
    slots: requestSlots("Or", [
      { headline: "Ooredoo — Partenaire télécom", link: "https://ooredoo.tn" },
      { headline: "Forfait Jeunes — 30 Go", link: "https://ooredoo.tn/jeunes" },
      { headline: "Restez connectés au club", link: "https://ooredoo.tn/jeunes" },
      { headline: "Match présenté par Ooredoo", link: "https://ooredoo.tn" },
      { headline: "L'énergie des champions", link: "https://ooredoo.tn/jeunes" },
      { headline: "30 Go offerts aux U15", link: "https://ooredoo.tn/offre" },
    ]),
  },
  {
    id: "req-biat-epargne",
    sponsor: "BIAT",
    sector: "Banque",
    club: "iSmart Club Tunis",
    tier: "Argent",
    name: "Épargne Junior",
    period: "1 sept → 31 déc 2026",
    submittedAt: "22 juillet 2026",
    color: "#0091ff",
    status: "en_attente",
    slots: requestSlots("Argent", [
      { headline: "BIAT — Partenaire du club", link: "https://biat.com.tn" },
      { headline: "Ouvrez un livret Junior", link: "https://biat.com.tn/junior" },
      { headline: "Épargner, ça s'apprend jeune", link: "https://biat.com.tn/junior" },
    ]),
  },
  {
    id: "req-pharmacie-rentree",
    sponsor: "Pharmacie Centrale El Menzah",
    sector: "Santé",
    club: "iSmart Club Tunis",
    tier: "Bronze",
    name: "Bilan de rentrée",
    period: "1 sept → 30 sept 2026",
    submittedAt: "23 juillet 2026",
    color: "#14b8a6",
    status: "en_attente",
    slots: requestSlots("Bronze", [
      { headline: "Pharmacie El Menzah — à vos côtés", link: "https://pharmacie-elmenzah.tn" },
      { headline: "Bilan sportif de rentrée", link: "https://pharmacie-elmenzah.tn/rentree" },
    ]),
  },
  {
    id: "req-sartex-maillots",
    sponsor: "Sartex Sport — équipementier officiel",
    sector: "Équipementier",
    club: "iSmart Club Tunis",
    tier: "Or",
    name: "Nouveaux maillots 2026",
    period: "1 août → 30 nov 2026",
    submittedAt: "12 juillet 2026",
    color: "#7f77dd",
    status: "approuvee",
    slots: requestSlots("Or", [
      { headline: "Sartex — Équipementier officiel", link: "https://sartex.tn" },
      { headline: "Le nouveau maillot est là", link: "https://sartex.tn/maillots" },
      { headline: "Portez les couleurs du club", link: "https://sartex.tn/maillots" },
      { headline: "Match présenté par Sartex", link: "https://sartex.tn" },
      { headline: "Collection 2026", link: "https://sartex.tn/maillots" },
      { headline: "-20 % sur le maillot domicile", link: "https://sartex.tn/offre" },
    ]),
  },
  {
    id: "req-garage-promo",
    sponsor: "Garage Auto Plus",
    sector: "Automobile",
    club: "iSmart Club Tunis",
    tier: "Bronze",
    name: "Révision avant l'hiver",
    period: "1 oct → 31 oct 2026",
    submittedAt: "8 juillet 2026",
    color: "#e5844b",
    status: "refusee",
    justification:
      "Le visuel de la bannière calendrier ne respecte pas le format demandé (1200 × 300 px) et le lien renvoie vers une page indisponible. Merci de renvoyer une demande corrigée.",
    slots: requestSlots("Bronze", [
      { headline: "Garage Auto Plus — El Menzah", link: "https://autoplus.tn" },
      { headline: "Révision hiver dès 90 DT", link: "https://autoplus.tn/hiver" },
    ]),
  },
]
