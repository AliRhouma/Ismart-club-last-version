import { useEffect, useRef, useState } from "react"
import { Navigate, NavLink, useParams } from "react-router-dom"
import {
  Check,
  CircleCheckBig,
  FolderKanban,
  FolderTree,
  LayoutGrid,
  ListTodo,
  Plus,
  UserX,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { PageHeader } from "@/components/kit/PageHeader"
import { Button } from "@/components/ui/button"
import type { Projet, Tache, TacheStatut } from "@/data/seed/taches"

import { HierarchieView } from "./taches/HierarchieView"
import { ProjetsView } from "./taches/ProjetsView"
import { KanbanView } from "./taches/KanbanView"
import { TacheModal } from "./taches/TacheModal"
import { ProjetModal } from "./taches/ProjetModal"

/** One URL per view — the tabs are routes, not local state. */
const VUES = [
  { slug: "hierarchie", label: "Hiérarchie", icon: FolderTree },
  { slug: "projets", label: "Projets", icon: FolderKanban },
  { slug: "kanban", label: "Kanban", icon: LayoutGrid },
] as const

type Vue = (typeof VUES)[number]["slug"]

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: LucideIcon
  tone?: "success" | "warning"
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md border border-border",
          tone === "success"
            ? "text-success"
            : tone === "warning"
              ? "text-warning"
              : "text-ink-muted",
        )}
      >
        <Icon size={15} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-ui text-[0.6rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
          {label}
        </span>
        <span className="font-ui text-sm text-ink tabular-nums">{value}</span>
      </span>
    </div>
  )
}

/**
 * Structuration ▸ Gestion des tâches.
 *
 * Three readings of the same work: the **hiérarchie** (projet › sous-projet ›
 * tâche › sous-tâche, with the "who carries nothing" filters), the **projets**
 * (one card per chantier), and the **kanban** (drag a tâche between statuts).
 * They all read the one flat tâche list in the store, so a change in any view
 * shows up in the other two immediately.
 */
export function TachesScreen() {
  const { vue } = useParams<{ vue: Vue }>()
  const { projets, taches } = useData()

  const [tacheOuverte, setTacheOuverte] = useState<Tache | null>(null)
  const [creerTache, setCreerTache] = useState<{ statut?: TacheStatut } | null>(
    null,
  )
  const [projetOuvert, setProjetOuvert] = useState<Projet | null>(null)
  const [creerProjet, setCreerProjet] = useState(false)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!vue || !VUES.some((v) => v.slug === vue)) {
    return <Navigate to="/structuration/taches/hierarchie" replace />
  }

  const terminees = taches.filter((t) => t.statut === "Terminée").length
  const orphelines = taches.filter((t) => !t.assigneId).length

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <PageHeader
        title="Gestion des tâches"
        subtitle={`${projets.length} projet${projets.length > 1 ? "s" : ""} · ${taches.length} tâche${taches.length > 1 ? "s" : ""} · Structuration`}
        actions={
          <>
            <Button variant="outline" onClick={() => setCreerProjet(true)}>
              <Plus size={15} /> Nouveau projet
            </Button>
            <Button onClick={() => setCreerTache({})}>
              <Plus size={16} /> Nouvelle tâche
            </Button>
          </>
        }
      />

      {/* View switcher + counters */}
      <div className="flex flex-col gap-3 rounded-lg border border-border px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {VUES.map(({ slug, label, icon: Icon }) => (
            <NavLink
              key={slug}
              to={`/structuration/taches/${slug}`}
              className={({ isActive }) =>
                cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3.5 py-1.5 font-ui text-[0.78rem] font-medium transition-colors",
                  isActive
                    ? "border-border-second bg-surface-nested text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Stat label="Projets" value={projets.length} icon={FolderKanban} />
          <Stat label="Tâches" value={taches.length} icon={ListTodo} />
          <Stat
            label="Terminées"
            value={terminees}
            icon={CircleCheckBig}
            tone="success"
          />
          <Stat
            label="Non attribuées"
            value={orphelines}
            icon={UserX}
            tone={orphelines > 0 ? "warning" : undefined}
          />
        </div>
      </div>

      {vue === "hierarchie" ? (
        <HierarchieView
          onOpenTache={setTacheOuverte}
          onOpenProjet={setProjetOuvert}
        />
      ) : null}

      {vue === "projets" ? (
        <ProjetsView
          onOpenTache={setTacheOuverte}
          onOpenProjet={setProjetOuvert}
          onNewProjet={() => setCreerProjet(true)}
        />
      ) : null}

      {vue === "kanban" ? (
        <KanbanView
          onOpenTache={setTacheOuverte}
          onNewTache={(statut) => setCreerTache({ statut })}
        />
      ) : null}

      {/* Modals */}
      {tacheOuverte ? (
        <TacheModal
          tache={tacheOuverte}
          onClose={() => setTacheOuverte(null)}
          onSaved={(nom) => notify(`Tâche « ${nom} » enregistrée`)}
          onDeleted={(nom) => notify(`Tâche « ${nom} » supprimée`)}
        />
      ) : null}

      {creerTache ? (
        <TacheModal
          tache={null}
          onClose={() => setCreerTache(null)}
          onSaved={(nom) => notify(`Tâche « ${nom} » créée`)}
        />
      ) : null}

      {projetOuvert ? (
        <ProjetModal
          projet={projetOuvert}
          onClose={() => setProjetOuvert(null)}
          onSaved={(nom) => notify(`Projet « ${nom} » enregistré`)}
          onDeleted={(nom) => notify(`Projet « ${nom} » supprimé`)}
        />
      ) : null}

      {creerProjet ? (
        <ProjetModal
          projet={null}
          onClose={() => setCreerProjet(false)}
          onSaved={(nom) => notify(`Projet « ${nom} » créé`)}
        />
      ) : null}

      {toast ? (
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
      ) : null}
    </div>
  )
}
