import { useMemo, useState } from "react"
import { Check, Plus, Shuffle, Trash2, UserPlus, Users, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type {
  Procede,
  ProcedeAtelier,
  SeanceDetail,
} from "@/data/seed/seances"
import { Avatar } from "@/components/kit/Avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** A player as this panel needs him, from either roster source. */
type Joueur = { id: string; nom: string; poste: string; photo?: string }

/**
 * The ateliers of one procédé: how the squad is split for *this* exercise.
 *
 * Membership is per procédé, not per séance — a joueur can be in atelier 1 on
 * the rondo and atelier 3 on the finishing drill — so the groups live on the
 * procédé and are rebuilt from ids at render time.
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
  const { categories, convocations, setProcedeAteliers } = useData()
  const [ajoutPour, setAjoutPour] = useState<string | null>(null)

  // Who can be placed: the convoqués if the séance has a convocation, else the
  // joueurs attached to it. The two sources carry different shapes.
  const roster: Joueur[] = useMemo(() => {
    const convocation = convocations.find((c) => c.eventId === detail.eventId)
    if (convocation) {
      const categorie = categories.find((c) => c.id === convocation.categorieId)
      return convocation.joueurs
        .map((j) => categorie?.joueurs.find((x) => x.id === j.joueurId))
        .filter((j) => !!j)
        .map((j) => ({ id: j.id, nom: j.nom, poste: j.poste, photo: j.photo }))
    }
    return detail.participants
      .filter((p) => p.kind === "joueur")
      .map((p) => ({ id: p.id, nom: p.name, poste: p.role }))
  }, [detail.eventId, detail.participants, convocations, categories])

  const ateliers = procede.ateliers ?? []
  const joueurDe = (id: string) => roster.find((j) => j.id === id)
  const places = new Set(ateliers.flatMap((a) => a.joueurIds))
  const restants = roster.filter((j) => !places.has(j.id))

  const ecrire = (suite: ProcedeAtelier[]) =>
    setProcedeAteliers(detail.eventId, procede.id, suite)

  const ajouterAtelier = () => {
    ecrire([
      ...ateliers,
      {
        id: crypto.randomUUID(),
        nom: `Atelier ${ateliers.length + 1}`,
        joueurIds: [],
      },
    ])
  }

  /** Deal the unplaced players round-robin across the existing ateliers. */
  const repartir = () => {
    if (ateliers.length === 0 || restants.length === 0) return
    const suite = ateliers.map((a) => ({ ...a, joueurIds: [...a.joueurIds] }))
    restants.forEach((j, i) => suite[i % suite.length].joueurIds.push(j.id))
    ecrire(suite)
    notify(`${restants.length} joueurs répartis`)
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-ui text-[0.95rem] font-medium text-ink">
            Groupes de joueurs
          </h3>
          <p className="font-body text-[0.78rem] text-ink-muted">
            {ateliers.length === 0
              ? "Sans groupe, tout le monde travaille ensemble sur ce procédé."
              : `${places.size}/${roster.length} joueurs placés · ${ateliers.length} groupe${ateliers.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {ateliers.length > 0 && restants.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={repartir}>
            <Shuffle /> Répartir
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={ajouterAtelier}>
          <Plus /> Ajouter un groupe
        </Button>
      </div>

      {ateliers.length === 0 ? null : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ateliers.map((atelier, i) => (
            <div
              key={atelier.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.72rem] text-ink-muted">
                  {i + 1}
                </span>
                <input
                  value={atelier.nom}
                  aria-label={`Nom du groupe ${i + 1}`}
                  onChange={(e) =>
                    ecrire(
                      ateliers.map((a) =>
                        a.id === atelier.id ? { ...a, nom: e.target.value } : a,
                      ),
                    )
                  }
                  className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1.5 py-1 font-ui text-[0.88rem] text-ink outline-none transition-colors hover:border-border focus:border-border-focus"
                />
                <span className="shrink-0 font-ui text-[0.72rem] text-ink-disabled tabular-nums">
                  {atelier.joueurIds.length}
                </span>
                <button
                  type="button"
                  aria-label={`Supprimer ${atelier.nom}`}
                  onClick={() => {
                    ecrire(ateliers.filter((a) => a.id !== atelier.id))
                    notify(`« ${atelier.nom} » supprimé`)
                  }}
                  className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {atelier.joueurIds.length === 0 ? (
                <p className="font-body text-[0.76rem] text-ink-disabled">
                  Aucun joueur dans ce groupe.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {atelier.joueurIds.map((id) => {
                    const j = joueurDe(id)
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong py-0.5 pr-1.5 pl-1 font-ui text-[0.74rem] text-ink-subtle"
                      >
                        <Avatar name={j?.nom ?? "?"} src={j?.photo} size="sm" className="size-5 text-[0.6rem]" />
                        {j?.nom ?? "Joueur retiré"}
                        <button
                          type="button"
                          aria-label={`Retirer ${j?.nom ?? "ce joueur"} de ${atelier.nom}`}
                          onClick={() =>
                            ecrire(
                              ateliers.map((a) =>
                                a.id === atelier.id
                                  ? {
                                      ...a,
                                      joueurIds: a.joueurIds.filter(
                                        (x) => x !== id,
                                      ),
                                    }
                                  : a,
                              ),
                            )
                          }
                          className="text-ink-disabled transition-colors hover:text-danger"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setAjoutPour(atelier.id)}
                disabled={restants.length === 0}
              >
                <UserPlus /> Ajouter des joueurs
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* What is left over — visible, because a forgotten joueur is the bug. */}
      {ateliers.length > 0 && restants.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 font-body text-[0.76rem] text-ink-muted">
          <Users size={12} className="text-ink-disabled" />
          Non placés :
          {restants.map((j) => (
            <span
              key={j.id}
              className="rounded-pill border border-border px-2 py-0.5 text-ink-disabled"
            >
              {j.nom}
            </span>
          ))}
        </p>
      ) : null}

      <ChoixJoueurs
        open={!!ajoutPour}
        onOpenChange={(o) => !o && setAjoutPour(null)}
        atelier={ateliers.find((a) => a.id === ajoutPour) ?? null}
        candidats={restants}
        onAjouter={(ids) => {
          ecrire(
            ateliers.map((a) =>
              a.id === ajoutPour
                ? { ...a, joueurIds: [...a.joueurIds, ...ids] }
                : a,
            ),
          )
          setAjoutPour(null)
        }}
      />
    </section>
  )
}

/** The unplaced players, picked several at a time into one atelier. */
function ChoixJoueurs({
  open,
  onOpenChange,
  atelier,
  candidats,
  onAjouter,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  atelier: ProcedeAtelier | null
  candidats: Joueur[]
  onAjouter: (ids: string[]) => void
}) {
  return (
    <Dialog open={open && !!atelier} onOpenChange={onOpenChange}>
      {/* Mounted only while open, so the selection starts clean each time. */}
      {open && atelier ? (
        <Corps
          atelier={atelier}
          candidats={candidats}
          onAnnuler={() => onOpenChange(false)}
          onAjouter={onAjouter}
        />
      ) : null}
    </Dialog>
  )
}

function Corps({
  atelier,
  candidats,
  onAnnuler,
  onAjouter,
}: {
  atelier: ProcedeAtelier
  candidats: Joueur[]
  onAnnuler: () => void
  onAjouter: (ids: string[]) => void
}) {
  const [choisis, setChoisis] = useState<string[]>([])

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Ajouter à « {atelier.nom} »</DialogTitle>
        <DialogDescription>
          {candidats.length} joueur{candidats.length > 1 ? "s" : ""} pas encore
          placé{candidats.length > 1 ? "s" : ""} sur ce procédé.
        </DialogDescription>
      </DialogHeader>

      <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
        {candidats.map((j) => {
          const on = choisis.includes(j.id)
          return (
            <button
              key={j.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() =>
                setChoisis((prev) =>
                  on ? prev.filter((x) => x !== j.id) : [...prev, j.id],
                )
              }
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                on ? "border-info bg-info/5" : "border-border hover:border-border-strong",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                  on ? "border-info bg-info text-ink-inverted" : "border-border-strong",
                )}
              >
                {on ? <Check size={11} strokeWidth={3} /> : null}
              </span>
              <Avatar name={j.nom} src={j.photo} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-ui text-[0.85rem] text-ink">
                  {j.nom}
                </span>
                <span className="block font-body text-[0.72rem] text-ink-muted">
                  {j.poste}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onAnnuler}>
          Annuler
        </Button>
        <Button
          variant="outline"
          onClick={() => onAjouter(candidats.map((j) => j.id))}
          disabled={candidats.length === 0}
        >
          Tout ajouter
        </Button>
        <Button onClick={() => onAjouter(choisis)} disabled={!choisis.length}>
          Ajouter {choisis.length || ""}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
