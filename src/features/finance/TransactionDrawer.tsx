import { useEffect, useMemo, useState } from "react"
import { Check, Paperclip, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt } from "@/lib/format"
import { useData } from "@/data/useData"
import type {
  Nature,
  NewTransaction,
  PaymentMethod,
  Scope,
  StaffCategory,
  Transaction,
} from "@/data/seed/finance"
import { NumInput } from "@/features/budget/ui"
import { FormSheet } from "@/components/kit/FormSheet"
import { Field, Select, inputCls, type Option } from "@/features/finance/ui"

export type DrawerMode = "create" | "edit" | "duplicate"

const NATURES: Nature[] = ["Dépense", "Revenu"]
const SCOPES: { value: Scope; label: string }[] = [
  { value: "general", label: "Général" },
  { value: "equipe", label: "Équipe" },
  { value: "staff", label: "Staff" },
]
const STAFF_CATS: StaffCategory[] = ["Administratif", "Technique"]
const PAYMENTS: PaymentMethod[] = ["Espèces", "Virement", "Chèque", "Carte"]

const todayIso = () => new Date().toISOString().slice(0, 10)

/**
 * Right-side drawer for creating / editing / duplicating a transaction.
 * Enforces the cascade: Groupe is filtered by Nature, Sous-catégorie by Groupe,
 * and changing a parent resets its children (docs §4.5). Portée has three modes
 * — général (nothing), équipe (multi-select, duplication) and staff (optional
 * catégorie / membre).
 */
export function TransactionDrawer({
  open,
  mode,
  source,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  mode: DrawerMode
  source?: Transaction | null
  onOpenChange: (open: boolean) => void
  onSaved: (message: string) => void
}) {
  const { groups, subCategories, financeTeams, staff, addTransaction, updateTransaction } =
    useData()

  const [nature, setNature] = useState<Nature>("Dépense")
  const [groupId, setGroupId] = useState("")
  const [subId, setSubId] = useState("")
  const [amount, setAmount] = useState(0)
  const [dateIso, setDateIso] = useState(todayIso())
  const [scope, setScope] = useState<Scope>("general")
  const [teamIds, setTeamIds] = useState<string[]>([])
  const [staffCat, setStaffCat] = useState<StaffCategory | "">("")
  const [staffMemberId, setStaffMemberId] = useState("")
  const [label, setLabel] = useState("")
  const [payment, setPayment] = useState<PaymentMethod | "">("")
  const [attachment, setAttachment] = useState("")

  // (Re)hydrate the form each time the drawer opens. Create → blank defaults;
  // edit / duplicate → prefill from the source row.
  useEffect(() => {
    if (!open) return
    if (source) {
      setNature(source.nature)
      setGroupId(source.group_id)
      setSubId(source.subcategory_id)
      setAmount(source.amount)
      setDateIso(source.date)
      setScope(source.scope)
      setTeamIds(source.team_ids)
      setStaffCat(source.staff_category ?? "")
      setStaffMemberId(source.staff_member_id ?? "")
      setLabel(source.label ?? "")
      setPayment(source.payment_method ?? "")
      setAttachment(source.attachment ?? "")
    } else {
      setNature("Dépense")
      setGroupId("")
      setSubId("")
      setAmount(0)
      setDateIso(todayIso())
      setScope("general")
      setTeamIds([])
      setStaffCat("")
      setStaffMemberId("")
      setLabel("")
      setPayment("")
      setAttachment("")
    }
  }, [open, source])

  const groupOptions: Option[] = useMemo(
    () =>
      groups
        .filter((g) => g.nature === nature && g.is_active)
        .map((g) => ({ value: g.id, label: g.name })),
    [groups, nature],
  )
  const subOptions: Option[] = useMemo(
    () =>
      subCategories
        .filter((s) => s.group_id === groupId && s.is_active)
        .map((s) => ({ value: s.id, label: s.name })),
    [subCategories, groupId],
  )
  const memberOptions: Option[] = useMemo(
    () =>
      staff
        .filter((m) => !staffCat || m.category === staffCat)
        .map((m) => ({ value: m.id, label: `${m.full_name} · ${m.role ?? m.category}` })),
    [staff, staffCat],
  )

  // Cascade resets ---------------------------------------------------------
  const onNature = (v: string) => {
    setNature(v as Nature)
    setGroupId("")
    setSubId("")
  }
  const onGroup = (v: string) => {
    setGroupId(v)
    setSubId("")
  }
  const onStaffCat = (v: string) => {
    setStaffCat(v as StaffCategory | "")
    setStaffMemberId("") // member list changes with the category
  }

  const toggleTeam = (id: string) =>
    setTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )

  const canSubmit =
    Boolean(nature) &&
    Boolean(groupId) &&
    Boolean(subId) &&
    amount > 0 &&
    Boolean(dateIso) &&
    (scope !== "equipe" || teamIds.length > 0)

  const submit = () => {
    if (!canSubmit) return
    const payload: NewTransaction = {
      nature,
      group_id: groupId,
      subcategory_id: subId,
      amount,
      date: dateIso,
      scope,
      team_ids: scope === "equipe" ? teamIds : [],
      staff_category: scope === "staff" ? staffCat || undefined : undefined,
      staff_member_id: scope === "staff" ? staffMemberId || undefined : undefined,
      label: label.trim() || undefined,
      payment_method: payment || undefined,
      attachment: attachment || undefined,
    }

    if (mode === "edit" && source) {
      updateTransaction(source.id, payload)
      onSaved(`Transaction modifiée — ${fmt(amount)}`)
    } else {
      addTransaction(payload)
      onSaved(
        `${mode === "duplicate" ? "Transaction dupliquée" : "Transaction ajoutée"} — ${fmt(amount)}`,
      )
    }
    onOpenChange(false)
  }

  const title =
    mode === "edit"
      ? "Modifier la transaction"
      : mode === "duplicate"
        ? "Dupliquer la transaction"
        : "Nouvelle transaction"

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Les montants sont positifs — le signe est dérivé de la nature."
      submitLabel={mode === "edit" ? "Enregistrer" : "Ajouter"}
      submitDisabled={!canSubmit}
      onSubmit={submit}
    >
      <div className="flex flex-col gap-4">
        <Field label="Nature" required>
          <div className="grid grid-cols-2 gap-2">
            {NATURES.map((n) => {
              const on = nature === n
              const revenu = n === "Revenu"
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onNature(n)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 font-ui text-sm font-medium transition-colors",
                    on
                      ? revenu
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-danger/40 bg-danger/10 text-danger"
                      : "border-input text-ink-muted hover:border-[var(--border-hover)] hover:text-ink",
                  )}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Groupe" required>
          <Select
            value={groupId}
            onChange={onGroup}
            options={groupOptions}
            placeholder="Choisir un groupe…"
          />
        </Field>

        <Field label="Sous-catégorie" required>
          <Select
            value={subId}
            onChange={setSubId}
            options={subOptions}
            placeholder={groupId ? "Choisir une sous-catégorie…" : "Choisir un groupe d'abord"}
            disabled={!groupId}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant" required>
            <NumInput value={amount} suffix="TND" onChange={setAmount} />
          </Field>
          <Field label="Date" required>
            <input
              type="date"
              className={cn(inputCls, "[color-scheme:dark]")}
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
            />
          </Field>
        </div>

        {/* Portée — one field, three modes */}
        <Field
          label="Portée"
          required
          hint={
            scope === "equipe" && teamIds.length > 1
              ? `Montant attribué en entier à chacune des ${teamIds.length} équipes (duplication).`
              : undefined
          }
        >
          <div className="grid grid-cols-3 gap-2">
            {SCOPES.map((sc) => {
              const on = scope === sc.value
              return (
                <button
                  key={sc.value}
                  type="button"
                  onClick={() => setScope(sc.value)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-md border px-3 py-2 font-ui text-[0.82rem] font-medium transition-colors",
                    on
                      ? "border-info/40 bg-info/10 text-info"
                      : "border-input text-ink-muted hover:border-[var(--border-hover)] hover:text-ink",
                  )}
                >
                  {sc.label}
                </button>
              )
            })}
          </div>
        </Field>

        {scope === "equipe" ? (
          <div className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Équipes concernées <span className="text-danger">*</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {financeTeams.map((t) => {
                const on = teamIds.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTeam(t.id)}
                    aria-pressed={on}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 font-ui text-[0.68rem] font-medium tracking-[0.04em] uppercase transition-colors",
                      on
                        ? "border-info/30 bg-info/10 text-info"
                        : "border-border text-ink-muted hover:border-[var(--border-hover)] hover:text-ink",
                    )}
                  >
                    {on ? <Check size={12} /> : null}
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {scope === "staff" ? (
          <div className="grid grid-cols-1 gap-3">
            <Field label="Catégorie staff" hint="Optionnel — laissez vide pour « Staff » générique.">
              <Select
                value={staffCat}
                onChange={onStaffCat}
                options={STAFF_CATS.map((c) => ({ value: c, label: c }))}
                placeholder="Toutes catégories"
              />
            </Field>
            <Field label="Membre" hint="Optionnel.">
              <Select
                value={staffMemberId}
                onChange={setStaffMemberId}
                options={memberOptions}
                placeholder="Aucun membre précis"
              />
            </Field>
          </div>
        ) : null}

        <Field label="Libellé">
          <input
            className={inputCls}
            value={label}
            placeholder="Ex. Bus déplacement — Sfax"
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>

        <Field label="Mode de paiement">
          <Select
            value={payment}
            onChange={(v) => setPayment(v as PaymentMethod | "")}
            options={PAYMENTS.map((p) => ({ value: p, label: p }))}
            placeholder="Non renseigné"
          />
        </Field>

        <Field label="Pièce jointe">
          {attachment ? (
            <div className="flex items-center gap-2 rounded-md border border-input bg-input-bg px-3 py-2">
              <Paperclip size={14} className="shrink-0 text-info" />
              <span className="min-w-0 flex-1 truncate font-body text-[0.8rem] text-ink-subtle">
                {attachment}
              </span>
              <button
                type="button"
                onClick={() => setAttachment("")}
                aria-label="Retirer la pièce jointe"
                className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <input
              type="file"
              onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? "")}
              className={cn(
                inputCls,
                "cursor-pointer py-2 file:mr-3 file:rounded-sm file:border-0 file:bg-accent file:px-2.5 file:py-1 file:font-ui file:text-[0.72rem] file:text-ink-subtle",
              )}
            />
          )}
        </Field>
      </div>
    </FormSheet>
  )
}
