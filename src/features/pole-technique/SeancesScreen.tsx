import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, ChevronRight, Clock, MapPin, Users, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { SeanceClub, SeanceStatut } from "@/data/seed/programmation"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { Badge } from "@/components/kit/Badge"
import { Button } from "@/components/ui/button"
import {
  heureDe,
  jourDe,
  moisCourtDe,
  moisDe,
  statutVariant,
} from "@/features/pole-technique/seanceUi"

type Filtre = "Toutes" | SeanceStatut

export function SeancesScreen() {
  const navigate = useNavigate()
  const { seancesClub, procedePrincipes } = useData()

  const [filtre, setFiltre] = useState<Filtre>("Toutes")
  const [brouillons, setBrouillons] = useState(false)

  const principeById = useMemo(
    () => new Map(procedePrincipes.map((p) => [p.id, p])),
    [procedePrincipes],
  )
  const themeOf = (s: SeanceClub) =>
    s.principeId ? (principeById.get(s.principeId)?.nom ?? "") : (s.special ?? "")

  const compte = (st: SeanceStatut) =>
    seancesClub.filter((s) => s.statut === st).length

  const visible = useMemo(
    () =>
      seancesClub.filter(
        (s) =>
          (filtre === "Toutes" || s.statut === filtre) &&
          (!brouillons || s.brouillon),
      ),
    [seancesClub, filtre, brouillons],
  )

  /** Grouped by month, newest month first — how a coach scans a season. */
  const parMois = useMemo(() => {
    const map = new Map<string, SeanceClub[]>()
    for (const s of visible) {
      const k = moisDe(s.date)
      const arr = map.get(k) ?? map.set(k, []).get(k)!
      arr.push(s)
    }
    return [...map.entries()].map(([mois, rows]) => ({
      mois,
      rows: rows.sort((a, b) => a.date.localeCompare(b.date)),
    }))
  }, [visible])

  const filtre_actif = filtre !== "Toutes" || brouillons

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Séances"
        subtitle="Les séances d'entraînement de la saison, issues du programme annuel."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/pole-technique/programmation")}
          >
            <CalendarDays /> Programme annuel
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Séances" value={seancesClub.length} />
        <Stat label="À venir" value={compte("À venir")} />
        <Stat label="En cours" value={compte("En cours")} />
        <Stat label="Terminées" value={compte("Terminée")} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-pill border border-border p-1">
          {(["Toutes", "À venir", "En cours", "Terminée"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltre(f)}
              className={cn(
                "shrink-0 rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] font-medium transition-colors",
                f === filtre
                  ? "border-border-second bg-surface-nested text-ink"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          type="button"
          role="checkbox"
          aria-checked={brouillons}
          onClick={() => setBrouillons((v) => !v)}
          className={cn(
            "rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] transition-colors",
            brouillons
              ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
              : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
          )}
        >
          Brouillons
        </button>

        {filtre_actif ? (
          <button
            type="button"
            onClick={() => {
              setFiltre("Toutes")
              setBrouillons(false)
            }}
            className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
          >
            <X size={13} /> Réinitialiser
          </button>
        ) : null}

        <p className="ml-auto font-body text-sm text-ink-muted">
          <span className="text-ink">{visible.length}</span> séance
          {visible.length > 1 ? "s" : ""}
        </p>
      </div>

      {parMois.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={CalendarDays}
            title={
              filtre_actif ? "Aucune séance ne correspond" : "Aucune séance"
            }
            description={
              filtre_actif
                ? "Changez de statut pour retrouver les séances de la saison."
                : "Planifiez une ligne du programme annuel pour créer la première séance."
            }
            action={
              filtre_actif ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltre("Toutes")
                    setBrouillons(false)
                  }}
                >
                  <X /> Réinitialiser
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/pole-technique/programmation")}
                >
                  <CalendarDays /> Ouvrir le programme
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {parMois.map(({ mois, rows }) => (
            <section key={mois} className="flex flex-col gap-2">
              <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                {mois}
              </h2>
              <div className="flex flex-col gap-2">
                {rows.map((s) => (
                  <SeanceRow
                    key={s.id}
                    seance={s}
                    theme={themeOf(s)}
                    onOpen={() => navigate(`/pole-technique/seances/${s.id}`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3.5">
      <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </span>
      <span className="font-ui text-xl font-semibold text-ink tabular-nums">
        {value}
      </span>
    </div>
  )
}

function SeanceRow({
  seance,
  theme,
  onOpen,
}: {
  seance: SeanceClub
  theme: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-background p-3.5 text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      {/* Date block — the anchor a coach scans down the list. */}
      <span className="relative z-10 flex size-12 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-surface-nested">
        <span className="font-ui text-[0.95rem] leading-none text-ink tabular-nums">
          {jourDe(seance.date)}
        </span>
        <span className="mt-0.5 font-ui text-[0.6rem] text-ink-disabled">
          {moisCourtDe(seance.date)}
        </span>
      </span>

      <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-ui text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
            Séance {seance.numero}
          </span>
          {seance.brouillon ? (
            <span className="rounded-pill border border-border px-2 py-0.5 font-ui text-[0.62rem] tracking-[0.06em] text-ink-disabled uppercase">
              Brouillon
            </span>
          ) : null}
        </span>
        <span className="truncate font-ui text-[0.78rem] text-ink-muted">
          {theme || "Thème à définir"}
        </span>
        {/* Facts drop off progressively as the row narrows. */}
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1 font-ui text-[0.7rem] text-ink-disabled">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={11} /> {heureDe(seance.date)} · {seance.duree} min
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Users size={11} /> {seance.groupe}
          </span>
          {seance.installation ? (
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <MapPin size={11} /> {seance.installation}
            </span>
          ) : null}
        </span>
      </span>

      <span className="relative z-10 flex shrink-0 items-center gap-2">
        <Badge variant={statutVariant[seance.statut]}>{seance.statut}</Badge>
        <ChevronRight size={16} className="hidden text-ink-disabled sm:block" />
      </span>
    </button>
  )
}
