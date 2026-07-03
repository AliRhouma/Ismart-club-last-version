/**
 * Finance module — Transactions data slice (docs: "Finance Module — Transactions").
 *
 * A single active season scopes the whole module (set globally, not on the page).
 * Every transaction is classified by nature + groupe + sous-catégorie and scoped
 * to a portée (général / équipe / staff). The referential (groupes + sous-
 * catégories) is admin-managed — seeded here as a starting set, fully editable in
 * principle. Amounts are positive magnitudes in TND; the sign/colour is derived
 * from `nature`.
 *
 * Multi-team is DUPLICATION, not split: a transaction linked to several teams
 * attributes its FULL amount to each (see docs §4.6). We store the team links
 * inline as `team_ids` (the prototype's flattened TransactionTeam join).
 *
 * Deletion is a SOFT delete: `is_deleted` hides a row from the table/KPIs but
 * keeps it restorable in the Historique. Seed rows keep readable slug ids; rows
 * added at runtime get crypto UUIDs.
 */

export type Nature = "Dépense" | "Revenu"
export type Scope = "general" | "equipe" | "staff"
export type StaffCategory = "Administratif" | "Technique"
export type PaymentMethod = "Espèces" | "Virement" | "Chèque" | "Carte"

export type FinanceConfig = {
  /** Globally-active season label, e.g. "2025 / 2026". */
  active_season: string
  /** Configured currency (global). The app formats amounts in TND. */
  currency: string
}

export type FinanceTeam = { id: string; name: string }

export type StaffMember = {
  id: string
  full_name: string
  category: StaffCategory
  role?: string
}

/** Groupe — belongs to exactly ONE nature (admin-managed). */
export type Group = {
  id: string
  name: string
  nature: Nature
  is_active: boolean
}

/** Sous-catégorie — belongs to exactly ONE groupe (admin-managed). */
export type SubCategory = {
  id: string
  group_id: string
  name: string
  is_active: boolean
}

export type Transaction = {
  id: string
  /** Active season at creation (label). */
  season: string
  nature: Nature
  group_id: string
  subcategory_id: string
  /** Positive magnitude; sign derived from nature. */
  amount: number
  /** ISO yyyy-mm-dd. */
  date: string
  scope: Scope
  /** When scope === "equipe": one or more teams, each attributed the full amount. */
  team_ids: string[]
  /** When scope === "staff": optional narrowing. */
  staff_category?: StaffCategory
  staff_member_id?: string
  label?: string
  payment_method?: PaymentMethod
  /** Filename of the attached receipt/invoice (pièce jointe). */
  attachment?: string
  is_deleted: boolean
  deleted_at?: string
  created_at: string
}

/** Shape the create form emits; the store fills id / season / flags / created_at. */
export type NewTransaction = Omit<
  Transaction,
  "id" | "season" | "is_deleted" | "deleted_at" | "created_at"
>

/* ── Global config ──────────────────────────────────────────────────────── */
export const financeConfigSeed: FinanceConfig = {
  active_season: "2025 / 2026",
  currency: "TND",
}

/* ── Teams & staff ──────────────────────────────────────────────────────── */
export const financeTeamsSeed: FinanceTeam[] = [
  { id: "team-seniors", name: "Séniors" },
  { id: "team-u19", name: "U19" },
  { id: "team-u17", name: "U17" },
  { id: "team-u15", name: "U15" },
  { id: "team-u13", name: "U13" },
  { id: "team-u11", name: "U11" },
]

export const staffSeed: StaffMember[] = [
  { id: "staff-karim", full_name: "Karim Belhadj", category: "Technique", role: "Entraîneur principal" },
  { id: "staff-mehdi", full_name: "Mehdi Traoui", category: "Technique", role: "Préparateur physique" },
  { id: "staff-sonia", full_name: "Sonia Khelifi", category: "Administratif", role: "Secrétaire générale" },
  { id: "staff-ahmed", full_name: "Ahmed Ben Salah", category: "Administratif", role: "Trésorier" },
]

/* ── Referential (groupes → sous-catégories), admin-managed ─────────────── */
type RefDef = { slug: string; name: string; subs: string[] }

const DEPENSES: RefDef[] = [
  { slug: "salaires", name: "Salaires & Rémunérations", subs: ["Salaires staff technique", "Salaires administratifs", "Indemnités"] },
  { slug: "primes", name: "Primes", subs: ["Prime de victoire", "Prime de maintien"] },
  { slug: "equipement", name: "Biens & Équipement", subs: ["Maillots & tenues", "Ballons", "Matériel d'entraînement"] },
  { slug: "loyer", name: "Loyer", subs: ["Loyer terrain", "Loyer bureau"] },
  { slug: "charges", name: "Eau & Énergie (Charges)", subs: ["Électricité", "Eau", "Internet & téléphonie"] },
  { slug: "sante", name: "Santé", subs: ["Kinésithérapie", "Pharmacie & soins", "Visite médicale"] },
  { slug: "hebergement", name: "Hébergement", subs: ["Hôtel (déplacement match)", "Hôtel (stage)"] },
  { slug: "restauration", name: "Restauration", subs: ["Repas déplacement", "Collations"] },
  { slug: "transport", name: "Transport", subs: ["Bus déplacement", "Carburant", "Péage & parking"] },
  { slug: "competition", name: "Frais de Compétition", subs: ["Engagement compétition", "Licences", "Frais d'arbitrage"] },
  { slug: "admin", name: "Frais Administratifs & Généraux", subs: ["Fournitures de bureau", "Assurance", "Frais bancaires"] },
  { slug: "entretien", name: "Entretien & Maintenance", subs: ["Entretien pelouse", "Réparations matériel"] },
]

const REVENUS: RefDef[] = [
  { slug: "sponsor", name: "Sponsor & Subventions", subs: ["Sponsor Délice", "Sponsor Ooredoo", "Subvention municipale", "Subvention fédérale"] },
  { slug: "supporteurs", name: "Supporteurs", subs: ["Cotisations adhérents", "Billetterie"] },
  { slug: "collecte", name: "Collecte", subs: ["Tombola", "Buvette", "Produits dérivés"] },
  { slug: "droits", name: "Primes & Droits Sportifs", subs: ["Prime fédérale", "Droits de formation"] },
]

function buildRef(defs: RefDef[], nature: Nature) {
  const groups: Group[] = []
  const subs: SubCategory[] = []
  for (const def of defs) {
    const groupId = `grp-${def.slug}`
    groups.push({ id: groupId, name: def.name, nature, is_active: true })
    def.subs.forEach((name, i) =>
      subs.push({ id: `sub-${def.slug}-${i + 1}`, group_id: groupId, name, is_active: true }),
    )
  }
  return { groups, subs }
}

const dep = buildRef(DEPENSES, "Dépense")
const rev = buildRef(REVENUS, "Revenu")

export const groupsSeed: Group[] = [...dep.groups, ...rev.groups]
export const subCategoriesSeed: SubCategory[] = [...dep.subs, ...rev.subs]

/* ── Transactions ───────────────────────────────────────────────────────── */
const SEASON = financeConfigSeed.active_season
/** sub id helper — `s("hebergement", 2)` → "sub-hebergement-2". */
const s = (slug: string, n: number) => `sub-${slug}-${n}`
const g = (slug: string) => `grp-${slug}`

/** Build a seed transaction with the boilerplate flags filled in. */
function tx(
  id: string,
  date: string,
  nature: Nature,
  groupSlug: string,
  subN: number,
  amount: number,
  scope: Scope,
  extra: Partial<Transaction> = {},
): Transaction {
  return {
    id,
    season: SEASON,
    nature,
    group_id: g(groupSlug),
    subcategory_id: s(groupSlug, subN),
    amount,
    date,
    scope,
    team_ids: [],
    is_deleted: false,
    created_at: `${date}T09:00:00`,
    ...extra,
  }
}

/**
 * Varied season activity: revenus & dépenses, all three portées, two multi-team
 * cases (duplication), an attachment here and there, and one already soft-deleted
 * row so the Historique reads on first load.
 */
export const transactionsSeed: Transaction[] = [
  tx("tx-sponsor-delice", "2025-09-12", "Revenu", "sponsor", 1, 15000, "general", {
    label: "Sponsor Délice — acompte saison",
    payment_method: "Virement",
    attachment: "contrat-delice-2025.pdf",
  }),
  tx("tx-maillots", "2025-09-20", "Dépense", "equipement", 1, 4200, "general", {
    label: "Maillots domicile & extérieur — Decathlon",
    payment_method: "Carte",
    attachment: "facture-decathlon-0920.pdf",
  }),
  tx("tx-cotisations", "2025-09-30", "Revenu", "supporteurs", 1, 8600, "general", {
    label: "Cotisations adhérents — septembre",
    payment_method: "Virement",
  }),
  // multi-team duplication: full 1 000 attributed to U17 AND U15
  tx("tx-bus-sfax", "2025-10-05", "Dépense", "transport", 1, 1000, "equipe", {
    team_ids: ["team-u17", "team-u15"],
    label: "Bus déplacement — Sfax",
    payment_method: "Espèces",
  }),
  tx("tx-salaire-karim", "2025-10-31", "Dépense", "salaires", 1, 3500, "staff", {
    staff_category: "Technique",
    staff_member_id: "staff-karim",
    label: "Salaire octobre — entraîneur principal",
    payment_method: "Virement",
  }),
  tx("tx-electricite", "2025-11-03", "Dépense", "charges", 1, 780, "general", {
    label: "Facture STEG — octobre",
    payment_method: "Chèque",
  }),
  tx("tx-stage-hiver", "2025-11-15", "Dépense", "hebergement", 2, 6200, "equipe", {
    team_ids: ["team-seniors"],
    label: "Stage hivernal — hôtel (4 nuits)",
    payment_method: "Virement",
    attachment: "hotel-stage-nov.pdf",
  }),
  tx("tx-salaire-sonia", "2025-11-30", "Dépense", "salaires", 2, 2200, "staff", {
    staff_category: "Administratif",
    staff_member_id: "staff-sonia",
    label: "Salaire novembre — secrétariat",
    payment_method: "Virement",
  }),
  tx("tx-sponsor-ooredoo", "2025-12-01", "Revenu", "sponsor", 2, 12000, "general", {
    label: "Sponsor Ooredoo — 1er versement",
    payment_method: "Virement",
    attachment: "convention-ooredoo.pdf",
  }),
  tx("tx-licences", "2025-12-10", "Dépense", "competition", 2, 2400, "general", {
    label: "Licences joueurs — saison",
    payment_method: "Virement",
  }),
  tx("tx-kine-seniors", "2026-01-08", "Dépense", "sante", 1, 900, "equipe", {
    team_ids: ["team-seniors"],
    label: "Séances kinésithérapie — janvier",
    payment_method: "Espèces",
  }),
  // soft-deleted from the start → visible only in the Historique
  tx("tx-fournitures", "2026-01-15", "Dépense", "admin", 1, 320, "general", {
    label: "Fournitures de bureau — papeterie",
    payment_method: "Carte",
    is_deleted: true,
    deleted_at: "2026-01-16T14:20:00",
  }),
  // second multi-team duplication
  tx("tx-repas-jeunes", "2026-01-20", "Dépense", "restauration", 1, 540, "equipe", {
    team_ids: ["team-u13", "team-u11"],
    label: "Repas déplacement — tournoi jeunes",
    payment_method: "Espèces",
  }),
  tx("tx-loyer", "2026-02-01", "Dépense", "loyer", 1, 2000, "general", {
    label: "Loyer terrain — février",
    payment_method: "Virement",
  }),
  tx("tx-tombola", "2026-02-14", "Revenu", "collecte", 1, 3200, "general", {
    label: "Tombola de la Saint-Valentin",
    payment_method: "Espèces",
  }),
  tx("tx-prime-victoire", "2026-03-05", "Dépense", "primes", 1, 1500, "equipe", {
    team_ids: ["team-seniors"],
    label: "Prime de victoire — derby",
    payment_method: "Espèces",
  }),

  /* ── Suivi budgétaire — mid-season activity that makes a few categories
     approach or cross their budget (feeds the Budget 2 dashboard alerts).
     Hébergement dépasse son budget, Eau & Énergie s'en approche, et Santé est
     engagée sans ligne prévue. ─────────────────────────────────────────────── */
  tx("tx-hotel-gafsa", "2026-02-08", "Dépense", "hebergement", 1, 2200, "equipe", {
    team_ids: ["team-seniors"],
    label: "Hôtel déplacement — Gafsa (2 nuits)",
    payment_method: "Virement",
    attachment: "hotel-gafsa-fev.pdf",
  }),
  tx("tx-hotel-stage-mars", "2026-03-14", "Dépense", "hebergement", 2, 1600, "equipe", {
    team_ids: ["team-seniors"],
    label: "Hôtel stage — préparation fin de saison",
    payment_method: "Virement",
  }),
  tx("tx-steg-hiver", "2026-01-31", "Dépense", "charges", 1, 1400, "general", {
    label: "Facture STEG — décembre & janvier",
    payment_method: "Chèque",
  }),
  tx("tx-sonede", "2026-02-20", "Dépense", "charges", 2, 980, "general", {
    label: "Facture SONEDE — 1er trimestre",
    payment_method: "Chèque",
  }),
  tx("tx-internet", "2026-03-01", "Dépense", "charges", 3, 620, "general", {
    label: "Abonnement internet & téléphonie",
    payment_method: "Carte",
  }),
  tx("tx-visite-medicale", "2026-01-25", "Dépense", "sante", 3, 700, "equipe", {
    team_ids: ["team-seniors"],
    label: "Visites médicales — reprise",
    payment_method: "Espèces",
  }),
]
