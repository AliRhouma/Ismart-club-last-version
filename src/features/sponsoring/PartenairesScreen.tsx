import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Archive,
  ArrowRight,
  Check,
  Handshake,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Partner, PartnerStatus } from "@/data/seed/sponsoring"
import { SponsoringShell } from "@/features/sponsoring/SponsoringShell"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { DataTable, type Column } from "@/components/kit/DataTable"
import { PartnerFormModal } from "@/features/sponsoring/PartnerFormModal"

/** One row of the partners table. */
type Row = { partner: Partner }

/** The three positions of the state filter. */
type Filter = "tous" | PartnerStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "actif", label: "Actifs" },
  { key: "archive", label: "Archivés" },
]

/**
 * Screen 5 — partenaires, as one flat table.
 *
 * Deux colonnes seulement : qui, et où en est le partenariat. Un partenaire ne
 * se supprime pas — il s'archive, et le filtre d'état décide de ce qu'on voit.
 * References EducateursScreen (roster rows) and the DataTable kit.
 */
export function PartenairesScreen() {
  const navigate = useNavigate()
  const { partners, updatePartner } = useData()

  const [form, setForm] = useState<{ editing: Partner | null } | null>(null)
  const [confirm, setConfirm] = useState<Partner | null>(null)
  const [filter, setFilter] = useState<Filter>("tous")

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const counts = {
    tous: partners.length,
    actif: partners.filter((p) => p.status === "actif").length,
    archive: partners.filter((p) => p.status === "archive").length,
  }

  // Les actifs d'abord : les archivés sont de la mémoire, pas du travail en cours.
  const rows = useMemo<Row[]>(() => {
    return partners
      .filter((p) => filter === "tous" || p.status === filter)
      .map((partner) => ({ partner }))
      .sort(
        (a, b) =>
          Number(a.partner.status === "archive") -
            Number(b.partner.status === "archive") ||
          a.partner.name.localeCompare(b.partner.name),
      )
  }, [partners, filter])

  const columns: Column<Row>[] = [
    {
      id: "partner",
      header: "Partenaire",
      cell: (row) => (
        <div className="flex items-start gap-3">
          {/* La couleur du partenaire cercle son avatar : la pastille reste
              lisible sans repeindre l'avatar (règle « pas d'arc-en-ciel »). */}
          <span
            className="shrink-0 rounded-pill border-2 p-[2px]"
            style={{ borderColor: row.partner.color }}
          >
            <Avatar name={row.partner.name} size="md" />
          </span>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() =>
                navigate(`/sponsoring/partenaires/${row.partner.id}`)
              }
              className="group/name inline-flex items-center gap-1.5 text-left font-body text-[0.88rem] text-ink transition-colors hover:text-brand-blue-600"
            >
              {row.partner.name}
              <ArrowRight
                size={13}
                className="opacity-0 transition-opacity group-hover/name:opacity-100"
              />
            </button>
            {row.partner.description ? (
              <p className="mt-0.5 line-clamp-1 font-body text-[0.76rem] text-ink-muted">
                {row.partner.description}
              </p>
            ) : (
              <p className="mt-0.5 font-body text-[0.76rem] text-ink-disabled italic">
                Pas encore de description
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "etat",
      header: "État",
      width: "160px",
      cell: (row) =>
        row.partner.status === "actif" ? (
          <Badge variant="success" dot>
            Actif
          </Badge>
        ) : (
          <Badge dot>Archivé</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      width: "56px",
      cell: (row) => (
        <RowMenu
          archived={row.partner.status === "archive"}
          onEdit={() => setForm({ editing: row.partner })}
          onArchive={() => setConfirm(row.partner)}
          onRestore={() => {
            updatePartner(row.partner.id, { status: "actif" })
            notify(`Partenaire « ${row.partner.name} » réactivé`)
          }}
        />
      ),
    },
  ]

  return (
    <SponsoringShell
      active="partenaires"
      subtitle="Les entreprises qui soutiennent le club."
      actions={
        <button
          type="button"
          onClick={() => setForm({ editing: null })}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
        >
          <Plus size={16} /> Ajouter un partenaire
        </button>
      }
    >
      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] font-medium transition-colors",
                active
                  ? "border-info bg-info/10 text-info"
                  : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
              )}
            >
              {f.label}
              <span className="ml-1.5 tabular-nums opacity-60">
                {counts[f.key]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.partner.id}
          empty={{
            icon: Handshake,
            title:
              filter === "archive"
                ? "Aucun partenaire archivé"
                : "Aucun partenaire",
            description:
              filter === "archive"
                ? "Les partenariats terminés viendront se ranger ici."
                : filter === "actif" && counts.archive > 0
                  ? "Tous les partenaires du club sont archivés."
                  : "Ajoutez le premier partenaire du club.",
          }}
        />
      </div>

      {/* ── Overlays ──────────────────────────────────────────────────── */}
      {form ? (
        <PartnerFormModal
          editing={form.editing}
          onClose={() => setForm(null)}
          onSaved={notify}
        />
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Archiver ce partenaire ?"
        description={
          confirm
            ? `« ${confirm.name} » quittera la liste des partenaires actifs. Sa fiche et son historique restent consultables, et vous pourrez le réactiver à tout moment.`
            : undefined
        }
        confirmLabel="Archiver"
        destructive={false}
        onConfirm={() => {
          if (confirm) updatePartner(confirm.id, { status: "archive" })
          const name = confirm?.name
          setConfirm(null)
          notify(`Partenaire${name ? ` « ${name} »` : ""} archivé`)
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
    </SponsoringShell>
  )
}

/* ── Row overflow menu (Modifier / Retirer) ─────────────────────────────── */
function RowMenu({
  archived,
  onEdit,
  onArchive,
  onRestore,
}: {
  archived: boolean
  onEdit: () => void
  onArchive: () => void
  onRestore: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} className="relative inline-block shrink-0 text-left">
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-sm border text-ink-muted transition-colors",
          open
            ? "border-border-strong bg-surface-hover text-ink"
            : "border-transparent hover:border-border hover:bg-surface-hover hover:text-ink",
        )}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 w-[160px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-deep">
          <button
            type="button"
            onClick={() => run(onEdit)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.82rem] text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Pencil size={15} className="shrink-0" /> Modifier
          </button>
          {archived ? (
            <button
              type="button"
              onClick={() => run(onRestore)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.82rem] text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <RotateCcw size={15} className="shrink-0" /> Réactiver
            </button>
          ) : (
            <button
              type="button"
              onClick={() => run(onArchive)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.82rem] text-warning transition-colors hover:bg-surface-hover"
            >
              <Archive size={15} className="shrink-0" /> Archiver
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
