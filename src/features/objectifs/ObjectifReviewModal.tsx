import { useEffect, useState } from "react"
import {
  Check,
  X,
  Target,
  Tag,
  Users,
  ClipboardCheck,
  Gauge,
  CalendarDays,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatutBadge } from "@/features/objectifs/ui"
import { Avatar } from "@/components/kit/Avatar"

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Tag
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-disabled uppercase">
          {label}
        </div>
        <div className="mt-0.5 font-body text-sm text-ink-subtle">{children}</div>
      </div>
    </div>
  )
}

/**
 * Global objective-review modal ("fiche"). Mounted once in AppShell so it can
 * open from anywhere — a table row's "Consulter" button or an objective
 * notification in the bell. Reads the active id from the store; Accepter /
 * Refuser set the status and surface a toast that survives the modal closing.
 */
export function ObjectifReviewModal() {
  const {
    reviewObjectifId,
    objectifs,
    setObjectifStatut,
    closeObjectifReview,
  } = useData()

  const [toast, setToast] = useState<{
    id: number
    msg: string
    tone: "ok" | "no"
  } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const objectif = objectifs.find((o) => o.id === reviewObjectifId) ?? null

  const decide = (statut: "Accepté" | "Refusé") => {
    if (!objectif) return
    setObjectifStatut(objectif.id, statut)
    setToast({
      id: Date.now(),
      msg: `Objectif « ${objectif.titre} » ${statut.toLowerCase()}`,
      tone: statut === "Accepté" ? "ok" : "no",
    })
    closeObjectifReview()
  }

  const names = objectif?.assignes ?? []
  const namesLabel =
    names.slice(0, 8).join(", ") +
    (names.length > 8 ? ` +${names.length - 8} autres` : "")

  return (
    <>
      <Dialog
        open={reviewObjectifId !== null}
        onOpenChange={(o) => !o && closeObjectifReview()}
      >
        {objectif ? (
          <DialogContent
            showCloseButton={false}
            className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[520px]"
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-border px-5 py-4">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-blue-600/10 text-brand-blue-600">
                <Target size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate font-ui text-base font-medium text-ink">
                  {objectif.titre}
                </DialogTitle>
                <DialogDescription className="mt-1 font-body text-[0.8rem] text-ink-muted">
                  Fiche de l'objectif technique
                </DialogDescription>
              </div>
              <StatutBadge statut={objectif.statut} />
              <button
                type="button"
                onClick={closeObjectifReview}
                aria-label="Fermer"
                className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-border-strong hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 px-5 py-4">
              <Row icon={Tag} label="Catégorie">
                {objectif.categorie}
              </Row>
              <Row icon={ClipboardCheck} label="Critère d'évaluation">
                {objectif.critere}
              </Row>
              <Row icon={Gauge} label="Valeur cible">
                <span className="font-medium text-ink">{objectif.valeurCible}</span>
              </Row>
              <Row icon={CalendarDays} label="Date de création">
                {objectif.date}
              </Row>
              <Row icon={Users} label={`Affecté à — ${names.length} joueurs`}>
                <div className="mt-1 flex items-center gap-2.5">
                  <div className="flex shrink-0 -space-x-2">
                    {names.slice(0, 5).map((n) => (
                      <Avatar
                        key={n}
                        name={n}
                        size="sm"
                        className="ring-2 ring-surface"
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2 font-body text-[0.82rem] leading-relaxed text-ink-muted">
                  {namesLabel}
                </p>
              </Row>

              <div className="rounded-md border border-border px-3.5 py-3">
                <div className="font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-disabled uppercase">
                  Description
                </div>
                <p className="mt-1 font-body text-[0.86rem] leading-relaxed text-ink-subtle">
                  {objectif.description}
                </p>
              </div>
            </div>

            {/* Footer — accept / decline */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
              <button
                type="button"
                onClick={() => decide("Refusé")}
                className="inline-flex items-center gap-1.5 rounded-md border border-danger/40 px-4 py-2 font-ui text-sm font-medium text-danger transition-colors hover:bg-danger/10"
              >
                <X size={16} /> Refuser
              </button>
              <button
                type="button"
                onClick={() => decide("Accepté")}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Check size={16} /> Accepter
              </button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      {toast ? (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "animate-toast-in fixed right-5 bottom-5 z-[200] flex items-center gap-2.5 rounded-md border bg-surface px-4 py-3 shadow-deep",
            toast.tone === "ok" ? "border-success/30" : "border-danger/30",
          )}
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full",
              toast.tone === "ok"
                ? "bg-success/15 text-success"
                : "bg-danger/15 text-danger",
            )}
          >
            {toast.tone === "ok" ? <Check size={14} /> : <X size={14} />}
          </span>
          <span className="font-body text-[0.84rem] text-ink">{toast.msg}</span>
        </div>
      ) : null}
    </>
  )
}
