/**
 * Inscription par lien — how a family joins a catégorie.
 *
 * The éducateur generates a link for one catégorie and shares it (WhatsApp,
 * SMS…). Whoever opens it either signs in or creates an account, says whether
 * he is the joueur or a parent, and submits a request. Nothing is added to the
 * club's effectif until the éducateur approves it: a `DemandeInscription` is
 * the pending state between the two.
 *
 * The fiches are stored on the demande, not merged into `categories`, precisely
 * because they are not club members yet — approving is what promotes them.
 */

export type LienInscription = {
  id: string
  /** The URL segment shared with families: /rejoindre/<token>. */
  token: string
  categorieId: string
  /** Groupe proposed on the form; empty = the éducateur places him. */
  groupeId?: string
  /** "dd/mm/yyyy". */
  creeLe: string
  /** A revoked link still exists (for its history) but no longer opens. */
  actif: boolean
}

export type ProfilDemande = "joueur" | "parent"
export type StatutDemande = "en-attente" | "approuvee" | "refusee"

/** The player a request is about — a new fiche, or a joueur already known. */
export type FicheJoueur = {
  prenom: string
  nom: string
  /** "AAAA-MM-JJ". */
  naissance: string
  genre: "Masculin" | "Féminin"
  email?: string
  telephone?: string
  /** Poste code — see POSTE_LABEL in seed/categories.ts. */
  poste?: string
  niveau?: string
  /** Set when the request points at a joueur the club already has. */
  joueurId?: string
}

export type FicheParent = {
  prenom: string
  nom: string
  email: string
  telephone: string
}

export type DemandeInscription = {
  id: string
  categorieId: string
  /** The link it came through, when it came through one. */
  lienId?: string
  profil: ProfilDemande
  /** True when the requester had no account and created one in the flow. */
  nouveauCompte: boolean
  joueur: FicheJoueur
  /** Present when a parent submitted for his child. */
  parent?: FicheParent
  statut: StatutDemande
  /** "dd/mm/yyyy". */
  soumiseLe: string
  traiteeLe?: string
  /** Reason shown to the family when refused. */
  motif?: string
}

/** Today as "dd/mm/yyyy" — the stamp every seeded date in the app uses. */
export const aujourdhuiFr = () => {
  const n = new Date()
  const p = (x: number) => String(x).padStart(2, "0")
  return `${p(n.getDate())}/${p(n.getMonth() + 1)}/${n.getFullYear()}`
}

/** `n` days ago, same stamp — keeps the seeded requests recent whenever the
 *  prototype is opened, so the "sans réponse" reminder stays meaningful. */
const ilYA = (jours: number) => {
  const d = new Date()
  d.setDate(d.getDate() - jours)
  const p = (x: number) => String(x).padStart(2, "0")
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export const PROFIL_LABEL: Record<ProfilDemande, string> = {
  joueur: "Joueur",
  parent: "Parent",
}

export const STATUT_DEMANDE_LABEL: Record<StatutDemande, string> = {
  "en-attente": "En attente",
  approuvee: "Approuvée",
  refusee: "Refusée",
}

/** One link already live, so the éducateur screen opens on something real. */
export const liensInscriptionSeed: LienInscription[] = [
  {
    id: "lien-u13",
    token: "u13-2526",
    categorieId: "u13",
    creeLe: ilYA(6),
    actif: true,
  },
]

/**
 * Three requests waiting on the U13 éducateur, deliberately uneven: a joueur
 * who signed up alone, a parent registering a child, and one already refused —
 * so the screen shows its three states without anyone having to click.
 */
export const demandesInscriptionSeed: DemandeInscription[] = [
  {
    id: "dem-1",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "joueur",
    nouveauCompte: true,
    joueur: {
      prenom: "Rayan",
      nom: "Belkacem",
      naissance: "2013-04-18",
      genre: "Masculin",
      email: "rayan.belkacem@example.com",
      telephone: "+216 22 145 908",
      poste: "MOC",
      niveau: "Déjà licencié une saison",
    },
    statut: "en-attente",
    soumiseLe: ilYA(4),
  },
  {
    id: "dem-2",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    nouveauCompte: true,
    joueur: {
      prenom: "Mehdi",
      nom: "Sassi",
      naissance: "2013-11-02",
      genre: "Masculin",
      poste: "GB",
    },
    parent: {
      prenom: "Hana",
      nom: "Sassi",
      email: "hana.sassi@example.com",
      telephone: "+216 55 902 331",
    },
    statut: "en-attente",
    soumiseLe: ilYA(1),
  },
  {
    id: "dem-3",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    nouveauCompte: false,
    joueur: {
      prenom: "Idris",
      nom: "Khemiri",
      naissance: "2011-06-21",
      genre: "Masculin",
    },
    parent: {
      prenom: "Nadia",
      nom: "Khemiri",
      email: "nadia.khemiri@example.com",
      telephone: "+216 98 447 210",
    },
    statut: "refusee",
    soumiseLe: ilYA(7),
    traiteeLe: ilYA(6),
    motif: "Idris relève de la catégorie U15 cette saison — voyez avec Sami.",
  },
]
