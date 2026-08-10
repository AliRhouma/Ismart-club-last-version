import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useNodesState,
  type Connection,
  type OnNodeDrag,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react"
import {
  ArrowRightLeft,
  Check,
  GitBranch,
  Link2,
  ListTodo,
  Network,
  Plus,
  Users,
  Wand2,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { PageHeader } from "@/components/kit/PageHeader"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { EmptyState } from "@/components/kit/EmptyState"

import { layoutUnites, NODE_W, NODE_W_TACHES } from "./organigramme/layout"
import { UniteNode, type UniteNodeType } from "./organigramme/UniteNode"
import { RelationEdge } from "./organigramme/RelationEdge"
import { StatChip, ToggleBtn, ToolSep } from "./organigramme/ui"
import {
  MembresModal,
  RelationModal,
  TacheTransfertModal,
  UniteApercuModal,
} from "./organigramme/modals"

import "@xyflow/react/dist/style.css"

const nodeTypes = { unite: UniteNode }
const edgeTypes = { relation: RelationEdge }

/* Canvas dot grid — a canvas texture, not a surface: no token covers it. */
const DOT_COLOR = "#2e2e2e"

/**
 * Fit options. On a phone we floor the zoom: squeezing the whole tree into
 * 400px lands around 0.2×, which is legible to nobody and far too small to
 * grab with a finger — better to show part of it and let the user pan. On a
 * desktop the whole organigramme does fit, so no floor.
 */
const fitOptions = () => ({
  padding: 0.12,
  maxZoom: 1,
  minZoom: window.innerWidth < 768 ? 0.5 : 0.2,
})

/**
 * Structuration ▸ Organigramme — the club's structure on a canvas.
 *
 * Three stacked layers the user turns on and off: the unités themselves, the
 * membres affected to each one, and the tâches those membres carry. On top of
 * the parent/child tree, two unités can be tied by a named relation transverse.
 * Everything (positions included) lives in the store, so a drag or a rename
 * survives navigating away and back.
 */
export function OrganigrammeScreen() {
  const {
    orgUnites,
    orgRelations,
    orgMembres,
    addOrgUnite,
    updateOrgUnite,
    removeOrgUnite,
    setOrgPositions,
    addOrgRelation,
  } = useData()

  /* Layers */
  const [showMembres, setShowMembres] = useState(true)
  const [showTaches, setShowTaches] = useState(false)
  const [showRelations, setShowRelations] = useState(true)
  const [espacement, setEspacement] = useState(1.2)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  /* Selection + relation drawing */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<string[]>([])

  /* Modals */
  const [membresFor, setMembresFor] = useState<string | null>(null)
  const [apercuFor, setApercuFor] = useState<string | null>(null)
  const [relationFor, setRelationFor] = useState<string | null>(null)
  const [transfert, setTransfert] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  /* Toast */
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = useCallback(
    (msg: string) => setToast({ id: toastId.current++, msg }),
    [],
  )
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const membresById = useMemo(
    () => Object.fromEntries(orgMembres.map((m) => [m.id, m])),
    [orgMembres],
  )

  /* ── Actions ──────────────────────────────────────────────────────────── */

  /** The canvas instance, so a re-layout can re-frame the view. */
  const flow = useRef<ReactFlowInstance<UniteNodeType, Edge> | null>(null)

  const relayout = useCallback(
    (
      opts?: Partial<{
        membres: boolean
        taches: boolean
        espacement: number
        expanded: Set<string>
      }>,
    ) => {
      setOrgPositions(
        layoutUnites(
          orgUnites,
          opts?.membres ?? showMembres,
          opts?.taches ?? showTaches,
          opts?.expanded ?? expanded,
          opts?.espacement ?? espacement,
        ),
      )
      // Re-frame once the new positions have painted, so nothing drifts
      // off-canvas when a layer changes the cards' height.
      requestAnimationFrame(() =>
        flow.current?.fitView({ ...fitOptions(), duration: 260 }),
      )
    },
    [orgUnites, showMembres, showTaches, expanded, espacement, setOrgPositions],
  )

  /** Folding a membre's tâches changes the card height — re-space the levels. */
  const toggleMembre = useCallback(
    (uniteId: string, membreId: string) => {
      const key = `${uniteId}:${membreId}`
      const next = new Set(expanded)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      setExpanded(next)
      relayout({ expanded: next })
    },
    [expanded, relayout],
  )

  const addUnite = useCallback(
    (parentId: string | null) => {
      const parent = parentId ? orgUnites.find((u) => u.id === parentId) : null
      const id = addOrgUnite({
        nom: "",
        parentId,
        membres: [],
        x: (parent?.x ?? 480) + 40,
        y: (parent?.y ?? 0) + 260,
      })
      setSelectedId(id)
      notify(parent ? `Sous-unité ajoutée sous « ${parent.nom} »` : "Unité racine ajoutée")
    },
    [orgUnites, addOrgUnite, notify],
  )

  /** Dragging a link from one unité's bottom handle onto another re-parents it. */
  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return
      // Refuse a cycle: the new parent must not sit under the moved unité.
      let cursor: string | null = c.source
      while (cursor) {
        if (cursor === c.target) {
          notify("Rattachement impossible — cela créerait une boucle")
          return
        }
        cursor = orgUnites.find((u) => u.id === cursor)?.parentId ?? null
      }
      updateOrgUnite(c.target, { parentId: c.source })
      notify("Rattachement mis à jour")
    },
    [orgUnites, updateOrgUnite, notify],
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      if (!picking) {
        setSelectedId(node.id)
        return
      }
      if (picked.includes(node.id)) {
        setPicked((p) => p.filter((id) => id !== node.id))
        return
      }
      const next = [...picked, node.id]
      if (next.length < 2) {
        setPicked(next)
        return
      }
      const [a, b] = next
      const ua = orgUnites.find((u) => u.id === a)
      const ub = orgUnites.find((u) => u.id === b)
      addOrgRelation({
        sourceId: a,
        targetId: b,
        libelle: "Nouvelle relation",
      })
      setPicking(false)
      setPicked([])
      setShowRelations(true)
      notify(`Relation créée entre « ${ua?.nom} » et « ${ub?.nom} »`)
    },
    [picking, picked, orgUnites, addOrgRelation, notify],
  )

  /* ── Graph ────────────────────────────────────────────────────────────── */

  const [nodes, setNodes, onNodesChange] = useNodesState<UniteNodeType>([])

  /**
   * The cards, rebuilt from the store whenever its *content* changes (a rename,
   * an affectation, a re-layout…) — never on a mere position tick.
   */
  const built = useMemo<UniteNodeType[]>(
    () =>
      orgUnites.map((u) => ({
        id: u.id,
        type: "unite" as const,
        position: { x: u.x, y: u.y },
        selected: u.id === selectedId,
        width: showTaches ? NODE_W_TACHES : NODE_W,
        data: {
          unite: u,
          membresById,
          showMembres,
          showTaches,
          expanded,
          pickMode: picking,
          picked: picked.includes(u.id),
          onRename: (id, nom) => updateOrgUnite(id, { nom }),
          onToggleMembre: toggleMembre,
          onGererMembres: setMembresFor,
          onApercu: setApercuFor,
          onAddChild: addUnite,
          onRemove: setDeleting,
        },
      })),
    [
      orgUnites,
      selectedId,
      membresById,
      showMembres,
      showTaches,
      expanded,
      picking,
      picked,
      updateOrgUnite,
      toggleMembre,
      addUnite,
    ],
  )

  const edges = useMemo<Edge[]>(() => {
    const ids = new Set(orgUnites.map((u) => u.id))
    const tree: Edge[] = orgUnites
      .filter((u) => u.parentId && ids.has(u.parentId))
      .map((u) => ({
        id: `tree-${u.parentId}-${u.id}`,
        source: u.parentId as string,
        target: u.id,
        type: "smoothstep",
        /* Neutral tree links — the accent is reserved for the relations. */
        style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
        /* Edges aren't clickable here; without this their fat invisible hit
           area covers the relation labels. */
        interactionWidth: 0,
      }))

    if (!showRelations) return tree

    const rel: Edge[] = orgRelations.flatMap((r) => {
      const a = orgUnites.find((u) => u.id === r.sourceId)
      const b = orgUnites.find((u) => u.id === r.targetId)
      if (!a || !b) return []
      // The link always leaves the left-hand card and enters the right-hand one.
      const [from, to] = a.x <= b.x ? [a, b] : [b, a]
      return [
        {
          id: r.id,
          source: from.id,
          target: to.id,
          sourceHandle: "rel-out",
          targetHandle: "rel-in",
          type: "relation",
          zIndex: 5,
          interactionWidth: 0,
          data: { libelle: r.libelle, onOpen: setRelationFor },
        },
      ]
    })

    return [...tree, ...rel]
  }, [orgUnites, orgRelations, showRelations])

  /**
   * React Flow owns the positions while the user is dragging — that's the whole
   * point of `useNodesState`: it moves one card through the canvas' own store
   * instead of re-rendering the app. Writing each drag tick into the global
   * DataProvider instead rebuilt the entire context 60×/s and dropped the drag
   * to ~8 fps. The store is written once, when the card is dropped.
   */
  useEffect(() => setNodes(built), [built, setNodes])

  const onNodeDragStop = useCallback<OnNodeDrag<UniteNodeType>>(
    (_, node) => setOrgPositions({ [node.id]: node.position }),
    [setOrgPositions],
  )

  /* ── Derived counters ─────────────────────────────────────────────────── */

  const nbLiens = orgUnites.filter((u) => u.parentId).length
  const nbMembres = orgUnites.reduce((s, u) => s + u.membres.length, 0)
  const nbTaches = orgUnites.reduce(
    (s, u) => s + u.membres.reduce((n, a) => n + a.taches.length, 0),
    0,
  )

  const uniteMembres = orgUnites.find((u) => u.id === membresFor) ?? null
  const uniteApercu = orgUnites.find((u) => u.id === apercuFor) ?? null
  const uniteDeleting = orgUnites.find((u) => u.id === deleting) ?? null

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <PageHeader
        title="Organigramme"
        subtitle={`${orgUnites.length} unité${orgUnites.length > 1 ? "s" : ""} · ${nbMembres} membre${nbMembres > 1 ? "s" : ""} affecté${nbMembres > 1 ? "s" : ""} · Structuration`}
        actions={
          <>
            <Button variant="outline" onClick={() => relayout()}>
              <Wand2 size={15} /> Auto-agencer
            </Button>
            <Button onClick={() => addUnite(null)}>
              <Plus size={16} /> Ajouter une unité
            </Button>
          </>
        }
      />

      {/* Toolbar — layers on the left, the organigramme's numbers on the right */}
      <div className="flex flex-wrap items-center justify-between gap-y-4 rounded-lg border border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
            Couches
          </span>
          <ToggleBtn
            active={showMembres}
            icon={Users}
            onClick={() => {
              const next = !showMembres
              setShowMembres(next)
              relayout({ membres: next })
            }}
          >
            Membres
          </ToggleBtn>
          <ToggleBtn
            active={showTaches}
            icon={ListTodo}
            onClick={() => {
              const next = !showTaches
              setShowTaches(next)
              if (next) setShowMembres(true)
              relayout({ taches: next, membres: next ? true : showMembres })
            }}
          >
            Tâches
          </ToggleBtn>
          <ToggleBtn
            active={showRelations}
            icon={Link2}
            onClick={() => setShowRelations((v) => !v)}
          >
            Relations
          </ToggleBtn>

          <ToolSep />

          {picking ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              onClick={() => {
                setPicking(false)
                setPicked([])
              }}
            >
              <X size={14} /> Annuler la relation
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={orgUnites.length < 2}
              onClick={() => {
                setPicking(true)
                setPicked([])
                setSelectedId(null)
              }}
            >
              <Link2 size={14} /> Créer une relation
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={nbTaches === 0}
            onClick={() => setTransfert(true)}
          >
            <ArrowRightLeft size={14} /> Réaffecter une tâche
          </Button>

          <ToolSep />

          <label className="flex items-center gap-2.5">
            <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
              Espacement
            </span>
            <input
              type="range"
              min="0.6"
              max="3"
              step="0.1"
              value={espacement}
              onChange={(e) => {
                const v = Number(e.target.value)
                setEspacement(v)
                relayout({ espacement: v })
              }}
              className="h-1 w-28 cursor-pointer appearance-none rounded-pill bg-surface-nested accent-brand-blue-600"
            />
            <span className="w-8 font-ui text-[0.72rem] text-ink-muted tabular-nums">
              {espacement.toFixed(1)}×
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <StatChip label="Unités" value={orgUnites.length} icon={Network} />
          <StatChip label="Liens" value={nbLiens} icon={GitBranch} />
          <StatChip label="Relations" value={orgRelations.length} icon={Link2} />
          <StatChip label="Membres" value={nbMembres} icon={Users} />
          <StatChip label="Tâches" value={nbTaches} icon={ListTodo} />
        </div>
      </div>

      {/* Relation drawing hint */}
      {picking ? (
        <div className="flex items-center gap-3 rounded-lg border border-brand-blue-600/30 bg-brand-blue-600/5 px-4 py-3">
          <Link2 size={16} className="shrink-0 text-brand-blue-600" />
          <p className="flex-1 font-body text-[0.82rem] text-ink">
            {picked.length === 0
              ? "Cliquez la première unité de la relation."
              : `Cliquez la seconde unité — première : « ${orgUnites.find((u) => u.id === picked[0])?.nom} ».`}
          </p>
          {picked.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-1 font-ui text-[0.68rem] text-brand-blue-600"
            >
              <Check size={12} />
              {orgUnites.find((u) => u.id === id)?.nom || "Unité"}
            </span>
          ))}
        </div>
      ) : null}

      {/* Canvas */}
      {/* On a phone the toolbar wraps over several rows, so the canvas takes a
          flat share of the viewport instead of "whatever is left over". */}
      <div className="h-[68svh] min-h-[420px] overflow-hidden rounded-lg border border-border md:h-[calc(100svh-300px)] md:min-h-[480px]">
        {orgUnites.length === 0 ? (
          <EmptyState
            className="h-full"
            icon={Network}
            title="Aucune unité"
            description="L'organigramme est vide. Créez la première unité — la présidence, par exemple — puis ajoutez ses sous-unités."
            action={
              <Button onClick={() => addUnite(null)}>
                <Plus size={16} /> Ajouter une unité
              </Button>
            }
          />
        ) : (
          <ReactFlow
            colorMode="dark"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onConnect={onConnect}
            onPaneClick={() => setSelectedId(null)}
            onInit={(inst) => (flow.current = inst)}
            fitView
            fitViewOptions={fitOptions()}
            minZoom={0.2}
            /* Double-click belongs to the cards (rename), not to the canvas:
               d3-zoom's own dblclick handler swallows the event before React
               ever sees it. Zooming stays on the wheel, pinch and Controls. */
            zoomOnDoubleClick={false}
            proOptions={{ hideAttribution: true }}
            className={cn("org-flow", picking && "cursor-crosshair")}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1}
              color={DOT_COLOR}
            />
            <Controls
              showInteractive={false}
              className="!rounded-md !border !border-border !bg-surface !shadow-none [&_button]:!border-border [&_button]:!bg-transparent [&_button]:!text-ink-muted [&_button:hover]:!bg-surface-hover [&_button:hover]:!text-ink [&_svg]:!fill-current"
            />
          </ReactFlow>
        )}
      </div>

      {/* Modals */}
      {uniteMembres ? (
        <MembresModal
          unite={uniteMembres}
          onClose={() => setMembresFor(null)}
          onSaved={(n) =>
            notify(
              `${n} membre${n > 1 ? "s" : ""} affecté${n > 1 ? "s" : ""} à « ${uniteMembres.nom} »`,
            )
          }
        />
      ) : null}

      {uniteApercu ? (
        <UniteApercuModal
          unite={uniteApercu}
          parent={orgUnites.find((u) => u.id === uniteApercu.parentId) ?? null}
          membresById={membresById}
          onClose={() => setApercuFor(null)}
        />
      ) : null}

      {relationFor ? (
        <RelationModal
          relationId={relationFor}
          onClose={() => setRelationFor(null)}
          onDeleted={(libelle) => notify(`Relation « ${libelle} » supprimée`)}
        />
      ) : null}

      {transfert ? (
        <TacheTransfertModal
          membresById={membresById}
          onClose={() => setTransfert(false)}
          onMoved={(titre, vers) => notify(`« ${titre} » réaffectée à ${vers}`)}
        />
      ) : null}

      <ConfirmDialog
        open={uniteDeleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Supprimer « ${uniteDeleting?.nom || "cette unité"} » ?`}
        description="Ses sous-unités seront rattachées à l'unité parente et ses relations transverses seront supprimées."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (!uniteDeleting) return
          removeOrgUnite(uniteDeleting.id)
          if (selectedId === uniteDeleting.id) setSelectedId(null)
          notify(`Unité « ${uniteDeleting.nom || "sans nom"} » supprimée`)
          setDeleting(null)
        }}
      />

      {toast ? (
        <div
          key={toast.id}
          role="status"
          className="animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-success/30 bg-surface px-4 py-3 shadow-deep"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={14} />
          </span>
          <span className="font-body text-[0.84rem] text-ink">{toast.msg}</span>
        </div>
      ) : null}
    </div>
  )
}
