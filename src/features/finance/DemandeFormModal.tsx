import { useEffect, useMemo, useState } from "react"
import { Info, Paperclip, Send, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Nature } from "@/data/seed/finance"
import { Field, Select, inputCls, type Option } from "@/features/finance/ui"
import { NumInput } from "@/features/budget/ui"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const NATURES: Nature[] = ["Dépense", "Revenu"]
const todayIso = () => new Date().toISOString().slice(0, 10)

/**
 * The « Nouvelle demande » form, in a centered modal: a staff member classifies
 * the movement (nature → groupe → sous-catégorie), gives an amount, a date and
 * a motif, and submits it for the admin to decide. Saving pushes a real request
 * into the store, so it shows up straight away in the historique below.
 */
export function DemandeFormModal({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: (message: string) => void
}) {
  const { groups, subCategories, staff, addTransactionRequest } = useData()

  const [demandeur, setDemandeur] = useState("")
  const [nature, setNature] = useState<Nature>("Dépense")
  const [groupId, setGroupId] = useState("")
  const [subId, setSubId] = useState("")
  const [amount, setAmount] = useState(0)
  const [dateIso, setDateIso] = useState(todayIso())
  const [motif, setMotif] = useState("")
  const [attachment, setAttachment] = useState("")

  // Blank slate each time the modal opens — a demande is never a draft.
  useEffect(() => {
    if (!open) return
    setDemandeur("")
    setNature("Dépense")
    setGroupId("")
    setSubId("")
    setAmount(0)
    setDateIso(todayIso())
    setMotif("")
    setAttachment("")
  }, [open])

  // Cascade: groupe filtered by nature, sous-catégorie by groupe.
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
      staff.map((m) => ({
        value: m.id,
        label: `${m.full_name} · ${m.role ?? m.category}`,
      })),
    [staff],
  )

  const onNature = (v: string) => {
    setNature(v as Nature)
    setGroupId("")
    setSubId("")
  }
  const onGroup = (v: string) => {
    setGroupId(v)
    setSubId("")
  }

  const complete =
    Boolean(demandeur) && Boolean(subId) && amount > 0 && motif.trim().length > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!complete) return
    addTransactionRequest({
      requester_id: demandeur,
      nature,
      group_id: groupId,
      subcategory_id: subId,
      amount,
      date: dateIso,
      motif: motif.trim(),
      attachment: attachment || undefined,
    })
    onOpenChange(false)
    onSent("Demande envoyée — en attente de validation")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Nouvelle demande de transaction
            </DialogTitle>
            <p className="mt-0.5 font-body text-sm text-ink-muted">
              Elle sera transmise à l'administration pour validation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-[var(--border-hover)] hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <form
          id="demande-form"
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5"
        >
          <Field label="Demandeur" required>
            <Select
              value={demandeur}
              onChange={setDemandeur}
              options={memberOptions}
              placeholder="Choisir un membre du staff…"
            />
          </Field>

          <Field label="Nature">
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
                      "inline-flex items-center justify-center rounded-md border px-3 py-2.5 font-ui text-sm font-medium transition-colors",
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                placeholder={
                  groupId ? "Choisir une sous-catégorie…" : "Choisir un groupe d'abord"
                }
                disabled={!groupId}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Montant" required>
              <NumInput value={amount} suffix="TND" onChange={setAmount} />
            </Field>
            <Field label="Date souhaitée">
              <input
                type="date"
                className={cn(inputCls, "[color-scheme:dark]")}
                value={dateIso}
                onChange={(e) => setDateIso(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Motif" required>
            <textarea
              rows={3}
              className={cn(inputCls, "resize-none")}
              value={motif}
              placeholder="Expliquez la raison de la demande…"
              onChange={(e) => setMotif(e.target.value)}
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

          <p className="flex items-center gap-1.5 font-body text-[0.72rem] text-ink-disabled">
            <Info size={12} /> Vous serez notifié dès qu'une décision est prise.
          </p>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center rounded-md border border-input px-3.5 py-2 font-ui text-sm font-medium text-ink-subtle transition-colors hover:border-[var(--border-hover)] hover:text-ink"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="demande-form"
            disabled={!complete}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            <Send size={15} /> Envoyer la demande
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
