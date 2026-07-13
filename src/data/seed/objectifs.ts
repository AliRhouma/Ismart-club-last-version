/**
 * Objectifs techniques — seed for the Structuration ▸ Objectifs techniques
 * table. Each row is a technical target assigned to a squad, with an
 * evaluation criterion, a target value, and a review status (the educator
 * proposes; the responsible validates → Accepté / Refusé).
 *
 * `assignes` holds the full list of players the objective is affected to; the
 * table shows the first couple of names + "+N". No engine — statuses are set
 * by hand in the review modal, not computed.
 */

export type ObjectifStatut = "En attente" | "Accepté" | "Refusé"

export type Objectif = {
  id: string
  titre: string
  categorie: string
  assignes: string[]
  critere: string
  valeurCible: string
  statut: ObjectifStatut
  /** dd/mm/yyyy — matches the notification date format */
  date: string
  description: string
}

/** Player name pool, drawn from to build believable squads. */
export const PLAYER_POOL = [
  "Abdelmalek Smaili", "Adem Bougdiri", "Yassine Khelifi", "Mohamed Ali Trabelsi",
  "Firas Ben Salah", "Oussama Gharbi", "Rayan Jebali", "Aziz Mansour",
  "Nizar Hammami", "Skander Ayari", "Malek Chaabane", "Hamza Ferjani",
  "Wassim Ltaief", "Bilel Mejri", "Anis Zouari", "Seif Eddine Nasri",
  "Karim Baccouche", "Ghassen Riahi", "Amine Dridi", "Aymen Sassi",
  "Zied Ouni", "Marwen Belhaj", "Chedi Toumi", "Mehdi Karray",
  "Louay Ben Amor", "Hedi Guesmi", "Sofien Abidi", "Nourdine Saidi",
  "Taha Mahjoub", "Elyes Bouazizi",
]

/** Categories used across the club's teams (also feeds the category filter). */
export const CATEGORIES = ["U13", "Minime", "Cadet", "U15", "Junior"]

const squad = (n: number) => PLAYER_POOL.slice(0, n)

export const objectifsSeed: Objectif[] = [
  {
    id: "obj-vitesse-30m",
    titre: "obj vitesse 30m",
    categorie: "Minime",
    assignes: squad(28),
    critere: "Vitesse linéaire 30m",
    valeurCible: "40 s",
    statut: "Accepté",
    date: "24/04/2026",
    description:
      "Améliorer la vitesse de course sur 30 mètres départ arrêté, mesurée au chronomètre électronique.",
  },
  {
    id: "obj-cooper",
    titre: "Endurance 2400m (Cooper)",
    categorie: "Cadet",
    assignes: squad(22),
    critere: "Test de Cooper (12 min)",
    valeurCible: "2400 m",
    statut: "En attente",
    date: "22/04/2026",
    description:
      "Développer la capacité aérobie : distance parcourue en 12 minutes de course continue.",
  },
  {
    id: "obj-passes",
    titre: "Précision passes courtes",
    categorie: "U15",
    assignes: squad(18),
    critere: "Passes réussies sur 20",
    valeurCible: "16/20",
    statut: "En attente",
    date: "21/04/2026",
    description:
      "Atteindre 16 passes courtes réussies sur 20 tentatives, sous pression légère.",
  },
  {
    id: "obj-detente",
    titre: "Détente verticale",
    categorie: "Junior",
    assignes: squad(14),
    critere: "Saut vertical (CMJ)",
    valeurCible: "55 cm",
    statut: "Accepté",
    date: "18/04/2026",
    description:
      "Améliorer la puissance des membres inférieurs, mesurée au counter-movement jump.",
  },
  {
    id: "obj-conduite",
    titre: "Conduite de balle slalom",
    categorie: "Minime",
    assignes: squad(9),
    critere: "Slalom 20 m chronométré",
    valeurCible: "8.5 s",
    statut: "Refusé",
    date: "16/04/2026",
    description:
      "Réaliser le parcours slalom de 20 m balle au pied en moins de 8.5 secondes.",
  },
  {
    id: "obj-tirs",
    titre: "Tirs cadrés",
    categorie: "Cadet",
    assignes: squad(25),
    critere: "Tirs cadrés sur 15",
    valeurCible: "12/15",
    statut: "En attente",
    date: "14/04/2026",
    description:
      "Cadrer au moins 12 tirs sur 15 depuis l'entrée de la surface, pied fort.",
  },
  {
    id: "obj-souplesse",
    titre: "Souplesse ischio-jambiers",
    categorie: "U13",
    assignes: squad(16),
    critere: "Test Sit and Reach",
    valeurCible: "+8 cm",
    statut: "Accepté",
    date: "11/04/2026",
    description:
      "Gagner en souplesse de la chaîne postérieure, mesurée au flexomètre (sit and reach).",
  },
  {
    id: "obj-recup-fc",
    titre: "Récupération FC post-effort",
    categorie: "Junior",
    assignes: squad(20),
    critere: "Baisse de FC en 1 min",
    valeurCible: "35 bpm",
    statut: "En attente",
    date: "09/04/2026",
    description:
      "Améliorer la récupération cardiaque : chute de la fréquence cardiaque une minute après l'effort.",
  },
]
