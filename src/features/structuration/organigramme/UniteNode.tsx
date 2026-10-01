import { useRef, useState } from "react"
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Network,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar } from "@/components/kit/Avatar"
import type { OrgMembre, OrgUnite } from "@/data/seed/organigramme"

import { NODE_W, NODE_W_TACHES } from "./layout"
import { TacheRow } from "./ui"

export type UniteNodeData = {
  unite: OrgUnite
  membresById: Record<string, OrgMembre>
  showMembres: boolean
  showTaches: boolean
  /** Keys are `uniteId:membreId` — which member rows have their tâches open. */
  expanded: Set<string>
  /** True while the user is picking the two ends of a new relation. */
  pickMode: boolean
  picked: boolean
  onRename: (uniteId: string, nom: string) => void
  onToggleMembre: (uniteId: string, membreId: string) => void
  onGererMembres: (uniteId: string) => void
  onApercu: (uniteId: string) => void
  /** Open a membre's sheet — rôles, fiche de poste, chartes. */
  onFicheMembre: (membreId: string) => void
  /** Documents each membre still has to accept / sign (by membre id). */
  enAttente: Record<string, number>
  onAddChild: (uniteId: string) => void
  onRemove: (uniteId: string) => void
}

export type UniteNodeType = Node<UniteNodeData, "unite">

/** Small square icon button used in the node header. */
function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "nodrag flex size-6 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-hover",
        danger ? "hover:text-danger" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}

const handleCls = "!size-2 !border-0 !bg-border-strong"

/**
 * One unité on the canvas: its name, the membres affected to it, and — when the
 * tâches layer is on — each membre's tâches, foldable row by row. The card is a
 * plain `bg-surface` panel; selection is signalled by the blue accent border,
 * never by a fill change.
 *
 * **The whole card is a drag handle.** Only the rename input and the icon
 * buttons opt out via `nodrag` — anything wider (the name, the membre rows)
 * would leave nothing to grab, especially on a touch screen where the card is
 * rendered small.
 */
export function UniteNode({ data, selected }: NodeProps<UniteNodeType>) {
  const {
    unite,
    membresById,
    showMembres,
    showTaches,
    expanded,
    pickMode,
    picked,
  } = data

  // A brand-new unité lands with an empty name — open straight into rename.
  const [editing, setEditing] = useState(unite.nom === "")
  /** Pointer-down position, to tell a tap on a membre row from a card drag. */
  const down = useRef<{ x: number; y: number } | null>(null)

  const width = showTaches ? NODE_W_TACHES : NODE_W
  const nbTaches = unite.membres.reduce((s, a) => s + a.taches.length, 0)

  return (
    <div
      style={{ width }}
      className={cn(
        "group relative rounded-lg border bg-surface transition-colors",
        picked
          ? "border-brand-blue-600 shadow-[0_0_0_3px_rgba(0,145,255,0.15)]"
          : selected
            ? "border-brand-blue-600"
            : "border-border",
        pickMode && !picked && "hover:border-border-strong",
      )}
    >
      {/* While a relation is being drawn the whole card is one big target:
          this catches the click before the inputs and member rows can eat it. */}
      {pickMode ? (
        <span aria-hidden className="absolute inset-0 z-20 rounded-lg" />
      ) : null}

      <Handle type="target" position={Position.Top} className={handleCls} />
      <Handle type="source" position={Position.Bottom} className={handleCls} />
      {/* Relation ends: a relation always leaves the left-most unité's right
          edge and enters the right-most unité's left edge. */}
      <Handle
        id="rel-out"
        type="source"
        position={Position.Right}
        className="!size-2 !border-0 !bg-transparent"
      />
      <Handle
        id="rel-in"
        type="target"
        position={Position.Left}
        className="!size-2 !border-0 !bg-transparent"
      />

      {/* Header — icon tile + editable name. The actions stay out of the way
          until the card is hovered, so the name gets the full width at rest. */}
      <div className="flex items-start gap-2.5 p-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
          <Network size={15} />
        </span>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={unite.nom}
              placeholder="Nom de l'unité"
              onChange={(e) => data.onRename(unite.id, e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur()
              }}
              onClick={(e) => e.stopPropagation()}
              className="nodrag w-full truncate rounded-sm border border-border-strong bg-transparent px-1 py-0.5 font-ui text-[0.86rem] font-medium text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
            />
          ) : (
            /* Plain text at rest — an always-live input would make the whole
               header undraggable, which is most of the card. */
            <span
              onDoubleClick={(e) => {
                // Otherwise the canvas' own double-click-to-zoom fires too.
                e.stopPropagation()
                setEditing(true)
              }}
              title="Double-cliquez pour renommer"
              className={cn(
                "block truncate px-1 py-0.5 font-ui text-[0.86rem] font-medium",
                unite.nom ? "text-ink" : "text-ink-disabled",
              )}
            >
              {unite.nom || "Nom de l'unité"}
            </span>
          )}
          <span className="mt-0.5 block px-1 font-body text-[0.7rem] text-ink-muted">
            {unite.membres.length} membre{unite.membres.length > 1 ? "s" : ""}
            {nbTaches > 0 ? ` · ${nbTaches} tâche${nbTaches > 1 ? "s" : ""}` : ""}
          </span>
        </div>
      </div>

      <div className="absolute top-2.5 right-2 flex items-center gap-0.5 rounded-sm bg-surface pl-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <IconBtn label="Aperçu de l'unité" onClick={() => data.onApercu(unite.id)}>
          <Eye size={14} />
        </IconBtn>
        <IconBtn label="Renommer l'unité" onClick={() => setEditing(true)}>
          <Pencil size={13} />
        </IconBtn>
        <IconBtn
          label="Ajouter une sous-unité"
          onClick={() => data.onAddChild(unite.id)}
        >
          <Plus size={14} />
        </IconBtn>
        <IconBtn
          label="Supprimer l'unité"
          danger
          onClick={() => data.onRemove(unite.id)}
        >
          <Trash2 size={14} />
        </IconBtn>
      </div>

      {/* Membres layer */}
      {showMembres ? (
        <div className="border-t border-border px-3 pb-3">
          {unite.membres.length === 0 ? (
            <p className="py-3 text-center font-body text-[0.74rem] text-ink-disabled">
              Aucun membre affecté
            </p>
          ) : (
            <ul className="flex flex-col py-1">
              {unite.membres.map((a) => {
                const membre = membresById[a.membreId]
                if (!membre) return null
                const key = `${unite.id}:${a.membreId}`
                const open = expanded.has(key)
                const foldable = showTaches && a.taches.length > 0
                return (
                  <li key={a.membreId}>
                    <div
                      /* No `nodrag` here: the membre rows are most of the card,
                         and marking them undraggable left nothing to grab. The
                         pointer delta below tells a tap from a card drag. */
                      onPointerDown={(e) => {
                        down.current = { x: e.clientX, y: e.clientY }
                      }}
                      onClick={(e) => {
                        const from = down.current
                        down.current = null
                        if (!foldable) return
                        if (
                          from &&
                          Math.hypot(e.clientX - from.x, e.clientY - from.y) > 4
                        ) {
                          return // the card was dragged, not tapped
                        }
                        e.stopPropagation()
                        data.onToggleMembre(unite.id, a.membreId)
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-sm px-1 py-1.5 transition-colors",
                        foldable && "cursor-pointer hover:bg-surface-hover",
                      )}
                    >
                      <Avatar name={membre.nom} size="sm" />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate font-body text-[0.78rem] text-ink">
                          {membre.nom}
                        </span>
                        <span className="block truncate font-body text-[0.68rem] text-ink-muted">
                          {membre.role}
                        </span>
                      </span>
                      <button
                        type="button"
                        title={
                          data.enAttente[a.membreId]
                            ? `Fiche du membre · ${data.enAttente[a.membreId]} document(s) en attente`
                            : "Fiche du membre"
                        }
                        aria-label={`Fiche de ${membre.nom}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          data.onFicheMembre(a.membreId)
                        }}
                        className="nodrag relative flex size-6 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                      >
                        <Eye size={14} />
                        {data.enAttente[a.membreId] ? (
                          <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-warning" />
                        ) : null}
                      </button>
                      {showTaches && a.taches.length > 0 ? (
                        <span className="flex shrink-0 items-center gap-1 text-ink-muted">
                          <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-1.5 font-ui text-[0.62rem] text-brand-blue-600 tabular-nums">
                            {a.taches.length}
                          </span>
                          {open ? (
                            <ChevronDown size={13} />
                          ) : (
                            <ChevronRight size={13} />
                          )}
                        </span>
                      ) : null}
                    </div>

                    {showTaches && open ? (
                      <div className="mt-1 mb-2 ml-8 flex flex-col gap-1.5">
                        {a.taches.map((t) => (
                          <TacheRow key={t.id} tache={t} />
                        ))}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onGererMembres(unite.id)
            }}
            className="nodrag mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-sm border-t border-border pt-2.5 font-ui text-[0.68rem] font-medium tracking-[0.05em] text-info uppercase transition-opacity hover:opacity-80"
          >
            <UserPlus size={13} />
            Gérer les membres
          </button>
        </div>
      ) : null}
    </div>
  )
}
