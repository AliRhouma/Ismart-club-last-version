import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  Coins,
  Layers,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  txCurrencySeed,
  txGroupsSeed,
  txTypesSeed,
  type TxGroup,
  type TxType,
} from "@/data/seed/transactionConfig"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { FormSheet } from "@/components/kit/FormSheet"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * Configuration de transaction — admin referential of transaction GROUPES,
 * each holding one or more TYPES (name + description). Presented as the same
 * collapsible sections used in the Budget 2 brouillon editor
 * (features/budget2/editor/parts.tsx → EditorSection / LineRow / AddLineRow),
 * so it reads as part of the same family. Prototype-only: state is local and
 * resets on refresh; the modals (FormSheet) and deletes (ConfirmDialog) reuse
 * the shared kit so create/edit/delete feel real.
 */

type GroupModal =
  | { mode: "create-group" }
  | { mode: "edit-group"; group: TxGroup }
  | { mode: "create-type"; groupId: string }
  | { mode: "edit-type"; type: TxType }
  | null

type PendingDelete =
  | { kind: "group"; group: TxGroup }
  | { kind: "type"; type: TxType }
  | null

export function TransactionConfigScreen() {
  const [currency, setCurrency] = useState(txCurrencySeed)
  const [groups, setGroups] = useState<TxGroup[]>(txGroupsSeed)
  const [types, setTypes] = useState<TxType[]>(txTypesSeed)

  const [modal, setModal] = useState<GroupModal>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const typesByGroup = useMemo(() => {
    const map = new Map<string, TxType[]>()
    for (const t of types) {
      const arr = map.get(t.group_id) ?? []
      arr.push(t)
      map.set(t.group_id, arr)
    }
    return map
  }, [types])

  /* ── Mutations (local state) ──────────────────────────────────────────── */
  const removeGroup = (group: TxGroup) => {
    setGroups((g) => g.filter((x) => x.id !== group.id))
    setTypes((t) => t.filter((x) => x.group_id !== group.id))
    notify(`Groupe « ${group.name} » supprimé`)
  }
  const removeType = (type: TxType) => {
    setTypes((t) => t.filter((x) => x.id !== type.id))
    notify(`Type « ${type.name} » supprimé`)
  }

  const totalTypes = types.length

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <BackButton to="/finance/transactions" label="Retour aux transactions" />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-ui text-2xl font-semibold tracking-normal text-ink">
            Création de configuration de transaction
          </h1>
          <p className="mt-1.5 max-w-prose font-body text-[0.82rem] text-ink-muted">
            Organisez vos transactions en groupes, chacun regroupant un ou
            plusieurs types. {groups.length} groupes · {totalTypes} types.
          </p>
        </div>
        <Button onClick={() => setModal({ mode: "create-group" })}>
          <Plus size={15} /> Nouveau groupe
        </Button>
      </div>

      {/* Devise */}
      <div className="mt-5 flex flex-col gap-1.5 rounded-lg border border-border px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
            <Coins size={16} />
          </span>
          <div>
            <div className="font-ui text-[0.64rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              Devise
            </div>
            <div className="font-body text-[0.78rem] text-ink-muted">
              Monnaie de référence des transactions
            </div>
          </div>
        </div>
        <div className="sm:ml-auto sm:w-28">
          <Input
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            aria-label="Devise"
          />
        </div>
      </div>

      {/* Groups */}
      <div className="mt-4 flex flex-col gap-3">
        {groups.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Aucun groupe de transaction"
            description="Créez un premier groupe pour commencer à organiser vos types de transaction."
            action={
              <Button onClick={() => setModal({ mode: "create-group" })}>
                <Plus size={15} /> Nouveau groupe
              </Button>
            }
          />
        ) : (
          groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              types={typesByGroup.get(group.id) ?? []}
              onEditGroup={() => setModal({ mode: "edit-group", group })}
              onRemoveGroup={() => setPendingDelete({ kind: "group", group })}
              onAddType={() =>
                setModal({ mode: "create-type", groupId: group.id })
              }
              onEditType={(type) => setModal({ mode: "edit-type", type })}
              onRemoveType={(type) =>
                setPendingDelete({ kind: "type", type })
              }
            />
          ))
        )}
      </div>

      {/* ── Overlays ───────────────────────────────────────────────────── */}
      <ConfigModal
        modal={modal}
        onClose={() => setModal(null)}
        onSaveGroup={(draft, editing) => {
          if (editing) {
            setGroups((g) =>
              g.map((x) => (x.id === editing.id ? { ...x, ...draft } : x)),
            )
            notify("Groupe modifié")
          } else {
            setGroups((g) => [
              ...g,
              { id: crypto.randomUUID(), ...draft },
            ])
            notify("Groupe créé")
          }
        }}
        onSaveType={(draft, groupId, editing) => {
          if (editing) {
            setTypes((t) =>
              t.map((x) => (x.id === editing.id ? { ...x, ...draft } : x)),
            )
            notify("Type modifié")
          } else {
            setTypes((t) => [
              ...t,
              { id: crypto.randomUUID(), group_id: groupId, ...draft },
            ])
            notify("Type ajouté")
          }
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={
          pendingDelete?.kind === "group"
            ? "Supprimer ce groupe ?"
            : "Supprimer ce type ?"
        }
        description={
          pendingDelete?.kind === "group"
            ? `« ${pendingDelete.group.name} » et tous ses types seront supprimés.`
            : pendingDelete
              ? `« ${pendingDelete.type.name} » sera supprimé.`
              : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (pendingDelete?.kind === "group") removeGroup(pendingDelete.group)
          else if (pendingDelete?.kind === "type") removeType(pendingDelete.type)
          setPendingDelete(null)
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

/* ── Collapsible group section (mirrors budget2 EditorSection) ───────────── */
function GroupSection({
  group,
  types,
  onEditGroup,
  onRemoveGroup,
  onAddType,
  onEditType,
  onRemoveType,
}: {
  group: TxGroup
  types: TxType[]
  onEditGroup: () => void
  onRemoveGroup: () => void
  onAddType: () => void
  onEditType: (type: TxType) => void
  onRemoveType: (type: TxType) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="group/header flex w-full items-center gap-3 pr-2 transition-colors hover:bg-surface-hover">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left"
        >
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-ink-muted transition-transform",
              open ? "" : "-rotate-90",
            )}
          />
          <span className="shrink-0 text-ink-muted">
            <Layers size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-ui text-[0.95rem] font-medium text-ink">
              {group.name}
            </h3>
            {group.description ? (
              <div className="mt-0.5 truncate font-body text-[0.74rem] text-ink-muted">
                {group.description}
              </div>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full border border-border-second px-2 py-0.5 font-ui text-[0.66rem] font-medium tabular-nums text-ink-muted">
            {types.length} {types.length > 1 ? "types" : "type"}
          </span>
        </button>
        {/* Group actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Modifier le groupe"
            onClick={onEditGroup}
            className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            aria-label="Supprimer le groupe"
            onClick={onRemoveGroup}
            className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border">
          {types.map((type) => (
            <TypeRow
              key={type.id}
              type={type}
              onEdit={() => onEditType(type)}
              onRemove={() => onRemoveType(type)}
            />
          ))}
          {types.length === 0 ? (
            <p className="px-4 py-3 font-body text-[0.78rem] text-ink-disabled">
              Aucun type dans ce groupe.
            </p>
          ) : null}
          <button
            type="button"
            onClick={onAddType}
            className="flex w-full items-center gap-1.5 px-4 py-2.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover"
          >
            <Plus size={14} /> Ajouter un type
          </button>
        </div>
      ) : null}
    </section>
  )
}

/* ── A single type row (mirrors budget2 LineRow) ─────────────────────────── */
function TypeRow({
  type,
  onEdit,
  onRemove,
}: {
  type: TxType
  onEdit: () => void
  onRemove: () => void
}) {
  return (
    <div className="group/row flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 hover:bg-surface-hover">
      <span className="shrink-0 text-ink-disabled">
        <Tag size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-body text-[0.86rem] text-ink">
          {type.name}
        </div>
        {type.description ? (
          <div className="truncate font-body text-[0.7rem] text-ink-disabled">
            {type.description}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
        <button
          type="button"
          aria-label="Modifier le type"
          onClick={onEdit}
          className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          aria-label="Supprimer le type"
          onClick={onRemove}
          className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── Field wrapper for the modals ────────────────────────────────────────── */
function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

/* ── Create / edit modal (group or type) — driven off the `modal` union ──── */
function ConfigModal({
  modal,
  onClose,
  onSaveGroup,
  onSaveType,
}: {
  modal: GroupModal
  onClose: () => void
  onSaveGroup: (
    draft: { name: string; description: string },
    editing: TxGroup | null,
  ) => void
  onSaveType: (
    draft: { name: string; description: string },
    groupId: string,
    editing: TxType | null,
  ) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Seed the fields whenever a modal opens.
  useEffect(() => {
    if (!modal) return
    if (modal.mode === "edit-group") {
      setName(modal.group.name)
      setDescription(modal.group.description)
    } else if (modal.mode === "edit-type") {
      setName(modal.type.name)
      setDescription(modal.type.description)
    } else {
      setName("")
      setDescription("")
    }
  }, [modal])

  const isGroup =
    modal?.mode === "create-group" || modal?.mode === "edit-group"
  const isEdit = modal?.mode === "edit-group" || modal?.mode === "edit-type"

  const title = !modal
    ? ""
    : modal.mode === "create-group"
      ? "Nouveau groupe de transaction"
      : modal.mode === "edit-group"
        ? "Modifier le groupe de transaction"
        : modal.mode === "create-type"
          ? "Nouveau type de transaction"
          : "Modifier le type de transaction"

  const nameLabel = isGroup
    ? "Nom de groupe de transaction"
    : "Nom de type de transaction"
  const descLabel = isGroup
    ? "Description de groupe de transaction"
    : "Description de type de transaction"

  const handleSubmit = () => {
    if (!modal) return
    const draft = { name: name.trim(), description: description.trim() }
    if (modal.mode === "create-group") onSaveGroup(draft, null)
    else if (modal.mode === "edit-group") onSaveGroup(draft, modal.group)
    else if (modal.mode === "create-type")
      onSaveType(draft, modal.groupId, null)
    else if (modal.mode === "edit-type")
      onSaveType(draft, modal.type.group_id, modal.type)
    onClose()
  }

  return (
    <FormSheet
      open={modal !== null}
      onOpenChange={(o) => !o && onClose()}
      title={title}
      submitLabel={isEdit ? "Enregistrer" : "Créer"}
      submitDisabled={name.trim().length === 0}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-4">
        <Field label={nameLabel}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isGroup ? "Ex. Sponsors et subventions" : "Ex. Billetterie"}
            autoFocus
          />
        </Field>
        <Field label={descLabel}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Description courte…"
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus-visible:border-border-focus"
          />
        </Field>
      </div>
    </FormSheet>
  )
}
