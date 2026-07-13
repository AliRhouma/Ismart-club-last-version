import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Target,
} from "lucide-react"

import { useData } from "@/data/useData"
import type { Objectif, ObjectifStatut } from "@/data/seed/objectifs"
import { CATEGORIES, PLAYER_POOL } from "@/data/seed/objectifs"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge } from "@/components/kit/Badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/kit/DataTable"
import { Select } from "@/features/finance/ui"
import { StatutBadge, AssigneeCell } from "@/features/objectifs/ui"
import { ObjectifFormModal } from "@/features/objectifs/ObjectifFormModal"

const STATUTS: ObjectifStatut[] = ["En attente", "Accepté", "Refusé"]
const PAGE_SIZES = ["10", "25", "50"]

/** Small labelled filter wrapper above a select. */
function Filter({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-[170px] flex-col gap-1.5">
      <span className="font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

export function ObjectifsScreen() {
  const { objectifs, openObjectifReview } = useData()

  const [statut, setStatut] = useState("")
  const [assigne, setAssigne] = useState("")
  const [categorie, setCategorie] = useState("")
  const [pageSize, setPageSize] = useState("10")
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  // Filtering. Any change resets to page 1.
  const filtered = useMemo(
    () =>
      objectifs.filter(
        (o) =>
          (!statut || o.statut === statut) &&
          (!categorie || o.categorie === categorie) &&
          (!assigne || o.assignes.includes(assigne)),
      ),
    [objectifs, statut, categorie, assigne],
  )
  useEffect(() => setPage(1), [statut, categorie, assigne, pageSize])

  const size = Number(pageSize)
  const pageCount = Math.max(1, Math.ceil(filtered.length / size))
  const current = Math.min(page, pageCount)
  const paged = filtered.slice((current - 1) * size, current * size)

  const columns: Column<Objectif>[] = [
    {
      id: "titre",
      header: "Objectif technique",
      cell: (o) => (
        <span className="font-ui font-medium text-ink">{o.titre}</span>
      ),
    },
    {
      id: "categorie",
      header: "Catégorie",
      cell: (o) => <Badge variant="info">{o.categorie}</Badge>,
    },
    {
      id: "assignes",
      header: "Affecter à",
      width: "260px",
      cell: (o) => <AssigneeCell assignes={o.assignes} />,
    },
    {
      id: "critere",
      header: "Critère d'évaluation",
      cell: (o) => o.critere,
    },
    {
      id: "valeur",
      header: "Valeur cible",
      cell: (o) => (
        <span className="font-medium text-ink tabular-nums">{o.valeurCible}</span>
      ),
    },
    {
      id: "statut",
      header: "Statut",
      cell: (o) => <StatutBadge statut={o.statut} />,
    },
    {
      id: "action",
      header: "Action",
      align: "right",
      cell: (o) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openObjectifReview(o.id)}
        >
          <Eye size={15} /> Consulter
        </Button>
      ),
    },
  ]

  const assigneeOptions = [
    { value: "", label: "Tous" },
    ...PLAYER_POOL.map((n) => ({ value: n, label: n })),
  ]

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Objectifs techniques"
        subtitle={`${filtered.length} objectif${filtered.length > 1 ? "s" : ""} · Structuration`}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} /> Ajouter un objectif
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <Filter label="Statut">
          <Select
            value={statut}
            onChange={setStatut}
            options={STATUTS.map((s) => ({ value: s, label: s }))}
            placeholder="Tous"
          />
        </Filter>
        <Filter label="Affecter à">
          <Select
            value={assigne}
            onChange={setAssigne}
            options={assigneeOptions.slice(1)}
            placeholder="Tous"
          />
        </Filter>
        <Filter label="Catégorie">
          <Select
            value={categorie}
            onChange={setCategorie}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Toutes les catégories"
          />
        </Filter>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paged}
        getRowId={(o) => o.id}
        onRowClick={(o) => openObjectifReview(o.id)}
        empty={{
          icon: Target,
          title: "Aucun objectif",
          description:
            "Aucun objectif ne correspond aux filtres. Ajustez-les ou créez-en un nouveau.",
        }}
      />

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-body text-[0.8rem] text-ink-muted">Afficher</span>
          <div className="w-[80px]">
            <Select
              value={pageSize}
              onChange={setPageSize}
              options={PAGE_SIZES.map((s) => ({ value: s, label: s }))}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-[0.8rem] text-ink-muted">
            Page {current} / {pageCount}
          </span>
          <div className="flex items-center rounded-md border border-border">
            <button
              type="button"
              aria-label="Page précédente"
              disabled={current <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex size-9 items-center justify-center rounded-l-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="w-px self-stretch bg-border" aria-hidden />
            <button
              type="button"
              aria-label="Page suivante"
              disabled={current >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="flex size-9 items-center justify-center rounded-r-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {adding ? (
        <ObjectifFormModal
          onClose={() => setAdding(false)}
          onCreated={(titre) =>
            notify(`Objectif « ${titre} » créé — notification envoyée`)
          }
        />
      ) : null}

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
