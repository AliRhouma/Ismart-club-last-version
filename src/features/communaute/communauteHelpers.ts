/**
 * Non-component helpers of the Communauté (kept apart so the .tsx files only
 * export components — React fast refresh).
 */
import { useOutletContext } from "react-router-dom"

import type { ClubCommunaute } from "@/data/seed/communaute"

export const RACINE_COMMUNAUTE = "/communaute"

export const CHEMINS = {
  profil: RACINE_COMMUNAUTE,
  partages: `${RACINE_COMMUNAUTE}/partages`,
  partenaires: `${RACINE_COMMUNAUTE}/partenaires`,
  partenairesListe: `${RACINE_COMMUNAUTE}/partenaires/liste`,
  partenairesParametres: `${RACINE_COMMUNAUTE}/partenaires/parametres`,
}

export const cheminClub = (id: string) => `${RACINE_COMMUNAUTE}/clubs/${id}`

/** "Montreuil FC" → "MF"; "F.C. 93" → "F9". */
export const initialesClub = (nom: string) =>
  nom
    .replace(/[.]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]!.toUpperCase())
    .join("")

/** "2026-05-04" → "4 mai 2026". */
export const dateFr = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export const nomDuClub = (clubs: ClubCommunaute[], id: string) =>
  clubs.find((c) => c.id === id)?.nom ?? "Club inconnu"

/** Deterministic 0…1 sequence from a string — stable thumbnails. */
export const graine = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  let x = h >>> 0
  return () => {
    x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0
    x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296
  }
}

/** What the Communauté shell hands its tabs (the shared toast). */
export type CommunauteContexte = { notify: (msg: string) => void }

export const useCommunaute = () => useOutletContext<CommunauteContexte>()
