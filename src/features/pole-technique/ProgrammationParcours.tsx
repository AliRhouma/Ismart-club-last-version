import type { ReactNode } from "react"
import { useMemo } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Layers,
  Target,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { SAISON_ACTIVE } from "@/data/seed/programmation"
import type { ProgrammeAnnuel } from "@/data/seed/programmation"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Badge } from "@/components/kit/Badge"
import { Bar } from "@/features/budget/ui"
import { pluriel } from "@/features/pole-technique/categorieUi"
import {
  cheminProgramme,
  cheminSaison,
  saisonDepuisSlug,
} from "@/features/pole-technique/programmationRoutes"

/* ── Shared card shell ────────────────────────────────────────────────────── */

/**
 * Every step of the parcours is the same navigable card (design-system "Card
 * anatomy"): flush with the page at rest, the surface fill descending on hover.
 * The three screens only differ in what they put inside it.
 */
function CarteNav({
  onOpen,
  children,
  className,
}: {
  onOpen: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <span className="relative z-10 flex flex-1 flex-col gap-3.5 p-4">
        {children}
      </span>
    </button>
  )
}

/** Icon tile + title + one muted line — the common head of all three cards. */
function TeteDeCarte({
  icon: Icon,
  image,
  initiales,
  titre,
  sousTitre,
  badge,
}: {
  icon?: typeof CalendarDays
  image?: string
  initiales?: string
  titre: string
  sousTitre: string
  badge?: ReactNode
}) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-nested font-ui text-[0.78rem] text-ink-muted transition-colors group-hover:text-brand-blue-600">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : Icon ? (
          <Icon size={18} />
        ) : (
          initiales
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
            {titre}
          </span>
          {badge}
        </span>
        <span className="block truncate font-ui text-[0.72rem] text-ink-disabled">
          {sousTitre}
        </span>
      </span>
      <ChevronRight
        size={15}
        className="shrink-0 text-ink-disabled transition-colors group-hover:text-brand-blue-600"
      />
    </span>
  )
}

/** Coverage footer: "x / y" plus the bar, or a single muted line when empty. */
function Couverture({
  fait,
  total,
  libelle,
  vide,
}: {
  fait: number
  total: number
  libelle: string
  vide: string
}) {
  if (!fait)
    return (
      <span className="font-body text-[0.78rem] text-ink-disabled">{vide}</span>
    )
  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between font-ui text-[0.74rem] text-ink-muted">
        <span>{libelle}</span>
        <span className="text-ink">
          {fait}
          <span className="text-ink-disabled"> / {total}</span>
        </span>
      </span>
      <Bar sm value={total ? (fait / total) * 100 : 0} />
    </span>
  )
}

/* ── Counting helpers ─────────────────────────────────────────────────────── */

const compte = (progs: ProgrammeAnnuel[]) => ({
  seances: progs.reduce((n, p) => n + p.sessions.length, 0),
  planifiees: progs.reduce(
    (n, p) => n + p.sessions.filter((s) => s.seanceId).length,
    0,
  ),
})



/* ── Step 1 — the saison ──────────────────────────────────────────────────── */

export function ProgrammationSaisonsScreen() {
  const navigate = useNavigate()
  const { saisons, categories, programmesAnnuels } = useData()

  const lignes = useMemo(
    () =>
      saisons.map((saison) => {
        const progs = programmesAnnuels.filter((p) => p.saison === saison)
        return { saison, progs, ...compte(progs) }
      }),
    [saisons, programmesAnnuels],
  )
  const totalEquipes = categories.length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programmation"
        subtitle="Choisissez la saison à travailler, puis l'équipe et le groupe."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lignes.map(({ saison, progs, seances, planifiees }) => (
          <CarteNav
            key={saison}
            onOpen={() =>
              navigate(cheminSaison(saison))
            }
          >
            <TeteDeCarte
              icon={CalendarDays}
              titre={saison}
              sousTitre={
                progs.length
                  ? pluriel(progs.length, "programme")
                  : "Saison à ouvrir"
              }
              badge={
                saison === SAISON_ACTIVE ? (
                  <Badge variant="info">En cours</Badge>
                ) : null
              }
            />

            <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-ui text-[0.74rem] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <Target size={12} /> {pluriel(seances, "séance")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarCheck2 size={12} /> {planifiees} planifiées
              </span>
            </span>

            <Couverture
              fait={progs.length}
              total={totalEquipes}
              libelle="Équipes couvertes"
              vide="Aucun programme sur cette saison."
            />
          </CarteNav>
        ))}
      </div>
    </div>
  )
}

/* ── Step 2 — the équipe ──────────────────────────────────────────────────── */

export function ProgrammationEquipesScreen() {
  const navigate = useNavigate()
  const { saison: slugSaison } = useParams()
  const { saisons, categories, programmesAnnuels } = useData()

  const saison = saisonDepuisSlug(slugSaison ?? "", saisons)

  // One programme per équipe: it either exists for this saison or it doesn't.
  const lignes = useMemo(
    () =>
      categories.map((cat) => {
        const prog =
          programmesAnnuels.find(
            (p) => p.saison === saison && p.categorieId === cat.id,
          ) ?? null
        return { cat, prog, ...compte(prog ? [prog] : []) }
      }),
    [categories, programmesAnnuels, saison],
  )

  if (!saison) return <Navigate to="/pole-technique/programmation" replace />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackButton to="/pole-technique/programmation" label="Saisons" />
        <PageHeader
          title={saison}
          subtitle="Un programme annuel par équipe — tous ses groupes le suivent."
        />
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Layers}
            title="Aucune équipe"
            description="Créez une catégorie pour pouvoir la programmer."
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lignes.map(({ cat, prog, seances, planifiees }) => (
            <CarteNav
              key={cat.id}
              onOpen={() => navigate(cheminProgramme(saison, cat.id))}
            >
              <TeteDeCarte
                image={cat.image}
                initiales={cat.nom.slice(0, 3)}
                titre={cat.nom}
                sousTitre={cat.groupes.map((g) => g.nom).join(" · ")}
                badge={prog ? null : <Badge variant="warning">À créer</Badge>}
              />

              <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-ui text-[0.74rem] text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={12} /> {pluriel(cat.joueurs.length, "joueur")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Target size={12} /> {pluriel(seances, "séance")}
                </span>
              </span>

              <Couverture
                fait={planifiees}
                total={seances}
                libelle="Séances planifiées"
                vide={
                  prog
                    ? "Programme prêt, aucune séance planifiée."
                    : "Pas encore de programme pour cette saison."
                }
              />
            </CarteNav>
          ))}
        </div>
      )}
    </div>
  )
}
