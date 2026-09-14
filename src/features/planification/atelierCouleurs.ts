import type { AtelierCouleur } from "@/data/seed/seances"

/**
 * Chasuble colours for a working group.
 *
 * A groupe de joueurs is a set of bibs on the pitch, so its colour is *content*
 * — what the éducateur shouts ("les jaunes avec moi") — not decoration, which is
 * why a hue outside the blue/neutral accent rule is allowed here. Six bibs, the
 * ones a club actually owns. Where a design token already names the same hue it
 * is reused verbatim; the values are raw hex because they are applied inline
 * from data (Tailwind can't generate a class from a runtime value).
 */
export const COULEURS_ATELIER: {
  id: AtelierCouleur
  nom: string
  hex: string
}[] = [
  { id: "bleu", nom: "Bleu", hex: "#0091ff" }, // --brand-blue-600
  { id: "rouge", nom: "Rouge", hex: "#e5484d" }, // --danger
  { id: "jaune", nom: "Jaune", hex: "#e6a817" }, // --warning
  { id: "vert", nom: "Vert", hex: "#46a758" }, // --success-600
  { id: "orange", nom: "Orange", hex: "#f0761e" },
  { id: "blanc", nom: "Blanc", hex: "#d4d4d4" }, // --neutral-600
]

/** Next unused bib, so two groups never open with the same colour. */
export function couleurLibre(prises: (AtelierCouleur | undefined)[]) {
  return (
    COULEURS_ATELIER.find((c) => !prises.includes(c.id))?.id ??
    COULEURS_ATELIER[prises.length % COULEURS_ATELIER.length].id
  )
}

export function hexCouleur(id: AtelierCouleur | undefined) {
  return COULEURS_ATELIER.find((c) => c.id === id)?.hex ?? COULEURS_ATELIER[0].hex
}

export function nomCouleur(id: AtelierCouleur | undefined) {
  return COULEURS_ATELIER.find((c) => c.id === id)?.nom ?? COULEURS_ATELIER[0].nom
}

/**
 * The tag recipe of the design system (border /30, fill /10, text full) applied
 * to a runtime hue — same weights as a brand-blue chip, different colour.
 */
export function styleChip(id: AtelierCouleur | undefined) {
  const hex = hexCouleur(id)
  return {
    borderColor: `${hex}4d`,
    backgroundColor: `${hex}1a`,
    color: hex,
  }
}
