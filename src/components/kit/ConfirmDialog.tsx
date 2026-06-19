import * as React from "react"
import type { ReactNode } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
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
 * Confirmation dialog for destructive (or otherwise consequential) actions.
 * Controlled via `open`/`onOpenChange`. `onConfirm` may be async — the confirm
 * button shows a spinner and both actions lock until it settles, and the dialog
 * can't be dismissed mid-action.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  destructive = true,
  loading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  destructive?: boolean
  loading?: boolean
}) {
  const [pending, setPending] = React.useState(false)
  const busy = loading || pending

  const handleConfirm = async () => {
    try {
      setPending(true)
      await onConfirm()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="gap-0 rounded-xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-3 text-left">
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md",
              destructive ? "bg-danger/10 text-danger" : "bg-brand/10 text-brand",
            )}
          >
            <AlertTriangle className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="font-ui text-base font-bold text-ink">
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription className="font-body text-sm text-ink-muted">
                {description}
              </DialogDescription>
            ) : null}
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={busy}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
