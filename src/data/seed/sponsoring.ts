import { fmtFrLong, parseFrLong, todayISO } from "@/lib/format"

/**
 * Sponsoring module — data slice.
 *
 * The club sells advertising space inside its own app. An "offre" (offer) is a
 * reusable sponsorship package template (Or / Argent / Bronze): it defines the
 * ad spaces a sponsor gets, how many sponsors may buy it (`seats`), and the
 * priority `points` that weight each sponsor in the rotation of shared spaces.
 *
 * This slice covers ONLY offer creation. Sponsors, contracts and the ad
 * rendering itself are out of scope (they show "Bientôt disponible").
 *
 * Seed = empty: the club hasn't joined the program yet, so the module opens on
 * its empty state. The three canonical offers live in SUGGESTED_OFFERS and are
 * added either by walking the form or via the "offres suggérées" shortcut.
 */

/** How an ad space is shared between the sponsors that own it. */
export type Allocation =
  | "cumulative" // everyone is always shown (annuaire)
  | "rotational" // shared by weighted rotation → a computed % per sponsor
  | "booked" // bought by the unit (matchs, jours)
  | "quota" // capped by the unit (envois)

export type SlotKey =
  | "accueil"
  | "planification"
  | "match_detail"
  | "messagerie"
  | "notification"

/**
 * What a space carries. A `visuel` space is an artwork — and an artwork is
 * always TWO artworks, one per version of the app (web and mobile), each with
 * its own dimension. A `message` space carries no image at all: it borrows the
 * app's own message / notification structure, so the sponsor writes text.
 */
export type SlotMedium = "visuel" | "message"

export type SlotDef = {
  key: SlotKey
  label: string
  description: string
  allocation: Allocation
  /** Unit label for booked/quota controls (e.g. "matchs / saison"). */
  unit?: string
  medium: SlotMedium
  /** Required artwork size per version — `visuel` spaces only. */
  webSize?: string
  mobileSize?: string
  /** Where the space sits, per version — the caption over each mock. */
  webContext: string
  mobileContext: string
}

/**
 * The catalogue of ad spaces, in display order — one per surface of the real
 * app: Accueil, Planification, Matchs, Messagerie, and the push notification.
 */
export const SLOT_DEFS: SlotDef[] = [
  {
    key: "accueil",
    label: "Accueil",
    description: "Bannière en haut du tableau de bord, sur toutes les sessions",
    allocation: "rotational",
    medium: "visuel",
    webSize: "1200 × 300 px · format 4:1",
    mobileSize: "640 × 320 px · format 2:1",
    webContext: "Accueil — tableau de bord",
    mobileContext: "Accueil",
  },
  {
    key: "planification",
    label: "Planification",
    description: "Bandeau dans le calendrier des séances et des matchs",
    allocation: "rotational",
    medium: "visuel",
    webSize: "1200 × 240 px · format 5:1",
    mobileSize: "640 × 240 px · format 8:3",
    webContext: "Planification — calendrier",
    mobileContext: "Planification",
  },
  {
    key: "match_detail",
    label: "Matchs & résultats",
    description: "Bandeau sur la fiche d'un match et sur la page résultats",
    allocation: "booked",
    unit: "matchs / saison",
    medium: "visuel",
    webSize: "1080 × 340 px · bannière",
    mobileSize: "640 × 280 px · bannière",
    webContext: "Match — feuille de match",
    mobileContext: "Match",
  },
  {
    key: "messagerie",
    label: "Messagerie",
    description: "Conversation sponsorisée dans la liste des discussions",
    allocation: "cumulative",
    medium: "message",
    webContext: "Messagerie — liste des conversations",
    mobileContext: "Messagerie",
  },
  {
    key: "notification",
    label: "Notification push",
    description: "Message envoyé aux parents, joueurs et éducateurs",
    allocation: "quota",
    unit: "envois / saison",
    medium: "message",
    webContext: "Cloche de notifications",
    mobileContext: "Notification",
  },
]

export const SLOT_BY_KEY: Record<SlotKey, SlotDef> = Object.fromEntries(
  SLOT_DEFS.map((s) => [s.key, s]),
) as Record<SlotKey, SlotDef>

/* ── Offer ad spaces (offer form + offer cards) ─────────────────────────── */

/**
 * The ad spaces an offer grants, as composed on the "Nouvelle offre" form.
 * Intentionally decoupled from the campaign/gallery `SlotKey` taxonomy above —
 * this is the club-facing list of what an offer is made of.
 *
 *   • share  — a rotated placement → an auto visibility % per partner
 *   • perDay — a send placement    → an auto number of sends per day
 *
 * Both auto values are computed; both can be overridden manually, per offer.
 */
export type SpaceKind = "share" | "perDay"

export type SpaceKey =
  | "calendar"
  | "match_list"
  | "match_detail"
  | "session_detail"
  | "notification"
  | "messagerie"

export type SpaceDef = {
  key: SpaceKey
  label: string
  description: string
  kind: SpaceKind
  /** Auto default (sends / day) for perDay spaces. */
  autoPerDay?: number
}

/** The catalogue of offer ad spaces, in display order. */
export const OFFER_SPACES: SpaceDef[] = [
  {
    key: "calendar",
    label: "Dans le calendrier",
    description: "Bannière en haut du calendrier des parents et joueurs.",
    kind: "share",
  },
  {
    key: "match_list",
    label: "Dans la liste des matchs",
    description: "Encart sponsorisé dans la liste des matchs.",
    kind: "share",
  },
  {
    key: "match_detail",
    label: "Dans les pages de match",
    description: "Mention « présenté par… » sur la page d'un match.",
    kind: "share",
  },
  {
    key: "session_detail",
    label: "Dans les pages de séances",
    description: "Encart sponsorisé sur la page d'une séance.",
    kind: "share",
  },
  {
    key: "notification",
    label: "Notifications",
    description: "Message poussé aux parents et joueurs.",
    kind: "perDay",
    autoPerDay: 1,
  },
  {
    key: "messagerie",
    label: "Messagerie",
    description: "Message sponsorisé dans la messagerie du club.",
    kind: "perDay",
    autoPerDay: 2,
  },
]

export const SPACE_BY_KEY: Record<SpaceKey, SpaceDef> = Object.fromEntries(
  OFFER_SPACES.map((s) => [s.key, s]),
) as Record<SpaceKey, SpaceDef>

/** One offer's configuration of a single ad space. */
export type OfferSpace = {
  enabled: boolean
  /**
   * Manual override. `null` = auto: a share space shows its computed %, a
   * perDay space shows its default rhythm. A number overrides that value —
   * percentage points for `share`, sends/day for `perDay`.
   */
  manual: number | null
}

export type Offer = {
  id: string
  name: string
  description: string
  /** Tier badge colour (raw hex — this is product data, not UI chrome). */
  color: string
  /** Prix en DT / saison. `null` = échange / institutionnel (no price). */
  price: number | null
  /** How many sponsors may buy this offer. */
  seats: number
  /** Priority weight in the rotation of shared spaces. */
  points: number
  slots: Record<SpaceKey, OfferSpace>
  exclusive: boolean
  exclusiveCategory: string
  appearsInDirectory: boolean
}

/**
 * Colour presets for the swatch pickers (6), shared by the packs and the
 * partenaires. Raw hex: these are product data (the colour a sponsor's badge is
 * drawn in), not design-system chrome, so they legitimately sit outside the
 * token palette. Both pickers also accept any custom colour.
 */
export const PRESET_COLORS: string[] = [
  "#E0A82E", // or
  "#9AA4B2", // argent
  "#C17A3F", // bronze
  "#0091FF", // saphir
  "#14B8A6", // sarcelle
  "#E5844B", // ambre
]

/** Every space enabled on auto — the natural starting point for a new offer. */
export function defaultSpaces(): Record<SpaceKey, OfferSpace> {
  return {
    calendar: { enabled: true, manual: null },
    match_list: { enabled: true, manual: null },
    match_detail: { enabled: true, manual: null },
    session_detail: { enabled: true, manual: null },
    notification: { enabled: true, manual: null },
    messagerie: { enabled: true, manual: null },
  }
}

/** A blank draft for the creation form. */
export function blankOffer(): Omit<Offer, "id"> {
  return {
    name: "",
    description: "",
    color: PRESET_COLORS[0],
    price: null,
    seats: 4,
    points: 100,
    slots: defaultSpaces(),
    exclusive: false,
    exclusiveCategory: "",
    appearsInDirectory: true,
  }
}

/**
 * Helper to build a seed offer's space map from a partial spec:
 *   number → enabled, manual override · false → disabled · (omitted) → auto.
 */
function spaces(
  spec: Partial<Record<SpaceKey, boolean | number>>,
): Record<SpaceKey, OfferSpace> {
  const base = defaultSpaces()
  for (const key of Object.keys(spec) as SpaceKey[]) {
    const v = spec[key]
    if (v === undefined) continue
    if (typeof v === "number") base[key] = { enabled: true, manual: v }
    else base[key] = { enabled: v, manual: null }
  }
  return base
}

/**
 * The three canonical offers. Added to the store by the "offres suggérées"
 * shortcut, or reproduced by walking the form three times. With these three in
 * the pool the worked example holds:
 *   Or 100×4=400 · Argent 40×6=240 · Bronze 10×12=120 · pool=760
 *   → Or 13.2 % · Argent 5.3 % · Bronze 1.3 % per sponsor.
 */
export const SUGGESTED_OFFERS: Omit<Offer, "id">[] = [
  {
    name: "Or",
    description:
      "Partenaire principal du club, visibilité maximale sur toutes les pages.",
    color: "#E0A82E",
    price: 15000,
    seats: 4,
    points: 100,
    // All spaces on auto, with the notification rhythm forced up manually.
    slots: spaces({ notification: 3 }),
    exclusive: true,
    exclusiveCategory: "Équipementier",
    appearsInDirectory: true,
  },
  {
    name: "Argent",
    description:
      "Bonne visibilité sur le calendrier et le fil d'actualité du club.",
    color: "#9AA4B2",
    price: 5000,
    seats: 6,
    points: 40,
    slots: spaces({
      session_detail: false,
      messagerie: false,
      notification: 1,
    }),
    exclusive: false,
    exclusiveCategory: "",
    appearsInDirectory: true,
  },
  {
    name: "Bronze",
    description:
      "Présence dans l'annuaire du club et sur la bannière du calendrier.",
    color: "#C17A3F",
    price: 1200,
    seats: 12,
    points: 10,
    slots: spaces({
      match_detail: false,
      session_detail: false,
      notification: false,
      messagerie: false,
    }),
    exclusive: false,
    exclusiveCategory: "",
    appearsInDirectory: true,
  },
]

/* ── Comptes sponsors ───────────────────────────────────────────────────── */

/**
 * A sponsor's own iSmart Club account — the space a company logs into to follow
 * its campaigns. Accounts exist independently of the club: a company signs up on
 * its own, then a club admin links it to a partenaire. Read-only here (account
 * creation is the sponsor's side of the product, out of scope).
 */
export type SponsorAccount = {
  id: string
  /** Raison sociale — what the admin searches for. */
  company: string
  /** Person who owns the account. */
  contact: string
  email: string
  /** Secteur d'activité — helps the admin pick the right company. */
  sector: string
  /** `pending` = signed up but hasn't confirmed its email yet. */
  status: "active" | "pending"
}

export const sponsorAccountsSeed: SponsorAccount[] = [
  {
    id: "account-delice",
    company: "Délice Danone",
    contact: "Sonia Belhaj",
    email: "sonia.belhaj@delice.tn",
    sector: "Agroalimentaire",
    status: "active",
  },
  {
    id: "account-ooredoo",
    company: "Ooredoo Tunisie",
    contact: "Karim Mansouri",
    email: "k.mansouri@ooredoo.tn",
    sector: "Télécom",
    status: "active",
  },
  {
    id: "account-biat",
    company: "BIAT",
    contact: "Amine Trabelsi",
    email: "amine.trabelsi@biat.com.tn",
    sector: "Banque",
    status: "active",
  },
  {
    id: "account-sartex",
    company: "Sartex Sport — équipementier officiel",
    contact: "Leïla Gharbi",
    email: "l.gharbi@sartex.tn",
    sector: "Équipementier",
    status: "active",
  },
  {
    id: "account-pharmacie",
    company: "Pharmacie Centrale El Menzah",
    contact: "Dr. Hichem Aouij",
    email: "contact@pharmacie-elmenzah.tn",
    sector: "Santé",
    status: "pending",
  },
  {
    id: "account-garage",
    company: "Garage Auto Plus",
    contact: "Nizar Ben Salah",
    email: "nizar@autoplus.tn",
    sector: "Automobile",
    status: "pending",
  },
]

/* ── Partenaires ────────────────────────────────────────────────────────── */

/**
 * A partenaire = a company the club has signed on one of its offers. It takes
 * one of that offer's `seats`.
 *
 * `accountId` links the partenaire to the sponsor's own iSmart Club account so
 * the company can follow its campaigns from its side. It's optional on purpose:
 * a club often signs a partner before that partner has an account — the link can
 * be added later.
 */
/**
 * Où en est le partenariat. Un partenaire ne se supprime pas — il s'archive :
 * le club garde la trace des entreprises qui l'ont soutenu.
 */
export type PartnerStatus = "actif" | "archive"

export type Partner = {
  id: string
  /** Offer (tier) the partner occupies a seat on. */
  offerId: string
  name: string
  description: string
  /** Couleur du partenaire (hex brut, comme les packs) — sa pastille partout. */
  color: string
  status: PartnerStatus
  accountId: string | null
  /**
   * Contract period — how long the partenaire holds its seat. ISO, so the form
   * reads it straight into `<input type="date">` and the screens format it.
   */
  startDate: string
  endDate: string
}

/** A blank draft for the partenaire form: starts today, runs a season. */
export function blankPartner(offerId: string): Omit<Partner, "id"> {
  const start = todayISO()
  return {
    offerId,
    name: "",
    description: "",
    color: PRESET_COLORS[0],
    status: "actif",
    accountId: null,
    startDate: start,
    endDate: applyContractPreset(CONTRACT_PRESETS[1], start).end,
  }
}

/* ── Durée du partenariat ───────────────────────────────────────────────── */

/**
 * A contract length offered as a one-click preset in the partenaire form.
 * `months` = added to the start date. `null` = snap to the sporting season
 * (1 septembre → 30 juin), the way a club actually counts a year.
 */
export type ContractPreset = { key: string; label: string; months: number | null }

export const CONTRACT_PRESETS: ContractPreset[] = [
  { key: "6m", label: "6 mois", months: 6 },
  { key: "1a", label: "1 an", months: 12 },
  { key: "2a", label: "2 ans", months: 24 },
  { key: "3a", label: "3 ans", months: 36 },
  { key: "saison", label: "Saison sportive", months: null },
]

/** ISO of a Date, local — the form's inputs speak ISO. */
function isoOf(d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * The période a preset implies from a given start.
 *
 * A "1 an" contract ends the DAY BEFORE its anniversary (1 août 2026 →
 * 31 juillet 2027), which is how a contract is actually written. The season
 * preset ignores the start day and snaps to the 1 septembre → 30 juin of the
 * season that start falls in.
 */
export function applyContractPreset(
  preset: ContractPreset,
  startISO: string,
): { start: string; end: string } {
  const start = new Date(`${startISO || todayISO()}T00:00:00`)

  if (preset.months === null) {
    // A season runs 1 sept → 30 juin. Juillet/août are the off-season, when a
    // club signs for the season ABOUT to open — so they count forward; the rest
    // of the year sits inside the season that opened last September.
    const year =
      start.getMonth() >= 6 ? start.getFullYear() : start.getFullYear() - 1
    return { start: `${year}-09-01`, end: `${year + 1}-06-30` }
  }

  const end = new Date(start)
  end.setMonth(end.getMonth() + preset.months)
  end.setDate(end.getDate() - 1)
  return { start: isoOf(start), end: isoOf(end) }
}

/** Which preset a période matches, if any — so the chips show as selected. */
export function matchContractPreset(
  startISO: string,
  endISO: string,
): string | null {
  if (!startISO || !endISO) return null
  const hit = CONTRACT_PRESETS.find((p) => {
    const { start, end } = applyContractPreset(p, startISO)
    return start === startISO && end === endISO
  })
  return hit?.key ?? null
}

/**
 * Display values of a contract période: its human length and where it stands
 * today. Computed in render, never stored (CLAUDE.md: derived values).
 */
export function contractSpan(
  startISO: string,
  endISO: string,
): {
  valid: boolean
  days: number
  /** "12 mois · 365 jours" */
  label: string
  /** "Se termine dans 45 jours" / "Expiré depuis 12 jours" / "Démarre dans 8 jours" */
  status: string
  tone: "ok" | "soon" | "over" | "future"
} | null {
  if (!startISO || !endISO) return null
  const start = Date.parse(`${startISO}T00:00:00`)
  const end = Date.parse(`${endISO}T00:00:00`)
  if (Number.isNaN(start) || Number.isNaN(end)) return null

  const valid = end >= start
  const days = Math.round((end - start) / 86_400_000) + 1
  const months = Math.max(1, Math.round(days / 30))
  const today = Date.now()
  const left = Math.ceil((end - today) / 86_400_000)
  const toStart = Math.ceil((start - today) / 86_400_000)

  const [status, tone]: [string, "ok" | "soon" | "over" | "future"] =
    today < start
      ? [`Démarre dans ${toStart} jour${toStart > 1 ? "s" : ""}`, "future"]
      : left < 0
        ? [`Expiré depuis ${-left} jour${-left > 1 ? "s" : ""}`, "over"]
        : left <= 60
          ? [`Se termine dans ${left} jour${left > 1 ? "s" : ""}`, "soon"]
          : [`Se termine dans ${left} jours`, "ok"]

  return {
    valid,
    days,
    label: `${months} mois · ${days} jours`,
    status,
    tone,
  }
}

/**
 * The offers the club already sells. Stable slug ids so the seeded partenaires
 * below can point at them.
 *
 * Seeding these means the module opens on the offers list rather than the
 * onboarding empty state — the club has already joined the program. The join
 * flow (SponsoringHome → Démarrage) is still reachable by deleting every offer.
 */
export const offersSeed: Offer[] = SUGGESTED_OFFERS.map((o, i) => ({
  ...o,
  id: ["offer-or", "offer-argent", "offer-bronze"][i],
}))

/**
 * Partenaires already signed. Varied on purpose: Délice Danone is the worked
 * example (account linked, campaigns running and archived), Ooredoo is a second
 * Or partner with a lighter history, and the pharmacy is the realistic edge case
 * — signed on the cheapest tier, no account yet, nothing running.
 *
 * Their contract periods are spread the same way: one comfortable, one about to
 * expire, one already past its end and waiting on a renewal.
 */
export const partnersSeed: Partner[] = [
  {
    id: "partner-delice",
    offerId: "offer-or",
    name: "Délice Danone",
    description:
      "Partenaire principal du club depuis 2019. Présent sur les maillots et sur l'ensemble des espaces de l'app.",
    color: "#0091FF",
    status: "actif",
    accountId: "account-delice",
    startDate: "2025-09-01",
    endDate: "2027-06-30",
  },
  {
    id: "partner-ooredoo",
    offerId: "offer-or",
    name: "Ooredoo Tunisie",
    description:
      "Partenaire télécom, sponsor du tournoi de jeunes et de la billetterie.",
    color: "#E5844B",
    status: "actif",
    accountId: "account-ooredoo",
    startDate: "2026-01-01",
    endDate: "2026-08-31",
  },
  {
    id: "partner-pharmacie",
    offerId: "offer-bronze",
    name: "Pharmacie Centrale El Menzah",
    description: "",
    color: "#14B8A6",
    status: "archive",
    accountId: null,
    startDate: "2025-07-01",
    endDate: "2026-06-30",
  },
]

/* ── Campagnes ──────────────────────────────────────────────────────────── */

/**
 * A campaign = the visuals a partenaire runs in the ad spaces its offer grants,
 * over a period. `en_cours` is the one being served right now; `archivee` ones
 * are past periods kept for their numbers.
 *
 * Everything here is display data. Views/clicks are frozen seed figures, and the
 * dates are pre-formatted strings — the prototype does no date math and no
 * counting (CLAUDE.md: no real business logic).
 */
export type CampaignStatus = "en_cours" | "archivee"

/** One ad space inside a campaign: its creative, its link, its numbers. */
export type CampaignSlot = {
  key: SlotKey
  /**
   * The text the parent reads: the headline drawn on a `visuel`, or the message
   * itself on the messagerie / notification spaces.
   */
  headline: string
  /** Where the creative sends you. */
  link: string
  /** `visuel` spaces: the two artworks, one per version of the app. */
  webImage?: string
  mobileImage?: string
  /**
   * The whole space's figures — the sum of everything that ran in it.
   * Frozen seed values; archived campaigns show these.
   */
  views: number
  clicks: number
  /**
   * Every creative that occupied this space, oldest first, the last one being
   * the one on air. A space whose artwork never changed leaves this out — read
   * it through `slotCreatives`, which folds that case into a single entry.
   */
  creatives?: SlotCreative[]
}

/**
 * One creative in the life of an ad space. Swapping the visual mid-campaign
 * closes the running one and opens a new one, so each keeps the vues et clics
 * IT made and the bilan can compare them instead of averaging them away.
 */
export type SlotCreative = {
  id: string
  /** The text this creative carried (a message space writes its own). */
  headline: string
  link: string
  webImage?: string
  mobileImage?: string
  /** Pre-formatted French dates. `to` is "" while the creative is on air. */
  from: string
  to: string
  views: number
  clicks: number
}

export type Campaign = {
  id: string
  partnerId: string
  name: string
  status: CampaignStatus
  /** Pre-formatted, French. No Date objects: the prototype never computes. */
  startDate: string
  endDate: string
  /** Human span, e.g. "3 mois · 92 jours". */
  duration: string
  /** Elapsed share, 0–100. Static — `en_cours` campaigns show it as a bar. */
  progress: number
  /** Days left, as a label. Empty for archived campaigns. */
  remaining: string
  /** Creative colour (raw hex — product data, like the tier colours). */
  color: string
  /** What the partenaire pays for this campaign, in DT. `null` = échange. */
  price: number | null
  /** Who the campaign is aimed at — absent when it targets everyone. */
  audience?: Audience
  slots: CampaignSlot[]
}

/** Sum a campaign's slot figures — display arithmetic, computed in render. */
export function campaignTotals(campaign: Campaign): {
  views: number
  clicks: number
  ctr: string
} {
  const views = campaign.slots.reduce((s, x) => s + x.views, 0)
  const clicks = campaign.slots.reduce((s, x) => s + x.clicks, 0)
  return {
    views,
    clicks,
    ctr: views
      ? `${((clicks / views) * 100).toLocaleString("fr-FR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} %`
      : "—",
  }
}

/**
 * The creatives of a space, oldest first. A space that never changed its
 * artwork has none stored: it reads as one creative covering the whole période.
 */
export function slotCreatives(
  slot: CampaignSlot,
  campaign: Campaign,
): SlotCreative[] {
  if (slot.creatives?.length) return slot.creatives
  return [
    {
      id: `${slot.key}-v1`,
      headline: slot.headline,
      link: slot.link,
      webImage: slot.webImage,
      mobileImage: slot.mobileImage,
      from: campaign.startDate,
      to: campaign.status === "archivee" ? campaign.endDate : "",
      views: slot.views,
      clicks: slot.clicks,
    },
  ]
}

/** "Visuel 2" — creatives are named by their rank in the space. */
export function creativeLabel(index: number): string {
  return `Visuel ${index + 1}`
}

/** Did the artwork (or the message) actually change? A new link alone hasn't. */
function creativeChanged(a: SlotCreative, b: Partial<SlotCreative>): boolean {
  return (
    (b.webImage ?? "") !== (a.webImage ?? "") ||
    (b.mobileImage ?? "") !== (a.mobileImage ?? "") ||
    (b.headline ?? "") !== a.headline
  )
}

/**
 * Save an edited space back onto a campaign.
 *
 * On a campaign that is running, replacing the artwork does NOT overwrite what
 * came before: the creative on air is closed on today's date with the figures
 * it made, and the new one starts at zero. That is the whole point — the club
 * has to be able to say which visual worked.
 */
export function applySlotEdit(
  campaign: Campaign,
  key: SlotKey,
  next: {
    headline: string
    link: string
    webImage: string
    mobileImage: string
  },
): Pick<Campaign, "slots"> {
  const today = fmtFrLong(todayISO())

  return {
    slots: campaign.slots.map((slot) => {
      if (slot.key !== key) return slot

      const history = slotCreatives(slot, campaign)
      const live = history[history.length - 1]
      const patch = {
        headline: next.headline.trim() || slot.headline,
        link: next.link.trim(),
        webImage: next.webImage || undefined,
        mobileImage: next.mobileImage || undefined,
      }

      // A finished campaign is corrected, not re-versioned: nothing is running.
      const versions =
        campaign.status === "en_cours" && creativeChanged(live, patch)
          ? [
              ...history.slice(0, -1),
              { ...live, to: today },
              {
                ...patch,
                id: `${key}-v${history.length + 1}`,
                from: today,
                to: "",
                views: 0,
                clicks: 0,
              },
            ]
          : [...history.slice(0, -1), { ...live, ...patch }]

      return {
        ...slot,
        ...patch,
        creatives: versions,
        views: versions.reduce((n, v) => n + v.views, 0),
        clicks: versions.reduce((n, v) => n + v.clicks, 0),
      }
    }),
  }
}

/** "1 284 302" — French thousands separators. */
export function num(n: number): string {
  return n.toLocaleString("fr-FR")
}

/* ── Créer une campagne côté club (admin) ───────────────────────────────── */

/**
 * Creative colour presets for the campaign form. Raw hex, like the tier
 * colours: this is the sponsor's artwork colour (product data), not chrome.
 */
export const CAMPAIGN_COLORS: string[] = [
  "#0091ff", // saphir
  "#7f77dd", // violet
  "#14b8a6", // sarcelle
  "#e5484d", // rouge
  "#e5844b", // ambre
  "#9aa4b2", // gris
]

/* ── Ciblage (configuration avancée) ────────────────────────────────────── */

/**
 * Who a campaign speaks to. Every field is a plain label — nothing is matched
 * against real people: the prototype targets nobody, it only records the brief.
 */
export const AUDIENCE_TYPES = [
  { key: "tous", label: "Tout le monde" },
  { key: "joueur", label: "Joueurs" },
  { key: "parent", label: "Parents" },
  { key: "coach", label: "Coachs" },
] as const
export type AudienceType = (typeof AUDIENCE_TYPES)[number]["key"]

export const AUDIENCE_GENDERS = [
  { key: "tous", label: "Tous" },
  { key: "feminin", label: "Filles" },
  { key: "masculin", label: "Garçons" },
] as const
export type AudienceGender = (typeof AUDIENCE_GENDERS)[number]["key"]

export type Audience = {
  /** The admin opened "Configuration avancée" and kept it on. */
  enabled: boolean
  city: string
  address: string
  gender: AudienceGender
  /** The two ends of the age range, as typed. */
  ageMin: string
  ageMax: string
  type: AudienceType
  /** Catégorie names, as they read in the club (U12, Senior…). */
  categories: string[]
  /** `type === "parent"` only — the children the parent follows. */
  childAgeMin: string
  childAgeMax: string
  childCategories: string[]
}

export function blankAudience(): Audience {
  return {
    enabled: false,
    city: "",
    address: "",
    gender: "tous",
    ageMin: "",
    ageMax: "",
    type: "tous",
    categories: [],
    childAgeMin: "",
    childAgeMax: "",
    childCategories: [],
  }
}

/** "Tunis · Parents · U10, U12" — the brief in one line, computed in render. */
export function audienceSummary(a: Audience | undefined): string {
  if (!a || !a.enabled) return "Tout le club"
  const parts: string[] = []
  if (a.city.trim()) parts.push(a.city.trim())
  parts.push(
    AUDIENCE_TYPES.find((t) => t.key === a.type)?.label ?? "Tout le monde",
  )
  if (a.gender !== "tous") {
    parts.push(AUDIENCE_GENDERS.find((g) => g.key === a.gender)!.label)
  }
  if (a.ageMin || a.ageMax) {
    parts.push(`${a.ageMin || "?"}–${a.ageMax || "?"} ans`)
  }
  const cats = a.type === "parent" ? a.childCategories : a.categories
  if (cats.length) parts.push(cats.join(", "))
  return parts.join(" · ")
}

/* ── Le brouillon de campagne ───────────────────────────────────────────── */

/**
 * One ad space as composed on the wizard's "Les visuels" step.
 *
 * `enabled` is the activation switch on the card: a campaign rarely runs
 * everywhere, so each space is turned on or off on purpose. A `visuel` space
 * then takes its two artworks (web + mobile, each its own dimension); a
 * `message` space takes the text the parent will read instead.
 */
export type DraftSlot = {
  enabled: boolean
  /** Filenames of the "uploaded" artworks — `visuel` spaces only. */
  webImage: string
  mobileImage: string
  /** `message` spaces: the message / notification body. */
  message: string
  link: string
}

/**
 * What the admin fills in. Dates are ISO here (they come from `<input
 * type="date">`); `buildCampaign` turns them into the pre-formatted French
 * strings the campaign screens read.
 */
export type CampaignDraft = {
  partnerId: string
  name: string
  start: string
  end: string
  /** What the partenaire pays, in DT. `null` = échange / institutionnel. */
  price: number | null
  /**
   * Creative colour — inherited from the partenaire's offre, never picked by
   * hand: the campaign is the partner's pack in motion, so it wears its colour.
   */
  color: string
  audience: Audience
  slots: Record<SlotKey, DraftSlot>
}

/** A blank draft: every space active — the admin switches off what he doesn't sell. */
export function blankCampaignDraft(
  partnerId: string,
  color: string = CAMPAIGN_COLORS[0],
): CampaignDraft {
  return {
    partnerId,
    name: "",
    start: "",
    end: "",
    price: null,
    color,
    audience: blankAudience(),
    slots: Object.fromEntries(
      SLOT_DEFS.map((s) => [
        s.key,
        { enabled: true, webImage: "", mobileImage: "", message: "", link: "" },
      ]),
    ) as Record<SlotKey, DraftSlot>,
  }
}

/** The spaces switched on — what the campaign will actually occupy. */
export function activeSlots(draft: CampaignDraft): SlotKey[] {
  return SLOT_DEFS.filter((def) => draft.slots[def.key].enabled).map(
    (def) => def.key,
  )
}

/**
 * A space is ready when it carries what its medium needs: at least one artwork
 * for a `visuel`, the message text for a `message`. An active space that isn't
 * ready still runs — it just falls back to the campaign's own name.
 */
export function slotIsReady(key: SlotKey, slot: DraftSlot): boolean {
  return SLOT_BY_KEY[key].medium === "message"
    ? slot.message.trim() !== ""
    : slot.webImage !== "" || slot.mobileImage !== ""
}

/** Whole days between two ISO dates, inclusive of both ends. */
function daysBetween(startISO: string, endISO: string): number {
  const ms = Date.parse(endISO) - Date.parse(startISO)
  return Number.isNaN(ms) ? 0 : Math.round(ms / 86_400_000) + 1
}

/**
 * The display values a période implies: its labels, its span, how far along it
 * is and whether it is still running. Shared by campaign creation and the
 * "Modifier la configuration" modal so both read the dates the same way.
 */
export function campaignPeriod(
  startISO: string,
  endISO: string,
): Pick<
  Campaign,
  "status" | "startDate" | "endDate" | "duration" | "progress" | "remaining"
> {
  const days = Math.max(1, daysBetween(startISO, endISO))
  const months = Math.max(1, Math.round(days / 30))
  const today = Date.now()
  const start = Date.parse(startISO)
  const end = Date.parse(endISO)

  const elapsed = (today - start) / Math.max(1, end - start)
  const progress = Math.min(100, Math.max(0, Math.round(elapsed * 100)))

  const left = Math.ceil((end - today) / 86_400_000)
  const toStart = Math.ceil((start - today) / 86_400_000)

  return {
    // A period already over is filed straight into the archives.
    status: today > end ? "archivee" : "en_cours",
    startDate: fmtFrLong(startISO),
    endDate: fmtFrLong(endISO),
    duration: `${months} mois · ${days} jours`,
    progress,
    remaining:
      today < start
        ? `Démarre dans ${toStart} jours`
        : today > end
          ? ""
          : `${Math.max(0, left)} jours restants`,
  }
}

/**
 * Turn a filled form into a campaign record.
 *
 * The only computed values are display ones (duration label, elapsed %, days
 * left) — the same arithmetic the seed rows hard-code. Views and clicks start
 * at zero: nothing has been served yet.
 */
export function buildCampaign(draft: CampaignDraft): Omit<Campaign, "id"> {
  return {
    partnerId: draft.partnerId,
    name: draft.name.trim() || "Campagne sans nom",
    ...campaignPeriod(draft.start, draft.end),
    color: draft.color,
    price: draft.price,
    audience: draft.audience.enabled ? draft.audience : undefined,
    // Only the spaces switched on: the others diffuse nothing.
    slots: activeSlots(draft).map((key) => {
      const slot = draft.slots[key]
      const message = slot.message.trim()
      return {
        key,
        // A message space reads its own text; a visuel carries the campaign name.
        headline:
          SLOT_BY_KEY[key].medium === "message" && message
            ? message
            : draft.name.trim() || "Campagne sans nom",
        link: slot.link.trim(),
        webImage: slot.webImage || undefined,
        mobileImage: slot.mobileImage || undefined,
        views: 0,
        clicks: 0,
      }
    }),
  }
}

/* ── Modifier la configuration d'une campagne ───────────────────────────── */

/**
 * One ad space as composed on the config modal: its artworks (or its message)
 * and its link. There is no accroche — a `visuel` carries the campaign's own
 * name, and a `message` space IS its text.
 */
export type EditSlot = {
  enabled: boolean
  /** `message` spaces only: the text the parent reads. */
  headline: string
  webImage: string
  mobileImage: string
  link: string
}

/**
 * What the config modal edits: the name, the période and the spaces. Not the
 * partenaire, not the figures, and not the colour — that one is inherited from
 * the offre the partenaire signed.
 */
export type CampaignEdit = {
  name: string
  /** ISO, for the date inputs. */
  start: string
  end: string
  /** What the partenaire pays, in DT. `null` = échange / institutionnel. */
  price: number | null
  slots: Record<SlotKey, EditSlot>
}

/** Read an existing campaign back into an editable draft. */
export function campaignEditDraft(campaign: Campaign): CampaignEdit {
  const bySlot = new Map(campaign.slots.map((s) => [s.key, s]))
  return {
    name: campaign.name,
    start: parseFrLong(campaign.startDate),
    end: parseFrLong(campaign.endDate),
    price: campaign.price,
    slots: Object.fromEntries(
      SLOT_DEFS.map((def) => {
        const slot = bySlot.get(def.key)
        return [
          def.key,
          {
            enabled: Boolean(slot),
            headline: slot?.headline ?? "",
            webImage: slot?.webImage ?? "",
            mobileImage: slot?.mobileImage ?? "",
            // A space added here inherits the campaign's existing destination.
            link: slot?.link ?? campaign.slots[0]?.link ?? "https://",
          },
        ]
      }),
    ) as Record<SlotKey, EditSlot>,
  }
}

/**
 * Fold an edited draft back onto a campaign. The figures are never touched: a
 * space kept on keeps its vues / clics, a space switched on starts at zero.
 */
export function applyCampaignEdit(
  campaign: Campaign,
  edit: CampaignEdit,
): Partial<Campaign> {
  const bySlot = new Map(campaign.slots.map((s) => [s.key, s]))
  return {
    name: edit.name.trim() || campaign.name,
    ...campaignPeriod(edit.start, edit.end),
    price: edit.price,
    slots: SLOT_DEFS.filter((def) => edit.slots[def.key].enabled).map((def) => {
      const previous = bySlot.get(def.key)
      const draft = edit.slots[def.key]
      return {
        key: def.key,
        // Only a message space writes its own line; a visuel wears the name.
        headline:
          SLOT_BY_KEY[def.key].medium === "message"
            ? draft.headline.trim() || edit.name.trim()
            : edit.name.trim() || campaign.name,
        link: draft.link.trim(),
        webImage: draft.webImage || undefined,
        mobileImage: draft.mobileImage || undefined,
        // The history belongs to the space — the form never rewrites it.
        creatives: previous?.creatives,
        views: previous?.views ?? 0,
        clicks: previous?.clicks ?? 0,
      }
    }),
  }
}

export const campaignsSeed: Campaign[] = [
  /* ── Délice Danone — the worked example ───────────────────────────────── */
  {
    id: "campaign-delice-ete-2026",
    partnerId: "partner-delice",
    name: "Campagne Été 2026",
    status: "en_cours",
    startDate: "1 juin 2026",
    endDate: "31 août 2026",
    duration: "3 mois · 92 jours",
    progress: 51,
    remaining: "45 jours restants",
    color: "#0091ff",
    price: 12000,
    // Half-way through the période, so the figures are half a season's.
    slots: [
      {
        key: "messagerie",
        headline: "Délice Danone — Partenaire officiel",
        link: "https://delice.tn",
        views: 18420,
        clicks: 690,
      },
      {
        key: "planification",
        headline: "Bien grandir, bien jouer",
        link: "https://delice.tn/juniors",
        webImage: "planification-web.png",
        mobileImage: "planification-mobile.png",
        views: 154300,
        clicks: 2040,
      },
      {
        // The one space whose artwork was swapped mid-campaign: the club
        // replaced the June visual on 1 July, so each keeps its own figures.
        key: "accueil",
        headline: "Délice Zéro — nouveau",
        link: "https://delice.tn/zero",
        webImage: "accueil-web-zero.png",
        mobileImage: "accueil-mobile-zero.png",
        views: 96250,
        clicks: 3180,
        creatives: [
          {
            id: "accueil-v1",
            headline: "Délice Danone — Partenaire officiel",
            link: "https://delice.tn",
            webImage: "accueil-web-lancement.png",
            mobileImage: "accueil-mobile-lancement.png",
            from: "1 juin 2026",
            to: "30 juin 2026",
            views: 41200,
            clicks: 980,
          },
          {
            id: "accueil-v2",
            headline: "Délice Zéro — nouveau",
            link: "https://delice.tn/zero",
            webImage: "accueil-web-zero.png",
            mobileImage: "accueil-mobile-zero.png",
            from: "1 juillet 2026",
            to: "",
            views: 55050,
            clicks: 2200,
          },
        ],
      },
      {
        key: "match_detail",
        headline: "Match présenté par Délice",
        link: "https://delice.tn",
        webImage: "match-web.png",
        // Mobile artwork still missing — a real campaign is rarely complete.
        views: 26740,
        clicks: 810,
      },
      {
        key: "notification",
        headline: "Un yaourt offert après chaque victoire",
        link: "https://delice.tn/offre",
        views: 6900,
        clicks: 1470,
      },
    ],
  },
  {
    id: "campaign-delice-saison-2025",
    partnerId: "partner-delice",
    name: "Campagne Saison 2025-2026",
    status: "archivee",
    startDate: "1 septembre 2025",
    endDate: "31 mai 2026",
    duration: "9 mois · 273 jours",
    progress: 100,
    remaining: "",
    color: "#0091ff",
    price: 28000,
    slots: [
      {
        key: "messagerie",
        headline: "Délice Danone — Partenaire officiel",
        link: "https://delice.tn",
        views: 48920,
        clicks: 1840,
      },
      {
        key: "planification",
        headline: "Bien grandir, bien jouer",
        link: "https://delice.tn/juniors",
        views: 412300,
        clicks: 5210,
      },
      {
        key: "accueil",
        headline: "Délice, partenaire de vos exploits",
        link: "https://delice.tn",
        views: 286450,
        clicks: 9870,
      },
      {
        key: "match_detail",
        headline: "Match présenté par Délice",
        link: "https://delice.tn",
        views: 74210,
        clicks: 2130,
      },
      {
        key: "notification",
        headline: "Un yaourt offert après chaque victoire",
        link: "https://delice.tn/offre",
        views: 18400,
        clicks: 3960,
      },
    ],
  },
  {
    id: "campaign-delice-ramadan-2026",
    partnerId: "partner-delice",
    name: "Ramadan 2026",
    status: "archivee",
    startDate: "18 février 2026",
    endDate: "19 mars 2026",
    duration: "1 mois · 30 jours",
    progress: 100,
    remaining: "",
    color: "#7f77dd",
    price: 4500,
    slots: [
      {
        key: "planification",
        headline: "Ramadan Karim — Délice",
        link: "https://delice.tn/ramadan",
        views: 51200,
        clicks: 1490,
      },
      {
        key: "accueil",
        headline: "Nos recettes de l'iftar",
        link: "https://delice.tn/recettes",
        views: 43800,
        clicks: 2870,
      },
      {
        key: "notification",
        headline: "Recette du jour : Zrir Délice",
        link: "https://delice.tn/recettes",
        views: 6100,
        clicks: 1420,
      },
    ],
  },
  {
    id: "campaign-delice-zero",
    partnerId: "partner-delice",
    name: "Lancement Délice Zéro",
    status: "archivee",
    startDate: "1 octobre 2025",
    endDate: "31 octobre 2025",
    duration: "1 mois · 31 jours",
    progress: 100,
    remaining: "",
    color: "#14b8a6",
    price: 6800,
    slots: [
      {
        key: "accueil",
        headline: "Délice Zéro arrive",
        link: "https://delice.tn/zero",
        views: 29900,
        clicks: 1680,
      },
    ],
  },

  /* ── Ooredoo — a lighter history (no archives) ─────────────────────────── */
  {
    id: "campaign-ooredoo-ete-2026",
    partnerId: "partner-ooredoo",
    name: "Forfait Jeunes 2026",
    status: "en_cours",
    startDate: "15 juin 2026",
    endDate: "15 septembre 2026",
    duration: "3 mois · 92 jours",
    progress: 35,
    remaining: "60 jours restants",
    color: "#e5484d",
    price: 9500,
    slots: [
      {
        key: "messagerie",
        headline: "Ooredoo — Partenaire télécom",
        link: "https://ooredoo.tn",
        views: 0,
        clicks: 0,
      },
      {
        key: "planification",
        headline: "Forfait Jeunes — 30 Go",
        link: "https://ooredoo.tn/jeunes",
        views: 0,
        clicks: 0,
      },
      {
        key: "accueil",
        headline: "Restez connectés au club",
        link: "https://ooredoo.tn/jeunes",
        views: 0,
        clicks: 0,
      },
    ],
  },
]

/* ── Share math — the only real calculation in this prototype ───────────── */

/** pool = Σ (points × seats) over all offers. */
export function pool(offers: { points: number; seats: number }[]): number {
  return offers.reduce((sum, o) => sum + o.points * o.seats, 0)
}

/** Share of the rotation a single sponsor of this offer receives. */
export function sharePerSponsor(
  offer: { points: number; seats: number },
  offers: { points: number; seats: number }[],
): number {
  const p = pool(offers)
  return p ? offer.points / p : 0
}

/** Share of the rotation the whole tier (all its seats) receives. */
export function sharePerTier(
  offer: { points: number; seats: number },
  offers: { points: number; seats: number }[],
): number {
  const p = pool(offers)
  return p ? (offer.points * offer.seats) / p : 0
}

/** Effective visibility fraction of a `share` space: manual % or auto share. */
export function shareValue(space: OfferSpace, autoShare: number): number {
  return space.manual !== null ? space.manual / 100 : autoShare
}

/** Effective sends/day of a `perDay` space: manual override or auto default. */
export function perDayValue(space: OfferSpace, def: SpaceDef): number {
  return space.manual ?? def.autoPerDay ?? 0
}

/** "13.2 %" — one decimal, French formatting. */
export function pct(fraction: number): string {
  return (fraction * 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + " %"
}
