import { useEffect, useRef, useState } from "react"
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  CalendarDays,
  CalendarRange,
  ChartColumn,
  Layers,
  Settings2,
  Target,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PROGRAMME_VUES,
  cheminProgramme,
  cheminSaison,
} from "@/features/pole-technique/programmationRoutes"
import { ProgrammeActions } from "@/features/pole-technique/ProgrammeActions"
import { useProgramme } from "@/features/pole-technique/useProgramme"
import { Toast } from "@/features/sponsoring/ui"

/**
 * One programme annuel. The programmation itself *is* the page — its three
 * secondary views (planification, stats, réglages) sit as buttons in the header,
 * next to the séances link, instead of eating a tab bar's worth of vertical
 * space above content that is already dense.
 *
 * Each view is still a real route, so any of them can be linked to or reloaded
 * directly; the active one is marked and toggles back to the programmation.
 */
export function ProgrammeShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { saisons, categories } = useData()
  const { saison, categorie, groupes, programme, valide, allerVers } =
    useProgramme()

  // One toast for the whole section: the actions menu confirms in the same
  // place whichever tab is open underneath.
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // A hand-typed or stale URL falls back to the nearest valid step of the
  // parcours instead of rendering an empty programme.
  if (!valide || !saison || !categorie)
    return (
      <Navigate
        to={saison ? cheminSaison(saison) : "/pole-technique/programmation"}
        replace
      />
    )

  const base = cheminProgramme(saison, categorie.id)
  const reste = pathname.slice(base.length).replace(/^\/|\/$/g, "")
  const vueActive = PROGRAMME_VUES.find((v) => v.value === reste)?.value ?? ""

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <BackButton to={cheminSaison(saison)} label={`Équipes · ${saison}`} />
        <PageHeader
          title={categorie.nom}
          subtitle={`${saison} · le programme annuel : ce que chaque séance de la saison doit travailler.`}
          actions={
            <>
              {/* The three secondary views, as buttons. The active one reads
                  selected and clicking it again drops back to the programmation. */}
              {PROGRAMME_VUES.map((v) => {
                const actif = v.value === vueActive
                const Icon = VUE_ICONS[v.value]
                return (
                  <Button
                    key={v.value}
                    asChild
                    variant="outline"
                    size="sm"
                    aria-current={actif ? "page" : undefined}
                    className={cn(
                      actif &&
                        "border-border-second bg-surface-nested text-ink hover:bg-surface-nested",
                    )}
                  >
                    <Link
                      to={actif ? base : `${base}/${v.value}`}
                      title={
                        actif
                          ? "Retour à la programmation"
                          : `Ouvrir ${v.label.toLowerCase()}`
                      }
                    >
                      <Icon /> {v.label}
                    </Link>
                  </Button>
                )
              })}

              <span aria-hidden className="mx-1 h-5 w-px bg-border" />

              <Button
                variant="outline"
                onClick={() => navigate("/pole-technique/seances")}
              >
                <CalendarDays /> Voir les séances
              </Button>
              {programme ? (
                <ProgrammeActions
                  programme={programme}
                  groupes={groupes.map((g) => g.nom).join(" · ")}
                  onSupprime={() => navigate(cheminSaison(saison))}
                  onFait={(msg) => setToast({ id: toastId.current++, msg })}
                />
              ) : null}
            </>
          }
        />
      </div>

      {/* Scope — the same two axes as the parcours, so the coach can jump
          sideways without walking back up it. Each change navigates. The
          groupes are stated, not chosen: they all run this programme. */}
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ScopeSelect
            icon={CalendarDays}
            label="Saison"
            value={saison}
            onChange={(s) => allerVers({ saison: s })}
            options={saisons.map((s) => ({ value: s, label: s }))}
          />
          <ScopeSelect
            icon={Layers}
            label="Équipe"
            value={categorie.id}
            onChange={(categorieId) => allerVers({ categorieId })}
            options={categories.map((c) => ({ value: c.id, label: c.nom }))}
          />
        </div>
        <p className="flex flex-wrap items-center gap-2 font-ui text-[0.74rem] text-ink-muted">
          <Target size={12} className="text-ink-disabled" />
          Suivi par
          {groupes.length ? (
            groupes.map((g) => (
              <span
                key={g.id}
                className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 text-brand-blue-600"
              >
                {g.nom}
              </span>
            ))
          ) : (
            <span className="text-ink-disabled">aucun groupe</span>
          )}
        </p>
      </div>

      <Outlet />

      {toast ? <Toast key={toast.id} id={toast.id} msg={toast.msg} /> : null}
    </div>
  )
}

const VUE_ICONS = {
  planification: CalendarRange,
  stats: ChartColumn,
  reglages: Settings2,
} as const

/* ── Scope selects ────────────────────────────────────────────────────────── */

function ScopeSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        <Icon size={12} /> {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
