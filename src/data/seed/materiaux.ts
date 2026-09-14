import svgCoupelle from "@/assets/materiaux/01.svg"
import svgCone from "@/assets/materiaux/02.svg"
import svgPiquet from "@/assets/materiaux/03.svg"

/**
 * Le matériel qu'un éducateur peut sortir pour une séance — un catalogue fermé
 * de douze références, pas un champ libre : on choisit dans la caisse, on donne
 * une quantité.
 *
 * Le visuel fait le travail de reconnaissance (un éducateur reconnaît une
 * coupelle avant de lire « coupelles »), le nom n'est là que pour lever le
 * doute. `nom` est ce qui est stocké sur la séance, donc il ne change pas.
 *
 * NOTE — trois visuels seulement sont fournis pour l'instant ; ils tournent sur
 * les douze emplacements. Pour donner son propre visuel à une référence, poser
 * le fichier dans `src/assets/materiaux/` et changer son `svg` ci-dessous.
 */
export type Materiau = {
  id: string
  nom: string
  svg: string
  /** Quantité proposée quand on ajoute la référence — un ordre de grandeur. */
  defaut: number
}

export const MATERIAUX: Materiau[] = [
  { id: "mat-ballons", nom: "Ballons", svg: svgCone, defaut: 10 },
  { id: "mat-coupelles", nom: "Coupelles", svg: svgCoupelle, defaut: 20 },
  { id: "mat-cones", nom: "Cônes", svg: svgCone, defaut: 12 },
  { id: "mat-plots", nom: "Plots", svg: svgCoupelle, defaut: 12 },
  { id: "mat-chasubles", nom: "Chasubles", svg: svgCoupelle, defaut: 14 },
  { id: "mat-piquets", nom: "Piquets", svg: svgPiquet, defaut: 8 },
  { id: "mat-haies", nom: "Haies", svg: svgCone, defaut: 6 },
  { id: "mat-echelle", nom: "Échelle de rythme", svg: svgPiquet, defaut: 2 },
  { id: "mat-cerceaux", nom: "Cerceaux", svg: svgCoupelle, defaut: 10 },
  { id: "mat-mannequins", nom: "Mannequins", svg: svgCone, defaut: 4 },
  { id: "mat-mini-buts", nom: "Mini-buts", svg: svgPiquet, defaut: 4 },
  { id: "mat-buts", nom: "Buts", svg: svgPiquet, defaut: 2 },
]

/** Retrouve le visuel d'une ligne de matériel déjà enregistrée (stockée par nom). */
export const materiauParNom = (nom: string) =>
  MATERIAUX.find((m) => m.nom.toLowerCase() === nom.trim().toLowerCase())
