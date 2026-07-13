import * as React from "react"
import type { ReactNode } from "react"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Centered modal wrapping a create/edit form. Controlled via `open`/
 * `onOpenChange`. Renders the form fields (`children`) in a scrollable body
 * with a sticky header + footer (Cancel / Submit). `onSubmit` may be async —
 * the submit button shows a spinner and the modal locks until it settles.
 *
 * (Historically a right-side sheet; now a modal — the name is kept so the
 * existing call sites don't churn.)
 */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  submitting = false,
  submitDisabled = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  onSubmit: () => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  submitting?: boolean
  submitDisabled?: boolean
}) {
  const [pending, setPending] = React.useState(false)
  const busy = submitting || pending

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy || submitDisabled) return
    try {
      setPending(true)
      await onSubmit()
    } finally {
      setPending(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <DialogTitle className="font-ui text-base font-medium text-ink">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-0.5 font-body text-sm text-ink-muted">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              aria-label="Fermer"
              className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-[var(--border-hover)] hover:text-ink disabled:opacity-45"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {children}
          </div>

          {/* Footer */}
          <div className="flex flex-row justify-end gap-2 border-t border-border px-5 py-3.5">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={busy}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={busy || submitDisabled}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
