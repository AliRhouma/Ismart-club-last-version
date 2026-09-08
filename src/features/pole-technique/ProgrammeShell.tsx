import { useEffect, useRef, useState } from "react"
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"
import { CalendarDays, Layers, Target } from "lucide-react"

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
  PROGRAMME_TABS,
  cheminProgramme,
  cheminSaison,
} from "@/features/pole-technique/programmationRoutes"
import { ProgrammeActions } from "@/features/pole-technique/ProgrammeActions"
import { useProgramme } from "@/features/pole-technique/useProgramme"
import { Toast } from "@/features/sponsoring/ui"

/**
 * One programme annuel, four tabs. The shell owns everything the tabs share —
 * where you are (back + title), what you are looking at (the three scope
 * selects) and which tab is open. Each tab is a real route, so any of them can
 * be linked to or reloaded directly.
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
  const ongletActif =
    PROGRAMME_TABS.find((t) => t.value === reste)?.value ?? ""

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <BackButton to={cheminSaison(saison)} label={`Équipes · ${saison}`} />
        <PageHeader
          title={categorie.nom}
          subtitle={`${saison} · le programme annuel : ce que chaque séance de la saison doit travailler.`}
          actions={
            <>
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

      {/* Tabs are routes, so a tab is linkable. */}
      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1">
        {PROGRAMME_TABS.map((t) => (
          <Link
            key={t.value || "programmation"}
            to={t.value ? `${base}/${t.value}` : base}
            aria-current={t.value === ongletActif ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3.5 py-2.5 font-ui text-[0.82rem] transition-colors",
              t.value === ongletActif
                ? "border-ink text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Outlet />

      {toast ? <Toast key={toast.id} id={toast.id} msg={toast.msg} /> : null}
    </div>
  )
}

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
