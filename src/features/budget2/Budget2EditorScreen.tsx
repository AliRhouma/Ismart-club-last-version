import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  Check,
  FileStack,
  Landmark,
  Plus,
  Trash2,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt } from "@/lib/format"
import { useData } from "@/data/useData"
import {
  detectConflicts,
  draftGroups,
  draftLines,
  draftTotals,
  sumLines,
  type BudgetLine,
  type StaffDepartment,
} from "@/data/seed/budget2"
import {
  byId,
  expenseBreakdown,
  groupMemberNames,
  individualTeamIds,
} from "@/features/budget2/helpers"
import { Crumbs, StatusBadge } from "@/features/budget2/ui"
import {
  AddLineRow,
  EditorSection,
  EmptyLines,
  LineRow,
} from "@/features/budget2/editor/parts"
import { LineEditor, type LineContext } from "@/features/budget2/editor/LineEditor"
import { AddBlockDialog } from "@/features/budget2/editor/AddBlockDialog"
import { ImportDialog } from "@/features/budget2/editor/ImportDialog"
import { EditorSummary } from "@/features/budget2/editor/EditorSummary"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"

const DEPARTMENTS: StaffDepartment[] = ["Technique", "Administratif"]

type LineEditorState = {
  open: boolean
  context: LineContext | null
  existing: BudgetLine | null
}
type PendingBlock =
  | { kind: "team"; teamId: string; label: string; lineIds: string[] }
  | { kind: "group"; groupId: string; label: string }
  | null

/**
 * Level 3 — the work-plan editor of a single draft (docs §3–§5). A sectioned
 * form: Dépenses générales → Staff (par département) → Équipes (équipes /
 * groupes mis en commun) → Revenus. The solde courant stays visible in a sticky
 * bar; the equilibrium is never forced. Editing depends on status: brouillon &
 * validé are editable (validé = reprévision), archivé is read-only.
 */
export function Budget2EditorScreen() {
  const navigate = useNavigate()
  const { seasonId = "", draftId = "" } = useParams()
  const {
    budget2,
    financeTeams,
    groups: refGroups,
    subCategories,
    removeBudget2Line,
    removeBudget2Group,
    validateBudget2Draft,
    duplicateBudget2Draft,
  } = useData()

  const season = budget2.seasons.find((s) => s.id === seasonId)
  const draft = budget2.drafts.find((d) => d.id === draftId)

  const groupMap = useMemo(() => byId(refGroups), [refGroups])
  const subMap = useMemo(() => byId(subCategories), [subCategories])
  const teamMap = useMemo(() => byId(financeTeams), [financeTeams])

  const lines = useMemo(
    () => draftLines(budget2.lines, draftId),
    [budget2.lines, draftId],
  )
  const teamGroups = useMemo(
    () => draftGroups(budget2.groups, draftId),
    [budget2.groups, draftId],
  )
  const totals = draftTotals(budget2.lines, draftId)
  const conflicts = useMemo(
    () => detectConflicts(budget2.lines, budget2.groups, draftId),
    [budget2.lines, budget2.groups, draftId],
  )

  // Empty individual-team blocks (added but no lines yet) live in local state.
  const [openTeams, setOpenTeams] = useState<string[]>([])
  useEffect(() => setOpenTeams([]), [draftId])

  const [lineEditor, setLineEditor] = useState<LineEditorState>({
    open: false,
    context: null,
    existing: null,
  })
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [pendingValidate, setPendingValidate] = useState(false)
  const [pendingBlock, setPendingBlock] = useState<PendingBlock>(null)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!season || !draft) {
    return (
      <div className="mx-auto max-w-5xl">
        <BackButton to={`/budget2`} label="Retour au budget" />
        <EmptyState
          icon={FileStack}
          title="Brouillon introuvable"
          description="Ce brouillon n'existe pas ou a été supprimé."
        />
      </div>
    )
  }

  const readOnly = draft.status === "archive"
  const editable = !readOnly
  const brouillonBase = `/budget2/${seasonId}/brouillon`

  /* ── Line partitions per section ──────────────────────────────────────── */
  const generalDep = lines.filter(
    (l) => l.nature === "Dépense" && l.scope_type === "general",
  )
  const staffLines = lines.filter((l) => l.scope_type === "staff")
  const equipeLines = lines.filter((l) => l.scope_type === "equipe")
  const groupeLines = lines.filter((l) => l.scope_type === "groupe")
  const revenus = lines.filter((l) => l.nature === "Revenu")

  const teamBlockIds = useMemo(() => {
    const ids = new Set<string>([...individualTeamIds(equipeLines), ...openTeams])
    return [...ids]
  }, [equipeLines, openTeams])

  const staffTotal = sumLines(staffLines)
  const equipesTotal = sumLines(equipeLines) + sumLines(groupeLines)

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const openAdd = (context: LineContext) =>
    setLineEditor({ open: true, context, existing: null })
  const openEdit = (line: BudgetLine) =>
    setLineEditor({
      open: true,
      existing: line,
      context: {
        draftId,
        nature: line.nature,
        scope_type: line.scope_type,
        staff_department: line.staff_department,
        team_id: line.team_id,
        group_ref: line.group_ref,
      },
    })

  const removeLine = (line: BudgetLine) => {
    removeBudget2Line(line.id)
    notify("Ligne supprimée")
  }

  const duplicateForEdit = () => {
    const id = duplicateBudget2Draft(draft.id)
    navigate(`${brouillonBase}/${id}`)
  }

  // Dépenses breakdown by category (Groupe) and pooled team-group, not by section.
  const breakdown = useMemo(
    () => expenseBreakdown(lines, teamGroups, groupMap),
    [lines, teamGroups, groupMap],
  )

  const conflictText = conflicts.map((c) => {
    const team = teamMap.get(c.teamId)?.name ?? c.teamId
    const cat = groupMap.get(c.groupId)?.name ?? c.groupId
    return `${team} — ${cat} (groupe « ${c.groupLabel} »)`
  })

  return (
    <div className="pb-16">
      <BackButton to={brouillonBase} label="Retour aux brouillons" />

      <Crumbs
        items={[
          { label: "Budget", to: "/budget2" },
          { label: season.label, to: brouillonBase },
          { label: "Brouillon", to: brouillonBase },
          { label: `« ${draft.label} »` },
        ]}
      />

      {/* Title */}
      <div className="mt-3 min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-ui text-2xl font-semibold tracking-normal text-ink">
            {draft.label}
          </h1>
          <StatusBadge status={draft.status} />
        </div>
        <p className="mt-1.5 max-w-prose font-body text-[0.82rem] text-ink-muted">
          {readOnly
            ? "Lecture seule — ce brouillon est archivé."
            : draft.status === "valide"
              ? "Référence active de la saison. Toute modification est une reprévision volontaire."
              : "Remplissez les sections dans l'ordre. L'enregistrement est automatique."}
        </p>
      </div>

      {/* Non-overlap warning (docs §5) */}
      {conflicts.length ? (
        <div className="mt-5 flex gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
          <div className="min-w-0">
            <p className="font-ui text-[0.82rem] font-medium text-warning">
              Chevauchement de budget
            </p>
            <p className="mt-0.5 font-body text-[0.78rem] text-ink-muted">
              Ces catégories sont budgétées à la fois individuellement et via un
              groupe — planifiées deux fois :
            </p>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {conflictText.map((t, i) => (
                <li key={i} className="font-body text-[0.78rem] text-ink-subtle">
                  · {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Two-column: sectioned work plan + sticky summary aside
          (mirrors the budget/nouvelle layout of the Budget 1 module) */}
      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── Sections ── */}
        <div className="flex min-w-0 flex-col gap-4">
        {/* 1 — Dépenses générales */}
        <EditorSection
          title="Dépenses générales"
          scope="Portée : Général"
          icon={<Landmark size={16} />}
          subtotal={sumLines(generalDep)}
          defaultOpen={false}
        >
          {generalDep.map((line) => (
            <LineRow
              key={line.id}
              line={line}
              groups={groupMap}
              subs={subMap}
              readOnly={readOnly}
              onEdit={() => openEdit(line)}
              onRemove={() => removeLine(line)}
            />
          ))}
          {generalDep.length === 0 ? (
            <EmptyLines label="Aucun coût fixe pour l'instant." />
          ) : null}
          {editable ? (
            <AddLineRow
              onClick={() =>
                openAdd({ draftId, nature: "Dépense", scope_type: "general" })
              }
            />
          ) : null}
        </EditorSection>

        {/* 2 — Staff (par département) */}
        <EditorSection
          title="Staff"
          scope="Portée : Staff — par département"
          icon={<Users size={16} />}
          subtotal={staffTotal}
          defaultOpen={false}
        >
          {DEPARTMENTS.map((dept) => {
            const deptLines = staffLines.filter((l) => l.staff_department === dept)
            return (
              <div key={dept} className="border-b border-border last:border-0">
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="font-ui text-[0.64rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                    {dept}
                  </span>
                  <span className="font-body text-[0.76rem] tabular-nums text-ink-subtle">
                    {fmt(sumLines(deptLines))}
                  </span>
                </div>
                {deptLines.map((line) => (
                  <LineRow
                    key={line.id}
                    line={line}
                    groups={groupMap}
                    subs={subMap}
                    readOnly={readOnly}
                    onEdit={() => openEdit(line)}
                    onRemove={() => removeLine(line)}
                  />
                ))}
                {deptLines.length === 0 ? (
                  <EmptyLines label={`Aucune ligne — ${dept.toLowerCase()}.`} />
                ) : null}
                {editable ? (
                  <AddLineRow
                    onClick={() =>
                      openAdd({
                        draftId,
                        nature: "Dépense",
                        scope_type: "staff",
                        staff_department: dept,
                      })
                    }
                  />
                ) : null}
              </div>
            )
          })}
        </EditorSection>

        {/* 3 — Équipes (équipe par équipe / groupes) */}
        <EditorSection
          title="Équipes"
          scope="Portée : Équipe ou Groupe (mise en commun)"
          icon={<UsersRound size={16} />}
          subtotal={equipesTotal}
          defaultOpen={false}
        >
          {editable ? (
            <div className="border-b border-border px-4 py-2.5">
              <button
                type="button"
                onClick={() => setAddBlockOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 font-ui text-[0.74rem] font-medium text-ink-subtle transition-colors hover:border-border-strong hover:text-ink"
              >
                <Plus size={14} /> Ajouter un bloc (équipe ou groupe)
              </button>
            </div>
          ) : null}

          {teamGroups.length === 0 && teamBlockIds.length === 0 ? (
            <EmptyLines label="Aucun bloc d'équipe. Ajoutez une équipe ou un groupe pour commencer." />
          ) : null}

          {/* Pooled group blocks */}
          {teamGroups.map((grp) => {
            const grpLines = groupeLines.filter((l) => l.group_ref === grp.id)
            return (
              <BlockPanel
                key={grp.id}
                pooled
                name={grp.label}
                meta={groupMemberNames(grp.team_ids, teamMap)}
                subtotal={sumLines(grpLines)}
                readOnly={readOnly}
                onRemove={() =>
                  setPendingBlock({ kind: "group", groupId: grp.id, label: grp.label })
                }
                onAddLine={() =>
                  openAdd({
                    draftId,
                    nature: "Dépense",
                    scope_type: "groupe",
                    group_ref: grp.id,
                  })
                }
              >
                {grpLines.map((line) => (
                  <LineRow
                    key={line.id}
                    line={line}
                    groups={groupMap}
                    subs={subMap}
                    readOnly={readOnly}
                    onEdit={() => openEdit(line)}
                    onRemove={() => removeLine(line)}
                  />
                ))}
                {grpLines.length === 0 ? (
                  <EmptyLines label="Aucune ligne pour ce groupe." />
                ) : null}
              </BlockPanel>
            )
          })}

          {/* Individual team blocks */}
          {teamBlockIds.map((teamId) => {
            const tLines = equipeLines.filter((l) => l.team_id === teamId)
            return (
              <BlockPanel
                key={teamId}
                name={teamMap.get(teamId)?.name ?? teamId}
                subtotal={sumLines(tLines)}
                readOnly={readOnly}
                onRemove={() =>
                  setPendingBlock({
                    kind: "team",
                    teamId,
                    label: teamMap.get(teamId)?.name ?? teamId,
                    lineIds: tLines.map((l) => l.id),
                  })
                }
                onAddLine={() =>
                  openAdd({
                    draftId,
                    nature: "Dépense",
                    scope_type: "equipe",
                    team_id: teamId,
                  })
                }
              >
                {tLines.map((line) => (
                  <LineRow
                    key={line.id}
                    line={line}
                    groups={groupMap}
                    subs={subMap}
                    readOnly={readOnly}
                    onEdit={() => openEdit(line)}
                    onRemove={() => removeLine(line)}
                  />
                ))}
                {tLines.length === 0 ? (
                  <EmptyLines label="Aucune ligne pour cette équipe." />
                ) : null}
              </BlockPanel>
            )
          })}
        </EditorSection>

        {/* 4 — Revenus */}
        <EditorSection
          title="Revenus"
          scope="Portée : Général"
          icon={<Wallet size={16} />}
          subtotal={sumLines(revenus)}
          defaultOpen={false}
        >
          {revenus.map((line) => (
            <LineRow
              key={line.id}
              line={line}
              groups={groupMap}
              subs={subMap}
              readOnly={readOnly}
              onEdit={() => openEdit(line)}
              onRemove={() => removeLine(line)}
            />
          ))}
          {revenus.length === 0 ? (
            <EmptyLines label="Aucune recette prévue pour l'instant." />
          ) : null}
          {editable ? (
            <AddLineRow
              onClick={() =>
                openAdd({ draftId, nature: "Revenu", scope_type: "general" })
              }
            />
          ) : null}
        </EditorSection>
        </div>

        {/* ── Summary aside (sticky, mirrors budget/nouvelle) ── */}
        <EditorSummary
          totals={totals}
          breakdown={breakdown}
          status={draft.status}
          readOnly={readOnly}
          onImport={() => setImportOpen(true)}
          onValidate={() => setPendingValidate(true)}
          onDuplicate={duplicateForEdit}
        />
      </div>

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      <LineEditor
        open={lineEditor.open}
        onOpenChange={(o) => setLineEditor((s) => ({ ...s, open: o }))}
        context={lineEditor.context}
        existing={lineEditor.existing}
        onSaved={notify}
      />

      <AddBlockDialog
        open={addBlockOpen}
        onOpenChange={setAddBlockOpen}
        draftId={draftId}
        teams={financeTeams}
        usedTeamIds={teamBlockIds}
        onAddTeam={(teamId) => {
          setOpenTeams((prev) => (prev.includes(teamId) ? prev : [...prev, teamId]))
          notify("Bloc équipe ajouté")
        }}
        onAddedGroup={() => notify("Groupe d'équipes ajouté")}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        targetDraftId={draftId}
        currentSeasonId={seasonId}
        targetHasLines={lines.length > 0}
        onImported={notify}
      />

      <ConfirmDialog
        open={pendingValidate}
        onOpenChange={setPendingValidate}
        destructive={false}
        title="Valider ce brouillon ?"
        description="Il devient la référence de la saison. Un budget déjà validé sera archivé."
        confirmLabel="Valider"
        onConfirm={() => {
          validateBudget2Draft(draft.id)
          setPendingValidate(false)
          notify("Brouillon validé — référence de la saison")
        }}
      />

      <ConfirmDialog
        open={pendingBlock !== null}
        onOpenChange={(o) => !o && setPendingBlock(null)}
        title={
          pendingBlock?.kind === "group"
            ? "Supprimer ce groupe ?"
            : "Supprimer ce bloc d'équipe ?"
        }
        description={
          pendingBlock
            ? `« ${pendingBlock.label} » et ses lignes budgétaires seront supprimés.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (pendingBlock?.kind === "group") {
            removeBudget2Group(pendingBlock.groupId)
          } else if (pendingBlock?.kind === "team") {
            pendingBlock.lineIds.forEach((id) => removeBudget2Line(id))
            setOpenTeams((prev) => prev.filter((t) => t !== pendingBlock.teamId))
          }
          setPendingBlock(null)
          notify("Bloc supprimé")
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

/* ── Team / group block panel (inside the Équipes section) ──────────────── */
function BlockPanel({
  name,
  meta,
  subtotal,
  pooled,
  readOnly,
  onRemove,
  onAddLine,
  children,
}: {
  name: string
  meta?: string
  subtotal: number
  pooled?: boolean
  readOnly?: boolean
  onRemove: () => void
  onAddLine: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "m-3 overflow-hidden rounded-md border",
        pooled ? "border-brand-blue-600/25" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-ui text-[0.88rem] font-medium text-ink">{name}</span>
            {pooled ? (
              <Badge variant="info">Groupe · mise en commun</Badge>
            ) : (
              <Badge variant="default">Équipe</Badge>
            )}
          </div>
          {meta ? (
            <div className="mt-0.5 font-body text-[0.7rem] text-ink-disabled">
              {meta} · compté une fois
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <div className="font-ui text-[0.9rem] font-medium tabular-nums text-ink">
              {fmt(subtotal)}
            </div>
          </div>
          {readOnly ? null : (
            <button
              type="button"
              aria-label="Supprimer le bloc"
              onClick={onRemove}
              className="inline-flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-border">
        {children}
        {readOnly ? null : <AddLineRow onClick={onAddLine} />}
      </div>
    </div>
  )
}
