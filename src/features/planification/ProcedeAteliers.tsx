import { AlertTriangle, Layers, Pencil, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Procede, ProcedeAtelier, SeanceDetail } from "@/data/seed/seances"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import { useRosterSeance } from "@/features/planification/useRosterSeance"
import { GroupesJoueurs } from "@/features/planification/GroupesJoueurs"
import {
  copierGroupes,
  groupesDuProcede,
} from "@/features/planification/groupesProcede"

/**
 * The Groupes tab of one procédé. It runs with the séance's groups — editing
 * them here changes them for every procédé that uses them — with groups of its
 * own, or with none. One small button beside « Ajouter un groupe » switches
 * between the séance's groups and personalised ones.
 */
export function ProcedeAteliers({
  detail,
  procede,
  notify,
}: {
  detail: SeanceDetail
  procede: Procede
  notify: (msg: string) => void
}) {
  const { updateSeanceDetail } = useData()
  const roster = useRosterSeance(detail)
  const { mode, groupes } = groupesDuProcede(detail, procede)
  const manquants = mode === "personnalises" && groupes.length === 0

  // One séance-level write each time: a planned séance that is not stored yet
  // re-mints its procédé ids on every read, so per-id patches could miss.
  const majProcede = (patch: Partial<Procede>) =>
    updateSeanceDetail(detail.eventId, {
      procedes: detail.procedes.map((p) =>
        p.id === procede.id ? { ...p, ...patch } : p,
      ),
    })

  const versSeance = () => {
    majProcede({ modeGroupes: "seance", ateliers: undefined })
    notify("Ce procédé reprend les groupes de la séance")
  }
  const personnaliser = () => {
    majProcede({
      modeGroupes: "personnalises",
      ateliers: copierGroupes(mode === "seance" ? groupes : []),
    })
    notify("Groupes personnalisés pour ce procédé")
  }

  const onChange = (suite: ProcedeAtelier[]) =>
    mode === "personnalises"
      ? majProcede({ ateliers: suite })
      : updateSeanceDetail(detail.eventId, { groupesSeance: suite })

  if (mode === "aucun")
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Users}
          title="Sans groupe"
          description="Tout le monde travaille ensemble sur ce procédé."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={versSeance}>
                <Layers /> Groupes de la séance
              </Button>
              <Button variant="outline" size="sm" onClick={personnaliser}>
                <Pencil /> Personnaliser
              </Button>
            </div>
          }
        />
      </section>
    )

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:p-6">
      {/* Personnalisé mais vide : le coach a voulu diviser, c'est à faire. */}
      {manquants ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/10 px-3.5 py-3"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
          <p className="min-w-0 flex-1 font-body text-[0.8rem] text-danger">
            <span className="font-ui font-medium">
              Aucun groupe ajouté pour ce procédé.
            </span>{" "}
            Créez ses groupes ci-dessous, ou revenez aux groupes de la séance.
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          manquants &&
            "rounded-lg ring-1 ring-danger/30 ring-offset-4 ring-offset-background",
        )}
      >
        <GroupesJoueurs
          // Un panneau par procédé et par mode : ses menus ne suivent pas.
          key={procede.id + ":" + mode}
          roster={roster}
          groupes={groupes}
          onChange={onChange}
          notify={notify}
          aide={mode === "personnalises" ? "personnalisés" : "de la séance"}
          vide={{
            titre: "Aucun groupe",
            description:
              mode === "personnalises"
                ? "Ajoutez les groupes de ce procédé."
                : "La séance n'a pas de groupe : tout le monde travaille ensemble.",
          }}
          actions={
            mode === "personnalises" ? (
              <Button variant="outline" size="sm" onClick={versSeance}>
                <Layers /> Groupes de la séance
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={personnaliser}>
                <Pencil /> Personnaliser
              </Button>
            )
          }
        />
      </div>
    </section>
  )
}
