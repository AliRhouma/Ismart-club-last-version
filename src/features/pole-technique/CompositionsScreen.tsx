import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Network, Plus, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  formationsSeed,
  type Composition,
  type CompositionJoueur,
} from "@/data/seed/compositions"
import {
  STADE_H,
  STADE_W,
} from "@/features/pole-technique/composition/TerrainEditeur"
import stadeFoot from "@/assets/terrain/stade-foot.png"
import { PageHeader } from "@/components/kit/PageHeader"
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
import { Toast } from "@/features/sponsoring/ui"

const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
const labelCls =
  "block font-ui text-[0.72rem] font-medium tracking-[0.02em] text-ink"

/**
 * Read-only board for the list cards. Same stadium and same 1206×802 ratio as
 * the editor, so a composition looks identical wherever it is shown.
 */
export function Terrain({
  joueurs,
  compact = false,
  onSelect,
  selectedId,
}: {
  joueurs: CompositionJoueur[]
  compact?: boolean
  onSelect?: (id: string) => void
  selectedId?: string | null
}) {
  return (
    <div
      style={{ aspectRatio: `${STADE_W} / ${STADE_H}` }}
      className="relative w-full overflow-hidden rounded-lg border border-border"
    >
      <img
        src={stadeFoot}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full select-none"
      />

      {joueurs.map((j) => {
        const on = j.id === selectedId
        // The board is embedded inside a navigable card on the list screen, so
        // markers are only real buttons when they're actually selectable.
        const Marker = onSelect ? "button" : "span"
        return (
          <Marker
            key={j.id}
            {...(onSelect
              ? { type: "button" as const, onClick: () => onSelect(j.id) }
              : {})}
            style={{ left: `${j.x}%`, top: `${j.y}%` }}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-md px-1 text-center transition-colors",
              onSelect ? "cursor-pointer" : "cursor-default",
            )}
          >
            <span
              className={cn(
                "mx-auto flex items-center justify-center overflow-hidden rounded-full border-2 font-ui text-white transition-colors",
                compact ? "size-5 text-[0.45rem]" : "size-9 text-[0.6rem]",
                on
                  ? "border-brand-blue-600 bg-brand-blue-600"
                  : "border-white/70 bg-black/55",
              )}
            >
              {j.photo ? (
                <img src={j.photo} alt="" loading="lazy" className="size-full object-cover" />
              ) : (
                j.poste
              )}
            </span>
            {!compact ? (
              <span className="mt-1 block max-w-20 truncate rounded-sm bg-black/55 px-1 font-ui text-[0.58rem] text-white">
                {j.nom.split(" ").slice(-1)[0]}
              </span>
            ) : null}
          </Marker>
        )
      })}
    </div>
  )
}

export function CompositionsScreen() {
  const navigate = useNavigate()
  const { compositions, addComposition, procedePhases } = useData()
  void procedePhases

  const [open, setOpen] = useState(false)
  const [titre, setTitre] = useState("")
  const [categorie, setCategorie] = useState("FFF")
  const [formation, setFormation] = useState("4-3-3")

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const create = () => {
    const clean = titre.trim() || formation
    const id = addComposition({
      titre: clean,
      description: "",
      categorie,
      groupe: "Groupe A",
      formation,
      joueurs: [],
    })
    setOpen(false)
    setTitre("")
    setToast({ id: toastId.current++, msg: "Composition créée." })
    navigate(`/pole-technique/composition/${id}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Composition"
        subtitle="Les compositions enregistrées du club — une formation, un onze de départ, prêts à être repris avant un match."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Créer une composition
          </Button>
        }
      />

      {compositions.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Network}
            title="Aucune composition"
            description="Créez une première composition pour préparer un onze de départ."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus /> Créer une composition
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {compositions.map((c) => (
            <CompoCard
              key={c.id}
              compo={c}
              onOpen={() => navigate(`/pole-technique/composition/${c.id}`)}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une composition</DialogTitle>
            <DialogDescription>
              Choisissez la catégorie et la formation — les joueurs se placent
              ensuite sur le terrain.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls} htmlFor="compo-titre">
                Titre
              </label>
              <input
                id="compo-titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="U13 - 4-3-3"
                className={fieldCls}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls} htmlFor="compo-cat">
                Catégorie
              </label>
              <input
                id="compo-cat"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className={fieldCls}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={labelCls}>Formation</span>
              {formationsSeed.map((g) => (
                <div key={g.format} className="flex flex-col gap-1.5">
                  <span className="font-ui text-[0.64rem] tracking-[0.08em] text-ink-disabled uppercase">
                    {g.format}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {g.formations.map((f) => (
                      <button
                        key={f}
                        type="button"
                        role="radio"
                        aria-checked={f === formation}
                        onClick={() => setFormation(f)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 font-ui text-[0.8rem] tabular-nums transition-colors",
                          f === formation
                            ? "border-border-second bg-surface-nested text-ink"
                            : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={create}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast ? <Toast msg={toast.msg} id={toast.id} /> : null}
    </div>
  )
}

function CompoCard({
  compo,
  onOpen,
}: {
  compo: Composition
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <div className="relative z-10 flex flex-col gap-3 p-4">
        <Terrain joueurs={compo.joueurs} compact />

        <div className="flex flex-col gap-1.5">
          <h3 className="truncate font-ui text-[0.92rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
            {compo.titre}
          </h3>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-[0.72rem] text-ink-muted">
            <span>{compo.categorie}</span>
            <span>·</span>
            <span>{compo.groupe}</span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={12} /> {compo.joueurs.length}
            </span>
          </span>
        </div>
      </div>
    </button>
  )
}
