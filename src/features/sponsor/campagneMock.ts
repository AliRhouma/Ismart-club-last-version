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
