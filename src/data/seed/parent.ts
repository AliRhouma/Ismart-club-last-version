/**
 * Espace parent — seed for the third space of the prototype.
 *
 * A parent signs in for the FAMILY, not for one child: Nadia Khemiri follows
 * three boys spread over three catégories. The space therefore has an active
 * child (the one every screen is scoped to, switched from the accueil) and a
 * family-wide "aujourd'hui" read across all of them.
 *
 * The three boys are real rows of the club's effectif (`u10-j7`, `u13-j15`,
 * `u8-j12` in `seed/categories.ts`), so both sides of the product line up: the
 * coach sees Taha Khemiri in the U10 roster, his mother sees the same boy here.
 *
 * Everything the screens show as a number (taux de présence, matchs joués,
 * buts) is DERIVED from `parentEventsSeed` in render — never stored.
 */

import { todayISO } from "@/lib/format"
import type { EventType } from "@/data/seed/events"
import type { ProcedeBlock } from "@/data/seed/seances"
import { TACTIC_IMG } from "@/data/seed/matches"

/** The parent's answer to a convocation. Past rows carry the recorded truth. */
export type ParentReponse = "attente" | "present" | "absent"

/**
 * One exercise of a séance, as the family sees it on the fiche.
 *
 * The three first fields are the summary line of the déroulé; everything below
 * is the éducateur's published detail — the same procédé the club reads on its
 * own fiche (`seed/seances.ts`), which is why the blocks reuse the club's
 * `ProcedeBlock` shape. All optional: a procédé the éducateur hasn't detailed
 * yet shows the summary alone.
 */
export type ParentProcede = {
  nom: string
  /** "20 min" — plain string, the fiche only displays it. */
  duree: string
  theme: string
  /** FIFA-card family tag the club tags its exercises with ("TEC", "PHY"…). */
  fifaCard?: string
  /** Work structure, e.g. "3*4 minutes". */
  sequence?: string
  /** Recovery between reps, in seconds — plain string. */
  recuperation?: string
  /** Schéma of the exercise (content image, not fetched through the store). */
  image?: string
  /** Objectif, organisation, consignes… — the éducateur's own words. */
  blocks?: ProcedeBlock[]
}

/**
 * One criterion of the club's evaluation grille, already scored for the child.
 * `code` is the three-letter tile the club prints on the carte joueur ("PHY").
 */
export type ParentCritere = {
  code: string
  label: string
  /** The éducateur's note. */
  note: number
  /** Barème — the club grades everything sur 100. */
  sur: number
  /** Feeds the child's carte joueur (a criterion can be graded without it). */
  carteJoueur?: boolean
  /** What the éducateur attached to justify the note — vidéo, PDF, photo. */
  documents?: string[]
  /** His own words on that criterion, when he wrote them. */
  commentaire?: string
}

/**
 * The club's evaluation model as the FAMILY reads it: the header says which
 * grille the éducateur used, the criteria carry the child's notes. The parent
 * never edits any of it — the back-office owns the model, the fiche shows the
 * published result.
 */
export type ParentEvaluation = {
  /** "Évaluation Carte Joueur & Groupe" — the model's name. */
  nom: string
  /** Type d'évaluation — "Évaluation privée des joueurs". */
  type: string
  /** Domaine d'évaluation — what the grille covers. */
  domaine: string
  /** "Modèle Joueur de champ", "Modèle Gardien". */
  modele: string
  /** Privée: visible by this family only, never par le groupe. */
  privee?: boolean
  criteres: ParentCritere[]
}

/** Séance-only payload — what the fiche of a séance shows. */
export type ParentSeanceInfo = {
  educateur: string
  /** "Tenue d'entraînement + protège-tibias". */
  tenue: string
  objectifs: string[]
  procedes: ParentProcede[]
  /** Written after the séance, addressed to the family. */
  bilan?: string
  /** The scored grille behind the bilan — the club's évaluation. */
  evaluation?: ParentEvaluation
}

/** Réunion-only payload — a parents' meeting has an agenda, not a programme. */
export type ParentReunionInfo = {
  anime: string
  ordreDuJour: string[]
  /** Some meetings ask the child to come too. */
  enfantAttendu?: boolean
  compteRendu?: string
}

/** What happened at a minute of a played match ("nous" = the club's side). */
export type ParentFaitKind = "but" | "jaune" | "rouge" | "changement"

export type ParentFaitDeMatch = {
  /** "12'" — display only. */
  minute: string
  kind: ParentFaitKind
  /** Main actor — buteur, joueur averti, joueur entrant. */
  label: string
  /** Second line — passeur, motif, joueur remplacé. */
  detail?: string
  nous: boolean
}

/** One instruction the coach published before the match. */
export type ParentConsigne = {
  titre: string
  /** Tactical board shown on the card — the club's own consigne visual. */
  image: string
  /** "Toute l'équipe", "Défenseurs & milieux", "Coach → Taha"… */
  audience: string
  /** Addressed to the child himself — highlighted on the fiche. */
  personal?: boolean
  detail?: string
}

/** How the group answered the convocation — the club's tally. */
export type ParentEffectifConvocation = {
  acceptes: number
  refuses: number
  attente: number
  total: number
}

/** The child's full line on a played match (the coach's feuille de match). */
export type ParentMatchStats = {
  tirs: number
  tirsCadres: number
  passes: number
  /** 0-100. */
  precisionPasses: number
  ballonsRecuperes: number
  duelsGagnes: number
  duelsTotal: number
  jaunes: number
  rouges: number
}

/** Match-only payload of a parent event. */
export type ParentMatchInfo = {
  adversaire: string
  /** Played at the club's ground. */
  domicile: boolean
  competition: string
  /** Set once the match has been played (drives the results tab). */
  termine: boolean
  butsPour?: number
  butsContre?: number
  /** False when the child stayed on the bench — an honest edge case. */
  joue?: boolean
  minutes?: number
  buts?: number
  passes?: number
  /** Coach's out-of-10 rating, when he graded the child. */
  note?: number
  /** The coach's note addressed to the family after the match. */
  commentaire?: string
  /** La grille que l'éducateur a remplie après la rencontre. */
  evaluation?: ParentEvaluation
  /* Convocation — before the game. */
  /** Meeting time at the ground, always earlier than the kickoff. */
  rdv?: string
  tenue?: string
  transport?: string
  /** Where the coach plans to use him. */
  poste?: string
  titulaire?: boolean
  consignes?: ParentConsigne[]
  /** Where the group stands on the convocation — read-only for the family. */
  effectif?: ParentEffectifConvocation
  /* After the game. */
  faits?: ParentFaitDeMatch[]
  /** The child's detailed line — shown on the "Sa performance" tab. */
  stats?: ParentMatchStats
}

export type ParentEvent = {
  id: string
  /** The child this event belongs to (see `parentEnfantsSeed`). */
  enfantId: string
  type: EventType
  /** ISO day, "YYYY-MM-DD". */
  date: string
  /** "HH:mm". */
  start: string
  /** "HH:mm" — optional (a séance often shows only a start). */
  end?: string
  title: string
  /** Second line: the séance objective, or "U10 vs AS Marsa". */
  detail?: string
  location?: string
  /** Team the child trains with — "U10 · Groupe A". */
  categorie: string
  reponse: ParentReponse
  seance?: ParentSeanceInfo
  reunion?: ParentReunionInfo
  match?: ParentMatchInfo
}

/* ── Les grilles d'évaluation du club ───────────────────────────────────── */

/** Modèle Joueur de champ — les six critères de la carte joueur. */
const MODELE_JOUEUR = [
  { code: "PHY", label: "Qualité physique" },
  { code: "PAS", label: "Qualité de passe" },
  { code: "VIT", label: "Vitesse" },
  { code: "DRI", label: "Qualité de dribble" },
  { code: "DEF", label: "Qualité défensive" },
  { code: "TIR", label: "Qualité de tir" },
]

/** Modèle Gardien — un gardien n'est pas noté sur le dribble. */
const MODELE_GARDIEN = [
  { code: "PLO", label: "Plongeon" },
  { code: "REF", label: "Réflexes" },
  { code: "MAI", label: "Maîtrise aérienne" },
  { code: "POS", label: "Placement" },
  { code: "PIE", label: "Jeu au pied" },
  { code: "DET", label: "Détente" },
]

/**
 * Applique les notes d'un éducateur à un modèle — tout est noté sur 100 et
 * compte pour la carte joueur, sauf ce que `extras` vient corriger critère par
 * critère (un commentaire, une pièce jointe, un critère hors carte).
 */
function grille(
  modele: { code: string; label: string }[],
  notes: number[],
  extras: Record<string, Partial<ParentCritere>> = {},
): ParentCritere[] {
  return modele.map((critere, i) => ({
    ...critere,
    note: notes[i],
    sur: 100,
    carteJoueur: true,
    ...extras[critere.code],
  }))
}

/** Le critère de groupe que le club ajoute à sa grille — hors carte joueur. */
const COMPORTEMENT = (note: number, commentaire: string): ParentCritere => ({
  code: "GRP",
  label: "Comportement en groupe",
  note,
  sur: 100,
  carteJoueur: false,
  commentaire,
})

/**
 * Les schemas que le club dessine pour ses procedes (bibliotheque tactique du
 * back-office). La fiche parent en attribue un a chaque procede qui n'a pas
 * d'image publiee — pioche par le nom de l'exercice, donc stable d'un rendu a
 * l'autre.
 */
export const PROCEDE_SCHEMAS = [
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1757070085626-214058553.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1757498258083-155344962.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1757503647815-346001130.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1758661660138-200047750.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1758661871734-65810280.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1759941814734-165270714.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761666361994-890610436.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761668274715-56245834.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761747316874-653387628.png",
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761909307382-519687286.png",
]

/** A child the signed-in parent follows. */
export type ParentEnfant = {
  /** Same id as the joueur in the club's effectif. */
  id: string
  nom: string
  categorie: string
  groupe: string
  /** Poste code — see POSTE_LABEL in seed/categories.ts. */
  poste: string
  posteLabel: string
  numero: number
  /** "AAAA-MM-JJ". */
  naissance: string
  educateur: string
  /** Licence number — rendered in mono, like every other ID in the app. */
  licence: string
  /** Since when the club has him — the youngest just arrived. */
  depuis: string
}

/**
 * The three Khemiri boys. Deliberately uneven: Taha has a full season behind
 * him, Rayan is the eldest and scores, Aziz has just joined (no match played
 * yet) — so the space's empty states are reachable by switching child.
 */
export const parentEnfantsSeed: ParentEnfant[] = [
  {
    id: "u10-j7",
    nom: "Taha Khemiri",
    categorie: "U10",
    groupe: "Groupe A",
    poste: "MDC",
    posteLabel: "Milieu défensif",
    numero: 6,
    naissance: "2016-03-11",
    educateur: "Nabil Ayari",
    licence: "TN-2026-U10-0074",
    depuis: "Septembre 2024",
  },
  {
    id: "u13-j15",
    nom: "Rayan Khemiri",
    categorie: "U13",
    groupe: "Groupe A",
    poste: "AT",
    posteLabel: "Attaquant",
    numero: 9,
    naissance: "2013-06-02",
    educateur: "Nabil Ayari",
    licence: "TN-2026-U13-0121",
    depuis: "Septembre 2022",
  },
  {
    id: "u8-j12",
    nom: "Aziz Khemiri",
    categorie: "U8",
    groupe: "Groupe A",
    poste: "GB",
    posteLabel: "Gardien",
    numero: 1,
    naissance: "2018-11-27",
    educateur: "Leila Mansour",
    licence: "TN-2026-U8-0212",
    depuis: "Août 2026",
  },
]

/** The child the space opens on. */
export const parentEnfantSeed: ParentEnfant = parentEnfantsSeed[0]

const CAT_U10 = "U10 · Groupe A"
const CAT_U13 = "U13 · Groupe A"
const CAT_U8 = "U8 · Groupe A"

/**
 * Today's rows are anchored to the real day so the accueil's "Aujourd'hui"
 * block is never empty during a demo — the rest of the agenda stays on fixed
 * dates around Août 2026, like every other seed of the prototype.
 */
const TODAY = todayISO()

/* ── Taha · U10 — une saison complète derrière lui ──────────────────────── */

const tahaEvents: ParentEvent[] = [
  {
    id: "pev-s-01",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-07-14",
    start: "17:30",
    end: "19:00",
    title: "Séance 12",
    detail: "Conduite de balle et prise d'information",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "present",
    seance: {
      educateur: "Nabil Ayari",
      tenue: "Tenue d'entraînement + protège-tibias",
      objectifs: ["Lever la tête avant de recevoir", "Conduire en sécurité"],
      procedes: [
        {
          nom: "Échauffement — carré de passes",
          duree: "15 min",
          theme: "Technique",
          fifaCard: "TEC",
          sequence: "3*4 minutes",
          recuperation: "60",
          image: "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761666361994-890610436.png",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Mettre le corps en route et retrouver la qualité de passe au sol avant les ateliers.",
            },
            {
              kind: "list",
              heading: "Organisation",
              items: [
                "Carré de 12 m sur 12 m, un joueur à chaque coin.",
                "Un ballon par carré, deux carrés en parallèle.",
                "Rotation après chaque série de 4 minutes.",
              ],
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "Passe à droite, puis on suit son ballon.",
                "Deux touches maximum : contrôle orienté puis passe.",
                "Appeler le ballon à la voix avant de le recevoir.",
              ],
            },
            {
              kind: "paragraph",
              heading: "Ce que l'éducateur regarde",
              text: "La tête qui se lève avant la réception, et le pied d'appui orienté vers la cible.",
            },
          ],
        },
        {
          nom: "Conduite en slalom, deux appuis",
          duree: "25 min",
          theme: "Technique",
          fifaCard: "TEC",
          sequence: "4*5 minutes",
          recuperation: "90",
          image: "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761747316874-653387628.png",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Conduire le ballon en sécurité, sans le regarder en permanence, et changer d'appui au bon moment.",
            },
            {
              kind: "list",
              heading: "Organisation",
              items: [
                "Deux couloirs de 20 m, 6 plots espacés de 3 m.",
                "Deux colonnes de 5 joueurs, départ au sifflet.",
                "Un ballon par joueur.",
              ],
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "Petites touches de balle entre les plots, ballon près du pied.",
                "Extérieur du pied à l'aller, intérieur au retour.",
                "Relever la tête à chaque plot pour lire la couleur annoncée.",
              ],
            },
            {
              kind: "table",
              heading: "Progression sur la série",
              head: ["Série", "Contrainte", "Durée"],
              rows: [
                ["1", "Pied fort, libre", "5 min"],
                ["2", "Pied faible", "5 min"],
                ["3", "Alternance des deux pieds", "5 min"],
                ["4", "En opposition, deux colonnes", "5 min"],
              ],
            },
          ],
        },
        {
          nom: "Jeu réduit 4 contre 4",
          duree: "30 min",
          theme: "Jeu",
          fifaCard: "JEU",
          sequence: "5*5 minutes",
          recuperation: "60",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Réinvestir la conduite dans le jeu : garder le ballon sous pression et trouver le partenaire libre.",
            },
            {
              kind: "list",
              heading: "Organisation",
              items: [
                "Terrain de 30 m sur 20 m, deux petits buts.",
                "Trois équipes de 4, l'équipe au repos récupère et relance les ballons.",
                "Match de 5 minutes, l'équipe qui gagne reste.",
              ],
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "But refusé si personne n'a conduit le ballon avant la passe décisive.",
                "On joue à trois touches maximum dans sa moitié.",
                "Tout le monde revient derrière la ligne du ballon à la perte.",
              ],
            },
          ],
        },
      ],
      bilan: "Séance appliquée. Taha a bien joué en une touche sur la fin.",
      evaluation: {
        nom: "Évaluation Carte Joueur & Groupe",
        type: "Évaluation privée des joueurs",
        domaine: "Technique & athlétique",
        modele: "Modèle Joueur de champ",
        privee: true,
        criteres: [
          ...grille(MODELE_JOUEUR, [72, 81, 66, 63, 77, 58], {
            PAS: {
              commentaire:
                "Sa qualité première : il voit la passe avant de recevoir.",
              documents: ["Séquence vidéo — jeu en une touche (2:10)"],
            },
            TIR: {
              commentaire: "Frappe rarement. À provoquer davantage.",
            },
          }),
          COMPORTEMENT(
            88,
            "Écoute les consignes et les répète aux plus jeunes du groupe.",
          ),
        ],
      },
    },
  },
  {
    id: "pev-s-02",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-07-21",
    start: "17:30",
    end: "19:00",
    title: "Séance 13",
    detail: "Passer et se déplacer — jeu à trois",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "absent",
    seance: {
      educateur: "Nabil Ayari",
      tenue: "Tenue d'entraînement + protège-tibias",
      objectifs: ["Donner et bouger", "Occuper les trois couloirs"],
      procedes: [
        { nom: "Passe et suit, deux ateliers", duree: "20 min", theme: "Technique" },
        { nom: "Jeu à trois dans un couloir", duree: "25 min", theme: "Jeu" },
        { nom: "Match à thème 6 contre 6", duree: "25 min", theme: "Jeu" },
      ],
    },
  },
  {
    id: "pev-m-01",
    enfantId: "u10-j7",
    type: "match",
    date: "2026-07-25",
    start: "09:30",
    end: "11:00",
    title: "Match — Championnat U10",
    detail: "U10 vs AS Marsa",
    location: "Stade municipal",
    categorie: CAT_U10,
    reponse: "present",
    match: {
      adversaire: "AS Marsa",
      domicile: true,
      competition: "Championnat U10",
      termine: true,
      butsPour: 3,
      butsContre: 1,
      joue: true,
      minutes: 40,
      buts: 1,
      passes: 1,
      note: 8,
      rdv: "08:45",
      tenue: "Maillot domicile, short blanc",
      transport: "Rendez-vous directement au stade",
      poste: "Milieu défensif",
      titulaire: true,
      commentaire:
        "Très bon match de Taha : beaucoup de ballons récupérés et un but sur coup franc. Continuez à l'encourager.",
      evaluation: {
        nom: "Évaluation Carte Joueur & Groupe",
        type: "Évaluation privée des joueurs",
        domaine: "Match — Championnat U10",
        modele: "Modèle Joueur de champ",
        privee: true,
        criteres: [
          ...grille(MODELE_JOUEUR, [74, 84, 68, 62, 80, 71], {
            DEF: {
              commentaire:
                "Sept ballons récupérés : il a tenu son couloir toute la première période.",
              documents: ["Séquence vidéo — récupérations (1:45)"],
            },
            TIR: {
              commentaire: "Le coup franc de la 28e récompense son travail de frappe.",
              documents: ["Photo — le coup franc"],
            },
            DRI: { commentaire: "Reste son axe de progrès : il élimine peu." },
          }),
          COMPORTEMENT(
            90,
            "A encouragé ses partenaires après le but encaissé, sans se plaindre de l'arbitrage.",
          ),
        ],
      },
      consignes: [
        {
          titre: "Bloc médian — ne pas monter trop haut",
          image: TACTIC_IMG,
          audience: "Toute l'équipe",
        },
        {
          titre: "Sa mission : couper les passes dans l'axe",
          image: TACTIC_IMG,
          audience: "Coach → Taha",
          personal: true,
          detail: "Rester entre les deux milieux adverses et attaquer le ballon.",
        },
      ],
      faits: [
        {
          minute: "12'",
          kind: "but",
          label: "Adam Ben Salah",
          detail: "Passe décisive · Taha Khemiri",
          nous: true,
        },
        {
          minute: "28'",
          kind: "but",
          label: "Taha Khemiri",
          detail: "Coup franc direct",
          nous: true,
        },
        { minute: "35'", kind: "but", label: "AS Marsa", detail: "Contre-attaque", nous: false },
        { minute: "44'", kind: "jaune", label: "AS Marsa", detail: "Faute sur Taha Khemiri", nous: false },
        {
          minute: "48'",
          kind: "but",
          label: "Karim Jebali",
          detail: "Passe décisive · Adam Ben Salah",
          nous: true,
        },
        {
          minute: "55'",
          kind: "changement",
          label: "Nadhir Mrabet",
          detail: "Entre à la place de Taha Khemiri",
          nous: true,
        },
      ],
      stats: {
        tirs: 3,
        tirsCadres: 2,
        passes: 34,
        precisionPasses: 82,
        ballonsRecuperes: 7,
        duelsGagnes: 6,
        duelsTotal: 9,
        jaunes: 0,
        rouges: 0,
      },
    },
  },
  {
    id: "pev-s-03",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-07-28",
    start: "17:30",
    end: "19:00",
    title: "Séance 14",
    detail: "Frappe et finition dans la surface",
    location: "Terrain A",
    categorie: CAT_U10,
    reponse: "present",
  },
  {
    id: "pev-s-04",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-08-04",
    start: "17:30",
    end: "19:00",
    title: "Séance 15",
    detail: "Défendre en zone — coulissement",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "present",
    seance: {
      educateur: "Nabil Ayari",
      tenue: "Tenue d'entraînement + protège-tibias",
      objectifs: ["Coulisser ensemble", "Cadrer le porteur"],
      procedes: [
        { nom: "Échauffement — appuis et coordination", duree: "15 min", theme: "Athlétique" },
        { nom: "Bloc à quatre, ballon guidé", duree: "25 min", theme: "Tactique" },
        { nom: "8 contre 8 sur demi-terrain", duree: "30 min", theme: "Jeu" },
      ],
      bilan: "Bonne lecture des trajectoires. À travailler : la remontée du bloc.",
    },
  },
  {
    id: "pev-m-02",
    enfantId: "u10-j7",
    type: "match",
    date: "2026-08-08",
    start: "10:00",
    end: "11:30",
    title: "Match — Championnat U10",
    detail: "U10 vs Club Africain",
    location: "Stade El Menzah",
    categorie: CAT_U10,
    reponse: "present",
    match: {
      adversaire: "Club Africain",
      domicile: false,
      competition: "Championnat U10",
      termine: true,
      butsPour: 1,
      butsContre: 2,
      joue: true,
      minutes: 25,
      buts: 0,
      passes: 0,
      note: 6,
      rdv: "09:00",
      tenue: "Maillot extérieur, short noir",
      transport: "Bus du club, départ du parking à 09:15",
      poste: "Milieu défensif",
      titulaire: false,
      commentaire:
        "Match difficile face à une équipe plus athlétique. Taha a tenu son poste pendant 25 minutes.",
      evaluation: {
        nom: "Évaluation Carte Joueur & Groupe",
        type: "Évaluation privée des joueurs",
        domaine: "Match — Championnat U10",
        modele: "Modèle Joueur de champ",
        privee: true,
        criteres: [
          ...grille(MODELE_JOUEUR, [61, 72, 64, 58, 66, 52], {
            PHY: {
              commentaire:
                "Adversaire plus grand et plus rapide : il a subi les duels aériens.",
            },
            PAS: { commentaire: "Continue de jouer simple, même sous pression." },
          }),
          COMPORTEMENT(
            82,
            "Entré en cours de match sans discuter la décision, tout de suite dans le rythme.",
          ),
        ],
      },
      faits: [
        { minute: "9'", kind: "but", label: "Club Africain", detail: "Corner", nous: false },
        {
          minute: "26'",
          kind: "changement",
          label: "Taha Khemiri",
          detail: "Entre à la place de Nadhir Mrabet",
          nous: true,
        },
        { minute: "31'", kind: "but", label: "Walid Nasri", detail: "Frappe de loin", nous: true },
        { minute: "44'", kind: "but", label: "Club Africain", detail: "Penalty", nous: false },
      ],
      stats: {
        tirs: 1,
        tirsCadres: 0,
        passes: 18,
        precisionPasses: 72,
        ballonsRecuperes: 4,
        duelsGagnes: 2,
        duelsTotal: 6,
        jaunes: 0,
        rouges: 0,
      },
    },
  },
  {
    id: "pev-s-05",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-08-11",
    start: "17:30",
    end: "19:00",
    title: "Séance 16",
    detail: "Jeu court — conservation à cinq",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "absent",
  },
  {
    id: "pev-r-01",
    enfantId: "u10-j7",
    type: "reunion",
    date: "2026-08-13",
    start: "18:30",
    end: "19:30",
    title: "Réunion parents — rentrée",
    detail: "Calendrier de la saison, licences et transport",
    location: "Salle 1",
    categorie: "Parents U10",
    reponse: "present",
    reunion: {
      anime: "Nabil Ayari",
      ordreDuJour: [
        "Calendrier de la saison 2026-2027",
        "Dossiers de licence à compléter",
        "Organisation des déplacements",
        "Questions des familles",
      ],
      compteRendu:
        "Le calendrier a été distribué. Les licences manquantes doivent être déposées avant le 31 août.",
    },
  },
  {
    id: "pev-m-03",
    enfantId: "u10-j7",
    type: "match",
    date: "2026-08-15",
    start: "09:30",
    end: "11:00",
    title: "Match amical",
    detail: "U10 vs CA Bizertin",
    location: "Terrain A",
    categorie: CAT_U10,
    reponse: "present",
    match: {
      adversaire: "CA Bizertin",
      domicile: true,
      competition: "Amical",
      termine: true,
      butsPour: 2,
      butsContre: 2,
      joue: false,
      minutes: 0,
      buts: 0,
      passes: 0,
      rdv: "08:45",
      tenue: "Maillot domicile, short blanc",
      transport: "Rendez-vous directement au terrain",
      commentaire:
        "Taha est resté sur le banc pour protéger sa cheville. Il reprend normalement cette semaine.",
      faits: [
        { minute: "14'", kind: "but", label: "Amine Ayari", nous: true },
        { minute: "22'", kind: "but", label: "CA Bizertin", nous: false },
        {
          minute: "40'",
          kind: "but",
          label: "Adam Ben Salah",
          detail: "Passe décisive · Karim Jebali",
          nous: true,
        },
        { minute: "52'", kind: "but", label: "CA Bizertin", detail: "Coup franc", nous: false },
      ],
    },
  },
  {
    id: "pev-s-06",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-08-18",
    start: "17:30",
    end: "19:00",
    title: "Séance 17",
    detail: "Reprise — motricité et appuis",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "present",
  },
  /* À venir ↓ — le parent a encore quelque chose à faire ici. */
  {
    id: "pev-s-07",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-08-25",
    start: "17:30",
    end: "19:00",
    title: "Séance 18",
    detail: "Attaquer la profondeur — appels croisés",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "attente",
    seance: {
      educateur: "Nabil Ayari",
      tenue: "Tenue d'entraînement + protège-tibias",
      objectifs: ["Appeler au bon moment", "Servir dans la course"],
      procedes: [
        {
          nom: "Échauffement — passes en mouvement",
          duree: "15 min",
          theme: "Technique",
          fifaCard: "TEC",
          sequence: "2*6 minutes",
          recuperation: "60",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Se mettre en action en donnant et en bougeant, pour préparer les appels de l'atelier suivant.",
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "Passe puis déplacement immédiat vers un plot libre.",
                "Jamais deux joueurs sur le même plot.",
                "Annoncer le prénom du joueur à qui on donne.",
              ],
            },
          ],
        },
        {
          nom: "Appels croisés à deux, finition",
          duree: "25 min",
          theme: "Technique",
          fifaCard: "TEC",
          sequence: "4*5 minutes",
          recuperation: "90",
          image: "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761747316874-653387628.png",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Attaquer l'espace dans le dos de la défense grâce à un appel croisé, puis finir dans la surface.",
            },
            {
              kind: "paragraph",
              heading: "But(s)",
              text: "Marquer en deux touches maximum après le service du partenaire.",
            },
            {
              kind: "list",
              heading: "Organisation",
              items: [
                "Demi-terrain, un gardien dans le but.",
                "Deux joueurs partent ensemble depuis le rond central.",
                "Ballons en réserve au niveau du meneur d'atelier.",
              ],
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "Le porteur fixe l'axe, le partenaire part dans le couloir opposé.",
                "L'appel se déclenche quand le porteur a la tête levée.",
                "On croise franchement : on ne se contente pas de courir devant.",
                "Frappe du premier choix : ne pas rechercher le geste parfait.",
              ],
            },
            {
              kind: "list",
              heading: "Comportements attendus",
              items: [
                "Vitesse d'exécution sur les cinq premiers mètres de l'appel.",
                "Le porteur lève la tête AVANT que le partenaire ne parte.",
                "Retour au calme entre deux passages, on ne coupe pas la file.",
              ],
            },
          ],
        },
        {
          nom: "Match à thème — but en profondeur",
          duree: "30 min",
          theme: "Jeu",
          fifaCard: "JEU",
          sequence: "3*8 minutes",
          recuperation: "120",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Retrouver l'appel croisé dans un vrai match, sans que l'éducateur ait à le demander.",
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "But compte double s'il vient d'une passe dans la profondeur.",
                "Terrain de 45 m sur 30 m, 8 contre 8 avec gardiens.",
                "Trois arrêts de jeu maximum par période pour corriger.",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "pev-m-04",
    enfantId: "u10-j7",
    type: "match",
    date: "2026-08-29",
    start: "09:30",
    end: "11:00",
    title: "Match — Championnat U10",
    detail: "U10 vs Stade Tunisien",
    location: "Stade municipal",
    categorie: CAT_U10,
    reponse: "present",
    match: {
      adversaire: "Stade Tunisien",
      domicile: true,
      competition: "Championnat U10",
      termine: false,
      rdv: "08:45",
      tenue: "Maillot domicile, short blanc",
      transport: "Rendez-vous directement au stade",
      poste: "Milieu défensif",
      titulaire: true,
      consignes: [
        {
          titre: "Arriver 45 minutes avant le coup d'envoi",
          image: TACTIC_IMG,
          audience: "Toute l'équipe",
          detail: "Échauffement collectif à 08:55 sur le terrain annexe.",
        },
        {
          titre: "Gourde et casquette obligatoires",
          image: TACTIC_IMG,
          audience: "Toute l'équipe",
          detail: "Le match se joue en plein soleil, pensez à la crème solaire.",
        },
        {
          titre: "Sa mission : protéger la défense",
          image: TACTIC_IMG,
          audience: "Coach → Taha",
          personal: true,
          detail:
            "Rester devant les deux centraux, ressortir le ballon simplement sur les côtés.",
        },
      ],
      effectif: { acceptes: 11, refuses: 1, attente: 2, total: 14 },
    },
  },
  {
    id: "pev-s-08",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-09-01",
    start: "17:30",
    end: "19:00",
    title: "Séance 19",
    detail: "Duels et récupération du ballon",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "attente",
  },
  {
    id: "pev-m-05",
    enfantId: "u10-j7",
    type: "match",
    date: "2026-09-05",
    start: "10:00",
    end: "11:30",
    title: "Match — Championnat U10",
    detail: "U10 vs JS Kairouan",
    location: "Complexe de Kairouan",
    categorie: CAT_U10,
    reponse: "attente",
    match: {
      adversaire: "JS Kairouan",
      domicile: false,
      competition: "Championnat U10",
      termine: false,
      rdv: "08:30",
      tenue: "Maillot extérieur, short noir",
      transport: "Bus du club — départ du club à 08:45, retour vers 14:00",
      consignes: [
        {
          titre: "Déplacement long — prévoir un pique-nique",
          image: TACTIC_IMG,
          audience: "Familles",
          detail: "Départ du club à 08:45, retour prévu vers 14:00.",
        },
        {
          titre: "Confirmer la présence avant jeudi soir",
          image: TACTIC_IMG,
          audience: "Familles",
          detail: "Le club réserve le bus en fonction des réponses.",
        },
      ],
      effectif: { acceptes: 6, refuses: 0, attente: 8, total: 14 },
    },
  },
  {
    id: "pev-s-09",
    enfantId: "u10-j7",
    type: "seance",
    date: "2026-09-08",
    start: "17:30",
    end: "19:00",
    title: "Séance 20",
    detail: "Coups de pied arrêtés offensifs",
    location: "Terrain A",
    categorie: CAT_U10,
    reponse: "attente",
  },
  {
    id: "pev-r-02",
    enfantId: "u10-j7",
    type: "reunion",
    date: "2026-09-10",
    start: "18:30",
    end: "19:30",
    title: "Réunion parents — tournoi d'automne",
    detail: "Organisation du déplacement et des repas",
    location: "Salle 1",
    categorie: "Parents U10",
    reponse: "attente",
    reunion: {
      anime: "Nabil Ayari",
      ordreDuJour: [
        "Dates et format du tournoi",
        "Covoiturage et hébergement",
        "Repas du samedi midi",
        "Participation financière",
      ],
    },
  },
]

/* ── Rayan · U13 — l'aîné, l'attaquant de la catégorie ──────────────────── */

const rayanEvents: ParentEvent[] = [
  {
    id: "pev-r13-s-01",
    enfantId: "u13-j15",
    type: "seance",
    date: "2026-07-16",
    start: "18:00",
    end: "19:45",
    title: "Séance 21",
    detail: "Finition — frappes de loin",
    location: "Terrain A",
    categorie: CAT_U13,
    reponse: "present",
    seance: {
      educateur: "Nabil Ayari",
      tenue: "Tenue d'entraînement + protège-tibias",
      objectifs: ["Frapper en équilibre", "Choisir sa surface de frappe"],
      procedes: [
        { nom: "Échauffement — gammes de frappe", duree: "20 min", theme: "Technique" },
        { nom: "Frappes de 18 m après contrôle", duree: "25 min", theme: "Technique" },
        { nom: "Opposition 7 contre 7", duree: "35 min", theme: "Jeu" },
      ],
      bilan: "Rayan frappe fort mais trop souvent en force. On travaille le placement.",
      evaluation: {
        nom: "Évaluation Carte Joueur & Groupe",
        type: "Évaluation privée des joueurs",
        domaine: "Technique & athlétique",
        modele: "Modèle Joueur de champ",
        privee: true,
        criteres: [
          ...grille(MODELE_JOUEUR, [79, 64, 88, 82, 51, 86], {
            VIT: { commentaire: "Le plus rapide de la catégorie sur 20 m." },
            TIR: {
              commentaire: "Puissance rare à cet âge, placement à construire.",
              documents: [
                "Séquence vidéo — 12 frappes de 18 m (3:40)",
                "Fiche PDF — gammes de frappe à la maison",
              ],
            },
            DEF: {
              commentaire: "Ne redescend pas encore avec le bloc.",
            },
          }),
          COMPORTEMENT(74, "Se décourage vite quand la frappe ne rentre pas."),
        ],
      },
    },
  },
  {
    id: "pev-r13-m-01",
    enfantId: "u13-j15",
    type: "match",
    date: "2026-07-19",
    start: "15:00",
    end: "16:45",
    title: "Match — Championnat U13",
    detail: "U13 vs CS Sfaxien",
    location: "Stade municipal",
    categorie: CAT_U13,
    reponse: "present",
    match: {
      adversaire: "CS Sfaxien",
      domicile: true,
      competition: "Championnat U13",
      termine: true,
      butsPour: 4,
      butsContre: 0,
      joue: true,
      minutes: 60,
      buts: 2,
      passes: 1,
      note: 9,
      rdv: "14:15",
      tenue: "Maillot domicile, short blanc",
      transport: "Rendez-vous directement au stade",
      poste: "Attaquant",
      titulaire: true,
      commentaire:
        "Match référence : deux buts et une passe. Rayan a joué pour l'équipe, c'est le plus important.",
      evaluation: {
        nom: "Évaluation Carte Joueur & Groupe",
        type: "Évaluation privée des joueurs",
        domaine: "Match — Championnat U13",
        modele: "Modèle Joueur de champ",
        privee: true,
        criteres: [
          ...grille(MODELE_JOUEUR, [83, 76, 88, 79, 61, 91], {
            TIR: {
              commentaire:
                "Deux frappes, deux buts : il a enfin choisi le placement plutôt que la puissance.",
              documents: ["Séquence vidéo — les deux buts (3:20)"],
            },
            VIT: {
              commentaire: "Prend systématiquement le dos du dernier défenseur.",
            },
            DEF: {
              commentaire: "Le premier pressing reste à travailler après la perte.",
            },
          }),
          COMPORTEMENT(
            85,
            "A servi Ilyes alors qu'il pouvait frapper — exactement ce qu'on lui demande.",
          ),
        ],
      },
      consignes: [
        {
          titre: "Pressing sur la relance adverse",
          image: TACTIC_IMG,
          audience: "Attaquants & milieux",
        },
        {
          titre: "Coups de pied arrêtés offensifs",
          image: TACTIC_IMG,
          audience: "Toute l'équipe",
        },
        {
          titre: "Sa mission : attaquer l'espace derrière la défense",
          image: TACTIC_IMG,
          audience: "Coach → Rayan",
          personal: true,
          detail: "Partir dans le dos du dernier défenseur dès que le milieu lève la tête.",
        },
      ],
      faits: [
        { minute: "8'", kind: "but", label: "Rayan Khemiri", detail: "Frappe de 18 m", nous: true },
        {
          minute: "24'",
          kind: "but",
          label: "Ilyes Bouzid",
          detail: "Passe décisive · Rayan Khemiri",
          nous: true,
        },
        { minute: "39'", kind: "but", label: "Rayan Khemiri", detail: "Contre-attaque", nous: true },
        { minute: "51'", kind: "jaune", label: "CS Sfaxien", detail: "Faute sur Rayan Khemiri", nous: false },
        { minute: "57'", kind: "but", label: "Mohamed Mrabet", nous: true },
        {
          minute: "62'",
          kind: "changement",
          label: "Adam Selmi",
          detail: "Entre à la place de Rayan Khemiri",
          nous: true,
        },
      ],
      stats: {
        tirs: 6,
        tirsCadres: 4,
        passes: 41,
        precisionPasses: 78,
        ballonsRecuperes: 5,
        duelsGagnes: 9,
        duelsTotal: 13,
        jaunes: 0,
        rouges: 0,
      },
    },
  },
  {
    id: "pev-r13-s-02",
    enfantId: "u13-j15",
    type: "seance",
    date: "2026-08-06",
    start: "18:00",
    end: "19:45",
    title: "Séance 22",
    detail: "Pressing haut et contre-pressing",
    location: "Terrain A",
    categorie: CAT_U13,
    reponse: "present",
  },
  {
    id: "pev-r13-m-02",
    enfantId: "u13-j15",
    type: "match",
    date: "2026-08-09",
    start: "15:00",
    end: "16:45",
    title: "Match — Championnat U13",
    detail: "U13 vs Espérance ST",
    location: "Stade de Radès",
    categorie: CAT_U13,
    reponse: "present",
    match: {
      adversaire: "Espérance ST",
      domicile: false,
      competition: "Championnat U13",
      termine: true,
      butsPour: 0,
      butsContre: 3,
      joue: true,
      minutes: 45,
      buts: 0,
      passes: 0,
      note: 5,
      rdv: "14:00",
      tenue: "Maillot extérieur, short noir",
      transport: "Bus du club",
      poste: "Attaquant",
      titulaire: true,
      commentaire:
        "Après-midi compliquée pour toute l'équipe. Rayan s'est agacé — nous en avons reparlé calmement lundi.",
      evaluation: {
        nom: "Évaluation Carte Joueur & Groupe",
        type: "Évaluation privée des joueurs",
        domaine: "Match — Championnat U13",
        modele: "Modèle Joueur de champ",
        privee: true,
        criteres: [
          ...grille(MODELE_JOUEUR, [64, 58, 80, 66, 47, 55], {
            DEF: {
              commentaire:
                "Peu d'aide sur les replacements : c'est là que le match s'est joué.",
            },
            PAS: { commentaire: "Trop de ballons perdus dans le premier quart d'heure." },
          }),
          COMPORTEMENT(
            58,
            "S'est agacé contre l'arbitre et ses partenaires. Nous en avons reparlé lundi, sujet clos.",
          ),
        ],
      },
      consignes: [
        {
          titre: "Bloc bas — rester compact",
          image: TACTIC_IMG,
          audience: "Toute l'équipe",
          detail: "Adversaire réputé plus athlétique : défendre à onze puis ressortir.",
        },
      ],
      faits: [
        { minute: "11'", kind: "but", label: "Espérance ST", nous: false },
        { minute: "35'", kind: "but", label: "Espérance ST", detail: "Contre-attaque", nous: false },
        { minute: "48'", kind: "jaune", label: "Rayan Khemiri", detail: "Contestation", nous: true },
        { minute: "62'", kind: "but", label: "Espérance ST", detail: "Penalty", nous: false },
      ],
      stats: {
        tirs: 2,
        tirsCadres: 0,
        passes: 22,
        precisionPasses: 64,
        ballonsRecuperes: 3,
        duelsGagnes: 4,
        duelsTotal: 12,
        jaunes: 1,
        rouges: 0,
      },
    },
  },
  {
    id: "pev-r13-s-03",
    enfantId: "u13-j15",
    type: "seance",
    date: "2026-08-13",
    start: "18:00",
    end: "19:45",
    title: "Séance 23",
    detail: "Remise en confiance — jeu vers l'avant",
    location: "Terrain A",
    categorie: CAT_U13,
    reponse: "absent",
  },
  {
    id: "pev-r13-s-04",
    enfantId: "u13-j15",
    type: "seance",
    date: "2026-08-20",
    start: "18:00",
    end: "19:45",
    title: "Séance 24",
    detail: "Jeu dos au but et remises",
    location: "Terrain A",
    categorie: CAT_U13,
    reponse: "present",
  },
  {
    id: "pev-r13-s-05",
    enfantId: "u13-j15",
    type: "seance",
    date: "2026-08-27",
    start: "18:00",
    end: "19:45",
    title: "Séance 25",
    detail: "Combinaisons dans le dernier tiers",
    location: "Terrain A",
    categorie: CAT_U13,
    reponse: "attente",
    seance: {
      educateur: "Nabil Ayari",
      tenue: "Tenue d'entraînement + protège-tibias",
      objectifs: ["Fixer puis servir", "Entrer dans la surface à trois"],
      procedes: [
        { nom: "Échauffement — conservation 5 contre 2", duree: "15 min", theme: "Technique" },
        { nom: "Combinaisons à trois, finition", duree: "30 min", theme: "Jeu" },
        { nom: "Opposition 8 contre 8", duree: "30 min", theme: "Jeu" },
      ],
    },
  },
  {
    id: "pev-r13-m-03",
    enfantId: "u13-j15",
    type: "match",
    date: "2026-08-29",
    start: "15:00",
    end: "16:45",
    title: "Match — Championnat U13",
    detail: "U13 vs AS Marsa",
    location: "Stade de La Marsa",
    categorie: CAT_U13,
    reponse: "attente",
    match: {
      adversaire: "AS Marsa",
      domicile: false,
      competition: "Championnat U13",
      termine: false,
      rdv: "14:00",
      tenue: "Maillot extérieur, short noir",
      transport: "Bus du club — départ du club à 14:15",
      poste: "Attaquant",
      titulaire: true,
      consignes: [
        {
          titre: "Même jour que le match de Taha (09:30)",
          image: TACTIC_IMG,
          audience: "Familles",
          detail: "Deux rendez-vous le même samedi — prévoyez l'organisation.",
        },
        {
          titre: "Confirmer la présence avant vendredi 18:00",
          image: TACTIC_IMG,
          audience: "Familles",
        },
        {
          titre: "Sa mission : attaquer la profondeur",
          image: TACTIC_IMG,
          audience: "Coach → Rayan",
          personal: true,
          detail: "Jouer dans le dos des défenseurs dès la première période.",
        },
      ],
      effectif: { acceptes: 9, refuses: 2, attente: 4, total: 15 },
    },
  },
]

/* ── Aziz · U8 — arrivé au club ce mois-ci ──────────────────────────────── */

const azizEvents: ParentEvent[] = [
  {
    id: "pev-u8-s-01",
    enfantId: "u8-j12",
    type: "seance",
    date: "2026-08-12",
    start: "10:00",
    end: "11:15",
    title: "Séance découverte",
    detail: "Premiers jeux avec le groupe",
    location: "Terrain C",
    categorie: CAT_U8,
    reponse: "present",
    seance: {
      educateur: "Leila Mansour",
      tenue: "Tenue de sport, gourde obligatoire",
      objectifs: ["Prendre ses repères", "Jouer avec les autres"],
      procedes: [
        {
          nom: "Jeu de l'épervier avec ballon",
          duree: "20 min",
          theme: "Motricité",
          fifaCard: "MOT",
          sequence: "5*3 minutes",
          recuperation: "60",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Découvrir le groupe en jouant, et manipuler le ballon sans y penser.",
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "Tout le monde traverse le carré avec son ballon.",
                "L'épervier essaie de sortir les ballons du carré.",
                "Un joueur touché devient épervier à son tour.",
              ],
            },
            {
              kind: "paragraph",
              heading: "Ce que l'éducateur regarde",
              text: "Le plaisir de jouer avant tout : à cet âge on ne corrige pas le geste, on encourage.",
            },
          ],
        },
        {
          nom: "Ateliers de conduite",
          duree: "20 min",
          theme: "Technique",
          fifaCard: "TEC",
          sequence: "4*4 minutes",
          recuperation: "45",
          blocks: [
            {
              kind: "list",
              heading: "Organisation",
              items: [
                "Quatre petits ateliers, quatre enfants par atelier.",
                "On change d'atelier toutes les 4 minutes au sifflet.",
                "Un ballon par enfant, aucun temps d'attente.",
              ],
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "Le ballon reste toujours à moins d'un mètre du pied.",
                "On essaie les deux pieds, même celui qui va moins bien.",
              ],
            },
          ],
        },
        {
          nom: "Petits matchs 4 contre 4",
          duree: "25 min",
          theme: "Jeu",
          fifaCard: "JEU",
          sequence: "5*4 minutes",
          recuperation: "60",
          blocks: [
            {
              kind: "paragraph",
              heading: "Objectif",
              text: "Jouer, marquer, et prendre du plaisir sur un vrai but — la séance finit toujours par un match.",
            },
            {
              kind: "list",
              heading: "Consignes",
              items: [
                "Équipes remélangées à chaque match.",
                "Chacun passe au but au moins une fois dans la séance.",
                "Pas de classement, pas de score cumulé.",
              ],
            },
          ],
        },
      ],
      bilan: "Aziz s'est très vite intégré. Il a demandé à jouer dans les buts.",
      evaluation: {
        nom: "Évaluation Carte Joueur & Groupe",
        type: "Évaluation privée des joueurs",
        domaine: "Gardien de but",
        modele: "Modèle Gardien",
        privee: true,
        criteres: [
          ...grille(MODELE_GARDIEN, [54, 61, 42, 48, 57, 63], {
            REF: { commentaire: "Sa qualité de départ — il part tôt." },
            MAI: {
              commentaire:
                "Sort peu sur les ballons hauts. Premier axe de travail.",
              documents: ["Séquence vidéo — sorties aériennes (1:25)"],
            },
          }),
          COMPORTEMENT(92, "Arrivé en septembre et déjà à l'aise avec tous."),
        ],
      },
    },
  },
  {
    id: "pev-u8-s-02",
    enfantId: "u8-j12",
    type: "seance",
    date: "2026-08-19",
    start: "10:00",
    end: "11:15",
    title: "Séance 2",
    detail: "Gardien — plonger et se relever",
    location: "Terrain C",
    categorie: CAT_U8,
    reponse: "present",
  },
  {
    id: "pev-u8-s-03",
    enfantId: "u8-j12",
    type: "seance",
    date: "2026-08-26",
    start: "10:00",
    end: "11:15",
    title: "Séance 3",
    detail: "Gardien — prises de balle à deux mains",
    location: "Terrain C",
    categorie: CAT_U8,
    reponse: "attente",
    seance: {
      educateur: "Leila Mansour",
      tenue: "Tenue de sport + gants de gardien",
      objectifs: ["Prendre le ballon à deux mains", "Se replacer après l'arrêt"],
      procedes: [
        { nom: "Échauffement — mains et appuis", duree: "15 min", theme: "Motricité" },
        { nom: "Atelier gardien — prises hautes", duree: "25 min", theme: "Technique" },
        { nom: "Petits matchs avec but", duree: "25 min", theme: "Jeu" },
      ],
    },
  },
]

/* ── Aujourd'hui — un rendez-vous par enfant ────────────────────────────── */

const todayEvents: ParentEvent[] = [
  {
    id: "pev-today-taha",
    enfantId: "u10-j7",
    type: "seance",
    date: TODAY,
    start: "17:30",
    end: "19:00",
    title: "Séance d'avant-match",
    detail: "Derniers réglages avant Stade Tunisien",
    location: "Terrain B",
    categorie: CAT_U10,
    reponse: "attente",
    seance: {
      educateur: "Nabil Ayari",
      tenue: "Tenue d'entraînement + protège-tibias",
      objectifs: [
        "Répéter l'animation offensive du week-end",
        "Fixer les coups de pied arrêtés",
      ],
      procedes: [
        { nom: "Échauffement — passes et appuis", duree: "15 min", theme: "Technique" },
        { nom: "Animation offensive à onze", duree: "25 min", theme: "Tactique" },
        { nom: "Coups de pied arrêtés — corners", duree: "20 min", theme: "Tactique" },
        { nom: "Opposition libre", duree: "20 min", theme: "Jeu" },
      ],
    },
  },
  {
    id: "pev-today-rayan",
    enfantId: "u13-j15",
    type: "match",
    date: TODAY,
    start: "15:00",
    end: "16:45",
    title: "Match — Championnat U13",
    detail: "U13 vs Étoile du Sahel",
    location: "Stade municipal",
    categorie: CAT_U13,
    reponse: "present",
    match: {
      adversaire: "Étoile du Sahel",
      domicile: true,
      competition: "Championnat U13",
      termine: false,
      rdv: "14:15",
      tenue: "Maillot domicile, short blanc",
      transport: "Rendez-vous directement au stade",
      poste: "Attaquant",
      titulaire: true,
      consignes: [
        {
          titre: "Arriver 45 minutes avant le coup d'envoi",
          image: TACTIC_IMG,
          audience: "Toute l'équipe",
          detail: "Rendez-vous au vestiaire 2 à 14:15.",
        },
        {
          titre: "Gourde remplie et casquette pour l'avant-match",
          image: TACTIC_IMG,
          audience: "Toute l'équipe",
        },
        {
          titre: "Sa mission : fixer le défenseur central",
          image: TACTIC_IMG,
          audience: "Coach → Rayan",
          personal: true,
          detail:
            "Venir chercher le ballon entre les lignes puis remettre en une touche.",
        },
      ],
      effectif: { acceptes: 13, refuses: 1, attente: 1, total: 15 },
    },
  },
  {
    id: "pev-today-aziz",
    enfantId: "u8-j12",
    type: "reunion",
    date: TODAY,
    start: "18:30",
    end: "19:15",
    title: "Réunion parents — accueil des nouveaux",
    detail: "Fonctionnement de l'école de foot",
    location: "Salle 2",
    categorie: "Parents U8",
    reponse: "attente",
    reunion: {
      anime: "Leila Mansour",
      ordreDuJour: [
        "Horaires et lieux des séances",
        "Équipement du jeune gardien",
        "Rôle des parents accompagnateurs",
        "Questions des familles",
      ],
      enfantAttendu: false,
    },
  },
]

export const parentEventsSeed: ParentEvent[] = [
  ...tahaEvents,
  ...rayanEvents,
  ...azizEvents,
  ...todayEvents,
]

/**
 * A séance without a seeded programme still opens a coherent fiche — the same
 * fallback idea as `buildFallbackSeance` on the club side.
 */
export function fallbackSeanceInfo(
  event: ParentEvent,
  enfant: ParentEnfant,
): ParentSeanceInfo {
  return {
    educateur: enfant.educateur,
    tenue: "Tenue d'entraînement + protège-tibias",
    objectifs: event.detail ? [event.detail] : [],
    procedes: [],
  }
}
