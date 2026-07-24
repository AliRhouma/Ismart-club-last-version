/**
 * Messagerie — mock content for the prototype.
 *
 * UI-only: three conversation types (groupes, sessions, matchs), each with a
 * handful of conversations and their messages. Kept local to the feature (not
 * the store) because the screen only *displays* it — no add/edit/remove, no
 * real messaging logic. Varied on purpose (unread counts, an online group, an
 * empty conversation, a long name) so the demo reads as real.
 */

export type ConvType = "groupe" | "session" | "match"

export type ChatMessage = {
  id: string
  author: string
  text: string
  time: string
  /** True for the signed-in user's own messages (right-aligned). */
  mine?: boolean
}

export type Conversation = {
  id: string
  type: ConvType
  name: string
  /** Context line under the name (members, category, date…). */
  context: string
  members: number
  online?: boolean
  unread?: number
  /** Last-activity label shown on the list row ("14:32", "Hier", "Lun"). */
  lastTime: string
  messages: ChatMessage[]
}

export const CONV_TYPES: { value: ConvType; label: string }[] = [
  { value: "groupe", label: "Groupes" },
  { value: "session", label: "Séances" },
  { value: "match", label: "Matchs" },
]

/* ── Groupes ──────────────────────────────────────────────────────────────── */

const groupes: Conversation[] = [
  {
    id: "g-staff",
    type: "groupe",
    name: "Staff technique",
    context: "9 membres",
    members: 9,
    online: true,
    unread: 3,
    lastTime: "14:32",
    messages: [
      { id: "m1", author: "Anis Khelifi", text: "Bonjour à tous, on cale la réunion hebdo à quelle heure ?", time: "09:12" },
      { id: "m2", author: "Sami Bouzid", text: "18h ça me va, après la séance des U15.", time: "09:20" },
      { id: "m3", author: "Moi", text: "Parfait pour moi. Je réserve la salle vidéo.", time: "09:22", mine: true },
      { id: "m4", author: "Leïla Gharbi", text: "Je préparerai le bilan physique de la semaine.", time: "10:05" },
      { id: "m5", author: "Anis Khelifi", text: "Top. On revoit aussi la compo pour samedi.", time: "14:30" },
      { id: "m6", author: "Anis Khelifi", text: "N'oubliez pas les rapports individuels avant ce soir.", time: "14:32" },
    ],
  },
  {
    id: "g-direction",
    type: "groupe",
    name: "Direction & bureau",
    context: "6 membres",
    members: 6,
    unread: 0,
    lastTime: "Hier",
    messages: [
      { id: "m1", author: "Hédi Trabelsi", text: "Le budget de la saison est validé par le trésorier.", time: "Hier · 17:40" },
      { id: "m2", author: "Moi", text: "Merci Hédi, je diffuse aux pôles concernés.", time: "Hier · 18:02", mine: true },
    ],
  },
  {
    id: "g-coordination",
    type: "groupe",
    name: "Coordination générale du club",
    context: "24 membres",
    members: 24,
    online: true,
    unread: 12,
    lastTime: "11:48",
    messages: [
      { id: "m1", author: "Nizar Ben Salah", text: "Rappel : inscriptions de la nouvelle saison ouvertes lundi.", time: "08:30" },
      { id: "m2", author: "Sonia Belhaj", text: "Les affiches sont prêtes, je les partage aujourd'hui.", time: "10:15" },
      { id: "m3", author: "Yassine Amri", text: "On aura besoin de bénévoles pour la journée portes ouvertes.", time: "11:48" },
    ],
  },
  {
    id: "g-parents-u13",
    type: "groupe",
    name: "Parents U13",
    context: "31 membres",
    members: 31,
    unread: 0,
    lastTime: "Lun",
    messages: [
      { id: "m1", author: "Moi", text: "Bonjour, le transport pour le tournoi part à 8h du club.", time: "Lun · 19:10", mine: true },
      { id: "m2", author: "Fatma Zouari", text: "Bien noté, merci pour l'info !", time: "Lun · 19:25" },
    ],
  },
  {
    id: "g-educateurs",
    type: "groupe",
    name: "Éducateurs — jeunes",
    context: "14 membres",
    members: 14,
    unread: 0,
    lastTime: "",
    messages: [],
  },
]

/* ── Sessions (séances d'entraînement) ────────────────────────────────────── */

const sessions: Conversation[] = [
  {
    id: "s-u15-lundi",
    type: "session",
    name: "Séance U15 — Lundi 18h",
    context: "Terrain B · 22 joueurs",
    members: 24,
    online: true,
    unread: 2,
    lastTime: "13:05",
    messages: [
      { id: "m1", author: "Coach Sami", text: "Séance de ce soir centrée sur la conservation du ballon.", time: "12:40" },
      { id: "m2", author: "Coach Sami", text: "Prévoyez chasubles et plots, on commence à l'heure.", time: "12:41" },
      { id: "m3", author: "Moi", text: "Reçu, j'arrive 15 min avant pour installer.", time: "13:05", mine: true },
    ],
  },
  {
    id: "s-seniors-physique",
    type: "session",
    name: "Séance Séniors — Physique",
    context: "Salle de muscu · 18 joueurs",
    members: 20,
    unread: 0,
    lastTime: "Hier",
    messages: [
      { id: "m1", author: "Leïla Gharbi", text: "Circuit force + gainage aujourd'hui, 4 ateliers.", time: "Hier · 16:00" },
      { id: "m2", author: "Skander Riahi", text: "On garde le travail d'explosivité de la semaine dernière ?", time: "Hier · 16:20" },
      { id: "m3", author: "Leïla Gharbi", text: "Oui, atelier 3. Récupération active entre les séries.", time: "Hier · 16:24" },
    ],
  },
  {
    id: "s-gardiens",
    type: "session",
    name: "Gardiens — Spécifique",
    context: "Terrain annexe · 4 joueurs",
    members: 6,
    unread: 1,
    lastTime: "09:30",
    messages: [
      { id: "m1", author: "Entr. Mehdi", text: "Travail des sorties aériennes et relance courte ce matin.", time: "09:30" },
    ],
  },
  {
    id: "s-u17-tactique",
    type: "session",
    name: "Séance U17 — Tactique",
    context: "Terrain A · 20 joueurs",
    members: 22,
    unread: 0,
    lastTime: "Mar",
    messages: [
      { id: "m1", author: "Coach Anis", text: "On revoit le pressing haut avant le match de dimanche.", time: "Mar · 17:15" },
      { id: "m2", author: "Moi", text: "Je prépare la vidéo des situations à corriger.", time: "Mar · 17:40", mine: true },
    ],
  },
]

/* ── Matchs ───────────────────────────────────────────────────────────────── */

const matchs: Conversation[] = [
  {
    id: "match-es-tunis",
    type: "match",
    name: "Match vs ES Tunis — Séniors",
    context: "Dimanche 15h · Domicile",
    members: 28,
    online: true,
    unread: 5,
    lastTime: "15:20",
    messages: [
      { id: "m1", author: "Coach Anis", text: "Convocation envoyée. Rendez-vous 13h au vestiaire.", time: "14:10" },
      { id: "m2", author: "Skander Riahi", text: "Présent. Je récupère les maillots au local.", time: "14:35" },
      { id: "m3", author: "Moi", text: "Échauffement gardiens à 13h45 sur l'annexe.", time: "15:02", mine: true },
      { id: "m4", author: "Coach Anis", text: "Compo affichée dans le vestiaire à 14h30.", time: "15:20" },
    ],
  },
  {
    id: "match-sfax",
    type: "match",
    name: "Déplacement Sfax — CS Sfaxien",
    context: "Samedi 18h · Extérieur",
    members: 26,
    unread: 0,
    lastTime: "Hier",
    messages: [
      { id: "m1", author: "Nizar Ben Salah", text: "Le bus part vendredi à 15h, hôtel réservé sur place.", time: "Hier · 11:00" },
      { id: "m2", author: "Moi", text: "Liste des 20 joueurs transmise au chauffeur.", time: "Hier · 12:30", mine: true },
    ],
  },
  {
    id: "match-monastir",
    type: "match",
    name: "US Monastir — Coupe de Tunisie",
    context: "Mercredi 16h · Terrain neutre",
    members: 30,
    unread: 2,
    lastTime: "10:12",
    messages: [
      { id: "m1", author: "Coach Sami", text: "Match couperet, on prépare aussi la séance de tirs au but.", time: "10:00" },
      { id: "m2", author: "Yassine Amri", text: "Billetterie ouverte pour les supporters du club.", time: "10:12" },
    ],
  },
  {
    id: "match-derby",
    type: "match",
    name: "Derby vs Club Africain",
    context: "Dans 2 semaines · Domicile",
    members: 32,
    unread: 0,
    lastTime: "Lun",
    messages: [
      { id: "m1", author: "Hédi Trabelsi", text: "Dispositif de sécurité renforcé, réunion d'organisation jeudi.", time: "Lun · 09:00" },
    ],
  },
]

export const CONVERSATIONS: Conversation[] = [...groupes, ...sessions, ...matchs]
