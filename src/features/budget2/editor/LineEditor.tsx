import { useEffect, useMemo, useState } from "react"

import { fmt } from "@/lib/format"
import { useData } from "@/data/useData"
import {
  computeEstimate,
  type BudgetLine,
  type Budget2Scope,
  type EstimationMethod,
  type LineNature,
  type StaffDepartment,
} from "@/data/seed/budget2"
import { SCOPE_LABEL } from "@/features/budget2/helpers"
import { FormSheet } from "@/components/kit/FormSheet"
import { Field, Select } from "@/features/finance/ui"
import { NumInput, Segmented } from "@/features/budget/ui"

/** Where a new/edited line belongs — fixed by the section it is added under. */
export type LineContext = {
  draftId: string
  nature: LineNature
  scope_type: Budget2Scope
  staff_department?: StaffDepartment
  team_id?: string
  group_ref?: string
}

const METHODS: { value: EstimationMethod; label: string }[] = [
  { value: "forfaitaire", label: "Forfaitaire" },
  { value: "recurrent", label: "Récurrent" },
  { value: "activite", label: "Activité" },
]

/**
 * Slide-in editor for a single budget line. The category (groupe + optional
 * sous-catégorie) plus one of three estimation methods (docs §4):
 * forfaitaire (a flat amount), récurrent (montant × périodes) or activité
 * (quantité × coût unitaire). The result AND the estimator inputs are stored.
 * The line's scope is fixed by its section, shown read-only for context.
 */
export function LineEditor({
  open,
  onOpenChange,
  context,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: LineContext | null
  existing: BudgetLine | null
  onSaved?: (msg: string) => void
}) {
  const { groups, subCategories, addBudget2Line, updateBudget2Line } = useData()

  const [groupId, setGroupId] = useState("")
  const [subId, setSubId] = useState("")
  const [method, setMethod] = useState<EstimationMethod>("forfaitaire")
  const [flat, setFlat] = useState(0)
  const [recAmount, setRecAmount] = useState(0)
  const [recPeriods, setRecPeriods] = useState(1)
  const [actQty, setActQty] = useState(0)
  const [actUnit, setActUnit] = useState(0)

  const nature = context?.nature ?? "Dépense"

  // Seed the form when the sheet opens (edit → prefill, add → reset).
  useEffect(() => {
    if (!open) return
    if (existing) {
      setGroupId(existing.group_id)
      setSubId(existing.subcategory_id ?? "")
      setMethod(existing.estimation_method)
      setFlat(existing.montant_estime)
      setRecAmount(existing.estimation_inputs?.amount ?? 0)
      setRecPeriods(existing.estimation_inputs?.periods ?? 1)
      setActQty(existing.estimation_inputs?.qty ?? 0)
      setActUnit(existing.estimation_inputs?.unit_cost ?? 0)
    } else {
      setGroupId("")
      setSubId("")
      setMethod("forfaitaire")
      setFlat(0)
      setRecAmount(0)
      setRecPeriods(1)
      setActQty(0)
      setActUnit(0)
    }
  }, [open, existing])

  const groupOpts = useMemo(
    () =>
      groups
        .filter((g) => g.nature === nature && g.is_active)
        .map((g) => ({ value: g.id, label: g.name })),
    [groups, nature],
  )
  const subOpts = useMemo(
    () =>
      subCategories
        .filter((s) => s.group_id === groupId && s.is_active)
        .map((s) => ({ value: s.id, label: s.name })),
    [subCategories, groupId],
  )

  const inputs =
    method === "recurrent"
      ? { amount: recAmount, periods: recPeriods }
      : method === "activite"
        ? { qty: actQty, unit_cost: actUnit }
        : undefined
  const total = computeEstimate(method, inputs, flat)

  const valid = groupId !== "" && total > 0

  const submit = () => {
    if (!context || !valid) return
    const payload = {
      draft_id: context.draftId,
      nature: context.nature,
      group_id: groupId,
      subcategory_id: subId || undefined,
      scope_type: context.scope_type,
      staff_department: context.staff_department,
      team_id: context.team_id,
      group_ref: context.group_ref,
      montant_estime: total,
      estimation_method: method,
      estimation_inputs: inputs,
    }
    if (existing) {
      updateBudget2Line(existing.id, payload)
      onSaved?.("Ligne mise à jour")
    } else {
      addBudget2Line(payload)
      onSaved?.("Ligne ajoutée")
    }
    onOpenChange(false)
  }

  const scopeText = context
    ? SCOPE_LABEL[context.scope_type] +
      (context.staff_department ? ` — ${context.staff_department}` : "")
    : ""

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? "Modifier la ligne" : "Ajouter une ligne"}
      description={`${nature} · Portée : ${scopeText}`}
      submitLabel={existing ? "Enregistrer" : "Ajouter"}
      submitDisabled={!valid}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-4">
        <Field label="Groupe" required>
          <Select
            value={groupId}
            onChange={(v) => {
              setGroupId(v)
              setSubId("")
            }}
            options={groupOpts}
            placeholder="Choisir un groupe…"
          />
        </Field>

        <Field label="Sous-catégorie" hint="Optionnel — la ligne peut rester au niveau du groupe.">
          <Select
            value={subId}
            onChange={setSubId}
            options={subOpts}
            placeholder={groupId ? "Aucune (niveau groupe)" : "Choisir un groupe d'abord"}
            disabled={!groupId}
          />
        </Field>

        <Field label="Méthode d'estimation">
          <Segmented
            value={method}
            onChange={(m) => setMethod(m)}
            options={METHODS}
            className="w-full"
          />
        </Field>

        {method === "forfaitaire" ? (
          <Field label="Montant estimé" required>
            <NumInput value={flat} suffix="TND" onChange={setFlat} />
          </Field>
        ) : method === "recurrent" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Montant / période" required>
              <NumInput value={recAmount} suffix="TND" onChange={setRecAmount} />
            </Field>
            <Field label="Nb de périodes" required>
              <NumInput value={recPeriods} suffix="×" onChange={setRecPeriods} small />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantité" required>
              <NumInput value={actQty} suffix="×" onChange={setActQty} small />
            </Field>
            <Field label="Coût unitaire" required>
              <NumInput value={actUnit} suffix="TND" onChange={setActUnit} />
            </Field>
          </div>
        )}

        {/* Computed total preview for the estimator methods */}
        {method !== "forfaitaire" ? (
          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
              Montant estimé
            </span>
            <span className="font-display text-lg font-semibold tabular-nums text-ink">
              {fmt(total)}
            </span>
          </div>
        ) : null}
      </div>
    </FormSheet>
  )
}
