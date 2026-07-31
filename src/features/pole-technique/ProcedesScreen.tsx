import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronRight,
  ClipboardList,
  Clock,
  Filter,
  Layers,
  Maximize2,
  Plus,
  Search,
  Users,
  Video,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  procedeTypes,
  type ProcedeItem,
  type ProcedeType,
} from "@/data/seed/procedes"
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
import { ProcedeFormModal } from "@/features/pole-technique/ProcedeFormModal"

const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/** "12 procédés" / "1 procédé" — the counts read as bare integers everywhere. */
const plural = (n: number) => `${n} procédé${n > 1 ? "s" : ""}`

export function ProcedesScreen() {
  const navigate = useNavigate()
  const {
    procedes,
    procedeGroupes,
    procedePhases,
    procedePrincipes,
    addProcede,
  } = useData()

  const [groupeId, setGroupeId] = useState(procedeGroupes[0]?.id ?? "")
  /** null = every procédé of the groupe, otherwise a single principe. */
  const [principeId, setPrincipeId] = useState<string | null>(null)
  const [type, setType] = useState<ProcedeType | "Tous">("Tous")
  const [query, setQuery] = useState("")
  const [auteurs, setAuteurs] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  const [treeOpen, setTreeOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  /* ── Derived referentials (computed in render, never stored) ───────────── */

  const phasesOfGroupe = useMemo(
    () => procedePhases.filter((p) => p.groupeId === groupeId),
    [procedePhases, groupeId],
  )
  /** principe id → its procédé count, for the rail badges. */
  const countByPrincipe = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of procedes) map.set(p.principeId, (map.get(p.principeId) ?? 0) + 1)
    return map
  }, [procedes])

  const countOfGroupe = (gid: string) => {
    const phases = new Set(
      procedePhases.filter((p) => p.groupeId === gid).map((p) => p.id),
    )
    return procedePrincipes
      .filter((pr) => phases.has(pr.phaseId))
      .reduce((sum, pr) => sum + (countByPrincipe.get(pr.id) ?? 0), 0)
  }

  const principeById = useMemo(
    () => new Map(procedePrincipes.map((p) => [p.id, p])),
    [procedePrincipes],
  )
  const activePrincipe = principeId ? principeById.get(principeId) : null
  const activeGroupe = procedeGroupes.find((g) => g.id === groupeId)

  const allAuteurs = useMemo(
    () => [...new Set(procedes.map((p) => p.auteur))].sort((a, b) => a.localeCompare(b)),
    [procedes],
  )
  const allCategories = useMemo(
    () => [...new Set(procedes.flatMap((p) => p.categories))].sort((a, b) => a.localeCompare(b)),
    [procedes],
  )

  /* ── The filtered grid ────────────────────────────────────────────────── */

  const principesOfGroupe = useMemo(() => {
    const phases = new Set(phasesOfGroupe.map((p) => p.id))
    return new Set(procedePrincipes.filter((p) => phases.has(p.phaseId)).map((p) => p.id))
  }, [phasesOfGroupe, procedePrincipes])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return procedes.filter((p) => {
      if (principeId ? p.principeId !== principeId : !principesOfGroupe.has(p.principeId))
        return false
      if (type !== "Tous" && p.type !== type) return false
      if (q && !p.titre.toLowerCase().includes(q)) return false
      if (auteurs.length && !auteurs.includes(p.auteur)) return false
      if (categories.length && !p.categories.some((c) => categories.includes(c)))
        return false
      return true
    })
  }, [procedes, principeId, principesOfGroupe, type, query, auteurs, categories])

  const extraFilters = auteurs.length + categories.length
  /** Narrowing the results — a principe selection is navigation, not a filter,
   *  so an empty principe still invites creating rather than resetting. */
  const filtered = extraFilters > 0 || type !== "Tous" || query.trim() !== ""
  const dirty = filtered || principeId !== null

  const reset = () => {
    setPrincipeId(null)
    setType("Tous")
    setQuery("")
    setAuteurs([])
    setCategories([])
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  const handleCreate = (draft: Omit<ProcedeItem, "id">) => {
    const id = addProcede(draft)
    setCreateOpen(false)
    navigate(`/pole-technique/procedes/${id}`)
    return id
  }

  /* ── Shared pieces (the rail is reused inside the mobile modal) ────────── */

  const tree = (
    <ProcedeTree
      groupes={procedeGroupes}
      phases={phasesOfGroupe}
      principes={procedePrincipes}
      groupeId={groupeId}
      principeId={principeId}
      countByPrincipe={countByPrincipe}
      countOfGroupe={countOfGroupe}
      onGroupe={(id) => {
        setGroupeId(id)
        setPrincipeId(null)
      }}
      onPrincipe={(id) => {
        setPrincipeId(id)
        setTreeOpen(false)
      }}
    />
  )

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Procédés"
        subtitle="La bibliothèque tactique du club — jeux, situations et exercices, rangés par principe de jeu."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nouveau procédé
          </Button>
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Rail — the taxonomy. Hidden on mobile, where it opens as a modal. */}
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:w-72 lg:shrink-0">
          {tree}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Toolbar. Search takes the row on mobile; controls wrap below. */}
          <div className="flex flex-col gap-3">
            {/* Mobile-only: the current principe, opens the taxonomy modal. */}
            <button
              type="button"
              onClick={() => setTreeOpen(true)}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3.5 py-2.5 text-left transition-colors hover:border-border-strong lg:hidden"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Layers size={15} className="shrink-0 text-ink-muted" />
                <span className="min-w-0">
                  <span className="block font-ui text-[0.64rem] tracking-[0.1em] text-ink-disabled uppercase">
                    {activeGroupe?.nom}
                  </span>
                  <span className="block truncate font-ui text-[0.85rem] text-ink">
                    {activePrincipe ? activePrincipe.nom : "Tous les principes"}
                  </span>
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-ink-disabled" />
            </button>

            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un procédé…"
                className={cn(fieldCls, "pl-10")}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type — a scrollable segmented on narrow screens. */}
              <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto rounded-pill border border-border p-1 px-1">
                {(["Tous", ...procedeTypes] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "shrink-0 rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] font-medium transition-colors",
                      t === type
                        ? "border-border-second bg-surface-nested text-ink"
                        : "border-transparent text-ink-muted hover:text-ink",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <Button variant="outline" onClick={() => setFiltersOpen(true)}>
                <Filter /> Filtres
                {extraFilters ? (
                  <span className="ml-0.5 inline-flex size-4.5 items-center justify-center rounded-full bg-brand-blue-600/15 font-ui text-[0.65rem] text-brand-blue-600 tabular-nums">
                    {extraFilters}
                  </span>
                ) : null}
              </Button>

              {dirty ? (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
                >
                  <X size={13} /> Réinitialiser
                </button>
              ) : null}
            </div>
          </div>

          {/* Result line — what you are looking at, in one sentence. */}
          <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
            <p className="min-w-0 font-body text-sm text-ink-muted">
              <span className="text-ink">{plural(visible.length)}</span>
              {activePrincipe ? (
                <span className="truncate"> · {activePrincipe.nom}</span>
              ) : (
                <span> · {activeGroupe?.nom}</span>
              )}
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-lg border border-border">
              <EmptyState
                icon={ClipboardList}
                title={
                  filtered ? "Aucun procédé ne correspond" : "Aucun procédé ici"
                }
                description={
                  filtered
                    ? "Élargissez la recherche ou changez de principe pour retrouver des procédés."
                    : "Ce principe n'a pas encore de procédé. Créez le premier pour lancer la bibliothèque."
                }
                action={
                  filtered ? (
                    <Button variant="outline" onClick={reset}>
                      <X /> Réinitialiser les filtres
                    </Button>
                  ) : (
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus /> Nouveau procédé
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => (
                <ProcedeCard
                  key={p.id}
                  procede={p}
                  principe={principeById.get(p.principeId)?.nom ?? ""}
                  onOpen={() => navigate(`/pole-technique/procedes/${p.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile taxonomy — modal, matching the app's modal-over-sheet rule. */}
      <Dialog open={treeOpen} onOpenChange={setTreeOpen}>
        <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parcourir par principe</DialogTitle>
            <DialogDescription>
              Choisissez une phase de jeu, puis le principe à travailler.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5">{tree}</div>
        </DialogContent>
      </Dialog>

      {/* Auteur + catégories — the two filters that don't fit the toolbar. */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtres</DialogTitle>
            <DialogDescription>
              Affinez la bibliothèque par auteur et par catégorie.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            <FilterGroup
              label="Créé par"
              options={allAuteurs}
              selected={auteurs}
              onToggle={(v) => setAuteurs((prev) => toggle(prev, v))}
            />
            <FilterGroup
              label="Catégories"
              options={allCategories}
              selected={categories}
              onToggle={(v) => setCategories((prev) => toggle(prev, v))}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAuteurs([])
                setCategories([])
              }}
            >
              Tout effacer
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>
              Voir {plural(visible.length)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProcedeFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultPrincipeId={principeId ?? undefined}
        onSubmit={(draft) => {
          handleCreate(draft)
          notify("Procédé créé.")
        }}
      />

      {toast ? <Toast msg={toast.msg} id={toast.id} /> : null}
    </div>
  )
}

/* ── Taxonomy rail — groupes ▸ phases ▸ principes ─────────────────────────── */

function ProcedeTree({
  groupes,
  phases,
  principes,
  groupeId,
  principeId,
  countByPrincipe,
  countOfGroupe,
  onGroupe,
  onPrincipe,
}: {
  groupes: { id: string; nom: string }[]
  phases: { id: string; nom: string }[]
  principes: { id: string; phaseId: string; nom: string }[]
  groupeId: string
  principeId: string | null
  countByPrincipe: Map<string, number>
  countOfGroupe: (id: string) => number
  onGroupe: (id: string) => void
  onPrincipe: (id: string | null) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Groupe — three long labels, so a stacked selector rather than tabs. */}
      <div className="flex flex-col gap-1">
        {groupes.map((g) => {
          const on = g.id === groupeId
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onGroupe(g.id)}
              aria-current={on ? "true" : undefined}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left transition-colors",
                on
                  ? "border-border-second bg-surface-nested text-ink"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              <span className="font-ui text-[0.85rem]">{g.nom}</span>
              <span className="shrink-0 font-ui text-[0.72rem] text-ink-disabled tabular-nums">
                {countOfGroupe(g.id)}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => onPrincipe(null)}
          className={cn(
            "rounded-md px-3 py-2 text-left font-ui text-[0.8rem] transition-colors",
            principeId === null
              ? "bg-surface-hover text-ink"
              : "text-ink-muted hover:text-ink",
          )}
        >
          Tous les principes
        </button>

        {phases.map((ph) => (
          <div key={ph.id} className="flex flex-col gap-1">
            <p className="px-3 font-ui text-[0.64rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              {ph.nom}
            </p>
            {principes
              .filter((pr) => pr.phaseId === ph.id)
              .map((pr) => {
                const on = pr.id === principeId
                const count = countByPrincipe.get(pr.id) ?? 0
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => onPrincipe(pr.id)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "flex items-start justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors",
                      on
                        ? "bg-surface-hover text-ink"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    <span className="font-ui text-[0.8rem] leading-snug">
                      {pr.nom}
                    </span>
                    <span
                      className={cn(
                        "mt-px shrink-0 font-ui text-[0.7rem] tabular-nums",
                        count === 0 ? "text-ink-disabled" : "text-ink-muted",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── One procédé card — navigable, so it uses the fluid-fill hover ────────── */

function ProcedeCard({
  procede,
  principe,
  onOpen,
}: {
  procede: ProcedeItem
  principe: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
    >
      {/* Fluid fill: surface descends from the top on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <div className="relative z-10 flex flex-col">
        {/* Tactic board. The one place the prototype shows real imagery. */}
        <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-surface-nested">
          {procede.image ? (
            <img
              src={procede.image}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-ink-disabled">
              <ClipboardList size={22} strokeWidth={1.5} />
            </span>
          )}
          <span className="absolute top-2.5 left-2.5 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.65rem] font-medium tracking-[0.08em] text-brand-blue-600 uppercase backdrop-blur-sm">
            {procede.type}
          </span>
          {procede.video ? (
            <span
              title="Animation disponible"
              className="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full border border-border bg-background/80 text-ink-muted backdrop-blur-sm"
            >
              <Video size={12} />
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          <h3 className="line-clamp-2 font-ui text-[0.92rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
            {procede.titre}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-ui text-[0.72rem] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} /> {procede.duree} min
            </span>
            {/* Effectif / surface are optional on the real records — a procédé
                without them just shows fewer facts rather than "0". */}
            {procede.effectif[0] > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Users size={12} /> {procede.effectif[0]}
                {procede.effectif[1] > 0 ? ` + ${procede.effectif[1]} GB` : ""}
              </span>
            ) : null}
            {procede.surface[0] > 0 && procede.surface[1] > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 size={12} /> {procede.surface[0]}×{procede.surface[1]} m
              </span>
            ) : null}
          </div>
        </div>

        {principe ? (
          <p className="truncate border-t border-border px-4 py-2.5 font-ui text-[0.7rem] text-ink-disabled">
            {principe}
          </p>
        ) : null}
      </div>
    </button>
  )
}

/* ── A checkbox-ish list of options inside the filters modal ──────────────── */

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(o)}
              className={cn(
                "rounded-pill border px-3 py-1.5 font-ui text-[0.76rem] transition-colors",
                on
                  ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                  : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
              )}
            >
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}
