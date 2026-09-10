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

/**
 * The club running the platform. It only surfaces in the invitation a family
 * reads, so one constant is enough — change it here and every message follows.
 */
export const CLUB_NOM = "Real Madrid Football Club"

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
  adresse?: string
  ville?: string
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
  adresse?: string
  ville?: string
  /** "AAAA-MM-JJ". */
  naissance?: string
  /** Père / Mère — it also settles how the club addresses him. */
  genre?: "Père" | "Mère"
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

/**
 * Links live on four catégories. U8's is deliberately revoked while a request
 * from it is still pending — the state an éducateur meets after regenerating.
 */
export const liensInscriptionSeed: LienInscription[] = [
  { id: "lien-u13", token: "u13-2526", categorieId: "u13", creeLe: ilYA(9), actif: true },
  { id: "lien-u10", token: "u10-2526", categorieId: "u10", creeLe: ilYA(21), actif: true },
  { id: "lien-u15", token: "u15-2526", categorieId: "u15", creeLe: ilYA(14), actif: true },
  { id: "lien-minime", token: "minime-2526", categorieId: "minime", creeLe: ilYA(30), actif: true },
  { id: "lien-u8", token: "u8-ancien", categorieId: "u8", creeLe: ilYA(45), actif: false },
]

/* Fiches are written out rather than generated: a seed that reads like a real
   week is the point, and a loop would give fifteen identical rows. */
const j = (
  prenom: string,
  nom: string,
  naissance: string,
  extra: Partial<FicheJoueur> = {},
): FicheJoueur => ({ prenom, nom, naissance, genre: "Masculin", ...extra })

const p = (
  prenom: string,
  nom: string,
  email: string,
  telephone: string,
): FicheParent => ({ prenom, nom, email, telephone })

/**
 * A fortnight of inscriptions across five catégories, deliberately uneven:
 * mostly pending (that is the state the desk exists for), a couple already
 * decided, ages that match their catégorie, and the edge cases a real inbox
 * has — a fiche filled in to the minimum, a name too long for its row, a
 * request older than the reminder threshold, one that arrived this morning.
 */
export const demandesInscriptionSeed: DemandeInscription[] = [
  /* ── U13 — the catégorie the demo opens on ─────────────────────────────── */
  {
    id: "dem-u13-1",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "joueur",
    nouveauCompte: true,
    joueur: j("Rayan", "Belkacem", "2013-04-18", {
      email: "rayan.belkacem@example.com",
      telephone: "+216 22 145 908",
      poste: "MOC",
      niveau: "Déjà licencié une saison",
    }),
    statut: "en-attente",
    soumiseLe: ilYA(5),
  },
  {
    id: "dem-u13-2",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    nouveauCompte: true,
    joueur: j("Mehdi", "Sassi", "2013-11-02", { poste: "GB" }),
    parent: p("Hana", "Sassi", "hana.sassi@example.com", "+216 55 902 331"),
    statut: "en-attente",
    soumiseLe: ilYA(1),
  },
  {
    id: "dem-u13-3",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    nouveauCompte: false,
    joueur: j("Aziz", "Ben Romdhane", "2013-02-27", {
      poste: "AD",
      niveau: "Vient du club de Radès",
    }),
    parent: p(
      "Sonia",
      "Ben Romdhane",
      "sonia.benromdhane@example.com",
      "+216 71 480 226",
    ),
    statut: "en-attente",
    soumiseLe: ilYA(0),
  },
  {
    // Minimum viable fiche: no poste, no niveau, no phone — it happens.
    id: "dem-u13-4",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "joueur",
    nouveauCompte: false,
    joueur: j("Oussama", "Gharbi", "2013-08-05", {
      email: "o.gharbi@example.com",
    }),
    statut: "en-attente",
    soumiseLe: ilYA(8),
  },
  {
    // A name that has to survive a narrow row.
    id: "dem-u13-5",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    nouveauCompte: true,
    joueur: j("Nour Eddine", "Ben Abdallah Trabelsi", "2013-06-14", {
      poste: "DC",
    }),
    parent: p(
      "Mohamed Amine",
      "Ben Abdallah Trabelsi",
      "ma.benabdallah@example.com",
      "+216 98 336 741",
    ),
    statut: "approuvee",
    soumiseLe: ilYA(11),
    traiteeLe: ilYA(10),
  },
  {
    id: "dem-u13-6",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    nouveauCompte: false,
    joueur: j("Idris", "Khemiri", "2011-06-21"),
    parent: p(
      "Nadia",
      "Khemiri",
      "nadia.khemiri@example.com",
      "+216 98 447 210",
    ),
    statut: "refusee",
    soumiseLe: ilYA(12),
    traiteeLe: ilYA(11),
    motif: "Idris relève de la catégorie U15 cette saison — voyez avec Sami.",
  },

  /* ── U10 ───────────────────────────────────────────────────────────────── */
  {
    id: "dem-u10-1",
    categorieId: "u10",
    lienId: "lien-u10",
    profil: "parent",
    nouveauCompte: true,
    joueur: j("Youssef", "Mejri", "2016-03-30", { poste: "AD" }),
    parent: p("Kais", "Mejri", "kais.mejri@example.com", "+216 24 771 059"),
    statut: "en-attente",
    soumiseLe: ilYA(2),
  },
  {
    id: "dem-u10-2",
    categorieId: "u10",
    lienId: "lien-u10",
    profil: "parent",
    nouveauCompte: true,
    joueur: j("Skander", "Ayadi", "2016-09-12", {
      niveau: "Première licence",
    }),
    parent: p("Leïla", "Ayadi", "leila.ayadi@example.com", "+216 52 118 640"),
    statut: "en-attente",
    soumiseLe: ilYA(6),
  },
  {
    id: "dem-u10-3",
    categorieId: "u10",
    lienId: "lien-u10",
    profil: "parent",
    nouveauCompte: false,
    joueur: j("Malek", "Hamdi", "2016-01-08", { poste: "BU" }),
    parent: p("Rim", "Hamdi", "rim.hamdi@example.com", "+216 27 604 913"),
    statut: "approuvee",
    soumiseLe: ilYA(19),
    traiteeLe: ilYA(18),
  },

  /* ── U15 ───────────────────────────────────────────────────────────────── */
  {
    id: "dem-u15-1",
    categorieId: "u15",
    lienId: "lien-u15",
    profil: "joueur",
    nouveauCompte: false,
    joueur: j("Firas", "Zouari", "2011-05-22", {
      email: "firas.zouari@example.com",
      telephone: "+216 20 559 174",
      poste: "DC",
      niveau: "Trois saisons en U13 puis U15",
    }),
    statut: "en-attente",
    soumiseLe: ilYA(3),
  },
  {
    id: "dem-u15-2",
    categorieId: "u15",
    lienId: "lien-u15",
    profil: "joueur",
    nouveauCompte: true,
    joueur: j("Anis", "Ben Slimane", "2011-10-03", {
      email: "anis.benslimane@example.com",
      telephone: "+216 53 220 887",
      poste: "LG",
    }),
    statut: "en-attente",
    soumiseLe: ilYA(0),
  },
  {
    // Oldest untouched request in the club — the reminder is the point.
    id: "dem-u15-3",
    categorieId: "u15",
    lienId: "lien-u15",
    profil: "parent",
    nouveauCompte: true,
    joueur: j("Wassim", "Chaabane", "2011-12-19", { poste: "MDC" }),
    parent: p(
      "Hédi",
      "Chaabane",
      "hedi.chaabane@example.com",
      "+216 96 013 528",
    ),
    statut: "en-attente",
    soumiseLe: ilYA(13),
  },

  /* ── Minime ────────────────────────────────────────────────────────────── */
  {
    id: "dem-minime-1",
    categorieId: "minime",
    lienId: "lien-minime",
    profil: "parent",
    nouveauCompte: true,
    joueur: j("Jassem", "Louati", "2012-07-25", { poste: "AG" }),
    parent: p("Amel", "Louati", "amel.louati@example.com", "+216 58 447 302"),
    statut: "en-attente",
    soumiseLe: ilYA(1),
  },
  {
    id: "dem-minime-2",
    categorieId: "minime",
    lienId: "lien-minime",
    profil: "joueur",
    nouveauCompte: true,
    joueur: j("Bilel", "Mansouri", "2012-04-11", {
      email: "bilel.mansouri@example.com",
      poste: "BU",
    }),
    statut: "refusee",
    soumiseLe: ilYA(16),
    traiteeLe: ilYA(15),
    motif:
      "Groupes complets en Minime. Rappelez-nous en janvier, une place se libère souvent à la trêve.",
  },

  /* ── U8 — arrivée par un lien depuis révoqué ───────────────────────────── */
  {
    id: "dem-u8-1",
    categorieId: "u8",
    lienId: "lien-u8",
    profil: "parent",
    nouveauCompte: true,
    joueur: j("Adam", "Ferchichi", "2018-02-16"),
    parent: p(
      "Sarra",
      "Ferchichi",
      "sarra.ferchichi@example.com",
      "+216 29 882 145",
    ),
    statut: "en-attente",
    soumiseLe: ilYA(4),
  },
]
