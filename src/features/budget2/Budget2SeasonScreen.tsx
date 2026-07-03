import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Check, FileStack, Plus, Scale } from "lucide-react"

import { useData } from "@/data/useData"
import { draftTotals, type Budget2Draft } from "@/data/seed/budget2"
import { BUDGET2_TABS, type Budget2Tab } from "@/features/budget2/helpers"
import { Budget2Tabs, Crumbs } from "@/features/budget2/ui"
import { Budget2Dashboard } from "@/features/budget2/Budget2Dashboard"
import { Budget2Analyse } from "@/features/budget2/Budget2Analyse"
import { DraftCard } from "@/features/budget2/DraftCard"
import { NameDraftDialog } from "@/features/budget2/NameDraftDialog"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"

type Confirm =
  | { kind: "validate"; draft: Budget2Draft }
  | { kind: "delete"; draft: Budget2Draft }
  | null

/**
 * Level 2 — a season's budget page: the season header, a breadcrumb, and the
 * three tabs (Dashboard / Brouillon / Analyse). Dashboard and Analyse are empty
 * for now; Brouillon is the live one — a grid of draft cards with full lifecycle
 * (create / rename / duplicate / validate / archive / delete).
 */
export function Budget2SeasonScreen() {
  const navigate = useNavigate()
  const { seasonId = "", tab } = useParams()
  const {
    budget2,
    addBudget2Draft,
    updateBudget2Draft,
    duplicateBudget2Draft,
    validateBudget2Draft,
    removeBudget2Draft,
  } = useData()

  const season = budget2.seasons.find((s) => s.id === seasonId)
  const activeTab: Budget2Tab = BUDGET2_TABS.some((t) => t.value === tab)
    ? (tab as Budget2Tab)
    : "brouillon"

  const drafts = useMemo(
    () =>
      budget2.drafts
        .filter((d) => d.season_id === seasonId)
        // reference first, then most recently modified
        .sort((a, b) => {
          if (a.status === "valide" && b.status !== "valide") return -1
          if (b.status === "valide" && a.status !== "valide") return 1
          return b.updated_at.localeCompare(a.updated_at)
        }),
    [budget2.drafts, seasonId],
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Budget2Draft | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!season) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackButton to="/budget2" label="Retour aux saisons" />
        <EmptyState
          icon={FileStack}
          title="Saison introuvable"
          description="Cette saison n'existe pas ou a été supprimée."
        />
      </div>
    )
  }

  const openEditor = (draftId: string) =>
    navigate(`/budget2/${seasonId}/brouillon/${draftId}`)

  const handleCreate = (name: string) => {
    const id = addBudget2Draft(seasonId, name)
    openEditor(id)
  }
  const handleDuplicate = (draft: Budget2Draft) => {
    const id = duplicateBudget2Draft(draft.id)
    notify(`« ${draft.label} » dupliqué`)
    openEditor(id)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton to="/budget2" label="Retour aux saisons" />

      <Crumbs
        items={[
          { label: "Budget", to: "/budget2" },
          { label: season.label },
        ]}
      />

      <div className="mt-3 flex flex-col gap-5">
        <h1 className="font-ui text-2xl font-semibold tracking-normal text-ink">
          {season.label}
        </h1>
        <Budget2Tabs
          seasonId={seasonId}
          active={activeTab}
          draftCount={drafts.length}
        />
      </div>

      {/* ── Tab: Dashboard — suivi budgétaire (réel vs plan validé) ──────── */}
      {activeTab === "dashboard" ? <Budget2Dashboard season={season} /> : null}

      {/* ── Tab: Analyse — écart réel vs référence (visuel, filtré) ───────── */}
      {activeTab === "analyse" ? <Budget2Analyse season={season} /> : null}

      {/* ── Tab: Brouillon — the live preparation grid ───────────────────── */}
      {activeTab === "brouillon" ? (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-body text-sm text-ink-muted">
              Plusieurs brouillons possibles — un seul validé sert de référence.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {drafts.length ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/budget2/comparaison?a=${drafts[0].id}`)
                  }
                  className="inline-flex items-center gap-2 rounded-md border border-input px-3.5 py-2 font-ui text-sm font-medium text-ink-subtle transition-colors hover:border-border-strong hover:text-ink"
                >
                  <Scale size={16} /> Comparer
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Plus size={16} /> Créer un nouveau brouillon
              </button>
            </div>
          </div>

          {drafts.length === 0 ? (
            <div className="rounded-lg border border-border">
              <EmptyState
                icon={FileStack}
                title="Aucun brouillon"
                description="Créez le premier brouillon de budget pour cette saison — vierge, ou en important une saison antérieure."
                action={
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
                  >
                    <Plus size={16} /> Créer un brouillon
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  totals={draftTotals(budget2.lines, draft.id)}
                  actions={{
                    onOpen: () => openEditor(draft.id),
                    onRename: () => setRenameTarget(draft),
                    onDuplicate: () => handleDuplicate(draft),
                    onValidate: () => setConfirm({ kind: "validate", draft }),
                    onArchive: () => {
                      updateBudget2Draft(draft.id, { status: "archive" })
                      notify(`« ${draft.label} » archivé`)
                    },
                    onDelete: () => setConfirm({ kind: "delete", draft }),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Create draft */}
      <NameDraftDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nouveau brouillon"
        description="Donnez un nom à ce brouillon de budget (« Prudent », « Optimiste »…)."
        submitLabel="Créer et ouvrir"
        onSubmit={handleCreate}
      />

      {/* Rename draft */}
      <NameDraftDialog
        open={renameTarget !== null}
        onOpenChange={(o) => !o && setRenameTarget(null)}
        title="Renommer le brouillon"
        initial={renameTarget?.label ?? ""}
        submitLabel="Enregistrer"
        onSubmit={(name) => {
          if (renameTarget) {
            updateBudget2Draft(renameTarget.id, { label: name })
            notify("Brouillon renommé")
          }
          setRenameTarget(null)
        }}
      />

      {/* Validate / delete confirmation */}
      <ConfirmDialog
        open={confirm?.kind === "validate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        destructive={false}
        title="Valider ce brouillon ?"
        description="Il devient la référence de la saison. Tout budget déjà validé pour cette saison sera archivé."
        confirmLabel="Valider"
        onConfirm={() => {
          if (confirm?.kind === "validate") {
            validateBudget2Draft(confirm.draft.id)
            notify(`« ${confirm.draft.label} » est la nouvelle référence`)
          }
          setConfirm(null)
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Supprimer ce brouillon ?"
        description={
          confirm?.kind === "delete"
            ? `« ${confirm.draft.label} » et toutes ses lignes seront définitivement supprimés.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirm?.kind === "delete") {
            removeBudget2Draft(confirm.draft.id)
            notify("Brouillon supprimé")
          }
          setConfirm(null)
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
