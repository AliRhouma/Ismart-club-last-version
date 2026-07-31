import type { SeanceStatut } from "@/data/seed/programmation"
import type { BadgeVariant } from "@/components/kit/Badge"

/** Séance status → badge tone. Only genuine status gets a semantic colour. */
export const statutVariant: Record<SeanceStatut, BadgeVariant> = {
  Terminée: "success",
  "En cours": "info",
  "À venir": "default",
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

/* Séance dates are stored as UTC instants; the club reads them as wall-clock
   times, so every formatter here works in UTC to avoid a timezone shift. */
export const moisDe = (iso: string) => {
  const d = new Date(iso)
  return `${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
export const jourDe = (iso: string) =>
  String(new Date(iso).getUTCDate()).padStart(2, "0")
export const moisCourtDe = (iso: string) =>
  MOIS[new Date(iso).getUTCMonth()].slice(0, 4)
export const heureDe = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, "0")}h${String(d.getUTCMinutes()).padStart(2, "0")}`
}
export const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
