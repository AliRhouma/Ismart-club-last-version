import { useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"

/**
 * Inline confirmation toast — the app's feedback pattern for a mutation that
 * happened in place (a convocation saved, a joueur moved). Auto-dismisses;
 * nothing to close. Pair `useToast()` with `<Toast toast={toast} />`.
 */
export type ToastMessage = { id: number; msg: string }

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const seq = useRef(0)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])
  return {
    toast,
    notify: (msg: string) => setToast({ id: seq.current++, msg }),
  }
}

export function Toast({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null
  return (
    <div
      key={toast.id}
      role="status"
      className="animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-success/30 bg-surface px-4 py-3 shadow-deep"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
        <Check size={14} />
      </span>
      <span className="font-body text-[0.84rem] text-ink">{toast.msg}</span>
    </div>
  )
}
