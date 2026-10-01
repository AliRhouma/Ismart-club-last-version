/**
 * Séance detail slice — the content behind a "séance" card on the Planification
 * calendar. Clicking a séance opens its session page (SeanceScreen), which has
 * two states: "avant le début" (what we build now — the plan the coach follows)
 * and "après la séance" (the debrief, built later).
 *
 * A séance detail is keyed by the calendar event id (`PlanEvent.id`). It carries
 * the header fields shown on the page (type, catégorie, groupe, durée, intensité,
 * statut, contrôles sécurité / hydratation…) plus the ordered list of *procédés*
 * — the exercises the coach runs, each a rich block of text + one illustration.
 *
 * Reference-only content: the store exposes it read-only (no add/edit/remove for
 * now). A séance without a seeded detail falls back to `buildFallbackSeance`, so
 * every séance card still opens a coherent page (with an empty procédé state).
 */

import type { PlanEvent } from "@/data/seed/events"
import type { ProcedeItem } from "@/data/seed/procedes"
import type { LigneMateriel } from "@/data/seed/materiaux"

/* ── Attendance enums (mirror the match feature for a consistent family) ───── */

/** RSVP to the convocation — shown on a *not-started* séance. */
export type ConvocationStatut = "accepte" | "refuse" | "attente"
/**
 * Attendance recorded on the day — shown on a *started / terminée* séance.
 *
 * Five states, the ones an éducateur actually needs at the whistle: présent,
 * en retard, blessé (là, mais ne s'entraîne pas), absent justifié (excusé — un
 * mot de la famille) et absent (non excusé). Someone with no line at all is
 * *non pointé*: the Présence tab shows that as its own neutral state instead of
 * pretending he was absent.
 */
export type PresenceStatut =
  | "present"
  | "retard"
  | "blesse"
  | "absentJustifie"
  | "absent"

/** One convoqué — a joueur or a staff member invited to the séance. */
export type SeanceParticipant = {
  id: string
  name: string
  /** Poste ("Milieu central") for joueurs, fonction ("Éducateur") for staff. */
  role: string
  kind: "joueur" | "staff"
  /** Numéro de maillot — joueurs only. */
  numero?: number
  /** RSVP shown on the Convocation tab. */
  convocation: ConvocationStatut
  /** Optional short reason, shown when a joueur has refused. */
  note?: string
}

/* ── Rich-content blocks — a procédé is a small ordered document ──────────── */

export type ProcedeBlock =
  | { kind: "paragraph"; heading: string; text: string }
  | { kind: "list"; heading: string; items: string[] }
  | { kind: "table"; heading: string; head: string[]; rows: string[][] }

/**
 * A sub-group of players inside one procédé — the ateliers a coach splits the
 * squad into for that exercise. Membership is per procédé, not per séance: the
 * same joueur can be in atelier 1 on the rondo and atelier 3 on the finishing
 * drill. Ids only; names are read from the roster at render time.
 */
export type ProcedeAtelier = {
  id: string
  nom: string
  /**
   * Chasuble worn by the group — what the coach calls it on the pitch. Absent
   * on an older group, which then falls back to the first bib.
   */
  couleur?: AtelierCouleur
  /** Ids of the convoqués in this atelier, in the order they were added. */
  joueurIds: string[]
}

/**
 * A drinks break in the déroulé: after the procédé at index `apres` (0-based),
 * the séance stops for `duree` minutes. The coach sets the length — a U9 water
 * break and a senior one in July are not the same pause.
 */
export type PauseHydratation = { apres: number; duree: number }

/** The bibs a club owns — see features/planification/atelierCouleurs.ts. */
export type AtelierCouleur =
  | "bleu"
  | "rouge"
  | "jaune"
  | "vert"
  | "orange"
  | "blanc"

export type Procede = {
  id: string
  /** Exercise name, e.g. "VAMEVAL". */
  titre: string
  /** FIFA-card physical family tag, e.g. "PHY" (physique), "VIT" (vitesse). */
  fifaCard?: string
  /** Total time, e.g. "20 minutes". */
  duree: string
  /** Work structure, e.g. "1*20 minutes". */
  sequence: string
  /** Recovery in seconds, e.g. "180". */
  recuperation: string
  /** Terrain, e.g. "15 × 20 m" — carried by procédés copied from the library. */
  surface?: string
  /** Effectif, e.g. "9 joueurs · 1 gardien" — library procédés only. */
  effectif?: string
  /** Library family ("Jeu", "Situation", "Exercice"); the seeded physical tests
   *  carry a `fifaCard` instead. */
  type?: string
  /** ProcedeItem.id this was copied from. A séance keeps its own snapshot, so
   *  re-editing the library never rewrites a session already run. */
  procedeId?: string
  /** Illustration URL (content image — not fetched through the store). */
  image?: string
  blocks: ProcedeBlock[]
  /** Player groups for this exercise. Absent = everyone works together. */
  ateliers?: ProcedeAtelier[]
  /**
   * Which groups the procédé runs with: the séance's, its own (`ateliers`),
   * or none — everyone together. Absent on older procédés: its own if it has
   * any, else the séance's.
   */
  modeGroupes?: ModeGroupesProcede
  /** What the exercise takes out of the caisse — copied from the library. */
  materiel?: LigneMateriel[]
}

export type ModeGroupesProcede = "seance" | "personnalises" | "aucun"

export type SeanceStatut = "Terminé" | "Planifiée" | "En cours"

export type SeanceDetail = {
  /** Matches PlanEvent.id. */
  eventId: string
  /** Headline, e.g. "Séance 22". */
  numero: string
  /** Kind of session, e.g. "Évaluation", "Séance technique". */
  type: string
  categorie: string
  groupe: string
  /** Head-count — kept a plain string so "N/A" is a valid value. */
  effectif: string
  /** "JJ/MM/AAAA". */
  date: string
  /** Duration in minutes, plain string ("32"). */
  duree: string
  /** Installation — for a séance with no calendar event to carry a lieu. */
  lieu?: string
  /** Perceived intensity — "N/A" until the séance is run. */
  intensite: string
  saison: string
  statut: SeanceStatut
  securiteVerifiee: boolean
  hydratationVerifiee: boolean
  procedes: Procede[]
  /**
   * Matériel of the whole séance, set by the coach (fiche de création or
   * « Modifier la séance »). Absent = computed from the procédés.
   */
  materiel?: LigneMateriel[]
  /**
   * The séance's own chasubles, defined when it is created. Every procédé
   * uses them unless it is set to personalised groups.
   */
  groupesSeance?: ProcedeAtelier[]
  /** Drinks breaks between procédés, as decided on the fiche de création. */
  hydratations?: PauseHydratation[]
  /** Staff + joueurs invited — the Convocation tab (not started) reads their
   *  `convocation`; the Présence tab (terminée) reads `presence[id]`. */
  participants: SeanceParticipant[]
  /** Attendance keyed by participant id — only meaningful once the séance ran. */
  presence: Record<string, PresenceStatut>
}

/** A séance is "not started" while planifiée; otherwise it has been run. */
export const isSeanceStarted = (statut: SeanceStatut): boolean =>
  statut !== "Planifiée"

/* ── Shared illustration images (two visuals, re-used across procédés) ────── */

const IMG_A =
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761666361994-890610436.png"
const IMG_B =
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761747316874-653387628.png"

/* ── The two seeded procédés (from the club's physical-test library) ──────── */

const PROCEDE_VAMEVAL: Procede = {
  id: "proc-vameval",
  titre: "VAMEVAL",
  fifaCard: "PHY",
  duree: "20 minutes",
  sequence: "1*20 minutes",
  recuperation: "180",
  image:
    "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761666361994-890610436.png",
  // Dix stations sur le schéma, un plot chacune.
  materiel: [{ quantite: 10, nom: "Plots" }],
  blocks: [
    {
      kind: "paragraph",
      heading: "Objectif",
      text: "Déterminer la Vitesse Maximale Aérobie (VMA).",
    },
    {
      kind: "paragraph",
      heading: "But(s)",
      text: "Donner une valeur de VMA en km/h.",
    },
    {
      kind: "list",
      heading: "Consignes",
      items: [
        "Les joueurs se placent chacun sur un plot.",
        "La bande-son émet des bips : à chaque bip, ils doivent être au plot suivant.",
        "La vitesse augmente de +0.5 km/h toutes les minutes.",
        "Le test s'arrête lorsque le joueur ne parvient plus à suivre le rythme deux fois consécutives.",
        "Noter la dernière vitesse atteinte.",
      ],
    },
    {
      kind: "list",
      heading: "Comportements attendus — Individuels",
      items: [
        "Gestion de l'effort.",
        "Concentration sur les appuis et la respiration.",
      ],
    },
    {
      kind: "list",
      heading: "Notation indicative",
      items: [
        "U13–U14 : 100 pts = 17 km/h | 75 pts = 15 km/h | 50 pts = 13 km/h | 25 pts = 11 km/h | 0 pt = 9 km/h",
        "U15–U16 : 100 pts = 18 km/h | 75 pts = 16 km/h | 50 pts = 14 km/h | 25 pts = 12 km/h | 0 pt = 10 km/h",
        "U17–U18 : 100 pts = 19 km/h | 75 pts = 17 km/h | 50 pts = 15 km/h | 25 pts = 13 km/h | 0 pt = 11 km/h",
        "U20–Senior : 100 pts = 20 km/h | 75 pts = 18 km/h | 50 pts = 16 km/h | 25 pts = 14 km/h | 0 pt = 12 km/h",
      ],
    },
    {
      kind: "list",
      heading: "Astuce pratique : tracer une piste de 200 m",
      items: [
        "Rectangle de base : 40 m (longueur) × 38,20 m (largeur).",
        "Lignes droites : 2 segments de 20 m sur chaque côté long → 4 plots.",
        "Virages : 3 plots sur chaque demi-cercle (coins arrondis) → 6 plots.",
        "Numérotation : plot 1 au départ, plot 10 rejoint le départ pour boucler le circuit.",
        "Total : 10 plots, tous espacés d'environ 20 m, boucle complète ≈ 200 m.",
        "Conseil : utiliser une corde ou un décamètre pour mesurer 20 m entre chaque plot, laisser 2–3 m de largeur pour courir.",
      ],
    },
  ],
}

const PROCEDE_SPRINT: Procede = {
  id: "proc-sprint",
  titre: "Sprint",
  fifaCard: "VIT",
  duree: "12 minutes",
  sequence: "1*12 minutes",
  recuperation: "30",
  materiel: [{ quantite: 2, nom: "Plots" }],
  image:
    "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761747316874-653387628.png",
  blocks: [
    {
      kind: "paragraph",
      heading: "Objectif",
      text: "Mesurer la vitesse de sprint sur 5, 10, 20 et 40 mètres — indicateur de la capacité d'accélération.",
    },
    {
      kind: "paragraph",
      heading: "But(s)",
      text: "Obtenir une donnée chiffrée permettant de suivre la progression de la vitesse.",
    },
    {
      kind: "list",
      heading: "Organisation",
      items: [
        "Terrain : ligne droite plate.",
        "Matériel : 2 plots (départ / arrivée), un chronomètre (idéalement des cellules photoélectriques).",
        "Effectif : 1 joueur à la fois, rotation rapide.",
      ],
    },
    {
      kind: "list",
      heading: "Consignes",
      items: [
        "Le joueur se place derrière la ligne de départ, un pied au sol, sans élan.",
        "L'éducateur donne le signal.",
        "Le joueur sprinte au maximum et dépasse la ligne d'arrivée.",
        "Chronométrer dès le premier mouvement du joueur.",
      ],
    },
    {
      kind: "list",
      heading: "Comportements attendus — Individuels",
      items: [
        "Réactivité au signal.",
        "Sprint maximal, ligne droite.",
        "Maintenir une posture dynamique (penchée légèrement vers l'avant).",
      ],
    },
    {
      kind: "table",
      heading: "Moyenne indicative par catégorie et distance",
      head: ["Catégorie", "5 m", "10 m", "20 m", "40 m"],
      rows: [
        ["U6–U7", "1,70 s", "3,10 s", "5,40 s", "10,50 s"],
        ["U8–U9", "1,60 s", "2,90 s", "5,00 s", "9,80 s"],
        ["U10–U12", "1,50 s", "2,70 s", "4,60 s", "9,20 s"],
        ["U13–U14", "1,45 s", "2,55 s", "4,30 s", "8,90 s"],
        ["U15–U16", "1,40 s", "2,50 s", "4,20 s", "8,70 s"],
        ["U17–U18", "1,35 s", "2,45 s", "4,00 s", "8,30 s"],
        ["U20–Senior", "1,25 s", "2,25 s", "3,90 s", "7,00 s"],
      ],
    },
  ],
}

/* ── Séance 21 — a 5-procédé technical session (images re-used, varied) ───── */

// The two visuals alternate across the five procédés in a fixed, varied order
// (B, A, B, A, A) so the session reads like real content without a random call.
const SEANCE_21_PROCEDES: Procede[] = [
  {
    id: "s21-echauffement",
    materiel: [{ quantite: 12, nom: "Coupelles" }],
    titre: "Échauffement dynamique",
    fifaCard: "PHY",
    duree: "12 minutes",
    sequence: "2*6 minutes",
    recuperation: "60",
    image: IMG_B,
    blocks: [
      {
        kind: "paragraph",
        heading: "Objectif",
        text: "Préparer le corps à l'effort et prévenir les blessures.",
      },
      {
        kind: "paragraph",
        heading: "But(s)",
        text: "Élever progressivement la température corporelle et activer les appuis.",
      },
      {
        kind: "list",
        heading: "Consignes",
        items: [
          "Course souple sur 15 m, puis montées de genoux et talons-fesses au retour.",
          "Enchaîner pas chassés, ouvertures et fermetures de hanches.",
          "Terminer par 3 accélérations progressives à 80 %.",
        ],
      },
      {
        kind: "list",
        heading: "Comportements attendus — Individuels",
        items: [
          "Amplitude et qualité des appuis.",
          "Respiration régulière, montée en intensité maîtrisée.",
        ],
      },
    ],
  },
  {
    id: "s21-conduite",
    materiel: [
      { quantite: 10, nom: "Ballons" },
      { quantite: 8, nom: "Piquets" },
    ],
    titre: "Conduite de balle en slalom",
    fifaCard: "TEC",
    duree: "15 minutes",
    sequence: "3*5 minutes",
    recuperation: "45",
    image: IMG_A,
    blocks: [
      {
        kind: "paragraph",
        heading: "Objectif",
        text: "Améliorer la maîtrise du ballon dans les changements de direction.",
      },
      {
        kind: "paragraph",
        heading: "But(s)",
        text: "Passer le slalom sans toucher les plots, tête relevée.",
      },
      {
        kind: "list",
        heading: "Consignes",
        items: [
          "Disposer 6 plots espacés de 2 m.",
          "Conduire le ballon en slalom avec les deux pieds.",
          "Accélérer sur les 5 derniers mètres après le dernier plot.",
        ],
      },
      {
        kind: "list",
        heading: "Comportements attendus — Individuels",
        items: [
          "Ballon proche du pied dans les virages.",
          "Regard alterné ballon / espace.",
        ],
      },
    ],
  },
  {
    id: "s21-passes",
    materiel: [
      { quantite: 10, nom: "Ballons" },
      { quantite: 18, nom: "Coupelles" },
    ],
    titre: "Passes courtes en triangle",
    fifaCard: "TEC",
    duree: "15 minutes",
    sequence: "3*5 minutes",
    recuperation: "40",
    image: IMG_B,
    blocks: [
      {
        kind: "paragraph",
        heading: "Objectif",
        text: "Développer la qualité et la vitesse des passes courtes.",
      },
      {
        kind: "paragraph",
        heading: "But(s)",
        text: "Enchaîner un maximum de passes justes en mouvement.",
      },
      {
        kind: "list",
        heading: "Consignes",
        items: [
          "Trois joueurs forment un triangle de 8 m de côté.",
          "Passe et suit : le passeur va au poste de réception.",
          "Une touche de contrôle, une touche de passe.",
        ],
      },
      {
        kind: "list",
        heading: "Comportements attendus — Individuels",
        items: [
          "Passe appuyée sur le pied fort du partenaire.",
          "Prise d'information avant la réception.",
        ],
      },
    ],
  },
  {
    id: "s21-jeu-position",
    materiel: [
      { quantite: 4, nom: "Ballons" },
      { quantite: 16, nom: "Coupelles" },
      { quantite: 6, nom: "Chasubles" },
    ],
    titre: "Jeu de position 4 contre 2",
    fifaCard: "TAC",
    duree: "18 minutes",
    sequence: "2*9 minutes",
    recuperation: "90",
    image: IMG_A,
    blocks: [
      {
        kind: "paragraph",
        heading: "Objectif",
        text: "Conserver le ballon sous pression et trouver l'homme libre.",
      },
      {
        kind: "paragraph",
        heading: "But(s)",
        text: "Réaliser 8 passes consécutives ou trouver la passe qui coupe une ligne.",
      },
      {
        kind: "list",
        heading: "Consignes",
        items: [
          "Carré de 10 m : 4 joueurs à l'extérieur, 2 défenseurs à l'intérieur.",
          "Deux touches maximum par joueur.",
          "Le défenseur qui récupère échange avec le joueur fautif.",
        ],
      },
      {
        kind: "list",
        heading: "Comportements attendus — Individuels",
        items: [
          "Orientation du corps ouverte sur le jeu.",
          "Créer un angle de passe en permanence.",
        ],
      },
    ],
  },
  {
    id: "s21-retour-calme",
    titre: "Retour au calme & étirements",
    fifaCard: "PHY",
    duree: "8 minutes",
    sequence: "1*8 minutes",
    recuperation: "0",
    image: IMG_A,
    blocks: [
      {
        kind: "paragraph",
        heading: "Objectif",
        text: "Favoriser la récupération et le relâchement musculaire.",
      },
      {
        kind: "paragraph",
        heading: "But(s)",
        text: "Faire redescendre la fréquence cardiaque en douceur.",
      },
      {
        kind: "list",
        heading: "Consignes",
        items: [
          "Marche active de 2 minutes en respirant profondément.",
          "Étirements doux des ischio-jambiers, quadriceps et mollets.",
          "Tenir chaque position 20 secondes sans à-coups.",
        ],
      },
      {
        kind: "list",
        heading: "Comportements attendus — Individuels",
        items: [
          "Respiration lente et contrôlée.",
          "Aucun étirement en force ni rebond.",
        ],
      },
    ],
  },
]

/* ── Roster — staff + joueurs convoqués to the Minime séances ─────────────── */

/**
 * The convoqués shared by the seeded séances. Mixed réponses (mostly acceptées,
 * a couple de refus with a motif, a few en attente) so the Convocation counters
 * read like real data. The same people are re-used for the Présence tab.
 */
const MINIME_ROSTER: SeanceParticipant[] = [
  // Staff.
  { id: "sp-st1", name: "Mondher Kanzari", role: "Éducateur principal", kind: "staff", convocation: "accepte" },
  { id: "sp-st2", name: "Sami Gharsallah", role: "Éducateur adjoint", kind: "staff", convocation: "accepte" },
  { id: "sp-st3", name: "Nabil Ayari", role: "Préparateur physique", kind: "staff", convocation: "attente" },
  { id: "sp-st4", name: "Leila Mansour", role: "Kinésithérapeute", kind: "staff", convocation: "accepte" },
  // Joueurs.
  { id: "sp-gk", name: "Youssef Mnasri", role: "Gardien", kind: "joueur", numero: 1, convocation: "accepte" },
  { id: "sp-df1", name: "Karim Haddad", role: "Défenseur droit", kind: "joueur", numero: 2, convocation: "accepte" },
  { id: "sp-df2", name: "Nizar Ben Amor", role: "Défenseur central", kind: "joueur", numero: 5, convocation: "accepte" },
  { id: "sp-df3", name: "Aymen Trabelsi", role: "Défenseur central", kind: "joueur", numero: 4, convocation: "attente" },
  { id: "sp-df4", name: "Slim Ferjani", role: "Défenseur gauche", kind: "joueur", numero: 3, convocation: "accepte" },
  { id: "sp-me1", name: "Hamza Gharbi", role: "Milieu central", kind: "joueur", numero: 6, convocation: "accepte" },
  { id: "sp-me2", name: "Oussama Jelassi", role: "Milieu relayeur", kind: "joueur", numero: 8, convocation: "accepte" },
  { id: "sp-me3", name: "Firas Belhadj", role: "Meneur de jeu", kind: "joueur", numero: 10, convocation: "refuse", note: "Blessure à la cheville" },
  { id: "sp-at1", name: "Mehdi Chaieb", role: "Ailier droit", kind: "joueur", numero: 7, convocation: "accepte" },
  { id: "sp-at2", name: "Wael Khelifi", role: "Avant-centre", kind: "joueur", numero: 9, convocation: "accepte" },
  { id: "sp-at3", name: "Bilel Saidi", role: "Ailier gauche", kind: "joueur", numero: 11, convocation: "attente" },
  { id: "sp-sub1", name: "Zied Ouni", role: "Attaquant", kind: "joueur", numero: 17, convocation: "refuse", note: "Absent — raisons personnelles" },
  { id: "sp-sub2", name: "Anis Mabrouk", role: "Milieu", kind: "joueur", numero: 14, convocation: "accepte" },
  { id: "sp-sub3", name: "Tarek Amri", role: "Défenseur", kind: "joueur", numero: 15, convocation: "accepte" },
]

/**
 * Attendance for the terminée séance — the five states in play, plus two
 * participants deliberately left out of the record: they were never pointés,
 * which is what the Présence tab's "à pointer" counter reads.
 */
const SEANCE_21_PRESENCE: Record<string, PresenceStatut> = {
  "sp-st1": "present",
  "sp-st2": "present",
  "sp-st3": "present",
  "sp-st4": "retard",
  "sp-gk": "present",
  "sp-df1": "present",
  "sp-df2": "present",
  "sp-df4": "present",
  "sp-me1": "present",
  "sp-me2": "present",
  // Blessé à l'échauffement — présent au bord du terrain, mais pas à l'entraînement.
  "sp-me3": "blesse",
  "sp-at1": "present",
  "sp-at2": "present",
  "sp-at3": "absentJustifie",
  "sp-sub1": "absent",
  "sp-sub2": "present",
  // sp-sub3 et sp-df3 volontairement non pointés → l'état « à pointer ».
}

/* ── Seeded details ───────────────────────────────────────────────────────── */

/** "2026-07-06" → "06/07/2026". */
function frDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

/**
 * Featured séance (Séance 22, visible on the current month) — a full physical
 * evaluation with both seeded procédés. Header values follow the product spec.
 */
export const seanceDetailsSeed: SeanceDetail[] = [
  // Séance 21 (Terminé) — a five-procédé technical session, reusing the two
  // visuals in a varied order.
  {
    eventId: "ev-seance-21",
    numero: "Séance 21",
    type: "Séance technique",
    categorie: "Minime · Minime A",
    groupe: "Groupe A",
    effectif: "18",
    date: "29/06/2026",
    duree: "68",
    intensite: "Modérée",
    saison: "2025 - 2026",
    statut: "Terminé",
    securiteVerifiee: true,
    hydratationVerifiee: true,
    procedes: SEANCE_21_PROCEDES,
    participants: MINIME_ROSTER,
    presence: SEANCE_21_PRESENCE,
  },
  {
    eventId: "ev-seance-22",
    numero: "Séance 22",
    type: "Évaluation",
    categorie: "Minime · Minime A",
    groupe: "Groupe A",
    effectif: "18",
    date: "06/07/2026",
    duree: "32",
    intensite: "N/A",
    saison: "2025 - 2026",
    // Séance démarrée : c'est celle sur laquelle on fait le pointage.
    statut: "En cours",
    securiteVerifiee: true,
    hydratationVerifiee: false,
    procedes: [PROCEDE_VAMEVAL, PROCEDE_SPRINT],
    participants: MINIME_ROSTER,
    // Séance en cours : le pointage se fait maintenant, rien n'est encore saisi.
    presence: {},
  },
  // A not-started séance (Planifiée) — its tabs are Procédé + Convocation.
  {
    eventId: "ev-seance-25",
    numero: "Séance 25",
    type: "Évaluation",
    categorie: "FFF",
    groupe: "Groupe A",
    effectif: "18",
    date: "20/07/2026",
    duree: "20",
    intensite: "Élevée",
    saison: "2025 - 2026",
    statut: "Planifiée",
    securiteVerifiee: true,
    hydratationVerifiee: true,
    procedes: [PROCEDE_VAMEVAL],
    participants: MINIME_ROSTER,
    presence: {},
  },
]

/**
 * Copy a procédé of the club's library (Pôle technique ▸ Procédés) into a
 * séance.
 *
 * The séance takes a **snapshot** — its own id, its own blocks — so that
 * re-editing the library afterwards never rewrites a session already run, and
 * so the same exercise can be programmed twice in one séance. The library's
 * `sections` become the rich blocks the page already renders; its matériel is
 * kept as data, shown in the séance's matériel column.
 */
export function procedeFromLibrary(item: ProcedeItem): Procede {
  const blocks: ProcedeBlock[] = item.sections.map((section) =>
    section.items?.length
      ? { kind: "list", heading: section.titre, items: section.items }
      : { kind: "paragraph", heading: section.titre, text: section.texte ?? "" },
  )

  const [joueurs, gardiens] = item.effectif
  const effectif = [
    `${joueurs} joueur${joueurs > 1 ? "s" : ""}`,
    gardiens > 0 ? `${gardiens} gardien${gardiens > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return {
    id: crypto.randomUUID(),
    procedeId: item.id,
    titre: item.titre,
    type: item.type,
    duree: `${item.duree} minutes`,
    sequence: item.sequence,
    recuperation: item.recuperation,
    surface: `${item.surface[0]} × ${item.surface[1]} m`,
    effectif,
    image: item.image,
    blocks,
    materiel: item.materiel.map((m) => ({ ...m })),
  }
}

/**
 * The programme annuel keeps its own, leaner `SeanceClub` rows. Planning one
 * from the programme should still open the full séance page, so this widens it
 * into a `SeanceDetail`: its procédés are copied out of the library, and its
 * convoqués are the joueurs of the groupe it belongs to.
 */
export function buildSeanceFromClub(
  seance: {
    id: string
    numero: number
    date: string
    categorie: string
    groupe: string
    statut: "À venir" | "En cours" | "Terminée"
    duree: string
    effectif: number
    procedeIds: string[]
    securiteVerifiee: boolean
    hydratationVerifiee: boolean
    hydratations?: PauseHydratation[]
    materiel?: LigneMateriel[]
    groupesSeance?: ProcedeAtelier[]
    rpeCible?: number
    installation?: string
  },
  titre: string,
  procedes: Procede[],
  participants: SeanceParticipant[],
  saison: string,
): SeanceDetail {
  return {
    eventId: seance.id,
    numero: `Séance ${seance.numero}`,
    type: titre,
    categorie: seance.categorie,
    groupe: seance.groupe,
    effectif: seance.effectif ? String(seance.effectif) : String(participants.length),
    date: frDate(seance.date.slice(0, 10)),
    duree: seance.duree,
    intensite: seance.rpeCible ? `RPE ${seance.rpeCible}/10` : "N/A",
    saison,
    statut:
      seance.statut === "Terminée"
        ? "Terminé"
        : seance.statut === "En cours"
          ? "En cours"
          : "Planifiée",
    securiteVerifiee: seance.securiteVerifiee,
    hydratationVerifiee: seance.hydratationVerifiee,
    procedes,
    // Une séance planifiée sans matériel suit celui de ses procédés.
    materiel: seance.materiel?.length ? seance.materiel : undefined,
    groupesSeance: seance.groupesSeance,
    lieu: seance.installation,
    hydratations: seance.hydratations,
    participants,
    presence: {},
  }
}

/**
 * Any séance without a seeded detail still opens a coherent page: the header is
 * derived from its calendar event and the procédé list is empty (empty state).
 */
export function buildFallbackSeance(event: PlanEvent): SeanceDetail {
  return {
    eventId: event.id,
    numero: event.title,
    type: "Séance technique",
    categorie: event.category ?? "N/A",
    groupe: "N/A",
    effectif: "N/A",
    date: frDate(event.date),
    duree: "N/A",
    intensite: "N/A",
    saison: "2025 - 2026",
    statut: "Planifiée",
    securiteVerifiee: false,
    hydratationVerifiee: false,
    procedes: [],
    participants: [],
    presence: {},
  }
}
