import { useMemo, useState } from "react"

import { useData } from "@/data/useData"
import { fmtDateRange } from "@/features/budget2/helpers"
import { Field, Select, inputCls } from "@/features/finance/ui"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** Predefined seasons (Aug 1 → Jun 30) offered by the "prédéfinie" mode. */
const PRESETS = [
  { label: "Saison 2026 / 2027", start_date: "2026-08-01", end_date: "2027-06-30" },
  { label: "Saison 2027 / 2028", start_date: "2027-08-01", end_date: "2028-06-30" },
  { label: "Saison 2028 / 2029", start_date: "2028-08-01", end_date: "2029-06-30" },
  { label: "Saison 2029 / 2030", start_date: "2029-08-01", end_date: "2030-06-30" },
]

type Mode = "preset" | "manuel"

/**
 * "Créer une nouvelle saison" — two ways to fill the season (docs §2.2):
 * a predefined season that pre-fills name + dates, or a fully manual entry.
 * On confirm the season is created as a global entity and the modal reports its
 * new id so the caller can open it.
 */
export function CreateSeasonModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string, label: string) => void
}) {
  const { addBudget2Season } = useData()
  const [mode, setMode] = useState<Mode>("preset")
  const [presetIdx, setPresetIdx] = useState("")
  const [label, setLabel] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")

  const reset = () => {
    setMode("preset")
    setPresetIdx("")
    setLabel("")
    setStart("")
    setEnd("")
  }

  const pickPreset = (idx: string) => {
    setPresetIdx(idx)
    const p = PRESETS[Number(idx)]
    if (p) {
      setLabel(p.label)
      setStart(p.start_date)
      setEnd(p.end_date)
    }
  }

  const valid = useMemo(
    () => label.trim().length > 0 && !!start && !!end && start < end,
    [label, start, end],
  )

  const submit = () => {
    if (!valid) return
    const id = addBudget2Season({
      label: label.trim(),
      start_date: start,
      end_date: end,
    })
    onCreated(id, label.trim())
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="rounded-xl border-border bg-card sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-ui text-base font-medium text-ink">
            Créer une nouvelle saison
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-ink-muted">
            La saison est créée comme entité globale, disponible dans toute
            l'application.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="inline-flex gap-1 rounded-pill border border-border p-1">
          {(
            [
              { value: "preset", label: "Saison prédéfinie" },
              { value: "manuel", label: "Manuel" },
            ] as const
          ).map((m) => {
            const on = m.value === mode
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={
                  "flex-1 rounded-pill px-4 py-1.5 font-ui text-[0.76rem] font-medium transition-colors " +
                  (on
                    ? "border border-border-second bg-surface-nested text-ink"
                    : "border border-transparent text-ink-muted hover:text-ink")
                }
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-4 py-1">
          {mode === "preset" ? (
            <>
              <Field label="Saison prédéfinie">
                <Select
                  value={presetIdx}
                  onChange={pickPreset}
                  options={PRESETS.map((p, i) => ({
                    value: String(i),
                    label: `${p.label}  ·  ${fmtDateRange(p.start_date, p.end_date)}`,
                  }))}
                  placeholder="Choisir une saison…"
                />
              </Field>
              {presetIdx !== "" ? (
                <div className="rounded-md border border-border px-4 py-3">
                  <div className="font-ui text-sm font-medium text-ink">{label}</div>
                  <div className="mt-0.5 font-body text-[0.78rem] text-ink-muted">
                    {fmtDateRange(start, end)}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Field label="Nom de la saison" required>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex : Saison 2026 / 2027"
                  autoFocus
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date de début" required>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </Field>
                <Field label="Date de fin" required>
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </Field>
              </div>
              {start && end && start >= end ? (
                <p className="font-body text-[0.74rem] text-danger">
                  La date de fin doit être postérieure à la date de début.
                </p>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" onClick={submit} disabled={!valid}>
            Créer la saison
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
