/**
 * Finance module — Demandes de transaction data slice.
 *
 * Before a dépense or a revenu is recorded, a staff member / coach SUBMITS a
 * request: same classification as a transaction (nature + groupe + sous-
 * catégorie + montant + date souhaitée) plus a motif and an optional pièce
 * jointe. The admin then approves or refuses it from Finance ▸ Transactions ▸
 * Demandes; the decision lands back on the requester's own page, in the
 * historique.
 *
 * The prototype does no real logic: approving a request only flips its status
 * (it does NOT create the transaction), and nothing is enforced on the amount.
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

import type { Nature } from "@/data/seed/finance"

/** Lifecycle of a request — pending until an admin decides. */
export type DemandeStatus = "en_attente" | "approuvee" | "refusee"

export const DEMANDE_STATUS_LABEL: Record<DemandeStatus, string> = {
  en_attente: "En attente",
  approuvee: "Approuvée",
  refusee: "Refusée",
}

export type TransactionRequest = {
  id: string
  /** Active season at submission (label). */
  season: string
  /** Staff member who submitted it (`staff-*`). */
  requester_id: string
  nature: Nature
  group_id: string
  subcategory_id: string
  /** Positive magnitude in TND; the sign/colour comes from `nature`. */
  amount: number
  /** ISO yyyy-mm-dd — the date the money is needed for. */
  date: string
  /** Why the request is made — shown to the admin who decides. */
  motif: string
  /** Filename of the attached devis / justificatif. */
  attachment?: string
  status: DemandeStatus
  /** ISO yyyy-mm-dd the request was submitted. */
  created_at: string
  /** ISO yyyy-mm-dd of the decision — absent while `en_attente`. */
  decided_at?: string
  /** Admin's note: the reason for a refusal, or a condition on an approval. */
  decision_note?: string
}

/** Shape the request form emits; the store fills id / season / status / dates. */
export type NewTransactionRequest = Omit<
  TransactionRequest,
  "id" | "season" | "status" | "created_at" | "decided_at" | "decision_note"
>

/**
 * A season of requests, deliberately varied so the historique reads as real on
 * first load: four still waiting on the admin, three approved (one with a
 * condition attached), two refused with an explicit reason, across both natures
 * and four different requesters.
 */
export const transactionRequestsSeed: TransactionRequest[] = [
  /* ── En attente ──────────────────────────────────────────────────────── */
  {
    id: "dem-ballons",
    season: "2025 / 2026",
    requester_id: "staff-karim",
    nature: "Dépense",
    group_id: "grp-equipement",
    subcategory_id: "sub-equipement-2",
    amount: 850,
    date: "2026-07-10",
    motif: "Renouvellement du lot de ballons pour la reprise des U17.",
    attachment: "devis-ballons.pdf",
    status: "en_attente",
    created_at: "2026-06-28",
  },
  {
    id: "dem-pharmacie",
    season: "2025 / 2026",
    requester_id: "staff-mehdi",
    nature: "Dépense",
    group_id: "grp-sante",
    subcategory_id: "sub-sante-2",
    amount: 320,
    date: "2026-07-08",
    motif: "Réassort de la trousse de premiers soins avant le tournoi.",
    status: "en_attente",
    created_at: "2026-06-30",
  },
  {
    id: "dem-bus-sousse",
    season: "2025 / 2026",
    requester_id: "staff-karim",
    nature: "Dépense",
    group_id: "grp-transport",
    subcategory_id: "sub-transport-1",
    amount: 1600,
    date: "2026-07-18",
    motif: "Bus pour le tournoi national U15 à Sousse (aller-retour).",
    attachment: "devis-transport-sousse.pdf",
    status: "en_attente",
    created_at: "2026-07-01",
  },
  {
    id: "dem-fournitures",
    season: "2025 / 2026",
    requester_id: "staff-sonia",
    nature: "Dépense",
    group_id: "grp-admin",
    subcategory_id: "sub-admin-1",
    amount: 145,
    date: "2026-07-06",
    motif: "Cartouches d'encre et ramettes de papier pour le secrétariat.",
    status: "en_attente",
    created_at: "2026-07-01",
  },

  /* ── Approuvées ──────────────────────────────────────────────────────── */
  {
    id: "dem-buvette",
    season: "2025 / 2026",
    requester_id: "staff-ahmed",
    nature: "Revenu",
    group_id: "grp-collecte",
    subcategory_id: "sub-collecte-2",
    amount: 1240,
    date: "2026-06-21",
    motif: "Recette de la buvette — tournoi de fin de saison.",
    attachment: "recette-buvette.pdf",
    status: "approuvee",
    created_at: "2026-06-22",
    decided_at: "2026-06-24",
  },
  {
    id: "dem-stage-hammamet",
    season: "2025 / 2026",
    requester_id: "staff-karim",
    nature: "Dépense",
    group_id: "grp-hebergement",
    subcategory_id: "sub-hebergement-2",
    amount: 4800,
    date: "2026-06-15",
    motif: "Stage de préparation U19 à Hammamet — 4 nuits, 22 joueurs.",
    attachment: "devis-hotel-hammamet.pdf",
    status: "approuvee",
    created_at: "2026-06-02",
    decided_at: "2026-06-05",
    decision_note:
      "Validé sur la base du devis à 4 800 TND. Toute nuitée supplémentaire fera l'objet d'une nouvelle demande.",
  },
  {
    id: "dem-licences",
    season: "2025 / 2026",
    requester_id: "staff-sonia",
    nature: "Dépense",
    group_id: "grp-competition",
    subcategory_id: "sub-competition-2",
    amount: 2150,
    date: "2026-06-10",
    motif: "Licences fédérales de la saison — 86 joueurs toutes catégories.",
    status: "approuvee",
    created_at: "2026-06-06",
    decided_at: "2026-06-08",
  },

  /* ── Refusées ────────────────────────────────────────────────────────── */
  {
    id: "dem-drone",
    season: "2025 / 2026",
    requester_id: "staff-mehdi",
    nature: "Dépense",
    group_id: "grp-equipement",
    subcategory_id: "sub-equipement-3",
    amount: 3400,
    date: "2026-05-30",
    motif:
      "Drone de captation vidéo pour l'analyse des séances et des matchs à domicile.",
    attachment: "comparatif-drones.pdf",
    status: "refusee",
    created_at: "2026-05-18",
    decided_at: "2026-05-24",
    decision_note:
      "Hors enveloppe équipement pour cette saison. À représenter au budget 2026 / 2027.",
  },
  {
    id: "dem-repas-gala",
    season: "2025 / 2026",
    requester_id: "staff-ahmed",
    nature: "Dépense",
    group_id: "grp-restauration",
    subcategory_id: "sub-restauration-1",
    amount: 1900,
    date: "2026-05-12",
    motif: "Repas de gala de fin de saison pour le staff et les partenaires.",
    status: "refusee",
    created_at: "2026-05-04",
    decided_at: "2026-05-07",
    decision_note: "Montant trop élevé — proposer une formule à 1 000 TND maximum.",
  },
]
