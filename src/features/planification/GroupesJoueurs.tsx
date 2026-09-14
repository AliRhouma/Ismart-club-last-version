import { useState } from "react"
import {
  Check,
  Palette,
  Plus,
  Shuffle,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { ProcedeAtelier } from "@/data/seed/seances"
import {
  COULEURS_ATELIER,
  couleurLibre,
  hexCouleur,
  nomCouleur,
  styleChip,
} from "@/features/planification/atelierCouleurs"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** A player as this panel needs him, from whichever roster source. */
export type JoueurGroupe = {
  id: string
  nom: string
  poste: string
  photo?: string
}

/**
 * Split a squad into coloured working groups.
 *
 * Fully controlled — the owner decides where the groups live: the séance page
 * writes them onto one procédé (ses ateliers), the fiche de création holds them
 * in form state until the séance exists. Same panel either way, so the coach
 * learns the interaction once.
 */
export function GroupesJoueurs({
  roster,
  groupes,
  onChange,
  notify,
  aide,
  vide,
}: {
  roster: JoueurGroupe[]
  groupes: ProcedeAtelier[]
  onChange: (groupes: ProcedeAtelier[]) => void
  notify?: (msg: string) => void
  /** Appended to the count line — what these groups mean here. */
  aide?: string
  /** Empty-state copy: what "no group" means in this context. */
  vide: { titre: string; description: string }
}) {
  const [ajoutPour, setAjoutPour] = useState<string | null>(null)
  const [palettePour, setPalettePour] = useState<string | null>(null)

  const joueurDe = (id: string) => roster.find((j) => j.id === id)
  const places = new Set(groupes.flatMap((g) => g.joueurIds))
  const restants = roster.filter((j) => !places.has(j.id))

  const ajouterGroupe = () =>
    onChange([
      ...groupes,
      {
        id: crypto.randomUUID(),
        nom: "Groupe " + (groupes.length + 1),
        couleur: couleurLibre(groupes.map((g) => g.couleur)),
        joueurIds: [],
      },
    ])

  const patch = (id: string, p: Partial<ProcedeAtelier>) =>
    onChange(groupes.map((g) => (g.id === id ? { ...g, ...p } : g)))

  /** Deal the unplaced players round-robin across the existing groups. */
  const repartir = () => {
    if (groupes.length === 0 || restants.length === 0) return
    const suite = groupes.map((g) => ({ ...g, joueurIds: [...g.joueurIds] }))
    restants.forEach((j, i) => suite[i % suite.length].joueurIds.push(j.id))
    onChange(suite)
    const s = restants.length > 1 ? "s" : ""
    notify?.(restants.length + " joueur" + s + " réparti" + s)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 font-body text-[0.78rem] text-ink-muted">
          {groupes.length === 0
            ? vide.description
            : places.size +
              "/" +
              roster.length +
              " joueurs placés · " +
              groupes.length +
              " groupe" +
              (groupes.length > 1 ? "s" : "") +
              (aide ? " · " + aide : "")}
        </p>
        {groupes.length > 0 && restants.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={repartir}>
            <Shuffle /> Répartir
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={ajouterGroupe}
          disabled={roster.length === 0}
        >
          <Plus /> Ajouter un groupe
        </Button>
      </div>

      {groupes.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Users}
            title={vide.titre}
            description={vide.description}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groupes.map((groupe, i) => (
            <div
              key={groupe.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3.5"
            >
              <div className="flex items-center gap-2">
                {/* La chasuble : l'identité du groupe, et la seule chose que
                    l'éducateur lit de l'autre bout du terrain. */}
                <span className="relative shrink-0">
                  <button
                    type="button"
                    aria-label={"Couleur de " + groupe.nom}
                    title={"Chasuble " + nomCouleur(groupe.couleur).toLowerCase()}
                    onClick={() =>
                      setPalettePour((p) => (p === groupe.id ? null : groupe.id))
                    }
                    className="flex size-6 items-center justify-center rounded-full ring-1 ring-white/15 transition-shadow hover:ring-white/40"
                    style={{ backgroundColor: hexCouleur(groupe.couleur) }}
                  >
                    <Palette size={11} className="text-black/45" />
                  </button>

                  {palettePour === groupe.id ? (
                    <>
                      <button
                        type="button"
                        aria-label="Fermer la palette"
                        onClick={() => setPalettePour(null)}
                        className="fixed inset-0 z-20 cursor-default"
                      />
                      <span className="absolute top-8 left-0 z-30 flex gap-1.5 rounded-md border border-border bg-background p-1.5 shadow-deep">
                        {COULEURS_ATELIER.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            aria-label={c.nom}
                            title={c.nom}
                            onClick={() => {
                              patch(groupe.id, { couleur: c.id })
                              setPalettePour(null)
                            }}
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full ring-1 transition-shadow",
                              groupe.couleur === c.id
                                ? "ring-2 ring-white/70"
                                : "ring-white/15 hover:ring-white/40",
                            )}
                            style={{ backgroundColor: c.hex }}
                          >
                            {groupe.couleur === c.id ? (
                              <Check
                                size={11}
                                strokeWidth={3}
                                className="text-black/60"
                              />
                            ) : null}
                          </button>
                        ))}
                      </span>
                    </>
                  ) : null}
                </span>

                <input
                  value={groupe.nom}
                  aria-label={"Nom du groupe " + (i + 1)}
                  onChange={(e) => patch(groupe.id, { nom: e.target.value })}
                  className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1.5 py-1 font-ui text-[0.88rem] text-ink outline-none transition-colors hover:border-border focus:border-border-focus"
                />
                <span className="shrink-0 font-ui text-[0.72rem] text-ink-disabled tabular-nums">
                  {groupe.joueurIds.length}
                </span>
                <button
                  type="button"
                  aria-label={"Supprimer " + groupe.nom}
                  onClick={() => {
                    onChange(groupes.filter((g) => g.id !== groupe.id))
                    notify?.("« " + groupe.nom + " » supprimé")
                  }}
                  className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {groupe.joueurIds.length === 0 ? (
                <p className="font-body text-[0.76rem] text-ink-disabled">
                  Aucun joueur dans ce groupe.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {groupe.joueurIds.map((id) => {
                    const j = joueurDe(id)
                    return (
                      <span
                        key={id}
                        style={styleChip(groupe.couleur)}
                        className="inline-flex items-center gap-1.5 rounded-pill border py-0.5 pr-1.5 pl-1 font-ui text-[0.74rem]"
                      >
                        <Avatar
                          name={j?.nom ?? "?"}
                          src={j?.photo}
                          size="sm"
                          className="size-5 text-[0.6rem]"
                        />
                        {j?.nom ?? "Joueur retiré"}
                        <button
                          type="button"
                          aria-label={
                            "Retirer " +
                            (j?.nom ?? "ce joueur") +
                            " de " +
                            groupe.nom
                          }
                          onClick={() =>
                            patch(groupe.id, {
                              joueurIds: groupe.joueurIds.filter(
                                (x) => x !== id,
                              ),
                            })
                          }
                          className="opacity-55 transition-opacity hover:opacity-100"
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
                onClick={() => setAjoutPour(groupe.id)}
                disabled={restants.length === 0}
              >
                <UserPlus /> Ajouter des joueurs
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Ce qui reste — un joueur oublié, c'est le bug de la séance. */}
      {groupes.length > 0 && restants.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 font-body text-[0.76rem] text-ink-muted">
          <Users size={12} className="text-ink-disabled" />
          {restants.length} joueur{restants.length > 1 ? "s" : ""} non placé
          {restants.length > 1 ? "s" : ""} :
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
        groupe={groupes.find((g) => g.id === ajoutPour) ?? null}
        candidats={restants}
        onAjouter={(ids) => {
          const cible = groupes.find((g) => g.id === ajoutPour)
          if (cible)
            patch(cible.id, { joueurIds: [...cible.joueurIds, ...ids] })
          setAjoutPour(null)
        }}
      />
    </div>
  )
}

/** The unplaced players, picked several at a time into one group. */
function ChoixJoueurs({
  open,
  onOpenChange,
  groupe,
  candidats,
  onAjouter,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupe: ProcedeAtelier | null
  candidats: JoueurGroupe[]
  onAjouter: (ids: string[]) => void
}) {
  return (
    <Dialog open={open && !!groupe} onOpenChange={onOpenChange}>
      {/* Mounted only while open, so the selection starts clean each time. */}
      {open && groupe ? (
        <Corps
          groupe={groupe}
          candidats={candidats}
          onAnnuler={() => onOpenChange(false)}
          onAjouter={onAjouter}
        />
      ) : null}
    </Dialog>
  )
}

function Corps({
  groupe,
  candidats,
  onAnnuler,
  onAjouter,
}: {
  groupe: ProcedeAtelier
  candidats: JoueurGroupe[]
  onAnnuler: () => void
  onAjouter: (ids: string[]) => void
}) {
  const [choisis, setChoisis] = useState<string[]>([])

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-full ring-1 ring-white/15"
            style={{ backgroundColor: hexCouleur(groupe.couleur) }}
          />
          Ajouter à « {groupe.nom} »
        </DialogTitle>
        <DialogDescription>
          {candidats.length} joueur{candidats.length > 1 ? "s" : ""} pas encore
          placé{candidats.length > 1 ? "s" : ""}.
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
                on
                  ? "border-info bg-info/5"
                  : "border-border hover:border-border-strong",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                  on
                    ? "border-info bg-info text-ink-inverted"
                    : "border-border-strong",
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
