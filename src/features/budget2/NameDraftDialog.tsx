import { useEffect, useState } from "react"

import { inputCls } from "@/features/finance/ui"
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

/**
 * Small dialog to name a draft — used both to create a new brouillon and to
 * rename an existing one. Controlled; reports the trimmed name on submit.
 */
export function NameDraftDialog({
  open,
  onOpenChange,
  title,
  description,
  initial = "",
  submitLabel,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initial?: string
  submitLabel: string
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState(initial)

  // Reset to the initial value each time the dialog is opened.
  useEffect(() => {
    if (open) setName(initial)
  }, [open, initial])

  const clean = name.trim()
  const submit = () => {
    if (!clean) return
    onSubmit(clean)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-border bg-card sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-ui text-base font-medium text-ink">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="font-body text-sm text-ink-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="py-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
            placeholder="Ex : Prudent, Optimiste, v2…"
            autoFocus
            className={inputCls}
          />
        </div>

        <DialogFooter className="mt-1">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" onClick={submit} disabled={!clean}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
