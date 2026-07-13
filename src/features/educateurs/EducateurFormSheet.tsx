import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  CATEGORIES,
  GROUPS,
  type Category,
  type Educateur,
} from "@/data/seed/educateurs"
import { FormSheet } from "@/components/kit/FormSheet"
import { Field, Select, inputCls } from "@/features/finance/ui"

export type FormMode = "create" | "edit"

/**
 * Create / edit an éducateur in a slide-in sheet. Nom + email are required;
 * groups are picked with toggleable chips (an éducateur may have none). On save
 * it writes through the store so the row appears / updates in the table.
 */
export function EducateurFormSheet({
  open,
  mode,
  source,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  mode: FormMode
  source: Educateur | null
  onOpenChange: (open: boolean) => void
  onSaved: (msg: string) => void
}) {
  const { addEducateur, updateEducateur } = useData()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [category, setCategory] = useState<Category>("Minime")
  const [groups, setGroups] = useState<string[]>([])

  // Re-seed the form whenever it opens (or the edited row changes).
  useEffect(() => {
    if (!open) return
    setName(source?.full_name ?? "")
    setEmail(source?.email ?? "")
    setPhone(source?.phone ?? "")
    setCategory(source?.category ?? "Minime")
    setGroups(source?.groups ?? [])
  }, [open, source])

  const toggleGroup = (g: string) =>
    setGroups((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    )

  const valid = name.trim().length > 0 && email.trim().length > 0

  const handleSubmit = () => {
    const payload = {
      full_name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      category,
      groups,
    }
    if (mode === "edit" && source) {
      updateEducateur(source.id, payload)
      onSaved(`Éducateur « ${payload.full_name} » modifié`)
    } else {
      addEducateur(payload)
      onSaved(`Éducateur « ${payload.full_name} » ajouté`)
    }
    onOpenChange(false)
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "edit" ? "Modifier l'éducateur" : "Nouvel éducateur"}
      description={
        mode === "edit"
          ? "Mettez à jour les informations et l'affectation."
          : "Renseignez l'éducateur et affectez-le à un ou plusieurs groupes."
      }
      submitLabel={mode === "edit" ? "Enregistrer" : "Ajouter"}
      submitDisabled={!valid}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-4">
        <Field label="Nom complet" required>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prénom Nom"
            className={inputCls}
          />
        </Field>

        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@ismartclub.tn"
            className={inputCls}
          />
        </Field>

        <Field label="Téléphone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+216 …"
            className={cn(inputCls, "font-mono")}
          />
        </Field>

        <Field label="Catégorie" required>
          <Select
            value={category}
            onChange={(v) => setCategory(v as Category)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </Field>

        <Field
          label="Groupes"
          hint="Sélectionnez les groupes encadrés par cet éducateur."
        >
          <div className="flex flex-wrap gap-1.5">
            {GROUPS.map((g) => {
              const on = groups.includes(g)
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGroup(g)}
                  className={cn(
                    "rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] transition-colors",
                    on
                      ? "border-brand-blue-600/40 bg-brand-blue-600/10 text-brand-blue-600"
                      : "border-input text-ink-muted hover:border-border-strong hover:text-ink",
                  )}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </FormSheet>
  )
}
