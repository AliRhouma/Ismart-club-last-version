import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Layers, Plus, Search, UserCog, Users, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Categorie } from "@/data/seed/categories"
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
import { SAISON, bilanDe, pluriel } from "@/features/pole-technique/categorieUi"

const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
const labelCls =
  "block font-ui text-[0.72rem] font-medium tracking-[0.02em] text-ink"

/**
 * Pôle Technique → Catégories. The club's age groups for the season: each card
 * shows who is in the catégorie and how its season is going, then routes to the
 * catégorie's own page. Navigable-card anatomy per the design system.
 */
export function CategoriesScreen() {
  const navigate = useNavigate()
  const { categories, addCategorie } = useData()

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState("")
  const [genre, setGenre] = useState<"Masculin" | "Féminin">("Masculin")

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? categories.filter((c) => c.nom.toLowerCase().includes(q)) : categories
  }, [categories, query])

  const totalJoueurs = categories.reduce((n, c) => n + c.joueurs.length, 0)
  const totalEducateurs = new Set(categories.flatMap((c) => c.educateurs)).size
  const totalGroupes = categories.reduce((n, c) => n + c.groupes.length, 0)

  const creer = () => {
    const clean = nom.trim()
    if (!clean) return
    const id = addCategorie({
      nom: clean,
      description: "",
      genre,
      groupes: [{ id: `${clean.toLowerCase()}-groupe-a`, nom: "Groupe A" }],
      educateurs: [],
      staff: 0,
      joueurs: [],
      matchs: [],
    })
    setOpen(false)
    setNom("")
    navigate(`/pole-technique/categories/${id}/effectif`)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Catégories"
        subtitle={`Les catégories d'équipes du club — saison ${SAISON}.`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Ajouter une catégorie
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Catégories" value={categories.length} />
        <Stat label="Joueurs" value={totalJoueurs} />
        <Stat label="Éducateurs" value={totalEducateurs} />
        <Stat label="Groupes" value={totalGroupes} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une catégorie…"
            className={cn(fieldCls, "pl-10")}
          />
        </div>
        {query.trim() ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
            >
              <X size={13} /> Réinitialiser
            </button>
            <p className="ml-auto font-body text-sm text-ink-muted">
              <span className="text-ink">{visible.length}</span> catégorie
              {visible.length > 1 ? "s" : ""}
            </p>
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Layers}
            title="Aucune catégorie"
            description={
              query.trim()
                ? "Aucune catégorie ne correspond à cette recherche."
                : "Créez une première catégorie pour organiser les équipes du club."
            }
            action={
              query.trim() ? (
                <Button variant="outline" onClick={() => setQuery("")}>
                  <X /> Réinitialiser
                </Button>
              ) : (
                <Button onClick={() => setOpen(true)}>
                  <Plus /> Ajouter une catégorie
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <CategorieCard
              key={c.id}
              categorie={c}
              onOpen={() =>
                navigate(`/pole-technique/categories/${c.id}/effectif`)
              }
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
            <DialogDescription>
              Un groupe est créé automatiquement — l'effectif se constitue
              ensuite.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelCls} htmlFor="cat-nom">
                Nom
              </label>
              <input
                id="cat-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="U21"
                className={fieldCls}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className={labelCls}>Genre</span>
              <div className="flex gap-2">
                {(["Masculin", "Féminin"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={g === genre}
                    onClick={() => setGenre(g)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 font-ui text-[0.8rem] transition-colors",
                      g === genre
                        ? "border-border-second bg-surface-nested text-ink"
                        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={creer} disabled={!nom.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3.5">
      <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </span>
      <span className="font-ui text-xl font-semibold text-ink tabular-nums">
        {value}
      </span>
    </div>
  )
}

function CategorieCard({
  categorie,
  onOpen,
}: {
  categorie: Categorie
  onOpen: () => void
}) {
  const bilan = bilanDe(categorie.matchs)

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

      <div className="relative z-10 flex flex-1 flex-col gap-3.5 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-nested font-ui text-[0.78rem] text-ink-muted">
            {categorie.image ? (
              <img
                src={categorie.image}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            ) : (
              categorie.nom.slice(0, 3)
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
              {categorie.nom}
            </span>
            <span className="block font-ui text-[0.72rem] text-ink-disabled">
              {categorie.genre} ·{" "}
              {categorie.groupes.length > 1
                ? pluriel(categorie.groupes.length, "groupe")
                : categorie.groupes[0]?.nom}
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-ui text-[0.74rem] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} /> {pluriel(categorie.joueurs.length, "joueur")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserCog size={12} />{" "}
            {pluriel(categorie.educateurs.length, "éducateur")}
          </span>
        </div>
      </div>

      {/* Season form — the one glance that says how the group is doing. */}
      <div className="relative z-10 flex items-center gap-2 border-t border-border px-4 py-2.5">
        {bilan.forme.length ? (
          <>
            <span className="font-ui text-[0.66rem] tracking-[0.06em] text-ink-disabled uppercase">
              Forme
            </span>
            <span className="flex gap-1">
              {bilan.forme.map((f, i) => (
                <FormeChip key={i} issue={f} />
              ))}
            </span>
            <span className="ml-auto font-ui text-[0.7rem] text-ink-disabled tabular-nums">
              {pluriel(bilan.joues, "match", "matchs")}
            </span>
          </>
        ) : (
          <span className="font-ui text-[0.7rem] text-ink-disabled">
            Aucun match joué
          </span>
        )}
      </div>
    </button>
  )
}

/**
 * V / N / D chip. A match result is genuine status, so it takes the semantic
 * colours — green win, red loss, neutral draw. Never decoration.
 */
export function FormeChip({ issue }: { issue: "V" | "N" | "D" }) {
  return (
    <span
      title={issue === "V" ? "Victoire" : issue === "N" ? "Match nul" : "Défaite"}
      className={cn(
        "flex size-5 items-center justify-center rounded-sm border font-ui text-[0.6rem] font-medium",
        issue === "V"
          ? "border-success/25 bg-success/10 text-success"
          : issue === "D"
            ? "border-danger/25 bg-danger/10 text-danger"
            : "border-border text-ink-muted",
      )}
    >
      {issue}
    </span>
  )
}
