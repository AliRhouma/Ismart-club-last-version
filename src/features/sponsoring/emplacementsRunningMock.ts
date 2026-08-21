import type { SlotKey } from "@/data/seed/sponsoring"

/**
 * IMAGINARY DATA — "Ce qui tourne en ce moment" on the Espaces publicitaires
 * screen.
 *
 * Deliberately local to that screen and NOT wired to the store: this is a
 * display proposal (what the club sees in each ad space right now) to validate
 * the layout before any real rotation logic exists. Percentages, countdowns and
 * partner names are made up; nothing here is computed.
 *
 * When the real logic lands, this file is what gets replaced — the screen reads
 * `RUNNING_BY_SLOT` and nothing else.
 */

export type RunningAd = {
  id: string
  /** The company whose visual is being served. */
  partner: string
  /** The campaign the visual belongs to. */
  campaign: string
  /** Headline drawn on the mock creative. */
  headline: string
  /** Where the creative sends you. */
  link: string
  /** Creative colour (raw hex — sponsor artwork, product data, not chrome). */
  color: string
  /** Share of the space, in % (rotation weight, or 100 for an exclusive one). */
  share: number
  /** Human countdown, e.g. "dans 3 jours". */
  endsIn: string
  /** Last day of diffusion, French long form. */
  endDate: string
  /** Days left — drives the urgency tone only. */
  daysLeft: number
  /** Optional unit line for booked / quota spaces. */
  note?: string
}

/**
 * One entry per ad space. Varied on purpose: a full rotation, a space with a
 * single exclusive buyer, a space ending tomorrow, and an empty one (splash —
 * nobody has bought the écran d'ouverture for the moment).
 */
export const RUNNING_BY_SLOT: Record<SlotKey, RunningAd[]> = {
  /* Messagerie — cumulative: every partenaire keeps its conversation. */
  messagerie: [
    {
      id: "run-messagerie-delice",
      partner: "Délice Danone",
      campaign: "Campagne Été 2026",
      headline: "Délice Danone — Partenaire officiel",
      link: "https://delice.tn",
      color: "#0091ff",
      share: 100,
      endsIn: "dans 45 jours",
      endDate: "31 août 2026",
      daysLeft: 45,
      note: "Toujours visible — la liste des conversations n'est pas une rotation",
    },
    {
      id: "run-messagerie-ooredoo",
      partner: "Ooredoo Tunisie",
      campaign: "Forfait Jeunes 2026",
      headline: "Ooredoo — Partenaire télécom",
      link: "https://ooredoo.tn",
      color: "#e5484d",
      share: 100,
      endsIn: "dans 60 jours",
      endDate: "15 septembre 2026",
      daysLeft: 60,
    },
    {
      id: "run-messagerie-sartex",
      partner: "Sartex Sport — équipementier officiel",
      campaign: "Maillots 2026-2027",
      headline: "Sartex Sport — équipementier officiel",
      link: "https://sartex.tn/club",
      color: "#14b8a6",
      share: 100,
      endsIn: "dans 210 jours",
      endDate: "28 février 2027",
      daysLeft: 210,
    },
    {
      id: "run-messagerie-pharmacie",
      partner: "Pharmacie Centrale El Menzah",
      campaign: "Santé des jeunes",
      headline: "Votre pharmacie de quartier",
      link: "https://pharmacie-elmenzah.tn",
      color: "#9aa4b2",
      share: 100,
      endsIn: "dans 3 jours",
      endDate: "3 août 2026",
      daysLeft: 3,
    },
  ],

  /* Bannière calendrier — rotation pondérée, la plus disputée. */
  planification: [
    {
      id: "run-cal-delice",
      partner: "Délice Danone",
      campaign: "Campagne Été 2026",
      headline: "Bien grandir, bien jouer",
      link: "https://delice.tn/juniors",
      color: "#0091ff",
      share: 38,
      endsIn: "dans 45 jours",
      endDate: "31 août 2026",
      daysLeft: 45,
    },
    {
      id: "run-cal-ooredoo",
      partner: "Ooredoo Tunisie",
      campaign: "Forfait Jeunes 2026",
      headline: "Forfait Jeunes — 30 Go",
      link: "https://ooredoo.tn/jeunes",
      color: "#e5484d",
      share: 27,
      endsIn: "dans 60 jours",
      endDate: "15 septembre 2026",
      daysLeft: 60,
    },
    {
      id: "run-cal-biat",
      partner: "BIAT",
      campaign: "Compte Junior",
      headline: "Le premier compte de votre enfant",
      link: "https://biat.com.tn/junior",
      color: "#7f77dd",
      share: 20,
      endsIn: "dans 12 jours",
      endDate: "12 août 2026",
      daysLeft: 12,
    },
    {
      id: "run-cal-pharmacie",
      partner: "Pharmacie Centrale El Menzah",
      campaign: "Santé des jeunes",
      headline: "Bilan sportif offert aux licenciés",
      link: "https://pharmacie-elmenzah.tn/sport",
      color: "#9aa4b2",
      share: 15,
      endsIn: "dans 3 jours",
      endDate: "3 août 2026",
      daysLeft: 3,
    },
  ],

  /* Fil d'accueil — rotation plus courte, une campagne se termine demain. */
  accueil: [
    {
      id: "run-feed-delice",
      partner: "Délice Danone",
      campaign: "Campagne Été 2026",
      headline: "Délice Zéro — nouveau",
      link: "https://delice.tn/zero",
      color: "#0091ff",
      share: 45,
      endsIn: "dans 45 jours",
      endDate: "31 août 2026",
      daysLeft: 45,
    },
    {
      id: "run-feed-sartex",
      partner: "Sartex Sport — équipementier officiel",
      campaign: "Maillots 2026-2027",
      headline: "Le nouveau maillot domicile est arrivé",
      link: "https://sartex.tn/maillot",
      color: "#14b8a6",
      share: 35,
      endsIn: "dans 210 jours",
      endDate: "28 février 2027",
      daysLeft: 210,
    },
    {
      id: "run-feed-garage",
      partner: "Garage Auto Plus",
      campaign: "Révision d'été",
      headline: "Révision d'été : -20 % pour les parents",
      link: "https://autoplus.tn/ete",
      color: "#e5844b",
      share: 20,
      endsIn: "demain",
      endDate: "1 août 2026",
      daysLeft: 1,
    },
  ],

  /* Page de match — acheté à l'unité : un seul sponsor à la fois. */
  match_detail: [
    {
      id: "run-match-ooredoo",
      partner: "Ooredoo Tunisie",
      campaign: "Forfait Jeunes 2026",
      headline: "Match présenté par Ooredoo",
      link: "https://ooredoo.tn/jeunes",
      color: "#e5484d",
      share: 100,
      endsIn: "dans 8 jours",
      endDate: "8 août 2026",
      daysLeft: 8,
      note: "4 matchs restants sur les 20 achetés",
    },
  ],


  /* Notification push — quota d'envois partagé entre deux partenaires. */
  notification: [
    {
      id: "run-notif-delice",
      partner: "Délice Danone",
      campaign: "Campagne Été 2026",
      headline: "Un yaourt offert après chaque victoire",
      link: "https://delice.tn/offre",
      color: "#0091ff",
      share: 60,
      endsIn: "dans 45 jours",
      endDate: "31 août 2026",
      daysLeft: 45,
      note: "3 envois / jour · 41 restants sur le quota",
    },
    {
      id: "run-notif-biat",
      partner: "BIAT",
      campaign: "Compte Junior",
      headline: "Ouvrez un Compte Junior avant la rentrée",
      link: "https://biat.com.tn/junior",
      color: "#7f77dd",
      share: 40,
      endsIn: "dans 12 jours",
      endDate: "12 août 2026",
      daysLeft: 12,
      note: "2 envois / jour · 9 restants sur le quota",
    },
  ],
}

/** Urgency of a countdown — real status, so it earns a semantic colour. */
export function endTone(daysLeft: number): "danger" | "warning" | "muted" {
  if (daysLeft <= 3) return "danger"
  if (daysLeft <= 14) return "warning"
  return "muted"
}
