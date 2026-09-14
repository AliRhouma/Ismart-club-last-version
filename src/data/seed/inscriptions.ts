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
 *
 * Two requests almost never mean the same work: creating a family from nothing
 * is not attaching a joueur who already exists, and neither is settling a
 * transfert. That is what `scenario` carries — see `SCENARIO_INFO`.
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

/**
 * What actually landed on the éducateur's desk. The profil says who typed the
 * request; the scenario says what it will cost him to accept it — which is the
 * only thing that changes his gesture.
 */
export type ScenarioDemande =
  /** Parent and child both unknown: two accounts to create. */
  | "creation-comptes"
  /** The child's email is already taken — the parent asks for a rattachement. */
  | "rattachement-compte"
  /** The child's fiche is already on the parent's account: nothing to create. */
  | "enfant-rattache"
  /** Several children sent in one go — one request each. */
  | "fratrie"
  /** A joueur signing himself up, without an account. */
  | "joueur-nouveau-compte"
  /** A joueur already on the platform joining this équipe. */
  | "joueur-compte-existant"
  /** Still licensed at another club. */
  | "transfert-club"
  /** His age points at a different catégorie — surclassement or wrong link. */
  | "changement-categorie"
  /** Same name and birthday as someone already in the effectif. */
  | "doublon-effectif"
  /** Came through a link since revoked or regenerated. */
  | "lien-revoque"

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
  /**
   * Poste code — see POSTE_LABEL in seed/categories.ts. Never asked of the
   * family: the éducateur sets it when he approves. It is only filled in
   * beforehand when the club already knows the joueur.
   */
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
  /** Which of the ten situations this is — decides the whole details modal. */
  scenario: ScenarioDemande
  /** True when the requester had no account and created one in the flow. */
  nouveauCompte: boolean
  joueur: FicheJoueur
  /** Present when a parent submitted for his child. */
  parent?: FicheParent
  /** Siblings sent in one go share this id; each is still decided on its own. */
  fratrieId?: string
  /** The account the request was sent from, when there was one. */
  compteEmail?: string
  /** The address that came back "déjà utilisée" — rattachement only. */
  emailConflit?: string
  /** The club still holding his licence — transfert only. */
  clubActuel?: string
  /** The catégorie his age actually points at — changement-categorie only. */
  categorieSuggereeId?: string
  /** A free note the family added to the request. */
  message?: string
  /** The groupe the éducateur placed him in when he approved. */
  groupeAffecteId?: string
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
 * Each scenario, told the way the éducateur needs to hear it: a two-word label
 * for the row, the one line that says why this request is not like the others,
 * the story behind it, and what approving actually commits him to.
 *
 * `ton` is the Badge variant: blue for "there is work to do", amber for "check
 * something first", red for "this might be wrong", plain for "nothing special".
 */
export type ScenarioInfo = {
  label: string
  /** One line, in the row, under the name. */
  resume: string
  /** What happened on the family's side, in the details modal. */
  recit: string
  /** What "Approuver" commits the club to. */
  aFaire: string[]
  ton: "default" | "info" | "warning" | "danger"
}

export const SCENARIO_INFO: Record<ScenarioDemande, ScenarioInfo> = {
  "creation-comptes": {
    label: "Comptes à créer",
    resume: "Le parent et l'enfant n'ont aucun compte — tout est à créer",
    recit:
      "Le parent a ouvert le lien sans compte iSmart Club. Il a créé le sien, puis rempli la fiche de son enfant dans la foulée. Ni l'un ni l'autre n'existe encore sur la plateforme : approuver, c'est les créer tous les deux d'un coup.",
    aFaire: [
      "Créer le compte du parent",
      "Créer la fiche du joueur et la rattacher à ce compte",
      "Ajouter le joueur à l'effectif de la catégorie",
    ],
    ton: "info",
  },
  "rattachement-compte": {
    label: "Rattachement",
    resume:
      "L'email de l'enfant est déjà pris : le parent demande à le rattacher",
    recit:
      "Le parent a déjà un compte. En créant la fiche de son enfant il est tombé sur « cet email est déjà utilisé » : une fiche joueur existe déjà à cette adresse. Plutôt que d'en créer une seconde, il demande à rattacher ce joueur à son compte, puis à rejoindre l'équipe.",
    aFaire: [
      "Vérifier qu'il s'agit bien du même joueur",
      "Rattacher la fiche existante au compte du parent",
      "Ajouter le joueur à l'effectif de la catégorie",
    ],
    ton: "warning",
  },
  "enfant-rattache": {
    label: "Enfant rattaché",
    resume: "La fiche de l'enfant est déjà sur le compte du parent",
    recit:
      "Le parent a un compte et la fiche de son enfant y est déjà rattachée. Il n'a rien eu à créer : il a choisi l'enfant dans sa liste et envoyé la demande. Rien à créer de votre côté non plus.",
    aFaire: [
      "Vérifier que l'âge correspond à la catégorie",
      "Ajouter le joueur à l'effectif",
    ],
    ton: "default",
  },
  fratrie: {
    label: "Fratrie",
    resume: "Plusieurs enfants envoyés ensemble — une demande par enfant",
    recit:
      "Le parent a sélectionné plusieurs enfants d'un coup dans la liste de son compte. Le lien les envoie en demandes séparées : chacune se valide ou se refuse pour elle-même, l'une peut partir en U13 et l'autre non.",
    aFaire: [
      "Traiter celle-ci comme une demande individuelle",
      "Ajouter le joueur à l'effectif",
      "Penser à traiter aussi la demande du frère ou de la sœur",
    ],
    ton: "info",
  },
  "joueur-nouveau-compte": {
    label: "Joueur sans compte",
    resume: "Le joueur s'inscrit lui-même et crée son compte",
    recit:
      "Le joueur a ouvert le lien seul, sans compte. Il a créé le sien et rempli sa propre fiche. Aucun parent n'est rattaché à la demande — le seul contact dont vous disposez est le sien.",
    aFaire: [
      "Créer le compte du joueur",
      "Ajouter le joueur à l'effectif",
      "Réclamer un contact parent s'il est mineur",
    ],
    ton: "info",
  },
  "joueur-compte-existant": {
    label: "Joueur déjà membre",
    resume: "Un joueur déjà sur la plateforme demande à rejoindre l'équipe",
    recit:
      "Le joueur a déjà un compte iSmart Club. Il s'est connecté, sa fiche s'est ouverte pré-remplie, il l'a confirmée. Ni compte ni fiche à créer : seule l'affectation à l'équipe manque.",
    aFaire: [
      "Vérifier la fiche existante",
      "Ajouter le joueur à l'effectif",
    ],
    ton: "default",
  },
  "transfert-club": {
    label: "Transfert",
    resume: "Le joueur est encore licencié dans un autre club",
    recit:
      "La fiche déclare une licence en cours dans un autre club. L'inscription ne sera définitive qu'une fois le transfert réglé : approuver ici lui réserve la place, la licence suivra.",
    aFaire: [
      "Demander la lettre de sortie du club actuel",
      "Réserver la place dans l'effectif",
      "Finaliser la licence auprès de la ligue",
    ],
    ton: "warning",
  },
  "changement-categorie": {
    label: "Hors catégorie",
    resume: "Sa date de naissance le place dans une autre catégorie",
    recit:
      "L'âge du joueur ne correspond pas à la catégorie du lien. C'est soit un lien envoyé par erreur, soit une demande de surclassement — dans les deux cas la décision vous revient, et elle engage l'autre éducateur.",
    aFaire: [
      "Confirmer la date de naissance",
      "Décider du surclassement, ou réorienter vers la bonne catégorie",
      "Prévenir l'éducateur de l'autre catégorie",
    ],
    ton: "warning",
  },
  "doublon-effectif": {
    label: "Doublon possible",
    resume: "Un joueur du même nom est déjà dans l'effectif",
    recit:
      "Les mêmes nom, prénom et date de naissance figurent déjà dans l'effectif de la catégorie. Soit la famille a envoyé sa demande deux fois, soit ce sont deux homonymes — approuver sans vérifier crée une seconde fiche pour la même personne.",
    aFaire: [
      "Comparer avec la fiche déjà présente",
      "Fusionner les deux fiches s'il s'agit de la même personne",
      "Refuser la demande si le joueur est déjà inscrit",
    ],
    ton: "danger",
  },
  "lien-revoque": {
    label: "Lien désactivé",
    resume: "Arrivée par un lien depuis désactivé ou régénéré",
    recit:
      "La demande est arrivée avant que le lien ne soit désactivé ou régénéré. Elle reste valable : c'est le lien qui a expiré, pas la demande — la famille attend toujours une réponse.",
    aFaire: [
      "Vérifier que la catégorie recrute encore",
      "Ajouter le joueur à l'effectif, ou refuser avec un motif",
    ],
    ton: "default",
  },
}

/** Filter order on the desk — the two that cost the most work come first. */
export const SCENARIOS = Object.keys(SCENARIO_INFO) as ScenarioDemande[]

/**
 * Links live on four catégories. U8's is deliberately revoked while a request
 * from it is still pending, and U13 carries a second, older one — the state an
 * éducateur meets after regenerating a link he had already shared.
 */
export const liensInscriptionSeed: LienInscription[] = [
  { id: "lien-u13", token: "u13-2526", categorieId: "u13", creeLe: ilYA(9), actif: true },
  { id: "lien-u13-ancien", token: "u13-ancien", categorieId: "u13", creeLe: ilYA(38), actif: false },
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
 *
 * U13 is the catégorie the demo opens on, so it carries one live example of
 * every scenario: the desk is only interesting when the ten of them are sitting
 * side by side and each asks for something different.
 */
export const demandesInscriptionSeed: DemandeInscription[] = [
  /* ── U13 — un exemple de chaque scénario ───────────────────────────────── */
  {
    // 1. Mère et enfant sans compte : les deux sont à créer.
    id: "dem-u13-1",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "creation-comptes",
    nouveauCompte: true,
    joueur: j("Mehdi", "Sassi", "2013-11-02", {
      adresse: "12 rue de Carthage",
      ville: "Tunis",
    }),
    parent: {
      ...p("Hana", "Sassi", "hana.sassi@example.com", "+216 55 902 331"),
      genre: "Mère",
      ville: "Tunis",
    },
    message: "Bonjour, nous venons d'emménager à Tunis, Mehdi est gardien.",
    statut: "en-attente",
    soumiseLe: ilYA(1),
  },
  {
    // 2. La mère a un compte ; l'email de l'enfant est déjà pris.
    id: "dem-u13-2",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "rattachement-compte",
    nouveauCompte: false,
    joueur: j("Aziz", "Ben Romdhane", "2013-02-27", {
      email: "aziz.benromdhane@example.com",
      niveau: "Vient du club de Radès",
    }),
    parent: {
      ...p(
        "Sonia",
        "Ben Romdhane",
        "sonia.benromdhane@example.com",
        "+216 71 480 226",
      ),
      genre: "Mère",
    },
    compteEmail: "sonia.benromdhane@example.com",
    emailConflit: "aziz.benromdhane@example.com",
    message:
      "Le site me dit que l'email d'Aziz est déjà utilisé — c'est bien mon fils, merci de le rattacher à mon compte.",
    statut: "en-attente",
    soumiseLe: ilYA(0),
  },
  {
    // 3. Le parent avait déjà créé la fiche : il ne demande que l'équipe.
    id: "dem-u13-3",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "enfant-rattache",
    nouveauCompte: false,
    joueur: j("Nassim", "Chedly", "2013-03-14", {
      ville: "La Marsa",
    }),
    parent: {
      ...p(
        "Sofiene",
        "Chedly",
        "sofiene.chedly@example.com",
        "+216 21 508 964",
      ),
      genre: "Père",
    },
    compteEmail: "sofiene.chedly@example.com",
    statut: "en-attente",
    soumiseLe: ilYA(2),
  },
  {
    // 4a / 4b. Deux frères envoyés en une fois, deux demandes distinctes.
    id: "dem-u13-4",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "fratrie",
    nouveauCompte: false,
    joueur: j("Ryad", "Gharsalli", "2013-09-08"),
    parent: {
      ...p(
        "Slim",
        "Gharsalli",
        "slim.gharsalli@example.com",
        "+216 23 660 471",
      ),
      genre: "Père",
    },
    fratrieId: "fratrie-gharsalli",
    compteEmail: "slim.gharsalli@example.com",
    message: "Mes deux garçons sont jumeaux, ils jouent toujours ensemble.",
    statut: "en-attente",
    soumiseLe: ilYA(3),
  },
  {
    id: "dem-u13-5",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "fratrie",
    nouveauCompte: false,
    joueur: j("Zied", "Gharsalli", "2013-09-08"),
    parent: {
      ...p(
        "Slim",
        "Gharsalli",
        "slim.gharsalli@example.com",
        "+216 23 660 471",
      ),
      genre: "Père",
    },
    fratrieId: "fratrie-gharsalli",
    compteEmail: "slim.gharsalli@example.com",
    message: "Mes deux garçons sont jumeaux, ils jouent toujours ensemble.",
    statut: "en-attente",
    soumiseLe: ilYA(3),
  },
  {
    // 5. Le joueur s'inscrit seul et crée son compte.
    id: "dem-u13-6",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "joueur",
    scenario: "joueur-nouveau-compte",
    nouveauCompte: true,
    joueur: j("Rayan", "Belkacem", "2013-04-18", {
      email: "rayan.belkacem@example.com",
      telephone: "+216 22 145 908",
      niveau: "Déjà licencié une saison",
    }),
    statut: "en-attente",
    soumiseLe: ilYA(5),
  },
  {
    // 6. Fiche au minimum, mais le compte existe déjà.
    id: "dem-u13-7",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "joueur",
    scenario: "joueur-compte-existant",
    nouveauCompte: false,
    joueur: j("Oussama", "Gharbi", "2013-08-05", {
      email: "o.gharbi@example.com",
    }),
    compteEmail: "o.gharbi@example.com",
    statut: "en-attente",
    soumiseLe: ilYA(8),
  },
  {
    // 7. Encore licencié ailleurs : la place se réserve, la licence suit.
    id: "dem-u13-8",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "transfert-club",
    nouveauCompte: true,
    joueur: j("Iyed", "Jaziri", "2013-01-23", {
      niveau: "Deux saisons en U11 puis U13",
      ville: "Ariana",
    }),
    parent: {
      ...p("Fathi", "Jaziri", "fathi.jaziri@example.com", "+216 50 224 806"),
      genre: "Père",
    },
    clubActuel: "Espérance Sportive de Tunis",
    message: "La lettre de sortie est demandée, nous l'aurons la semaine prochaine.",
    statut: "en-attente",
    soumiseLe: ilYA(4),
  },
  {
    // 8. Né en 2011 : c'est du U15, pas du U13.
    id: "dem-u13-9",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "changement-categorie",
    nouveauCompte: true,
    joueur: j("Tarek", "Haddad", "2011-03-09"),
    parent: {
      ...p("Olfa", "Haddad", "olfa.haddad@example.com", "+216 26 913 057"),
      genre: "Mère",
    },
    categorieSuggereeId: "u15",
    message: "C'est l'éducateur qui nous a envoyé ce lien, je ne sais pas si c'est le bon.",
    statut: "en-attente",
    soumiseLe: ilYA(6),
  },
  {
    // 9. Même nom, même date que u13-j4 : à vérifier avant d'ajouter.
    id: "dem-u13-10",
    categorieId: "u13",
    lienId: "lien-u13",
    profil: "parent",
    scenario: "doublon-effectif",
    nouveauCompte: true,
    joueur: j("Ilyes", "Bouzid", "2013-05-16"),
    parent: {
      ...p("Mounir", "Bouzid", "mounir.bouzid@example.com", "+216 97 105 338"),
      genre: "Père",
    },
    statut: "en-attente",
    soumiseLe: ilYA(7),
  },
  {
    // 10. Envoyée depuis l'ancien lien, avant la régénération.
    id: "dem-u13-11",
    categorieId: "u13",
    lienId: "lien-u13-ancien",
    profil: "joueur",
    scenario: "lien-revoque",
    nouveauCompte: true,
    joueur: j("Seif", "Bouaziz", "2013-07-30", {
      email: "seif.bouaziz@example.com",
      telephone: "+216 54 337 902",
    }),
    statut: "en-attente",
    soumiseLe: ilYA(12),
  },
  {
    // Déjà traitée — une famille entière créée la semaine dernière.
    // Un nom qui doit survivre à une ligne étroite.
    id: "dem-u13-12",
    categorieId: "u13",
    lienId: "lien-u13-ancien",
    profil: "parent",
    scenario: "creation-comptes",
    nouveauCompte: true,
    // Le poste et le groupe datent de l'approbation, pas de la demande.
    joueur: j("Nour Eddine", "Ben Abdallah Trabelsi", "2013-06-14", {
      poste: "DC",
    }),
    groupeAffecteId: "u13-groupe-a",
    parent: {
      ...p(
        "Mohamed Amine",
        "Ben Abdallah Trabelsi",
        "ma.benabdallah@example.com",
        "+216 98 336 741",
      ),
      genre: "Père",
    },
    statut: "approuvee",
    soumiseLe: ilYA(11),
    traiteeLe: ilYA(10),
  },
  {
    // Déjà traitée — le cas « hors catégorie » tranché dans l'autre sens.
    id: "dem-u13-13",
    categorieId: "u13",
    lienId: "lien-u13-ancien",
    profil: "parent",
    scenario: "changement-categorie",
    nouveauCompte: false,
    joueur: j("Idris", "Khemiri", "2011-06-21"),
    parent: {
      ...p(
        "Nadia",
        "Khemiri",
        "nadia.khemiri@example.com",
        "+216 98 447 210",
      ),
      genre: "Mère",
    },
    compteEmail: "nadia.khemiri@example.com",
    categorieSuggereeId: "u15",
    statut: "refusee",
    soumiseLe: ilYA(14),
    traiteeLe: ilYA(13),
    motif: "Idris relève de la catégorie U15 cette saison — voyez avec Sami.",
  },

  /* ── U10 ───────────────────────────────────────────────────────────────── */
  {
    id: "dem-u10-1",
    categorieId: "u10",
    lienId: "lien-u10",
    profil: "parent",
    scenario: "creation-comptes",
    nouveauCompte: true,
    joueur: j("Youssef", "Mejri", "2016-03-30"),
    parent: {
      ...p("Kais", "Mejri", "kais.mejri@example.com", "+216 24 771 059"),
      genre: "Père",
    },
    statut: "en-attente",
    soumiseLe: ilYA(2),
  },
  {
    id: "dem-u10-2",
    categorieId: "u10",
    lienId: "lien-u10",
    profil: "parent",
    scenario: "rattachement-compte",
    nouveauCompte: false,
    joueur: j("Skander", "Ayadi", "2016-09-12", {
      email: "skander.ayadi@example.com",
      niveau: "Première licence",
    }),
    parent: {
      ...p("Leïla", "Ayadi", "leila.ayadi@example.com", "+216 52 118 640"),
      genre: "Mère",
    },
    compteEmail: "leila.ayadi@example.com",
    emailConflit: "skander.ayadi@example.com",
    statut: "en-attente",
    soumiseLe: ilYA(6),
  },
  {
    id: "dem-u10-3",
    categorieId: "u10",
    lienId: "lien-u10",
    profil: "parent",
    scenario: "enfant-rattache",
    nouveauCompte: false,
    joueur: j("Malek", "Hamdi", "2016-01-08", { poste: "BU" }),
    groupeAffecteId: "u10-groupe-b",
    parent: {
      ...p("Rim", "Hamdi", "rim.hamdi@example.com", "+216 27 604 913"),
      genre: "Mère",
    },
    compteEmail: "rim.hamdi@example.com",
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
    scenario: "joueur-compte-existant",
    nouveauCompte: false,
    joueur: j("Firas", "Zouari", "2011-05-22", {
      email: "firas.zouari@example.com",
      telephone: "+216 20 559 174",
      niveau: "Trois saisons en U13 puis U15",
    }),
    compteEmail: "firas.zouari@example.com",
    statut: "en-attente",
    soumiseLe: ilYA(3),
  },
  {
    id: "dem-u15-2",
    categorieId: "u15",
    lienId: "lien-u15",
    profil: "joueur",
    scenario: "transfert-club",
    nouveauCompte: true,
    joueur: j("Anis", "Ben Slimane", "2011-10-03", {
      email: "anis.benslimane@example.com",
      telephone: "+216 53 220 887",
    }),
    clubActuel: "Club Africain",
    statut: "en-attente",
    soumiseLe: ilYA(0),
  },
  {
    // Oldest untouched request in the club — the reminder is the point.
    id: "dem-u15-3",
    categorieId: "u15",
    lienId: "lien-u15",
    profil: "parent",
    scenario: "creation-comptes",
    nouveauCompte: true,
    joueur: j("Wassim", "Chaabane", "2011-12-19"),
    parent: {
      ...p(
        "Hédi",
        "Chaabane",
        "hedi.chaabane@example.com",
        "+216 96 013 528",
      ),
      genre: "Père",
    },
    statut: "en-attente",
    soumiseLe: ilYA(13),
  },

  /* ── Minime ────────────────────────────────────────────────────────────── */
  {
    id: "dem-minime-1",
    categorieId: "minime",
    lienId: "lien-minime",
    profil: "parent",
    scenario: "creation-comptes",
    nouveauCompte: true,
    joueur: j("Jassem", "Louati", "2012-07-25"),
    parent: {
      ...p("Amel", "Louati", "amel.louati@example.com", "+216 58 447 302"),
      genre: "Mère",
    },
    statut: "en-attente",
    soumiseLe: ilYA(1),
  },
  {
    id: "dem-minime-2",
    categorieId: "minime",
    lienId: "lien-minime",
    profil: "joueur",
    scenario: "joueur-nouveau-compte",
    nouveauCompte: true,
    joueur: j("Bilel", "Mansouri", "2012-04-11", {
      email: "bilel.mansouri@example.com",
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
    scenario: "lien-revoque",
    nouveauCompte: true,
    joueur: j("Adam", "Ferchichi", "2018-02-16"),
    parent: {
      ...p(
        "Sarra",
        "Ferchichi",
        "sarra.ferchichi@example.com",
        "+216 29 882 145",
      ),
      genre: "Mère",
    },
    statut: "en-attente",
    soumiseLe: ilYA(4),
  },
]
