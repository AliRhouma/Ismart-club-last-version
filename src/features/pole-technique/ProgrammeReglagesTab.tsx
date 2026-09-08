import { useEffect, useRef, useState } from "react"
import { CalendarPlus, Eraser, Eye, Settings2, Trash2, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  VISIBILITE_PAR_DEFAUT,
  type ProgrammeVisibilite,
} from "@/data/seed/programmation"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Toast } from "@/features/sponsoring/ui"
import { useProgramme } from "@/features/pole-technique/useProgramme"

/**
 * The shape of the season itself, kept apart from the planning that reads it:
 * how many semaines it runs, how many séances each holds, and the two coarse
 * actions a coach reaches for once — add a semaine, or wipe the principes and
 * start the year's plan over.
 */
export function ProgrammeReglagesTab() {
  const { saison, categorie, groupes, programme } = useProgramme()
  const {
    addProgSemaine,
    removeProgSemaine,
    updateProgSession,
    updateProgrammeAnnuel,
  } = useData()

  const [viderOpen, setViderOpen] = useState(false)
  const [semaineASupprimer, setSemaineASupprimer] = useState<number | null>(null)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) =>
    setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  if (!programme)
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={Settings2}
          title="Aucun réglage"
          description="Les réglages portent sur le programme annuel : créez-le d'abord."
        />
      </div>
    )

  const semaines = [...new Set(programme.sessions.map((s) => s.semaine))].sort(
    (a, b) => a - b,
  )
  const visibilite = programme.visibilite ?? VISIBILITE_PAR_DEFAUT
  const majVisibilite = (patch: Partial<ProgrammeVisibilite>) => {
    updateProgrammeAnnuel(programme.id, {
      visibilite: { ...visibilite, ...patch },
    })
    notify("Visibilité mise à jour.")
  }

  const planifiees = programme.sessions.filter((s) => s.seanceId).length
  const definis = programme.sessions.filter(
    (s) => s.principeId || s.special,
  ).length

  return (
    <div className="flex flex-col gap-5">
      {/* Identity — what this programme is, in one read. */}
      <section className="flex flex-col gap-4 rounded-lg border border-border p-5">
        <h2 className="font-ui text-[0.95rem] font-medium text-ink">
          Le programme
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Ligne label="Saison" valeur={saison ?? "—"} />
          <Ligne label="Équipe" valeur={categorie?.nom ?? "—"} />
          <Ligne
            label="Groupes"
            valeur={groupes.map((g) => g.nom).join(" · ") || "—"}
          />
          <Ligne label="Semaines" valeur={String(semaines.length)} />
          <Ligne
            label="Séances"
            valeur={`${programme.sessions.length} · ${definis} définies`}
          />
          <Ligne
            label="Planifiées"
            valeur={`${planifiees} / ${programme.sessions.length}`}
          />
        </dl>
      </section>

      {/* Who, inside the club, can open this programme. */}
      <section className="flex flex-col gap-4 rounded-lg border border-border p-5">
        <div>
          <h2 className="font-ui text-[0.95rem] font-medium text-ink">
            Visibilité
          </h2>
          <p className="font-body text-[0.82rem] text-ink-muted">
            Le staff y a toujours accès. Ouvrez-le aux joueurs et aux parents, et
            limitez-le aux groupes concernés.
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Bascule
            icon={Users}
            label="Joueurs"
            aide="Le programme apparaît dans leur espace."
            actif={visibilite.joueurs}
            onToggle={() => majVisibilite({ joueurs: !visibilite.joueurs })}
          />
          <Bascule
            icon={Eye}
            label="Parents"
            aide="Visible depuis l'espace parent de leur enfant."
            actif={visibilite.parents}
            onToggle={() => majVisibilite({ parents: !visibilite.parents })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Groupes qui le voient
          </span>
          {!visibilite.joueurs && !visibilite.parents ? (
            <p className="font-body text-[0.8rem] text-ink-disabled">
              Personne hors du staff pour l'instant — ouvrez d'abord aux joueurs
              ou aux parents.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* Empty = everyone, so "Tous les groupes" is the reset. */}
              <Puce
                label="Tous les groupes"
                actif={visibilite.groupeIds.length === 0}
                onClick={() => majVisibilite({ groupeIds: [] })}
              />
              {groupes.map((g) => (
                <Puce
                  key={g.id}
                  label={g.nom}
                  actif={visibilite.groupeIds.includes(g.id)}
                  onClick={() =>
                    majVisibilite({
                      groupeIds: visibilite.groupeIds.includes(g.id)
                        ? visibilite.groupeIds.filter((x) => x !== g.id)
                        : [...visibilite.groupeIds, g.id],
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Structure — the weeks, and what each holds. */}
      <section className="flex flex-col gap-4 rounded-lg border border-border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-ui text-[0.95rem] font-medium text-ink">
              Structure de la saison
            </h2>
            <p className="font-body text-[0.82rem] text-ink-muted">
              Une semaine supprimée emporte ses séances non planifiées.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              addProgSemaine(programme.id)
              notify("Semaine ajoutée.")
            }}
          >
            <CalendarPlus /> Ajouter une semaine
          </Button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-2">
          {semaines.map((semaine) => {
            const slots = programme.sessions.filter((s) => s.semaine === semaine)
            const faites = slots.filter((s) => s.seanceId).length
            return (
              <div
                key={semaine}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-ui text-[0.78rem] text-ink">
                    Semaine {semaine}
                  </span>
                  <span className="block truncate font-body text-[0.72rem] text-ink-muted">
                    {slots.length} séances · {faites} planifiée
                    {faites > 1 ? "s" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Supprimer la semaine ${semaine}`}
                  onClick={() => setSemaineASupprimer(semaine)}
                  className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* The one consequential action, kept apart and clearly labelled. */}
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-ui text-[0.95rem] font-medium text-ink">
            Vider les principes
          </h2>
          <p className="font-body text-[0.82rem] text-ink-muted">
            Remet les {definis} séances définies à « À définir ». Les séances
            déjà planifiées gardent leur date.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setViderOpen(true)}
          disabled={!definis}
        >
          <Eraser /> Vider
        </Button>
      </section>

      <ConfirmDialog
        open={viderOpen}
        onOpenChange={setViderOpen}
        title="Vider tous les principes ?"
        description={`Les ${definis} séances définies de ${categorie?.nom} repasseront à « À définir » pour tous ses groupes.`}
        confirmLabel="Vider"
        onConfirm={() => {
          for (const s of programme.sessions)
            if (s.principeId || s.special)
              updateProgSession(s.id, {
                principeId: undefined,
                special: undefined,
              })
          setViderOpen(false)
          notify("Principes vidés.")
        }}
      />

      <ConfirmDialog
        open={semaineASupprimer !== null}
        onOpenChange={(o) => !o && setSemaineASupprimer(null)}
        title={`Supprimer la semaine ${semaineASupprimer} ?`}
        description="Ses séances quittent le programme. Les semaines suivantes ne sont pas renumérotées."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (semaineASupprimer !== null)
            removeProgSemaine(programme.id, semaineASupprimer)
          setSemaineASupprimer(null)
          notify("Semaine supprimée.")
        }}
      />

      {toast ? <Toast key={toast.id} id={toast.id} msg={toast.msg} /> : null}
    </div>
  )
}

/** A labelled on/off row — the switch is the whole card, so it stays tappable. */
function Bascule({
  icon: Icon,
  label,
  aide,
  actif,
  onToggle,
}: {
  icon: typeof Users
  label: string
  aide: string
  actif: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
        actif ? "border-info" : "border-border hover:border-border-strong",
      )}
    >
      <Icon
        size={16}
        className={cn("shrink-0", actif ? "text-info" : "text-ink-muted")}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-ui text-[0.86rem] text-ink">{label}</span>
        <span className="block font-body text-[0.75rem] text-ink-muted">
          {aide}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          actif ? "bg-info" : "bg-surface-nested",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-ink transition-transform",
            actif && "translate-x-4",
          )}
        />
      </span>
    </button>
  )
}

function Puce({
  label,
  actif,
  onClick,
}: {
  label: string
  actif: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={cn(
        "rounded-pill border px-3.5 py-1.5 font-ui text-[0.78rem] transition-colors",
        actif
          ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
          : "border-border-strong text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  )
}

function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </dt>
      <dd className="font-body text-[0.88rem] text-ink">{valeur}</dd>
    </div>
  )
}
