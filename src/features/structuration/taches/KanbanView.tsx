import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  GripVertical,
  ListTodo,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { Button } from "@/components/ui/button"
import { Select, inputCls } from "@/features/finance/ui"
import { TACHE_STATUTS, type Tache, type TacheStatut } from "@/data/seed/taches"
import type { OrgMembre } from "@/data/seed/organigramme"

import {
  AssigneeChip,
  Echeance,
  PrioriteBadge,
  ProgressBar,
  avancement,
  statutMeta,
} from "./ui"

/* ── Card ───────────────────────────────────────────────────────────────── */

function TacheCard({
  tache,
  membre,
  projet,
  dragging,
}: {
  tache: Tache
  membre: OrgMembre | null
  projet: string
  dragging?: boolean
}) {
  const { faites, total, pct } = avancement(tache)
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface p-3 transition-colors",
        dragging
          ? "border-brand-blue-600 shadow-deep"
          : "border-border hover:border-border-strong",
      )}
    >
      <h4
        className={cn(
          /* pr-7 keeps the title clear of the drag grip pinned top-right. */
          "pr-7 font-body text-[0.84rem] leading-snug",
          tache.statut === "Terminée" ? "text-ink-muted" : "text-ink",
        )}
      >
        {tache.nom}
      </h4>
      <p className="mt-1 line-clamp-2 font-body text-[0.74rem] text-ink-muted">
        {tache.description}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="max-w-full truncate rounded-pill border border-border bg-surface-nested px-2 py-0.5 font-ui text-[0.64rem] text-ink-muted">
          {projet}
        </span>
        <PrioriteBadge priorite={tache.priorite} />
      </div>

      {total > 0 ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-ui text-[0.62rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
              Sous-tâches
            </span>
            <span className="font-body text-[0.7rem] text-ink-muted tabular-nums">
              {faites}/{total}
            </span>
          </div>
          <ProgressBar pct={pct} tone={pct === 100 ? "success" : "info"} />
        </div>
      ) : null}

      <div className="mt-3">
        <AssigneeChip membre={membre} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <Echeance tache={tache} />
        <span className="flex items-center gap-2.5 font-body text-[0.7rem] text-ink-disabled tabular-nums">
          {tache.piecesJointes > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={11} /> {tache.piecesJointes}
            </span>
          ) : null}
          {tache.commentaires > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={11} /> {tache.commentaires}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  )
}

/**
 * The draggable wrapper. Three gestures have to coexist on one card, so each
 * gets its own surface:
 *
 * - **tap the card** → open the tâche
 * - **swipe the card** → scroll the board sideways (`touch-action: manipulation`
 *   leaves the pan to the browser)
 * - **drag the grip** → move the tâche between colonnes
 *
 * The grip exists because of that middle case: on a horizontal scroller the
 * compositor claims a sideways finger before dnd-kit's delayed touch sensor
 * ever fires, so a card with no `touch-action: none` surface simply cannot be
 * dragged on a phone. The mouse has no such conflict — on desktop the whole
 * card stays draggable.
 */
function DraggableCard({
  tache,
  membre,
  projet,
  onOpen,
}: {
  tache: Tache
  membre: OrgMembre | null
  projet: string
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tache.id,
    data: { nom: tache.nom },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      style={{ touchAction: "manipulation" }}
      className={cn(
        "group relative cursor-grab text-left outline-none active:cursor-grabbing",
        isDragging && "opacity-35",
      )}
    >
      <TacheCard tache={tache} membre={membre} projet={projet} />

      <button
        type="button"
        {...listeners}
        aria-label={`Déplacer « ${tache.nom} »`}
        title="Déplacer la tâche"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: "none" }}
        className="absolute top-1.5 right-1.5 flex size-7 cursor-grab items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={15} />
      </button>
    </div>
  )
}

/* ── Column ─────────────────────────────────────────────────────────────── */

function Colonne({
  statut,
  taches,
  children,
}: {
  statut: TacheStatut
  taches: Tache[]
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statut })
  const { icon: Icon, dot } = statutMeta[statut]

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[84vw] max-w-[320px] shrink-0 snap-start flex-col rounded-lg border transition-colors sm:w-[300px]",
        isOver ? "border-brand-blue-600 bg-brand-blue-600/5" : "border-border",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
          <Icon size={14} className="shrink-0 text-ink-muted" />
          <span className="truncate font-ui text-[0.8rem] font-medium text-ink">
            {statut}
          </span>
        </span>
        <span className="shrink-0 rounded-pill bg-surface-nested px-2 py-0.5 font-ui text-[0.68rem] text-ink-muted tabular-nums">
          {taches.length}
        </span>
      </header>

      <div className="flex max-h-[62svh] flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
        {children}
      </div>
    </section>
  )
}

/* ── Board ──────────────────────────────────────────────────────────────── */

/** dnd-kit announces drags to screen readers in English by default. */
const annonces = {
  onDragStart: ({ active }: { active: { data: { current?: { nom?: string } } } }) =>
    `Déplacement de la tâche « ${active.data.current?.nom ?? "sélectionnée"} ».`,
  onDragOver: ({ over }: { over: { id: string | number } | null }) =>
    over ? `Au-dessus de la colonne « ${over.id} ».` : "Hors de toute colonne.",
  onDragEnd: ({ over }: { over: { id: string | number } | null }) =>
    over ? `Tâche déposée dans « ${over.id} ».` : "Déplacement annulé.",
  onDragCancel: () => "Déplacement annulé.",
}

/**
 * Kanban — the five statuts as columns, drag a card to move it. The board
 * scrolls horizontally with scroll-snap so a phone shows one full column at a
 * time; tapping a card opens it, where the statut can also be changed without
 * dragging at all.
 */
export function KanbanView({
  onOpenTache,
  onNewTache,
}: {
  onOpenTache: (tache: Tache) => void
  onNewTache: (statut: TacheStatut) => void
}) {
  const { taches, projets, sousProjets, orgMembres, setTacheStatut } = useData()

  const [recherche, setRecherche] = useState("")
  const [projetId, setProjetId] = useState("")
  const [actif, setActif] = useState<Tache | null>(null)

  const sensors = useSensors(
    // A few pixels of travel before a mouse drag starts, so a click stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // A short press before a touch drag starts, so a swipe still scrolls.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
  )

  const membreById = useMemo(
    () => Object.fromEntries(orgMembres.map((m) => [m.id, m])),
    [orgMembres],
  )
  const projetParSousProjet = useMemo(
    () =>
      Object.fromEntries(
        sousProjets.map((sp) => [
          sp.id,
          projets.find((p) => p.id === sp.projetId)?.nom ?? "—",
        ]),
      ),
    [sousProjets, projets],
  )

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return taches.filter((t) => {
      if (projetId) {
        const sp = sousProjets.find((s) => s.id === t.sousProjetId)
        if (!sp || sp.projetId !== projetId) return false
      }
      if (!q) return true
      return (
        t.nom.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (projetParSousProjet[t.sousProjetId] ?? "").toLowerCase().includes(q)
      )
    })
  }, [taches, recherche, projetId, sousProjets, projetParSousProjet])

  const onDragStart = (e: DragStartEvent) =>
    setActif(taches.find((t) => t.id === e.active.id) ?? null)

  const onDragEnd = (e: DragEndEvent) => {
    setActif(null)
    const cible = e.over?.id as TacheStatut | undefined
    if (!cible) return
    const tache = taches.find((t) => t.id === e.active.id)
    if (!tache || tache.statut === cible) return
    setTacheStatut(tache.id, cible)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2.5 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-disabled"
          />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une tâche…"
            className={cn(inputCls, "py-2 pr-9 pl-9")}
          />
          {recherche ? (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => setRecherche("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 text-ink-disabled transition-colors hover:text-ink"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
        <div className="sm:w-[240px]">
          <Select
            value={projetId}
            onChange={setProjetId}
            options={projets.map((p) => ({ value: p.id, label: p.nom }))}
            placeholder="Tous les projets"
          />
        </div>
        <span className="shrink-0 font-body text-[0.74rem] text-ink-muted">
          {visibles.length} tâche{visibles.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        accessibility={{ announcements: annonces }}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActif(null)}
      >
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:snap-none">
          {TACHE_STATUTS.map((statut) => {
            const colonne = visibles.filter((t) => t.statut === statut)
            return (
              <Colonne key={statut} statut={statut} taches={colonne}>
                {colonne.map((t) => (
                  <DraggableCard
                    key={t.id}
                    tache={t}
                    membre={t.assigneId ? membreById[t.assigneId] : null}
                    projet={projetParSousProjet[t.sousProjetId] ?? "—"}
                    onOpen={() => onOpenTache(t)}
                  />
                ))}

                {colonne.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-3 py-8 text-center">
                    <ListTodo size={20} className="text-ink-disabled" />
                    <span className="font-body text-[0.76rem] text-ink-disabled">
                      Rien ici
                    </span>
                  </div>
                ) : null}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNewTache(statut)}
                  className="w-full justify-center border border-dashed border-border text-ink-muted hover:text-ink"
                >
                  <Plus size={14} /> Ajouter
                </Button>
              </Colonne>
            )
          })}
        </div>

        {/* The card that follows the pointer / finger */}
        <DragOverlay dropAnimation={null}>
          {actif ? (
            <div className="w-[280px] rotate-1">
              <TacheCard
                dragging
                tache={actif}
                membre={actif.assigneId ? membreById[actif.assigneId] : null}
                projet={projetParSousProjet[actif.sousProjetId] ?? "—"}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
