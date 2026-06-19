import * as React from "react"
import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

/**
 * Slide-in sheet wrapping a create/edit form. Controlled via `open`/
 * `onOpenChange`. Renders the form fields (`children`) in a scrollable body
 * with a sticky header + footer (Cancel / Submit). `onSubmit` may be async —
 * the submit button shows a spinner and the sheet locks until it settles.
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
  side = "right",
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
  side?: "right" | "left"
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
    <Sheet open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <SheetContent
        side={side}
        className="w-full gap-0 border-border bg-surface-panel p-0 sm:max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="font-ui text-base font-bold text-ink">
              {title}
            </SheetTitle>
            {description ? (
              <SheetDescription className="font-body text-sm text-ink-muted">
                {description}
              </SheetDescription>
            ) : null}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">{children}</div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
