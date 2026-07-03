import { useMemo, useState } from "react"
import { Check, Info, Paperclip, Send, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt } from "@/lib/format"
import { useData } from "@/data/useData"
import type { Nature } from "@/data/seed/finance"
import { PageHeader } from "@/components/kit/PageHeader"
import { Field, Select, inputCls, type Option } from "@/features/finance/ui"
import { NumInput } from "@/features/budget/ui"

const NATURES: Nature[] = ["Dépense", "Revenu"]
const todayIso = () => new Date().toISOString().slice(0, 10)

/**
 * Standalone page — the form a coach / staff member fills to REQUEST a
 * transaction (dépense or revenu) for the admin to validate. UI-only prototype:
 * submitting just shows a confirmation, nothing is persisted.
 */
export function DemandeTransactionScreen() {
  const { groups, subCategories, staff } = useData()

  const [demandeur, setDemandeur] = useState("")
  const [nature, setNature] = useState<Nature>("Dépense")
  const [groupId, setGroupId] = useState("")
  const [subId, setSubId] = useState("")
  const [amount, setAmount] = useState(0)
  const [dateIso, setDateIso] = useState(todayIso())
  const [motif, setMotif] = useState("")
  const [attachment, setAttachment] = useState("")
  const [sent, setSent] = useState(false)

  // Cascade: groupe filtered by nature, sous-catégorie by groupe (display only).
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

  const reset = () => {
    setDemandeur("")
    setNature("Dépense")
    setGroupId("")
    setSubId("")
    setAmount(0)
    setDateIso(todayIso())
    setMotif("")
    setAttachment("")
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true) // UI-only confirmation — no persistence
  }

  return (
    <>
      <PageHeader
        title="Demander une transaction"
        subtitle="Soumettez une demande de dépense ou de revenu pour validation par l'administration."
      />

      <div className="mt-6 max-w-2xl">
        {sent ? (
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check size={16} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-ui text-[0.92rem] font-medium text-ink">
                Demande envoyée
              </p>
              <p className="font-body text-sm text-ink-muted">
                Votre demande{amount > 0 ? ` de ${fmt(amount)}` : ""} a été
                transmise à l'administration. Vous serez notifié après validation.
              </p>
              <button
                type="button"
                onClick={() => {
                  reset()
                  setSent(false)
                }}
                className="mt-1.5 self-start font-ui text-[0.78rem] font-medium text-info transition-opacity hover:opacity-80"
              >
                Faire une nouvelle demande
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="flex flex-col gap-4 rounded-lg border border-border p-5 md:p-6"
          >
            <Field label="Demandeur">
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

            <Field label="Groupe">
              <Select
                value={groupId}
                onChange={onGroup}
                options={groupOptions}
                placeholder="Choisir un groupe…"
              />
            </Field>

            <Field label="Sous-catégorie">
              <Select
                value={subId}
                onChange={setSubId}
                options={subOptions}
                placeholder={groupId ? "Choisir une sous-catégorie…" : "Choisir un groupe d'abord"}
                disabled={!groupId}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Montant">
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

            <Field label="Motif">
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
              <Info size={12} /> La demande sera transmise à l'administration pour validation.
            </p>

            <div className="mt-1 flex justify-end border-t border-border pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Send size={15} /> Envoyer la demande
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
