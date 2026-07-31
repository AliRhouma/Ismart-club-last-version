import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ClipboardList,
  Clock,
  Maximize2,
  Package,
  Pencil,
  RefreshCw,
  Repeat,
  Share2,
  Trash2,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { ProcedeSection } from "@/data/seed/procedes"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Toast } from "@/features/sponsoring/ui"
import { ProcedeFormModal } from "@/features/pole-technique/ProcedeFormModal"

const LIST = "/pole-technique/procedes"

export function ProcedeDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    procedes,
    procedePhases,
    procedePrincipes,
    procedeGroupes,
    updateProcede,
    removeProcede,
  } = useData()

  const procede = procedes.find((p) => p.id === id)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  /* Breadcrumb of the taxonomy — computed, never stored. */
  const trail = useMemo(() => {
    const principe = procedePrincipes.find((p) => p.id === procede?.principeId)
    const phase = procedePhases.find((p) => p.id === principe?.phaseId)
    const groupe = procedeGroupes.find((g) => g.id === phase?.groupeId)
    return { principe, phase, groupe }
  }, [procede, procedePrincipes, procedePhases, procedeGroupes])

  if (!procede) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <BackButton to={LIST} label="Retour aux procédés" />
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={ClipboardList}
            title="Procédé introuvable"
            description="Ce procédé a été supprimé ou n'existe plus dans la bibliothèque."
            action={
              <Button variant="outline" onClick={() => navigate(LIST)}>
                Retour aux procédés
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <BackButton to={LIST} label="Retour aux procédés" />

      <div className="flex flex-col gap-6">
        {/* Where this procédé sits in the taxonomy, above the title. */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-[0.7rem] tracking-[0.04em] text-ink-disabled">
          <span>{trail.groupe?.nom}</span>
          <span aria-hidden>·</span>
          <span>{trail.phase?.nom}</span>
          <span aria-hidden>·</span>
          <span className="text-ink-muted">{trail.principe?.nom}</span>
        </p>

        <PageHeader
          title={procede.titre}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{procede.type}</Badge>
              {procede.partage ? (
                <span className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] text-ink-muted">
                  <Share2 size={12} /> Partagé avec le réseau
                </span>
              ) : null}
              {procede.video ? (
                <span className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] text-ink-muted">
                  <Video size={12} /> Animation disponible
                </span>
              ) : null}
            </span>
          }
          actions={
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil /> Modifier
              </Button>
              <Button variant="outline" onClick={() => setDeleteOpen(true)}>
                <Trash2 /> Supprimer
              </Button>
            </>
          }
        />

        {/* Format tiles — the numbers a coach checks before running the drill. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetaTile icon={Clock} label="Durée" value={`${procede.duree} min`} />
          <MetaTile icon={Repeat} label="Séquence" value={procede.sequence} />
          <MetaTile
            icon={RefreshCw}
            label="Récupération"
            value={`${procede.recuperation} s`}
          />
          {/* Surface / effectif are optional on the real records — "Non précisé"
              beats a meaningless "0 × 0 m". */}
          <MetaTile
            icon={Maximize2}
            label="Surface"
            value={
              procede.surface[0] > 0 && procede.surface[1] > 0
                ? `${procede.surface[0]} × ${procede.surface[1]} m`
                : "Non précisée"
            }
          />
          <MetaTile
            icon={Users}
            label="Effectif"
            value={
              procede.effectif[0] > 0
                ? `${procede.effectif[0]} joueurs${
                    procede.effectif[1] > 0 ? ` + ${procede.effectif[1]} GB` : ""
                  }`
                : "Non précisé"
            }
          />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
          {/* Board + side facts. Full width on mobile, a sticky column on lg. */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:w-[22rem] lg:shrink-0">
            {procede.image ? (
              <figure className="overflow-hidden rounded-lg border border-border bg-surface-nested">
                <img
                  src={procede.image}
                  alt={`Schéma du procédé ${procede.titre}`}
                  loading="lazy"
                  className="w-full object-contain"
                />
              </figure>
            ) : null}

            {procede.materiel.length ? (
              <section className="rounded-lg border border-border p-4">
                <h2 className="mb-3 flex items-center gap-2 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                  <Package size={12} /> Matériel
                </h2>
                <ul className="flex flex-col gap-2">
                  {procede.materiel.map((m, i) => (
                    <li
                      key={i}
                      className="flex items-baseline justify-between gap-3 font-body text-[0.84rem] text-ink-muted"
                    >
                      <span>{m.nom}</span>
                      <span className="font-ui text-ink tabular-nums">
                        ×{m.quantite}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-3 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Fiche
              </h2>
              <dl className="flex flex-col gap-2.5 font-body text-[0.84rem]">
                <Row label="Créé par" value={procede.auteur} />
                <Row
                  label="Catégories"
                  value={
                    procede.categories.length ? (
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {procede.categories.map((c) => (
                          <span
                            key={c}
                            className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.68rem] text-brand-blue-600"
                          >
                            {c}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-ink-disabled">Toutes</span>
                    )
                  }
                />
              </dl>
            </section>
          </div>

          {/* The procédé itself — the ordered rich-text sections. */}
          <div className="min-w-0 flex-1">
            {procede.sections.length === 0 ? (
              <div className="rounded-lg border border-border">
                <EmptyState
                  icon={ClipboardList}
                  title="Fiche à compléter"
                  description="Aucun contenu pour l'instant — objectif, consignes et comportements attendus restent à rédiger."
                  action={
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                      <Pencil /> Modifier le procédé
                    </Button>
                  }
                />
              </div>
            ) : (
              <article className="flex flex-col">
                {procede.sections.map((s, i) => (
                  <SectionView key={i} section={s} first={i === 0} />
                ))}
              </article>
            )}
          </div>
        </div>
      </div>

      <ProcedeFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        procede={procede}
        onSubmit={(draft) => {
          updateProcede(procede.id, draft)
          setEditOpen(false)
          notify("Procédé mis à jour.")
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer ce procédé ?"
        description={`« ${procede.titre} » sera retiré de la bibliothèque. Cette action est définitive.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeProcede(procede.id)
          navigate(LIST)
        }}
      />

      {toast ? <Toast msg={toast.msg} id={toast.id} /> : null}
    </div>
  )
}

function SectionView({
  section,
  first,
}: {
  section: ProcedeSection
  first: boolean
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2.5 py-5",
        first ? "pt-0" : "border-t border-border",
      )}
    >
      <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {section.titre}
      </h2>
      {section.texte ? (
        <p className="font-body text-[0.9rem] leading-relaxed text-ink-subtle">
          {section.texte}
        </p>
      ) : null}
      {section.items ? (
        <ul className="flex flex-col gap-2">
          {section.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-2.5 font-body text-[0.9rem] leading-relaxed text-ink-subtle"
            >
              <span
                aria-hidden
                className="mt-2 size-1 shrink-0 rounded-full bg-ink-disabled"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border px-3.5 py-3">
      <span className="flex items-center gap-1.5 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        <Icon size={11} /> {label}
      </span>
      <span className="font-ui text-[0.88rem] text-ink">{value}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  )
}
