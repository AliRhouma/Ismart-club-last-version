import type {
  ModeGroupesProcede,
  Procede,
  ProcedeAtelier,
  SeanceDetail,
} from "@/data/seed/seances"

/**
 * The groups a procédé is run with — the séance's, its own, or none. An older
 * procédé with no mode counts as « personnalisés » only if it already carries
 * groups of its own.
 */
export function groupesDuProcede(
  detail: Pick<SeanceDetail, "groupesSeance">,
  procede: Procede,
): { mode: ModeGroupesProcede; groupes: ProcedeAtelier[] } {
  const mode: ModeGroupesProcede =
    procede.modeGroupes ??
    ((procede.ateliers?.length ?? 0) > 0 ? "personnalises" : "seance")
  return {
    mode,
    groupes:
      mode === "personnalises"
        ? (procede.ateliers ?? [])
        : mode === "seance"
          ? (detail.groupesSeance ?? [])
          : [],
  }
}

/** Personalised but still empty — the coach chose to split it and hasn't yet. */
export const groupesManquants = (
  detail: Pick<SeanceDetail, "groupesSeance">,
  procede: Procede,
) => {
  const g = groupesDuProcede(detail, procede)
  return g.mode === "personnalises" && g.groupes.length === 0
}

/** Des chasubles recopiées : nouveaux ids, mêmes couleurs et mêmes joueurs. */
export const copierGroupes = (groupes: ProcedeAtelier[]): ProcedeAtelier[] =>
  groupes.map((g) => ({ ...g, id: crypto.randomUUID(), joueurIds: [...g.joueurIds] }))
