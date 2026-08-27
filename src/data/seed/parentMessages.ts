/**
 * Espace parent — Messagerie familiale (seed).
 *
 * A parent has ONE inbox for the whole family: every conversation the club
 * opens about one of the children lands here. What makes it readable is that a
 * conversation always belongs to a child (`enfantId` → `parentEnfantsSeed`), so
 * the screen can pin the child on every row and filter the inbox by child.
 *
 * Three kinds of interlocuteur, because that is who actually writes to a
 * family: l'éducateur de l'enfant (direct), le groupe des parents de sa
 * catégorie, et un service du club (secrétariat, cellule médicale).
 *
 * Deliberately uneven — Aziz vient d'arriver (beaucoup de non-lus, un groupe
 * de parents encore vide), Rayan a une entorse en cours de protocole, Taha
 * n'a que des fils calmes — pour que les états vides et chargés soient tous
 * atteignables en changeant d'enfant.
 */

/** Who is on the other side of the thread. */
export type ParentConvKind = "educateur" | "groupe" | "club"

export type ParentMessage = {
  id: string
  /** Display name of the author ("Nabil Ayari", "Moi"). */
  author: string
  text: string
  /** ISO day, "YYYY-MM-DD" — the thread groups its messages by day. */
  date: string
  /** "HH:mm". */
  time: string
  /** True for the parent's own messages (right-aligned). */
  mine?: boolean
}

export type ParentConversation = {
  id: string
  /** The child this conversation is about — the whole point of the screen. */
  enfantId: string
  kind: ParentConvKind
  /** Interlocuteur: "Nabil Ayari", "Parents U10 · Groupe A", "Secrétariat". */
  name: string
  /** Second line under the name: his role, or the group's size. */
  role: string
  /** Members, for a group conversation. */
  membres?: number
  online?: boolean
  /** Unread messages — cleared as soon as the parent opens the thread. */
  unread: number
  messages: ParentMessage[]
}

export const CONV_KIND_LABEL: Record<ParentConvKind, string> = {
  educateur: "Éducateur",
  groupe: "Groupe de parents",
  club: "Service du club",
}

/* ── Taha Khemiri — U10 · Groupe A ─────────────────────────────────────── */

const taha: ParentConversation[] = [
  {
    id: "pconv-taha-educateur",
    enfantId: "u10-j7",
    kind: "educateur",
    name: "Nabil Ayari",
    role: "Éducateur · U10 · Groupe A",
    online: true,
    unread: 2,
    messages: [
      {
        id: "pm-t1",
        author: "Nabil Ayari",
        text: "Bonsoir Madame Khemiri. Taha a fait une très bonne séance ce soir, il commence enfin à lever la tête avant de recevoir le ballon.",
        date: "2026-08-18",
        time: "19:40",
      },
      {
        id: "pm-t2",
        author: "Moi",
        text: "Merci Nabil, ça lui fera plaisir de l'entendre. Il travaille beaucoup ça à la maison.",
        date: "2026-08-18",
        time: "20:12",
        mine: true,
      },
      {
        id: "pm-t3",
        author: "Nabil Ayari",
        text: "Ça se voit. Petite chose : il oublie systématiquement sa gourde au vestiaire, pensez à la marquer à son nom.",
        date: "2026-08-19",
        time: "08:05",
      },
      {
        id: "pm-t4",
        author: "Moi",
        text: "C'est noté, je la marque ce soir.",
        date: "2026-08-19",
        time: "08:31",
        mine: true,
      },
      {
        id: "pm-t5",
        author: "Nabil Ayari",
        text: "Je vous confirme la convocation de samedi contre l'AS Marsa : rendez-vous au club à 08h30, coup d'envoi 10h00.",
        date: "2026-08-21",
        time: "14:02",
      },
      {
        id: "pm-t6",
        author: "Nabil Ayari",
        text: "Merci de répondre à la convocation dans l'application avant jeudi soir, je fais la feuille de match vendredi matin.",
        date: "2026-08-21",
        time: "14:03",
      },
    ],
  },
  {
    id: "pconv-taha-groupe",
    enfantId: "u10-j7",
    kind: "groupe",
    name: "Parents U10 · Groupe A",
    role: "17 parents",
    membres: 17,
    unread: 0,
    messages: [
      {
        id: "pm-tg1",
        author: "Sonia Ben Amor",
        text: "Bonjour à tous, qui monte à La Marsa samedi ? J'ai deux places dans la voiture.",
        date: "2026-08-20",
        time: "18:22",
      },
      {
        id: "pm-tg2",
        author: "Karim Jelassi",
        text: "Je peux prendre trois enfants, je pars du club à 08h30.",
        date: "2026-08-20",
        time: "18:47",
      },
      {
        id: "pm-tg3",
        author: "Moi",
        text: "Je viens avec Taha, et je peux ramener deux enfants au retour.",
        date: "2026-08-20",
        time: "19:03",
        mine: true,
      },
      {
        id: "pm-tg4",
        author: "Sonia Ben Amor",
        text: "Parfait, on est complets. Je fais la liste et je l'envoie ce soir.",
        date: "2026-08-20",
        time: "19:15",
      },
    ],
  },
]

/* ── Rayan Khemiri — U13 · Groupe A ────────────────────────────────────── */

const rayan: ParentConversation[] = [
  {
    id: "pconv-rayan-medical",
    enfantId: "u13-j15",
    kind: "club",
    name: "Cellule médicale",
    role: "Kiné du club · Sofiene Abidi",
    unread: 1,
    messages: [
      {
        id: "pm-rm1",
        author: "Sofiene Abidi",
        text: "Bonjour, suite à l'entorse de cheville de Rayan, je mets en place un protocole de reprise sur deux semaines.",
        date: "2026-08-17",
        time: "11:20",
      },
      {
        id: "pm-rm2",
        author: "Sofiene Abidi",
        text: "Semaine 1 : course en ligne droite et travail proprioceptif, pas d'opposition. Semaine 2 : réathlétisation avec le groupe.",
        date: "2026-08-17",
        time: "11:22",
      },
      {
        id: "pm-rm3",
        author: "Moi",
        text: "Merci beaucoup. Il ne se plaint plus le matin, mais il boite encore un peu après l'effort.",
        date: "2026-08-17",
        time: "13:44",
        mine: true,
      },
      {
        id: "pm-rm4",
        author: "Sofiene Abidi",
        text: "C'est normal à ce stade. Glaçage 15 minutes après chaque séance, et on refait le point vendredi.",
        date: "2026-08-20",
        time: "17:05",
      },
    ],
  },
  {
    id: "pconv-rayan-educateur",
    enfantId: "u13-j15",
    kind: "educateur",
    name: "Nabil Ayari",
    role: "Éducateur · U13 · Groupe A",
    online: true,
    unread: 0,
    messages: [
      {
        id: "pm-re1",
        author: "Nabil Ayari",
        text: "Bravo à Rayan pour son doublé dimanche, il a été décisif sur les deux temps forts du match.",
        date: "2026-08-16",
        time: "21:10",
      },
      {
        id: "pm-re2",
        author: "Moi",
        text: "Merci ! Par contre il s'est fait mal à la cheville en fin de match, on a vu le kiné lundi.",
        date: "2026-08-16",
        time: "21:38",
        mine: true,
      },
      {
        id: "pm-re3",
        author: "Nabil Ayari",
        text: "Sofiene m'a transmis le protocole, je l'allège sur les séances de cette semaine. Aucune urgence à le remettre en opposition.",
        date: "2026-08-17",
        time: "12:02",
      },
      {
        id: "pm-re4",
        author: "Nabil Ayari",
        text: "Je le garde dans le groupe pour le tournoi de septembre, mais sa participation dépendra du feu vert médical.",
        date: "2026-08-19",
        time: "16:25",
      },
    ],
  },
  {
    id: "pconv-rayan-groupe",
    enfantId: "u13-j15",
    kind: "groupe",
    name: "Parents U13 · Groupe A",
    role: "22 parents",
    membres: 22,
    unread: 4,
    messages: [
      {
        id: "pm-rg1",
        author: "Hédi Trabelsi",
        text: "Bonjour, le club commande les survêtements de la saison cette semaine.",
        date: "2026-08-20",
        time: "09:14",
      },
      {
        id: "pm-rg2",
        author: "Hédi Trabelsi",
        text: "Merci d'envoyer la taille de votre enfant avant jeudi, après ce sera trop tard pour la première livraison.",
        date: "2026-08-20",
        time: "09:15",
      },
      {
        id: "pm-rg3",
        author: "Ines Ferchichi",
        text: "Est-ce que les tailles taillent grand ? L'an dernier j'avais pris trop juste.",
        date: "2026-08-20",
        time: "10:02",
      },
      {
        id: "pm-rg4",
        author: "Hédi Trabelsi",
        text: "Oui, prenez une taille au-dessus pour les U13.",
        date: "2026-08-21",
        time: "08:40",
      },
    ],
  },
]

/* ── Aziz Khemiri — U8 · Groupe A (arrivé en août) ─────────────────────── */

const aziz: ParentConversation[] = [
  {
    id: "pconv-aziz-educateur",
    enfantId: "u8-j12",
    kind: "educateur",
    name: "Leila Mansour",
    role: "Éducatrice · U8 · Groupe A",
    unread: 3,
    messages: [
      {
        id: "pm-ae1",
        author: "Leila Mansour",
        text: "Bienvenue à Aziz dans la catégorie U8 ! Sa première séance est mardi à 17h00 sur le terrain annexe.",
        date: "2026-08-19",
        time: "15:30",
      },
      {
        id: "pm-ae2",
        author: "Leila Mansour",
        text: "Comme il souhaite jouer gardien, prévoyez une paire de gants à sa taille et un survêtement long pour les plongeons.",
        date: "2026-08-19",
        time: "15:33",
      },
      {
        id: "pm-ae3",
        author: "Leila Mansour",
        text: "Il a très bien pris ses marques hier, il n'a pas eu peur du ballon une seule fois. On continue tranquillement.",
        date: "2026-08-21",
        time: "09:47",
      },
    ],
  },
  {
    id: "pconv-aziz-secretariat",
    enfantId: "u8-j12",
    kind: "club",
    name: "Secrétariat du club",
    role: "Inscriptions & licences",
    unread: 1,
    messages: [
      {
        id: "pm-as1",
        author: "Amel Belhadj",
        text: "Bonjour Madame Khemiri, le dossier d'inscription d'Aziz est presque complet.",
        date: "2026-08-18",
        time: "10:15",
      },
      {
        id: "pm-as2",
        author: "Amel Belhadj",
        text: "Il manque encore le certificat médical de non contre-indication et une photo d'identité récente.",
        date: "2026-08-18",
        time: "10:16",
      },
      {
        id: "pm-as3",
        author: "Moi",
        text: "Bonjour, nous avons le rendez-vous chez le médecin jeudi, je vous dépose tout vendredi matin.",
        date: "2026-08-18",
        time: "12:30",
        mine: true,
      },
      {
        id: "pm-as4",
        author: "Amel Belhadj",
        text: "Très bien. Sans le certificat, la licence ne pourra pas être validée avant le premier plateau de septembre.",
        date: "2026-08-20",
        time: "16:52",
      },
    ],
  },
  {
    id: "pconv-aziz-groupe",
    enfantId: "u8-j12",
    kind: "groupe",
    name: "Parents U8 · Groupe A",
    role: "9 parents · groupe créé cette semaine",
    membres: 9,
    unread: 0,
    messages: [],
  },
]

/**
 * The family inbox — every conversation of every child, in one list. The
 * screen sorts it by last activity; the order here is only the seed order.
 */
export const parentConversationsSeed: ParentConversation[] = [
  ...taha,
  ...rayan,
  ...aziz,
]
