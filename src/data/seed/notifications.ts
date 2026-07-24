/**
 * Top-bar notifications — seed for the bell dropdown. Notifications now live in
 * the store so new ones can be pushed at runtime (e.g. when a technical
 * objective is created). A notification of kind `objectif` carries the
 * `objectifId` it refers to, so clicking it opens that objective's review
 * modal.
 */

export type NotifKind = "fiche" | "reponse" | "charte" | "objectif" | "demande"

export type AppNotif = {
  id: string
  kind: NotifKind
  title: string
  /** dd/mm/yyyy */
  date: string
  body: string
  unread?: boolean
  /** set when kind === "objectif" — the objective to open on click */
  objectifId?: string
}

export const notificationsSeed: AppNotif[] = [
  { id: "n1", kind: "fiche", title: "Fiche de poste", date: "24/04/2026", body: "Nouvelle fiche de poste disponible", unread: true },
  { id: "n2", kind: "fiche", title: "Fiche de poste", date: "23/04/2026", body: "Nouvelle fiche de poste disponible", unread: true },
  { id: "n3", kind: "fiche", title: "Fiche de poste", date: "23/04/2026", body: "Nouvelle fiche de poste disponible" },
  { id: "n4", kind: "fiche", title: "Fiche de poste", date: "23/04/2026", body: "Nouvelle fiche de poste disponible" },
  { id: "n5", kind: "reponse", title: "Réponse charte", date: "22/04/2026", body: "Nouvelle réponse pour le rôle « Règlement test ios »", unread: true },
  { id: "n6", kind: "charte", title: "Charte", date: "22/04/2026", body: "Nouveau document disponible" },
  { id: "n7", kind: "reponse", title: "Réponse charte", date: "22/04/2026", body: "Nouvelle réponse pour le rôle « Règlement test ios »" },
  { id: "n8", kind: "charte", title: "Charte", date: "09/04/2026", body: "Nouveau document disponible" },
  { id: "n9", kind: "charte", title: "Charte", date: "09/04/2026", body: "Nouveau document disponible" },
  { id: "n10", kind: "charte", title: "Charte", date: "09/04/2026", body: "Nouveau document disponible" },
]
