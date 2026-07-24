/**
 * Match detail slice — the content behind a "match" card on the Planification
 * calendar. Clicking a match opens its page (MatchScreen), which has two
 * states, driven by `statut`:
 *
 *   • "avenir"  (avant le coup d'envoi) — the coach's briefing: who's convoqué
 *     (with their réponse), the consignes he sent, and an empty composition.
 *   • "termine" (après le match)        — the debrief: the timeline of events,
 *     the signed-in player's own stats, compositions, présences, évaluation
 *     (empty) and the same consignes.
 *
 * A match detail is keyed by the calendar event id (`PlanEvent.id`). Content is
 * reference-only: the store exposes it read-only (no add/edit/remove), exactly
 * like séance details. A match without a seeded detail falls back to
 * `buildFallbackMatch`, so every match card still opens a coherent page.
 */

import type { PlanEvent } from "@/data/seed/events"

/* ── Enums ─────────────────────────────────────────────────────────────────── */

/** RSVP to the convocation (before the match). */
export type ConvocationStatut = "accepte" | "refuse" | "attente"
/** Attendance recorded on match day (after the match). */
export type PresenceStatut = "present" | "absent" | "retard"
/** Which side an on-pitch event belongs to (your team home, opponent away). */
export type MatchSide = "home" | "away"

/* ── People — one roster shared by convocation + présences ─────────────────── */

export type MatchParticipant = {
  id: string
  name: string
  /** Poste ("Milieu central") for joueurs, fonction ("Entraîneur") for staff. */
  role: string
  kind: "joueur" | "staff"
  /** Numéro de maillot — joueurs only. */
  numero?: number
  /** RSVP shown on the Convocation tab. */
  convocation: ConvocationStatut
  /** Optional short reason, shown when a joueur has refused. */
  note?: string
  /** The signed-in user — highlighted, and the subject of the "Mes stats" tab. */
  isMe?: boolean
}

/* ── Timeline (finished match) ─────────────────────────────────────────────── */

export type MatchEventKind = "but" | "jaune" | "rouge" | "changement"

export type MatchTimelineEvent = {
  minute: number
  side: MatchSide
  kind: MatchEventKind
  /** Main actor — buteur, joueur averti, joueur entrant. */
  player: string
  /** Second line — passeur, motif, joueur remplacé. */
  detail?: string
}

/* ── Consignes (image + title cards) ───────────────────────────────────────── */

export type MatchConsigne = {
  id: string
  titre: string
  image: string
  /** "Toute l'équipe", "Coach → moi", "Défenseurs"… */
  audience: string
  /** Personal note addressed to the signed-in player. */
  personal?: boolean
}

/* ── The signed-in player's own line (finished match) ──────────────────────── */

export type MyMatchStats = {
  /** False when the player stayed on the bench — drives an empty-ish state. */
  played: boolean
  poste: string
  /** Titulaire / Remplaçant. */
  role: string
  minutes: number
  buts: number
  passesDecisives: number
  tirs: number
  tirsCadres: number
  passes: number
  precisionPasses: number
  ballonsRecuperes: number
  duelsGagnes: number
  duelsTotal: number
  cartonsJaunes: number
  cartonsRouges: number
  /** Coach's out-of-10 rating, or undefined when not graded. */
  note?: number
}

/* ── The match ─────────────────────────────────────────────────────────────── */

export type MatchStatut = "avenir" | "termine"

export type MatchDetail = {
  /** Matches PlanEvent.id. */
  eventId: string
  statut: MatchStatut
  /** Your team — always the "home" side (green, per the design system). */
  homeTeam: string
  /** Opponent — always the "away" side (red). */
  awayTeam: string
  /** "HH:mm". */
  kickoff: string
  /** ISO day, "YYYY-MM-DD". */
  dateIso: string
  categorie: string
  groupe: string
  /** Compétition the match belongs to ("La Liga", "Champions League"…). */
  competition?: string
  location?: string
  /** Final score — set only when statut === "termine". */
  homeScore?: number
  awayScore?: number
  participants: MatchParticipant[]
  consignes: MatchConsigne[]
  /* Finished-match only ↓ */
  timeline: MatchTimelineEvent[]
  /** Attendance keyed by participant id. */
  presence: Record<string, PresenceStatut>
  /** The signed-in player's line — undefined for an upcoming match. */
  myStats?: MyMatchStats
}

/* ── Shared image (per the brief, every consigne card uses this one) ───────── */

const TACTIC_IMG =
  "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/tactics/image-1761666361994-890610436.png"

/* ── Rosters ───────────────────────────────────────────────────────────────── */

/**
 * The convoqués of the featured upcoming match (Real Madrid vs Bayer FC). Mixed
 * réponses — mostly acceptées, a couple de refus (with a motif) and quelques
 * réponses en attente — so the counters read like real data. The signed-in
 * player (Hamza Gharbi, #6) has accepté.
 */
const SENIOR_ROSTER: MatchParticipant[] = [
  { id: "mp-gk", name: "Youssef Mnasri", role: "Gardien", kind: "joueur", numero: 1, convocation: "accepte" },
  { id: "mp-df1", name: "Karim Haddad", role: "Défenseur droit", kind: "joueur", numero: 2, convocation: "accepte" },
  { id: "mp-df2", name: "Nizar Ben Amor", role: "Défenseur central", kind: "joueur", numero: 5, convocation: "accepte" },
  { id: "mp-df3", name: "Aymen Trabelsi", role: "Défenseur central", kind: "joueur", numero: 4, convocation: "attente" },
  { id: "mp-df4", name: "Slim Ferjani", role: "Défenseur gauche", kind: "joueur", numero: 3, convocation: "accepte" },
  { id: "mp-me1", name: "Hamza Gharbi", role: "Milieu central", kind: "joueur", numero: 6, convocation: "accepte", isMe: true },
  { id: "mp-me2", name: "Oussama Jelassi", role: "Milieu relayeur", kind: "joueur", numero: 8, convocation: "accepte" },
  { id: "mp-me3", name: "Firas Belhadj", role: "Meneur de jeu", kind: "joueur", numero: 10, convocation: "refuse", note: "Blessure à la cheville" },
  { id: "mp-at1", name: "Mehdi Chaieb", role: "Ailier droit", kind: "joueur", numero: 7, convocation: "accepte" },
  { id: "mp-at2", name: "Wael Khelifi", role: "Avant-centre", kind: "joueur", numero: 9, convocation: "accepte" },
  { id: "mp-at3", name: "Bilel Saidi", role: "Ailier gauche", kind: "joueur", numero: 11, convocation: "attente" },
  { id: "mp-sub1", name: "Rami Zouari", role: "Gardien", kind: "joueur", numero: 16, convocation: "accepte" },
  { id: "mp-sub2", name: "Anis Mabrouk", role: "Milieu", kind: "joueur", numero: 14, convocation: "accepte" },
  { id: "mp-sub3", name: "Zied Ouni", role: "Attaquant", kind: "joueur", numero: 17, convocation: "refuse", note: "Absent — raisons personnelles" },
  { id: "mp-sub4", name: "Tarek Amri", role: "Défenseur", kind: "joueur", numero: 15, convocation: "attente" },
  // Staff.
  { id: "mp-st1", name: "Mondher Kanzari", role: "Entraîneur principal", kind: "staff", convocation: "accepte" },
  { id: "mp-st2", name: "Sami Gharsallah", role: "Entraîneur adjoint", kind: "staff", convocation: "accepte" },
  { id: "mp-st3", name: "Nabil Ayari", role: "Préparateur physique", kind: "staff", convocation: "attente" },
  { id: "mp-st4", name: "Leila Mansour", role: "Médecin", kind: "staff", convocation: "accepte" },
]

/** The consignes the coach pushed before the match (image + titre cards). */
const SENIOR_CONSIGNES: MatchConsigne[] = [
  { id: "mc-1", titre: "Plan de pressing haut", image: TACTIC_IMG, audience: "Toute l'équipe" },
  { id: "mc-2", titre: "Bloc défensif — phase sans ballon", image: TACTIC_IMG, audience: "Défenseurs & milieux" },
  { id: "mc-3", titre: "Coups de pied arrêtés offensifs", image: TACTIC_IMG, audience: "Toute l'équipe" },
  { id: "mc-4", titre: "Ta mission : verrouiller l'axe", image: TACTIC_IMG, audience: "Coach → moi", personal: true },
]

/* ── Played matches (Résultats) ────────────────────────────────────────────── */

/**
 * A finished match reduced to what the Résultats list shows: the two teams, the
 * final score, its catégorie and its poule/groupe. Convocation, timeline and
 * présences aren't needed here, so they're reused/empty — the roster is shared
 * so the record stays a coherent MatchDetail if a detail page is wired later.
 * `homeTeam` is always our club (green side); `awayTeam` is the opponent (red).
 */
const played = (
  eventId: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  categorie: string,
  groupe: string,
  competition: string,
  dateIso: string,
  kickoff: string,
  location = "Stade municipal",
): MatchDetail => ({
  eventId,
  statut: "termine",
  homeTeam,
  awayTeam,
  kickoff,
  dateIso,
  categorie,
  groupe,
  competition,
  location,
  homeScore,
  awayScore,
  participants: SENIOR_ROSTER,
  consignes: [],
  timeline: [],
  presence: {},
})

/**
 * The season's results — a varied mix so the list reads like real data: wide
 * wins, narrow losses, draws and 0-0s, across every catégorie and the three
 * poules (Group A / B / C). Newest first is handled by the screen.
 */
const RESULT_MATCHES: MatchDetail[] = [
  played("ev-result-1", "iSmart Seniors", "US Monastir", 3, 0, "Senior", "Group A", "La Liga", "2026-06-21", "18:00"),
  played("ev-result-2", "iSmart Seniors", "Espérance ST", 1, 2, "Senior", "Group A", "Champions League", "2026-06-07", "18:30", "Stade Olympique"),
  played("ev-result-3", "iSmart Cadets", "Stade Tunisien", 4, 1, "Cadet", "Group B", "Ligue 1", "2026-05-31", "10:00"),
  played("ev-result-4", "iSmart Minimes", "CA Bizertin", 2, 2, "Minime", "Group B", "Coupe de Tunisie", "2026-05-17", "09:00", "Terrain A"),
  played("ev-result-5", "iSmart Juniors", "JS Kairouan", 0, 0, "Junior", "Group C", "Ligue 1", "2026-05-03", "16:00"),
  played("ev-result-6", "iSmart Cadets", "AS Marsa", 2, 1, "Cadet", "Group C", "Coupe de Tunisie", "2026-04-19", "10:30"),
  played("ev-result-7", "iSmart Minimes", "Club Africain", 1, 3, "Minime", "Group A", "Champions League", "2026-04-05", "09:00", "Stade El Menzah"),
  played("ev-result-8", "iSmart Seniors", "ES Métlaoui", 5, 2, "Senior", "Group A", "La Liga", "2026-03-15", "18:00"),
  played("ev-result-9", "iSmart Juniors", "CS Sfaxien", 2, 0, "Junior", "Group C", "Champions League", "2026-02-28", "15:30"),
]

/* ── Seeded matches ────────────────────────────────────────────────────────── */

export const matchDetailsSeed: MatchDetail[] = [
  ...RESULT_MATCHES,
  /* Featured UPCOMING match — the brief's exact example (avant le coup d'envoi). */
  {
    eventId: "ev-match-real",
    statut: "avenir",
    homeTeam: "Real Madrid",
    awayTeam: "Bayer FC",
    kickoff: "14:00",
    dateIso: "2026-05-09",
    categorie: "Senior",
    groupe: "Group A",
    location: "Stade municipal",
    participants: SENIOR_ROSTER,
    consignes: SENIOR_CONSIGNES,
    timeline: [],
    presence: {},
  },

  /* Juillet 2026 — UPCOMING (not started): Real Madrid vs Bayern. Landing month
     already shows a "before" match to open. */
  {
    eventId: "ev-match-bayern",
    statut: "avenir",
    homeTeam: "Real Madrid",
    awayTeam: "Bayern Munich",
    kickoff: "18:30",
    dateIso: "2026-07-30",
    categorie: "Senior",
    groupe: "Group A",
    location: "Stade municipal",
    participants: SENIOR_ROSTER,
    consignes: SENIOR_CONSIGNES,
    timeline: [],
    presence: {},
  },

  /* Juillet 2026 — FINISHED with all details: Real Madrid vs FC Barcelone. */
  {
    eventId: "ev-match-fcb",
    statut: "termine",
    homeTeam: "Real Madrid",
    awayTeam: "FC Barcelone",
    kickoff: "17:00",
    dateIso: "2026-07-18",
    categorie: "Senior",
    groupe: "Group A",
    location: "Stade municipal",
    homeScore: 3,
    awayScore: 2,
    participants: SENIOR_ROSTER,
    consignes: SENIOR_CONSIGNES,
    timeline: [
      { minute: 8, side: "home", kind: "but", player: "Mehdi Chaieb", detail: "Passe décisive · Hamza Gharbi" },
      { minute: 21, side: "away", kind: "but", player: "FC Barcelone", detail: "Ouverture du score" },
      { minute: 39, side: "home", kind: "but", player: "Wael Khelifi", detail: "Passe décisive · Firas Belhadj" },
      { minute: 45, side: "home", kind: "jaune", player: "Nizar Ben Amor", detail: "Faute tactique" },
      { minute: 52, side: "away", kind: "but", player: "FC Barcelone", detail: "Penalty" },
      { minute: 60, side: "home", kind: "changement", player: "Zied Ouni", detail: "Entre à la place de Mehdi Chaieb" },
      { minute: 74, side: "home", kind: "but", player: "Firas Belhadj", detail: "Frappe des 20 mètres" },
      { minute: 83, side: "away", kind: "jaune", player: "FC Barcelone", detail: "Contestation" },
      { minute: 90, side: "home", kind: "changement", player: "Anis Mabrouk", detail: "Entre à la place de Wael Khelifi" },
    ],
    presence: {
      "mp-gk": "present",
      "mp-df1": "present",
      "mp-df2": "present",
      "mp-df3": "present",
      "mp-df4": "retard",
      "mp-me1": "present",
      "mp-me2": "present",
      "mp-me3": "absent",
      "mp-at1": "present",
      "mp-at2": "present",
      "mp-at3": "present",
      "mp-sub1": "present",
      "mp-sub2": "present",
      "mp-sub3": "present",
      "mp-sub4": "absent",
      "mp-st1": "present",
      "mp-st2": "present",
      "mp-st3": "present",
      "mp-st4": "retard",
    },
    myStats: {
      played: true,
      poste: "Milieu central",
      role: "Titulaire",
      minutes: 88,
      buts: 0,
      passesDecisives: 1,
      tirs: 3,
      tirsCadres: 1,
      passes: 52,
      precisionPasses: 91,
      ballonsRecuperes: 8,
      duelsGagnes: 9,
      duelsTotal: 13,
      cartonsJaunes: 0,
      cartonsRouges: 0,
      note: 8,
    },
  },

  /* FINISHED match (après le match) — the July fixture, with the full debrief. */
  {
    eventId: "ev-match-206",
    statut: "termine",
    homeTeam: "iSmart Minimes",
    awayTeam: "AS Marsa",
    kickoff: "08:00",
    dateIso: "2026-07-14",
    categorie: "Minime",
    groupe: "Group A",
    competition: "Ligue 1",
    location: "Stade municipal",
    homeScore: 2,
    awayScore: 1,
    participants: SENIOR_ROSTER,
    consignes: SENIOR_CONSIGNES,
    timeline: [
      { minute: 12, side: "home", kind: "but", player: "Mehdi Chaieb", detail: "Passe décisive · Hamza Gharbi" },
      { minute: 27, side: "away", kind: "jaune", player: "AS Marsa", detail: "Faute sur Wael Khelifi" },
      { minute: 34, side: "away", kind: "but", player: "AS Marsa", detail: "Contre-attaque" },
      { minute: 41, side: "home", kind: "jaune", player: "Karim Haddad", detail: "Anti-jeu" },
      { minute: 58, side: "home", kind: "changement", player: "Zied Ouni", detail: "Entre à la place de Wael Khelifi" },
      { minute: 63, side: "home", kind: "but", player: "Firas Belhadj", detail: "Penalty" },
      { minute: 78, side: "away", kind: "rouge", player: "AS Marsa", detail: "Deuxième avertissement" },
      { minute: 88, side: "home", kind: "changement", player: "Anis Mabrouk", detail: "Entre à la place de Mehdi Chaieb" },
    ],
    presence: {
      "mp-gk": "present",
      "mp-df1": "present",
      "mp-df2": "present",
      "mp-df3": "retard",
      "mp-df4": "present",
      "mp-me1": "present",
      "mp-me2": "present",
      "mp-me3": "absent",
      "mp-at1": "present",
      "mp-at2": "present",
      "mp-at3": "present",
      "mp-sub1": "present",
      "mp-sub2": "present",
      "mp-sub3": "absent",
      "mp-sub4": "retard",
      "mp-st1": "present",
      "mp-st2": "present",
      "mp-st3": "present",
      "mp-st4": "present",
    },
    myStats: {
      played: true,
      poste: "Milieu central",
      role: "Titulaire",
      minutes: 90,
      buts: 0,
      passesDecisives: 1,
      tirs: 2,
      tirsCadres: 1,
      passes: 47,
      precisionPasses: 89,
      ballonsRecuperes: 6,
      duelsGagnes: 7,
      duelsTotal: 11,
      cartonsJaunes: 0,
      cartonsRouges: 0,
      note: 7.5,
    },
  },
]

/**
 * Any match without a seeded detail still opens a coherent page: the header is
 * derived from its calendar event, participants/consignes are empty (empty
 * states), and the match is treated as upcoming.
 */
export function buildFallbackMatch(event: PlanEvent): MatchDetail {
  // event.detail is often "Équipe vs Adversaire" — split it when it fits.
  const [home, away] = (event.detail ?? "").split(/\s+vs\s+/i)
  return {
    eventId: event.id,
    statut: "avenir",
    homeTeam: home?.trim() || event.category || "Notre équipe",
    awayTeam: away?.trim() || "Adversaire",
    kickoff: event.start,
    dateIso: event.date,
    categorie: event.category ?? "N/A",
    groupe: "N/A",
    location: event.location,
    participants: [],
    consignes: [],
    timeline: [],
    presence: {},
  }
}
