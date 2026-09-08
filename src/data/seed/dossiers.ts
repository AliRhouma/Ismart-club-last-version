/**
 * Dossiers — the club's filing tree, as far as the prototype needs it: a name,
 * a parent, and nothing else. It exists so a programme (or later a document)
 * can be filed somewhere; the tree itself is read-only for now.
 */

export type Dossier = {
  id: string
  nom: string
  /** null = a root folder. */
  parentId: string | null
}

const d = (id: string, nom: string, parentId: string | null = null): Dossier => ({
  id,
  nom,
  parentId,
})

/** Three roots, deliberately uneven — one deep branch, one flat, one empty. */
export const dossiersSeed: Dossier[] = [
  d("dos-technique", "Pôle technique"),
  d("dos-programmes", "Programmes annuels", "dos-technique"),
  d("dos-programmes-2526", "Saison 2025 - 2026", "dos-programmes"),
  d("dos-programmes-2425", "Saison 2024 - 2025", "dos-programmes"),
  d("dos-procedes", "Procédés & séances", "dos-technique"),
  d("dos-projets", "Projets de jeu", "dos-technique"),

  d("dos-administratif", "Administratif"),
  d("dos-licences", "Licences", "dos-administratif"),
  d("dos-conventions", "Conventions", "dos-administratif"),

  d("dos-archives", "Archives"),
]

/** Children of a folder, in seed order — the tree is small enough to filter. */
export const enfantsDe = (dossiers: Dossier[], parentId: string | null) =>
  dossiers.filter((x) => x.parentId === parentId)

/** "Pôle technique / Programmes annuels / Saison 2025 - 2026". */
export function cheminDossier(dossiers: Dossier[], id: string): string {
  const parts: string[] = []
  let courant = dossiers.find((x) => x.id === id)
  while (courant) {
    parts.unshift(courant.nom)
    courant = courant.parentId
      ? dossiers.find((x) => x.id === courant!.parentId)
      : undefined
  }
  return parts.join(" / ")
}
