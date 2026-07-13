import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Educateur } from "@/data/seed/educateurs"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import {
  EducateurFormSheet,
  type FormMode,
} from "@/features/educateurs/EducateurFormSheet"

const PAGE = 8

export function EducateursScreen() {
  const { educateurs, removeEducateur } = useData()

  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [sheet, setSheet] = useState<{ mode: FormMode; source: Educateur | null } | null>(null)
  const [confirm, setConfirm] = useState<Educateur | null>(null)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return educateurs
    return educateurs.filter((e) =>
      [e.full_name, e.email, e.category, ...e.groups]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [educateurs, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const current = Math.min(page, totalPages)
  const rows = filtered.slice((current - 1) * PAGE, current * PAGE)

  const rosterEmpty = educateurs.length === 0

  const openSheet = (mode: FormMode, source: Educateur | null = null) =>
    setSheet({ mode, source })

  return (
    <>
      <PageHeader
        title="Éducateurs"
        subtitle="Encadrants du club, leur catégorie et leurs groupes."
        actions={
          <button
            type="button"
            onClick={() => openSheet("create")}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
          >
            <Plus size={16} /> Ajouter un éducateur
          </button>
        }
      />

      {rosterEmpty ? (
        <div className="mt-8 rounded-lg border border-border">
          <EmptyState
            icon={UserCog}
            title="Aucun éducateur"
            description="Ajoutez le premier encadrant pour commencer à constituer le staff technique."
            action={
              <button
                type="button"
                onClick={() => openSheet("create")}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Plus size={16} /> Ajouter un éducateur
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-disabled"
              />
              <input
                value={query}
                onChange={(e) => {
                  setPage(1)
                  setQuery(e.target.value)
                }}
                placeholder="Rechercher…"
                className="w-full rounded-md border border-input bg-input-bg py-2 pr-3 pl-9 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
              />
            </div>
            <span className="ml-auto font-body text-[0.78rem] text-ink-disabled tabular-nums">
              {filtered.length} éducateur{filtered.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <Th className="w-16">Image</Th>
                    <Th>Éducateur</Th>
                    <Th>Catégorie</Th>
                    <Th>Groupes</Th>
                    <Th align="right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <p className="font-body text-sm text-ink-muted">
                          Aucun résultat pour «&nbsp;{query.trim()}&nbsp;»
                        </p>
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="mt-1.5 font-ui text-[0.74rem] font-medium text-info transition-opacity hover:opacity-80"
                        >
                          Effacer la recherche
                        </button>
                      </td>
                    </tr>
                  ) : (
                    rows.map((e) => (
                      <tr
                        key={e.id}
                        className="group border-b border-border transition-colors last:border-0 hover:bg-accent"
                      >
                        <td className="px-3.5 py-3">
                          <Avatar name={e.full_name} src={e.avatar} size="md" />
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="font-body text-[0.88rem] text-ink">
                            {e.full_name}
                          </div>
                          <div className="font-body text-[0.74rem] text-ink-disabled">
                            {e.email}
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <Badge variant="default">{e.category}</Badge>
                        </td>
                        <td className="px-3.5 py-3">
                          {e.groups.length === 0 ? (
                            <span className="font-body text-[0.78rem] text-ink-disabled italic">
                              Non affecté
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {e.groups.map((g) => (
                                <span
                                  key={g}
                                  className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.68rem] whitespace-nowrap text-brand-blue-600"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => openSheet("edit", e)}
                              aria-label={`Modifier ${e.full_name}`}
                              className="inline-flex size-8 items-center justify-center rounded-sm border border-transparent text-ink-muted transition-colors hover:border-border hover:bg-surface-hover hover:text-ink"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirm(e)}
                              aria-label={`Supprimer ${e.full_name}`}
                              className="inline-flex size-8 items-center justify-center rounded-sm border border-transparent text-ink-muted transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
              <span className="font-body text-[0.74rem] text-ink-disabled tabular-nums">
                Page {current} / {totalPages} · {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <PagerButton
                  disabled={current <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  label="Page précédente"
                >
                  <ChevronLeft size={16} />
                </PagerButton>
                <PagerButton
                  disabled={current >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  label="Page suivante"
                >
                  <ChevronRight size={16} />
                </PagerButton>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Overlays */}
      <EducateurFormSheet
        open={sheet !== null}
        mode={sheet?.mode ?? "create"}
        source={sheet?.source ?? null}
        onOpenChange={(o) => !o && setSheet(null)}
        onSaved={notify}
      />

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Supprimer cet éducateur ?"
        description={
          confirm
            ? `« ${confirm.full_name} » sera retiré de la liste des encadrants.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirm) removeEducateur(confirm.id)
          const name = confirm?.full_name
          setConfirm(null)
          notify(`Éducateur${name ? ` « ${name} »` : ""} supprimé`)
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
    </>
  )
}

function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode
  align?: "left" | "right" | "center"
  className?: string
}) {
  return (
    <th
      className={cn(
        "px-3.5 py-2.5 font-ui text-[0.7rem] font-medium tracking-[0.08em] whitespace-nowrap text-ink-disabled uppercase",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-sm border border-input text-ink-muted transition-colors hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-input disabled:hover:text-ink-muted"
    >
      {children}
    </button>
  )
}
