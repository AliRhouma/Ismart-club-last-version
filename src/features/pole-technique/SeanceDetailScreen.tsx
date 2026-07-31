import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Droplets,
  Gauge,
  MapPin,
  Package,
  ShieldCheck,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { SeanceStatut } from "@/data/seed/programmation"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Toast } from "@/features/sponsoring/ui"
import { dateLongue, statutVariant } from "@/features/pole-technique/seanceUi"

const LIST = "/pole-technique/seances"
const STATUTS: SeanceStatut[] = ["À venir", "En cours", "Terminée"]

export function SeanceDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    seancesClub,
    procedes,
    procedePrincipes,
    procedePhases,
    updateSeance,
    removeSeance,
  } = useData()

  const seance = seancesClub.find((s) => s.id === id)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const principe = useMemo(
    () => procedePrincipes.find((p) => p.id === seance?.principeId),
    [procedePrincipes, seance],
  )
  const phase = useMemo(
    () => procedePhases.find((p) => p.id === principe?.phaseId),
    [procedePhases, principe],
  )
  /** The séance's procédés, resolved out of the library. */
  const procedesDeLaSeance = useMemo(
    () =>
      (seance?.procedeIds ?? [])
        .map((pid) => procedes.find((p) => p.id === pid))
        .filter((p): p is NonNullable<typeof p> => !!p),
    [seance, procedes],
  )

  if (!seance) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <BackButton to={LIST} label="Retour aux séances" />
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={CalendarDays}
            title="Séance introuvable"
            description="Cette séance a été supprimée ou n'existe plus."
            action={
              <Button variant="outline" onClick={() => navigate(LIST)}>
                Retour aux séances
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const theme = principe?.nom ?? seance.special ?? ""

  return (
    <div className="mx-auto w-full max-w-5xl">
      <BackButton to={LIST} label="Retour aux séances" />

      <div className="flex flex-col gap-6">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-ui text-[0.7rem] tracking-[0.04em] text-ink-disabled">
          <span>{seance.categorie}</span>
          <span aria-hidden>·</span>
          <span>{seance.groupe}</span>
          {phase ? (
            <>
              <span aria-hidden>·</span>
              <span className="text-ink-muted">{phase.nom}</span>
            </>
          ) : null}
        </p>

        <PageHeader
          title={`Séance ${seance.numero}`}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant={statutVariant[seance.statut]}>
                {seance.statut}
              </Badge>
              {seance.brouillon ? (
                <span className="rounded-pill border border-border px-2 py-0.5 font-ui text-[0.62rem] tracking-[0.06em] text-ink-disabled uppercase">
                  Brouillon
                </span>
              ) : null}
              <span className="font-ui text-[0.8rem] text-ink-muted">
                {dateLongue(seance.date)}
              </span>
            </span>
          }
          actions={
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Supprimer
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetaTile icon={Clock} label="Durée" value={`${seance.duree} min`} />
          <MetaTile
            icon={Users}
            label="Effectif"
            value={seance.effectif > 0 ? `${seance.effectif} joueurs` : "Non relevé"}
          />
          <MetaTile
            icon={Gauge}
            label="RPE cible"
            value={seance.rpeCible > 0 ? `${seance.rpeCible} / 10` : "Non défini"}
          />
          <MetaTile
            icon={MapPin}
            label="Lieu"
            value={seance.installation ?? "Non précisé"}
          />
          <MetaTile
            icon={ClipboardList}
            label="Procédés"
            value={String(procedesDeLaSeance.length)}
          />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex flex-col gap-4 lg:w-[20rem] lg:shrink-0">
            {/* Status is the one thing a coach changes from this screen. */}
            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-3 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Statut
              </h2>
              <div className="flex flex-col gap-2">
                {STATUTS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    role="radio"
                    aria-checked={st === seance.statut}
                    onClick={() => {
                      updateSeance(seance.id, { statut: st })
                      notify(`Séance ${st.toLowerCase()}.`)
                    }}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left font-ui text-[0.82rem] transition-colors",
                      st === seance.statut
                        ? "border-border-second bg-surface-nested text-ink"
                        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {st}
                    {st === seance.statut ? (
                      <Check size={14} className="text-info" />
                    ) : null}
                  </button>
                ))}
              </div>
            </section>

            {/* Pre-session checks — toggled on site, so they're live controls. */}
            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-3 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Contrôles
              </h2>
              <div className="flex flex-col gap-2">
                <CheckRow
                  icon={ShieldCheck}
                  label="Sécurité vérifiée"
                  on={seance.securiteVerifiee}
                  onToggle={() =>
                    updateSeance(seance.id, {
                      securiteVerifiee: !seance.securiteVerifiee,
                    })
                  }
                />
                <CheckRow
                  icon={Droplets}
                  label="Hydratation vérifiée"
                  on={seance.hydratationVerifiee}
                  onToggle={() =>
                    updateSeance(seance.id, {
                      hydratationVerifiee: !seance.hydratationVerifiee,
                    })
                  }
                />
              </div>
            </section>

            {seance.materiel.length ? (
              <section className="rounded-lg border border-border p-4">
                <h2 className="mb-3 flex items-center gap-2 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                  <Package size={12} /> Matériel
                </h2>
                <ul className="flex flex-col gap-2">
                  {seance.materiel.map((m, i) => (
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
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-2 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Thème de la séance
              </h2>
              <p className="font-ui text-[1.05rem] text-ink">
                {theme || "À définir"}
              </p>
              {phase ? (
                <p className="mt-1 font-body text-[0.84rem] text-ink-muted">
                  {phase.nom}
                </p>
              ) : null}
            </section>

            {/* The procédés — the bridge into the tactical library. */}
            <section className="flex flex-col gap-3">
              <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Procédés · {procedesDeLaSeance.length}
              </h2>

              {procedesDeLaSeance.length === 0 ? (
                <div className="rounded-lg border border-border">
                  <EmptyState
                    icon={ClipboardList}
                    title="Aucun procédé"
                    description="Le contenu de la séance n'a pas encore été composé depuis la bibliothèque."
                    action={
                      <Button
                        variant="outline"
                        onClick={() => navigate("/pole-technique/procedes")}
                      >
                        Ouvrir les procédés
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ol className="flex flex-col gap-2">
                  {procedesDeLaSeance.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/pole-technique/procedes/${p.id}`)
                        }
                        className="group relative flex w-full items-center gap-3.5 overflow-hidden rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-border-strong"
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
                        />
                        <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.72rem] text-ink-muted tabular-nums">
                          {i + 1}
                        </span>
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            loading="lazy"
                            className="relative z-10 hidden h-12 w-20 shrink-0 rounded-md border border-border object-cover sm:block"
                          />
                        ) : null}
                        <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate font-ui text-[0.88rem] text-ink transition-colors group-hover:text-brand-blue-600">
                            {p.titre}
                          </span>
                          <span className="font-ui text-[0.7rem] text-ink-muted">
                            {p.type} · {p.duree} min
                          </span>
                        </span>
                        <ChevronRight
                          size={16}
                          className="relative z-10 shrink-0 text-ink-disabled"
                        />
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer cette séance ?"
        description={`La séance ${seance.numero} sera retirée et sa ligne du programme annuel repassera « à programmer ».`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeSeance(seance.id)
          navigate(LIST)
        }}
      />

      {toast ? <Toast msg={toast.msg} id={toast.id} /> : null}
    </div>
  )
}

function CheckRow({
  icon: Icon,
  label,
  on,
  onToggle,
}: {
  icon: LucideIcon
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left font-ui text-[0.82rem] transition-colors",
        on
          ? "border-success/25 bg-success/10 text-success"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      <Icon size={14} />
      {label}
      {on ? <Check size={14} className="ml-auto" /> : null}
    </button>
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
      <span className="truncate font-ui text-[0.88rem] text-ink">{value}</span>
    </div>
  )
}
