import { useEffect, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { EventType, PlanEvent } from "@/data/seed/events"
import { FormSheet } from "@/components/kit/FormSheet"
import { EVENT_TYPES, TYPE_META } from "@/features/planification/eventMeta"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-body text-[0.72rem] text-ink-disabled">{hint}</span>
      ) : null}
    </label>
  )
}

type Draft = {
  type: EventType
  title: string
  category: string
  date: string
  start: string
  end: string
  location: string
  detail: string
}

const blankDraft = (date: string): Draft => ({
  type: "seance",
  title: "",
  category: "",
  date,
  start: "08:00",
  end: "",
  location: "",
  detail: "",
})

const fromEvent = (e: PlanEvent): Draft => ({
  type: e.type,
  title: e.title,
  category: e.category ?? "",
  date: e.date,
  start: e.start,
  end: e.end ?? "",
  location: e.location ?? "",
  detail: e.detail ?? "",
})

/**
 * Create / edit sheet for a calendar event. When `event` is set it edits in
 * place; otherwise it creates on `defaultDate` (the cell the user clicked).
 * Type-specific vocabulary (the placeholders) shifts with the selected type so
 * the same form serves séances, matchs, and réunions.
 */
export function EventFormSheet({
  open,
  onOpenChange,
  event,
  defaultDate,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: PlanEvent | null
  defaultDate: string
  onSaved: (message: string) => void
}) {
  const { addEvent, updateEvent } = useData()
  const [draft, setDraft] = useState<Draft>(blankDraft(defaultDate))

  // Re-seed the form each time it opens (fresh for create, filled for edit).
  useEffect(() => {
    if (!open) return
    setDraft(event ? fromEvent(event) : blankDraft(defaultDate))
  }, [open, event, defaultDate])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const canSubmit = draft.title.trim().length > 0 && draft.date && draft.start

  const submit = () => {
    if (!canSubmit) return
    const payload: Omit<PlanEvent, "id"> = {
      type: draft.type,
      title: draft.title.trim(),
      date: draft.date,
      start: draft.start,
      end: draft.end || undefined,
      category: draft.category.trim() || undefined,
      location: draft.location.trim() || undefined,
      detail: draft.detail.trim() || undefined,
    }
    if (event) {
      updateEvent(event.id, payload)
      onSaved("Événement mis à jour")
    } else {
      addEvent(payload)
      onSaved("Événement ajouté au planning")
    }
    onOpenChange(false)
  }

  const meta = TYPE_META[draft.type]

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={event ? "Modifier l'événement" : "Nouvel événement"}
      description={
        event
          ? "Ajustez les informations de cet événement."
          : "Planifiez une séance, un match ou une réunion."
      }
      onSubmit={submit}
      submitDisabled={!canSubmit}
      submitLabel={event ? "Enregistrer" : "Ajouter"}
    >
      <div className="flex flex-col gap-4">
        <Field label="Type">
          <div className="grid grid-cols-3 gap-1.5">
            {EVENT_TYPES.map((type) => {
              const m = TYPE_META[type]
              const Icon = m.icon
              const on = draft.type === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("type", type)}
                  aria-pressed={on}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 font-ui text-[0.78rem] font-medium transition-colors",
                    on
                      ? "border-border-second bg-surface-nested text-ink"
                      : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                  )}
                >
                  <Icon size={14} className={on ? m.iconColor : undefined} />
                  {m.label}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Titre">
          <input
            className={inputCls}
            value={draft.title}
            autoFocus
            placeholder={meta.titlePlaceholder}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>

        <Field label={draft.type === "match" ? "Équipe" : "Catégorie / groupe"}>
          <input
            className={inputCls}
            value={draft.category}
            placeholder={meta.categoryPlaceholder}
            onChange={(e) => set("category", e.target.value)}
          />
        </Field>

        <Field label="Date">
          <input
            type="date"
            className={cn(inputCls, "[color-scheme:dark]")}
            value={draft.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Heure de début">
            <input
              type="time"
              className={cn(inputCls, "[color-scheme:dark]")}
              value={draft.start}
              onChange={(e) => set("start", e.target.value)}
            />
          </Field>
          <Field label="Heure de fin" hint="Optionnel">
            <input
              type="time"
              className={cn(inputCls, "[color-scheme:dark]")}
              value={draft.end}
              onChange={(e) => set("end", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Lieu">
          <input
            className={inputCls}
            value={draft.location}
            placeholder={meta.locationPlaceholder}
            onChange={(e) => set("location", e.target.value)}
          />
        </Field>

        <Field
          label={draft.type === "match" ? "Adversaire / note" : "Objectif / note"}
        >
          <textarea
            rows={3}
            className={cn(inputCls, "resize-none")}
            value={draft.detail}
            placeholder={meta.detailPlaceholder}
            onChange={(e) => set("detail", e.target.value)}
          />
        </Field>
      </div>
    </FormSheet>
  )
}
