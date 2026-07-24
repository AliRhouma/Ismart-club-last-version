/**
 * Planification slice — seed for the monthly calendar.
 *
 * Each row is one scheduled event of the club: a training session (`seance`),
 * a match (`match`), or a staff meeting (`reunion`). Dates are ISO
 * ("2026-07-06") so the calendar can group them by day without a date library;
 * times are plain "HH:mm" strings. `end` is optional (a séance often shows only
 * a start time).
 *
 * The seed centres on Juillet 2026 (the current month) so the calendar opens on
 * a populated view, with one event spilling into the previous month (29 Juin)
 * and one into the next (3 Août) to exercise the out-of-month cells.
 */

export type EventType = "seance" | "match" | "reunion"

export type PlanEvent = {
  id: string
  type: EventType
  /** ISO day, "YYYY-MM-DD". */
  date: string
  /** "HH:mm". */
  start: string
  /** "HH:mm" — optional; séances usually show only a start. */
  end?: string
  /** Headline shown on the chip: "Séance 22", "Match", "Weekly meeting". */
  title: string
  /** Team / group concerned, e.g. "Minime · Minime A". */
  category?: string
  /** Second line — séance objective, or the "Minime vs Match206" opponent line. */
  detail?: string
  /** Venue / room — "Stade", "Salle 1". */
  location?: string
}

export const eventsSeed: PlanEvent[] = [
  // Spills into the previous month (29 Juin) — exercises an out-of-month cell.
  {
    id: "ev-seance-21",
    type: "seance",
    date: "2026-06-29",
    start: "08:00",
    end: "10:00",
    title: "Séance 21",
    category: "Minime · Minime A",
    detail: "Se démarquer pour fixer et éliminer, passer ou finir",
    location: "Terrain B",
  },
  {
    id: "ev-seance-22",
    type: "seance",
    date: "2026-07-06",
    start: "08:00",
    end: "10:00",
    title: "Séance 22",
    category: "Minime · Minime A",
    detail: "Défendre son but, récupérer ou dégager le ballon",
    location: "Terrain B",
  },
  {
    id: "ev-seance-23",
    type: "seance",
    date: "2026-07-13",
    start: "08:00",
    end: "10:00",
    title: "Séance 23",
    category: "Minime · Minime A",
    detail: "Défendre son but, récupérer ou dégager le ballon",
    location: "Terrain B",
  },
  {
    id: "ev-reunion-weekly",
    type: "reunion",
    date: "2026-07-13",
    start: "09:00",
    end: "13:00",
    title: "Réunion hebdomadaire",
    category: "Staff technique",
    detail: "Bilan de la semaine et préparation du match",
    location: "Salle 1",
  },
  {
    id: "ev-match-206",
    type: "match",
    date: "2026-07-14",
    start: "08:00",
    end: "12:00",
    title: "iSmart Minimes vs AS Marsa",
    category: "Minime",
    detail: "iSmart Minimes vs AS Marsa",
    location: "Stade municipal",
  },
  // Juillet 2026 — a FINISHED match with the full debrief ("après le match").
  {
    id: "ev-match-fcb",
    type: "match",
    date: "2026-07-18",
    start: "17:00",
    end: "19:00",
    title: "Real Madrid vs FC Barcelone",
    category: "Senior",
    detail: "Real Madrid vs FC Barcelone",
    location: "Stade municipal",
  },
  // Juillet 2026 — an UPCOMING match, not started yet ("avant le coup d'envoi").
  {
    id: "ev-match-bayern",
    type: "match",
    date: "2026-07-30",
    start: "18:30",
    end: "20:30",
    title: "Real Madrid vs Bayern",
    category: "Senior",
    detail: "Real Madrid vs Bayern",
    location: "Stade municipal",
  },
  // The brief's featured example (Real Madrid vs Bayer FC, 9 mai 2026) — sits in
  // May so the header reads exactly as specified; reachable by paging back.
  {
    id: "ev-match-real",
    type: "match",
    date: "2026-05-09",
    start: "14:00",
    end: "16:00",
    title: "Real Madrid vs Bayer FC",
    category: "Senior",
    detail: "Real Madrid vs Bayer FC",
    location: "Stade municipal",
  },
  // Sits on the current day (9 Juil 2026) so the “aujourd’hui” cell has content.
  {
    id: "ev-seance-24",
    type: "seance",
    date: "2026-07-09",
    start: "17:30",
    end: "19:00",
    title: "Séance 24",
    category: "Minime · Minime B",
    detail: "Transitions offensives après récupération",
    location: "Terrain A",
  },
  {
    id: "ev-seance-25",
    type: "seance",
    date: "2026-07-20",
    start: "08:00",
    end: "10:00",
    title: "Séance 25",
    category: "Minime · Minime A",
    detail: "Jouer dans les intervalles et entre les lignes",
    location: "Terrain B",
  },
  {
    id: "ev-seance-26",
    type: "seance",
    date: "2026-07-27",
    start: "08:00",
    end: "10:00",
    title: "Séance 26",
    category: "Minime · Minime A",
    detail: "Jouer dans les intervalles et entre les lignes",
    location: "Terrain B",
  },
  // Spills into the next month (3 Août) — the other out-of-month cell.
  {
    id: "ev-seance-27",
    type: "seance",
    date: "2026-08-03",
    start: "08:00",
    end: "10:00",
    title: "Séance 27",
    category: "Minime · Minime A",
    detail: "Finir les actions dans la surface",
    location: "Terrain B",
  },
]
