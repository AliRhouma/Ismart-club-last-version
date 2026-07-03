import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  FileText,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react"

import { useData } from "@/data/useData"
import {
  DOC_TYPES,
  docTemplates,
  type DocTemplate,
  type DocType,
  type Document,
} from "@/data/seed/documents"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { Badge } from "@/components/kit/Badge"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
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

const fieldCls =
  "w-full rounded-md border border-input bg-input-bg px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
const labelCls = "block font-ui text-[0.72rem] font-medium tracking-[0.02em] text-ink"

/** Today as a French display date, e.g. "30 juin 2026". */
function today() {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function DocumentsScreen() {
  const navigate = useNavigate()
  const { documents, addDocument, removeDocument } = useData()

  const [newOpen, setNewOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Document | null>(null)

  const [title, setTitle] = useState("")
  const [type, setType] = useState<DocType>("")

  const openDocument = (id: string) => navigate(`/documents/${id}`)

  const resetForm = () => {
    setTitle("")
    setType("")
  }

  const handleCreate = () => {
    const clean = title.trim()
    if (!clean) return
    const id = addDocument({ title: clean, type, updatedAt: today() })
    setNewOpen(false)
    resetForm()
    openDocument(id)
  }

  const handleTemplate = (tpl: DocTemplate) => {
    const id = addDocument({
      title: tpl.title,
      type: tpl.type,
      updatedAt: today(),
    })
    setTemplateOpen(false)
    openDocument(id)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        title="Documents"
        subtitle="Créez et gérez les documents du club — comptes rendus, fiches de poste, règlements…"
        actions={
          <>
            <Button variant="outline" onClick={() => setTemplateOpen(true)}>
              <LayoutTemplate /> Depuis un modèle
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus /> Nouveau document
            </Button>
          </>
        }
      />

      {documents.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={FileText}
            title="Aucun document"
            description="Créez votre premier document pour démarrer."
            action={
              <Button onClick={() => setNewOpen(true)}>
                <Plus /> Créer un document
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong"
            >
              {/* Fluid fill: surface (#181818) descends from top to bottom on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
              />
              <button
                type="button"
                onClick={() => openDocument(doc.id)}
                className="relative z-10 flex flex-1 flex-col p-5 text-left"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-md bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
                    <FileText size={18} strokeWidth={2} />
                  </span>
                  {doc.type ? <Badge variant="info">{doc.type}</Badge> : null}
                </div>
                <h3 className="line-clamp-2 font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
                  {doc.title}
                </h3>
                <div className="mt-2 flex items-center gap-1.5 font-body text-[0.78rem] text-ink-muted">
                  <Calendar size={13} />
                  Modifié le {doc.updatedAt}
                </div>
              </button>
              <div className="relative z-10 border-t border-border px-5 py-3">
                <button
                  type="button"
                  onClick={() => setPendingDelete(doc)}
                  className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-medium text-ink-muted transition-colors hover:text-danger"
                >
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New document */}
      <Dialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o)
          if (!o) resetForm()
        }}
      >
        <DialogContent className="rounded-xl border-border bg-card sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Nouveau document
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-ink-muted">
              Renseignez les informations de base du document.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="doc-title" className={labelCls}>
                Titre du document <span className="text-danger">*</span>
              </label>
              <input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                }}
                placeholder="Ex : Compte rendu réunion du 5 mars…"
                autoFocus
                className={fieldCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="doc-type" className={labelCls}>
                Type de document
              </label>
              <select
                id="doc-type"
                value={type}
                onChange={(e) => setType(e.target.value as DocType)}
                className={`${fieldCls} cursor-pointer`}
              >
                {DOC_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleCreate} disabled={!title.trim()}>
              Créer le document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* From template */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="rounded-xl border-border bg-card sm:max-w-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Depuis un modèle
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-ink-muted">
              Choisissez un point de départ — le document est créé aussitôt.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-2">
            {docTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleTemplate(tpl)}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-hover"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
                  <FileText size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-ui text-sm font-medium text-ink">
                    {tpl.label}
                  </div>
                  <div className="truncate font-body text-[0.78rem] text-ink-muted">
                    {tpl.description}
                  </div>
                </div>
                <Badge variant="info">{tpl.type}</Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Supprimer ce document ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.title} » sera définitivement supprimé.`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (pendingDelete) removeDocument(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
