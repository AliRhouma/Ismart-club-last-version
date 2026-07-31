import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ListOrdered, PlayCircle, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { ProjetDeJeu } from "@/data/seed/projetsDeJeu"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"

const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

type Filtre = "Tous" | "Actifs" | "Modèles"

export function ProjetsDeJeuScreen() {
  const navigate = useNavigate()
  const { projetsDeJeu } = useData()

  const [filtre, setFiltre] = useState<Filtre>("Tous")
  const [query, setQuery] = useState("")

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projetsDeJeu.filter((p) => {
      if (filtre === "Actifs" && !p.actif) return false
      // "Modèles" = the library projects not yet applied to a catégorie.
      if (filtre === "Modèles" && p.categories.length > 0) return false
      if (q && !p.nom.toLowerCase().includes(q)) return false
      return true
    })
  }, [projetsDeJeu, filtre, query])

  const dirty = filtre !== "Tous" || query.trim() !== ""

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Projet de jeu"
        subtitle="Les modèles de jeu du club : le système, les animations et les étapes à faire vivre par catégorie."
      />

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un projet de jeu…"
            className={cn(fieldCls, "pl-10")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-pill border border-border p-1">
            {(["Tous", "Actifs", "Modèles"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltre(f)}
                className={cn(
                  "rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] font-medium transition-colors",
                  f === filtre
                    ? "border-border-second bg-surface-nested text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {dirty ? (
            <button
              type="button"
              onClick={() => {
                setFiltre("Tous")
                setQuery("")
              }}
              className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
            >
              <X size={13} /> Réinitialiser
            </button>
          ) : null}

          <p className="ml-auto font-body text-sm text-ink-muted">
            <span className="text-ink">{visible.length}</span> projet
            {visible.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={PlayCircle}
            title="Aucun projet de jeu"
            description={
              dirty
                ? "Aucun projet ne correspond à cette recherche."
                : "Le club n'a pas encore défini de modèle de jeu."
            }
            action={
              dirty ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltre("Tous")
                    setQuery("")
                  }}
                >
                  <X /> Réinitialiser
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProjetCard
              key={p.id}
              projet={p}
              onOpen={() => navigate(`/pole-technique/projet-de-jeu/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjetCard({
  projet,
  onOpen,
}: {
  projet: ProjetDeJeu
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

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-surface-nested">
          {projet.image ? (
            <img
              src={projet.image}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-ink-disabled">
              <PlayCircle size={22} strokeWidth={1.5} />
            </span>
          )}
          {projet.actif ? (
            <span className="absolute top-2.5 left-2.5 rounded-pill border border-success/25 bg-success/10 px-2.5 py-0.5 font-ui text-[0.65rem] font-medium tracking-[0.08em] text-success uppercase backdrop-blur-sm">
              Actif
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <h3 className="line-clamp-2 font-ui text-[0.92rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
            {projet.nom}
          </h3>
          {projet.description ? (
            <p className="line-clamp-2 font-body text-[0.8rem] leading-relaxed text-ink-muted">
              {projet.description}
            </p>
          ) : null}

          <span className="mt-auto inline-flex items-center gap-1.5 font-ui text-[0.72rem] text-ink-disabled">
            <ListOrdered size={12} /> {projet.etapes.length} étape
            {projet.etapes.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2.5">
          {projet.categories.length ? (
            projet.categories.map((c) => (
              <span
                key={c}
                className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.66rem] text-brand-blue-600"
              >
                {c}
              </span>
            ))
          ) : (
            <span className="font-ui text-[0.7rem] text-ink-disabled">
              Aucune catégorie assignée
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
