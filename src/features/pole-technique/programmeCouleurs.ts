/**
 * Programme annuel — the colour scale of the planning grid.
 *
 * Raw hex here, on purpose: the design system's palette is chrome (one green
 * for buttons, one blue for everything interactive), while a season plan needs
 * one telling hue per principe — the "sports data viz" exception. Hues carry
 * the family, so a coach reads the season at a glance:
 *   · On a le ballon      → cool  (blue → teal → violet)
 *   · On n'a pas le ballon → warm  (coral → deep red)
 *   · Autre (évaluation, récréative, physique…) → its own distinct hue
 * A slot with nothing set stays neutral (no colour) and reads as "à définir".
 */

import type { ProgSession } from "@/data/seed/programmation"

/** Colour of a slot: its principe, or its séance spéciale, keyed as below. */
const COULEURS: Record<string, string> = {
  /* On a le ballon */
  "creer-et-utiliser-des-espaces": "#1d4ed8",
  "jouer-dans-les-intervalles-et-entres-les-l": "#4f46e5",
  "jouer-a-l-oppose-apres-avoir-fixe-collecti": "#0091ff",
  "jouer-combine-pour-creer-un-surnombre": "#0d9488",
  "se-demarquer-pour-fixer-et-eliminer-passer": "#6d28d9",
  /* On n'a pas le ballon */
  "freiner-la-progression-de-l-adversaire-org": "#f2777a",
  "densifier-et-etre-actif-dans-le-cjd": "#dc2626",
  "s-organiser-en-desequilibre": "#ef4444",
  "defendre-son-but-recuperer-ou-degager-le-b": "#991b1b",
  /* Autre — les séances qui ne travaillent pas un principe */
  "special:Évaluation": "#1e3a8a",
  "special:Séance récréative": "#10b981",
  "special:Préparation physique": "#db2777",
  "special:Problèmes récurrents": "#e6a817",
}

/** Complementary principes (échauffements, athlétique, divers) land here. */
const PALETTE_SECONDAIRE = [
  "#0e7490",
  "#7c3aed",
  "#c2410c",
  "#4d7c0f",
  "#a16207",
  "#be123c",
]

/** How a slot is identified across the grid, the legend and the filters. */
export const cleDe = (s: Pick<ProgSession, "principeId" | "special">) =>
  s.principeId ?? (s.special ? `special:${s.special}` : null)

export const cleSpeciale = (special: string) => `special:${special}`

/** Stable hue for a key with no dedicated colour — same id, same colour. */
const secondaire = (cle: string) => {
  let n = 0
  for (let i = 0; i < cle.length; i++) n = (n + cle.charCodeAt(i)) % 997
  return PALETTE_SECONDAIRE[n % PALETTE_SECONDAIRE.length]
}

export const couleurDe = (cle: string | null): string | null =>
  cle ? (COULEURS[cle] ?? secondaire(cle)) : null

/** Ink that stays readable on a filled tile (light hues take dark text). */
export function encreSur(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  // Rec. 601 luma — enough to split the light coral / amber tiles from the rest.
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1e1e1e" : "#ffffff"
}
