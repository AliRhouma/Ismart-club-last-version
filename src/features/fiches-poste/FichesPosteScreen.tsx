import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, Plus, Search, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  FICHE_TYPE_FILTERS,
  type Fiche,
  type FicheType,
} from "@/data/seed/fichesPoste"
import { PageHeader } from "@/components/kit/PageHeader"
import { DataTable, type Column } from "@/components/kit/DataTable"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { NouvelleFicheModal } from "@/features/fiches-poste/NouvelleFicheModal"
import { StatutBadge, TypeBadge, TypeTile, typeIcon } from "@/features/fiches-poste/ui"

/** "Tous" plus one chip per document family. */
type Filtre = "Tous" | (typeof FICHE_TYPE_FILTERS)[number]
const FILTRES: Filtre[] = ["Tous", ...FICHE_TYPE_FILTERS]

/** Today as the module's display date, e.g. "13 août 2026". */
function today() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function FichesPosteScreen() {
  const navigate = useNavigate()
  const { fiches, addFiche, removeFiche } = useData()

  const [query, setQuery] = useState("")
  const [filtre, setFiltre] = useState<Filtre>("Tous")
  const [creating, setCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Fiche | null>(null)

  /** Counts feed the chips, so they stay honest as documents come and go. */
  const countFor = (f: Filtre) =>
    f === "Tous" ? fiches.length : fiches.filter((d) => d.type === f).length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return fiches.filter(
      (d) =>
        (filtre === "Tous" || d.type === filtre) &&
        (!q ||
          d.titre.toLowerCase().includes(q) ||
          d.perimetre.toLowerCase().includes(q)),
    )
  }, [fiches, filtre, query])

  const columns: Column<Fiche>[] = [
    {
      id: "titre",
      header: "Titre du document",
      cell: (d) => (
        <span className="flex min-w-0 items-center gap-3">
          <TypeTile type={d.type} />
          <span className="truncate font-ui font-medium text-ink">{d.titre}</span>
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      width: "150px",
      cell: (d) => <TypeBadge type={d.type} />,
    },
    {
      id: "perimetre",
      header: "Poste / Périmètre",
      width: "180px",
      cell: (d) => <span className="text-ink-muted">{d.perimetre}</span>,
    },
    {
      id: "maj",
      header: "Mis à jour",
      width: "130px",
      cell: (d) => (
        <span className="block">
          <span className="block text-ink-muted">{d.majLe}</span>
          <span className="mt-0.5 block font-body text-[0.72rem] text-ink-disabled">
            {d.auteur}
          </span>
        </span>
      ),
    },
    {
      id: "statut",
      header: "Statut",
      width: "120px",
      cell: (d) => <StatutBadge statut={d.statut} />,
    },
    {
      id: "actions",
      header: "",
      width: "56px",
      align: "right",
      cell: (d) => (
        <button
          type="button"
          aria-label={`Supprimer ${d.titre}`}
          title="Supprimer"
          onClick={(e) => {
            e.stopPropagation()
            setPendingDelete(d)
          }}
          className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-danger"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ]

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="font-ui text-[0.66rem] tracking-[0.1em] text-ink-disabled uppercase">
          Club Documents
        </span>
        <PageHeader
          title="Fiches & Documents"
          subtitle="Fiches de poste, chartes et règlements du club — et les membres que chacun engage."
          actions={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Nouveau document
            </Button>
          }
        />
      </div>

      {/* Toolbar: search + type chips. Chips carry their count so an empty
          family is visible before you click it. */}
      <div className="flex flex-col gap-4">
        <div className="flex w-full max-w-sm items-center gap-2.5 rounded-md border border-input px-3.5 py-2.5 transition-colors focus-within:border-border-focus">
          <Search size={14} className="shrink-0 text-ink-disabled" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un document…"
            className="w-full bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink-disabled"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTRES.map((f) => {
            const active = filtre === f
            const Icon = f === "Tous" ? null : typeIcon(f as FicheType)
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFiltre(f)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 font-ui text-[0.75rem] transition-colors",
                  active
                    ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                    : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                )}
              >
                {Icon ? <Icon size={12} /> : null}
                {f}
                <span
                  className={cn(
                    "ml-0.5 rounded-pill px-1.5 py-px font-body text-[0.65rem]",
                    active
                      ? "bg-brand-blue-600/20 text-brand-blue-600"
                      : "bg-surface-nested text-ink-disabled",
                  )}
                >
                  {countFor(f)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(d) => d.id}
        onRowClick={(d) => navigate(`/structuration/fiches-poste/${d.id}`)}
        empty={{
          icon: FileText,
          title:
            fiches.length === 0
              ? "Aucun document"
              : "Aucun document trouvé",
          description:
            fiches.length === 0
              ? "Créez la première fiche de poste ou charte du club."
              : "Aucun document ne correspond à cette recherche.",
          action:
            fiches.length === 0 ? (
              <Button onClick={() => setCreating(true)}>
                <Plus /> Nouveau document
              </Button>
            ) : undefined,
        }}
      />

      <NouvelleFicheModal
        open={creating}
        onOpenChange={setCreating}
        onCreate={(f) => {
          const id = addFiche({
            ...f,
            majLe: today(),
            auteur: "RH",
            statut: "Brouillon",
            version: "v1.0",
          })
          navigate(`/structuration/fiches-poste/${id}`)
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Supprimer ce document ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.titre} » sera définitivement supprimé.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (pendingDelete) removeFiche(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
