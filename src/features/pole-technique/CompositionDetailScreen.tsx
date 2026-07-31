import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Network, Trash2, UserPlus, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { formationsSeed } from "@/data/seed/compositions"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Toast } from "@/features/sponsoring/ui"
import { Terrain } from "@/features/pole-technique/CompositionsScreen"

const LIST = "/pole-technique/composition"

export function CompositionDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { compositions, updateComposition, removeComposition } = useData()

  const compo = compositions.find((c) => c.id === id)

  const [selected, setSelected] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!compo) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <BackButton to={LIST} label="Retour aux compositions" />
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Network}
            title="Composition introuvable"
            description="Cette composition a été supprimée ou n'existe plus."
            action={
              <Button variant="outline" onClick={() => navigate(LIST)}>
                Retour aux compositions
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const titulaires = compo.joueurs.filter((j) => !j.remplacant)
  const remplacants = compo.joueurs.filter((j) => j.remplacant)
  const toutesFormations = formationsSeed.flatMap((g) => g.formations)

  /** Re-place the squad on a new formation, keeping who plays where in order. */
  const changerFormation = (f: string) => {
    const lignes = f.split("-").map(Number)
    const spots = [{ x: 50, y: 12 }]
    lignes.forEach((n, li) => {
      const y = 28 + (li * 56) / Math.max(lignes.length - 1, 1)
      for (let i = 0; i < n; i++)
        spots.push({ x: n === 1 ? 50 : 14 + (i * 72) / (n - 1), y })
    })
    updateComposition(compo.id, {
      formation: f,
      joueurs: compo.joueurs.map((j, i) =>
        spots[i] && !j.remplacant
          ? { ...j, x: Math.round(spots[i].x * 10) / 10, y: Math.round(spots[i].y * 10) / 10 }
          : j,
      ),
    })
    notify(`Formation ${f}.`)
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <BackButton to={LIST} label="Retour aux compositions" />

      <div className="flex flex-col gap-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-[0.7rem] tracking-[0.04em] text-ink-disabled">
          <span>{compo.categorie}</span>
          <span aria-hidden>·</span>
          <span>{compo.groupe}</span>
        </p>

        <PageHeader
          title={compo.titre}
          subtitle={
            <span className="flex flex-wrap items-center gap-3">
              <span className="font-ui text-[0.8rem] text-ink-muted tabular-nums">
                {compo.formation || "Placement libre"}
              </span>
              <span className="inline-flex items-center gap-1.5 font-ui text-[0.75rem] text-ink-muted">
                <Users size={12} /> {titulaires.length} titulaires
                {remplacants.length ? ` · ${remplacants.length} remplaçants` : ""}
              </span>
            </span>
          }
          actions={
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Supprimer
            </Button>
          }
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
          <div className="lg:w-[24rem] lg:shrink-0">
            {compo.joueurs.length === 0 ? (
              <div className="rounded-lg border border-border">
                <EmptyState
                  icon={UserPlus}
                  title="Terrain vide"
                  description="Cette composition n'a pas encore de joueurs placés."
                />
              </div>
            ) : (
              <Terrain
                joueurs={compo.joueurs}
                onSelect={(jid) => setSelected(jid === selected ? null : jid)}
                selectedId={selected}
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-3 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Formation
              </h2>
              <div className="flex flex-wrap gap-2">
                {toutesFormations.map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={f === compo.formation}
                    onClick={() => changerFormation(f)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 font-ui text-[0.8rem] tabular-nums transition-colors",
                      f === compo.formation
                        ? "border-border-second bg-surface-nested text-ink"
                        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Titulaires · {titulaires.length}
              </h2>
              {titulaires.length === 0 ? (
                <p className="rounded-lg border border-border px-4 py-6 text-center font-body text-[0.84rem] text-ink-disabled">
                  Aucun joueur placé.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {titulaires.map((j) => (
                    <li key={j.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelected(j.id === selected ? null : j.id)
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                          j.id === selected
                            ? "border-border-second bg-surface-nested"
                            : "border-border hover:border-border-strong",
                        )}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-nested font-ui text-[0.6rem] text-ink-muted">
                          {j.photo ? (
                            <img
                              src={j.photo}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          ) : (
                            j.poste.slice(0, 3)
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-ui text-[0.86rem] text-ink">
                          {j.nom}
                        </span>
                        <span className="shrink-0 font-ui text-[0.7rem] text-ink-muted">
                          {j.poste}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer cette composition ?"
        description={`« ${compo.titre} » sera retirée des compositions du club.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeComposition(compo.id)
          navigate(LIST)
        }}
      />

      {toast ? <Toast msg={toast.msg} id={toast.id} /> : null}
    </div>
  )
}
