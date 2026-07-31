import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Layers,
  MapPin,
  Target,
  Trash2,
  UserCog,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  POSTE_LABEL,
  type Categorie,
  type CategorieJoueur,
  type CategorieMatch,
} from "@/data/seed/categories"
import type { ProgrammeAnnuel, SeanceClub } from "@/data/seed/programmation"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { FormeChip } from "@/features/pole-technique/CategoriesScreen"
import {
  CATEGORIE_TABS,
  LIGNES,
  SAISON,
  bilanDe,
  dateCourte,
  heureCourte,
  issueDe,
  pluriel,
  tauxDe,
  tauxMoyen,
  type Bilan,
  type CategorieTab,
} from "@/features/pole-technique/categorieUi"
import {
  heureDe,
  jourDe,
  moisCourtDe,
  statutVariant,
} from "@/features/pole-technique/seanceUi"

const LIST = "/pole-technique/categories"

/**
 * One catégorie: who is in it, how its season is going, what it trains. The
 * groupe switcher scopes the effectif; the four tabs are real routes so a tab
 * can be linked to directly.
 */
export function CategoryDetailScreen() {
  const { slug, tab } = useParams()
  const navigate = useNavigate()
  const { categories, seancesClub, programmesAnnuels, removeCategorie } = useData()

  const categorie = categories.find((c) => c.id === slug)
  const [groupeId, setGroupeId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const activeTab: CategorieTab = CATEGORIE_TABS.some((t) => t.value === tab)
    ? (tab as CategorieTab)
    : "effectif"

  const groupeActif =
    groupeId && categorie?.groupes.some((g) => g.id === groupeId) ? groupeId : null

  const joueurs = useMemo(
    () =>
      (categorie?.joueurs ?? []).filter(
        (j) => !groupeActif || j.groupeId === groupeActif,
      ),
    [categorie, groupeActif],
  )

  if (!categorie) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <BackButton to={LIST} label="Retour aux catégories" />
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Layers}
            title="Catégorie introuvable"
            description="Cette catégorie a été supprimée ou n'existe plus."
            action={
              <Button variant="outline" onClick={() => navigate(LIST)}>
                Retour aux catégories
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const bilan = bilanDe(categorie.matchs)
  const taux = tauxMoyen(categorie, groupeActif)
  const seances = seancesClub.filter((s) => s.categorie === categorie.nom)

  return (
    <div className="mx-auto w-full max-w-6xl">
      <BackButton to={LIST} label="Retour aux catégories" />

      <div className="flex flex-col gap-6">
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-nested font-ui text-[0.72rem] text-ink-muted">
                {categorie.image ? (
                  <img src={categorie.image} alt="" className="size-full object-cover" />
                ) : (
                  categorie.nom.slice(0, 3)
                )}
              </span>
              {categorie.nom}
            </span>
          }
          subtitle={`${categorie.genre} · Saison ${SAISON}`}
          actions={
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 /> Supprimer
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Info icon={Users} label="Joueurs" value={String(joueurs.length)} />
          <Info
            icon={UserCog}
            label="Éducateurs"
            value={String(categorie.educateurs.length)}
          />
          <Info
            icon={Layers}
            label="Groupes"
            value={String(categorie.groupes.length)}
          />
          <Info
            icon={Target}
            label="Présence moyenne"
            value={taux === null ? "—" : `${taux} %`}
          />
        </div>

        {/* Groupe switcher — scopes the effectif, like the real product. */}
        {categorie.groupes.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setGroupeId(null)}
              aria-pressed={groupeActif === null}
              className={cn(
                "rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] transition-colors",
                groupeActif === null
                  ? "border-border-second bg-surface-nested text-ink"
                  : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
              )}
            >
              Tous les groupes
            </button>
            {categorie.groupes.map((g) => {
              const n = categorie.joueurs.filter((j) => j.groupeId === g.id).length
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupeId(g.id)}
                  aria-pressed={groupeActif === g.id}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] transition-colors",
                    groupeActif === g.id
                      ? "border-border-second bg-surface-nested text-ink"
                      : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                  )}
                >
                  {g.nom}
                  <span className="font-ui text-[0.68rem] text-ink-disabled tabular-nums">
                    {n}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}

        {/* Tabs are routes, so a tab is linkable. */}
        <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1">
          {CATEGORIE_TABS.map((t) => (
            <Link
              key={t.value}
              to={`${LIST}/${categorie.id}/${t.value}`}
              aria-current={t.value === activeTab ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-3.5 py-2.5 font-ui text-[0.82rem] transition-colors",
                t.value === activeTab
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {activeTab === "effectif" ? (
          <EffectifTab categorie={categorie} joueurs={joueurs} />
        ) : null}
        {activeTab === "resultats" ? (
          <ResultatsTab matchs={categorie.matchs} bilan={bilan} />
        ) : null}
        {activeTab === "seances" ? (
          <SeancesTab
            seances={seances}
            onOpen={(id) => navigate(`/pole-technique/seances/${id}`)}
          />
        ) : null}
        {activeTab === "programme" ? (
          <ProgrammeTab
            categorie={categorie}
            programmes={programmesAnnuels.filter(
              (p) => p.categorieId === categorie.id && p.saison === SAISON,
            )}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer cette catégorie ?"
        description={`« ${categorie.nom} » et son effectif seront retirés du club.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeCategorie(categorie.id)
          navigate(LIST)
        }}
      />
    </div>
  )
}

/* ── Effectif ─────────────────────────────────────────────────────────────── */

function EffectifTab({
  categorie,
  joueurs,
}: {
  categorie: Categorie
  joueurs: CategorieJoueur[]
}) {
  if (joueurs.length === 0 && categorie.educateurs.length === 0) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={Users}
          title="Catégorie à constituer"
          description="Aucun joueur ni éducateur n'est encore rattaché à cette catégorie."
        />
      </div>
    )
  }

  const connus = LIGNES.flatMap((l) => l.postes)
  const autres = joueurs.filter((j) => !connus.includes(j.poste))

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
      <section className="flex flex-col gap-2 lg:w-[18rem] lg:shrink-0">
        <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
          Éducateurs · {categorie.educateurs.length}
        </h2>
        {categorie.educateurs.length === 0 ? (
          <p className="rounded-lg border border-border px-4 py-5 text-center font-body text-[0.82rem] text-ink-disabled">
            Aucun éducateur rattaché.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {categorie.educateurs.map((e) => (
              <li
                key={e}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.66rem] text-ink-muted">
                  {e
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="min-w-0 truncate font-ui text-[0.86rem] text-ink">
                  {e}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {LIGNES.map((ligne) => {
          const rows = joueurs.filter((j) => ligne.postes.includes(j.poste))
          if (!rows.length) return null
          return (
            <section key={ligne.label} className="flex flex-col gap-2">
              <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                {ligne.label} · {rows.length}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {rows.map((j) => (
                  <JoueurRow key={j.id} joueur={j} />
                ))}
              </ul>
            </section>
          )
        })}

        {/* Any post outside the four lines still has to show up. */}
        {autres.length ? (
          <section className="flex flex-col gap-2">
            <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              Autres · {autres.length}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {autres.map((j) => (
                <JoueurRow key={j.id} joueur={j} />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function JoueurRow({ joueur }: { joueur: CategorieJoueur }) {
  const taux = tauxDe(joueur.presences, joueur.seances)
  return (
    <li className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-nested font-ui text-[0.6rem] text-ink-muted">
        {joueur.photo ? (
          <img
            src={joueur.photo}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          joueur.poste
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-ui text-[0.88rem] text-ink">{joueur.nom}</span>
        <span className="font-ui text-[0.7rem] text-ink-muted">
          {POSTE_LABEL[joueur.poste] ?? joueur.poste}
        </span>
      </span>

      {/* Attendance: a bar reads faster than a number down a long list. Below
          70% it turns to warning — a real signal, not decoration. */}
      {taux === null ? (
        <span className="shrink-0 font-ui text-[0.7rem] text-ink-disabled">
          Non relevé
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden
            className="hidden h-1 w-20 overflow-hidden rounded-pill bg-surface-nested sm:block"
          >
            <span
              className={cn(
                "block h-full rounded-pill",
                taux < 70 ? "bg-warning" : "bg-info",
              )}
              style={{ width: `${taux}%` }}
            />
          </span>
          <span
            className={cn(
              "w-11 text-right font-ui text-[0.75rem] tabular-nums",
              taux < 70 ? "text-warning" : "text-ink-muted",
            )}
          >
            {taux} %
          </span>
        </span>
      )}
    </li>
  )
}

/* ── Résultats ────────────────────────────────────────────────────────────── */

function ResultatsTab({ matchs, bilan }: { matchs: CategorieMatch[]; bilan: Bilan }) {
  if (matchs.length === 0) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={CalendarDays}
          title="Aucun match"
          description="Le calendrier de cette catégorie n'a pas encore été rempli."
        />
      </div>
    )
  }

  const joues = matchs.filter((m) => m.termine)
  const aVenir = matchs.filter((m) => !m.termine)
  const diff = bilan.butsPour - bilan.butsContre

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Chiffre label="Joués" value={String(bilan.joues)} />
        <Chiffre
          label="V · N · D"
          value={`${bilan.victoires} · ${bilan.nuls} · ${bilan.defaites}`}
        />
        <Chiffre label="Buts" value={`${bilan.butsPour} : ${bilan.butsContre}`} />
        <Chiffre
          label="Différence"
          value={`${diff > 0 ? "+" : ""}${diff}`}
          tone={diff > 0 ? "success" : diff < 0 ? "danger" : undefined}
        />
      </div>

      {bilan.joues > 0 ? (
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Bilan de la saison
          </h2>
          {/* The neon --success reads far too hot across a full-width bar, so
              this uses the softer status greens/reds the system provides. */}
          <div className="flex h-2 overflow-hidden rounded-pill bg-surface-nested">
            <span
              className="block bg-success-600"
              style={{ width: `${(bilan.victoires / bilan.joues) * 100}%` }}
            />
            <span
              className="block bg-border-strong"
              style={{ width: `${(bilan.nuls / bilan.joues) * 100}%` }}
            />
            <span
              className="block bg-error-600"
              style={{ width: `${(bilan.defaites / bilan.joues) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-ui text-[0.75rem]">
            <span className="text-success-600">
              {pluriel(bilan.victoires, "victoire")}
            </span>
            <span className="text-ink-muted">{pluriel(bilan.nuls, "nul")}</span>
            <span className="text-error-600">
              {pluriel(bilan.defaites, "défaite")}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              {bilan.forme.map((f, i) => (
                <FormeChip key={i} issue={f} />
              ))}
            </span>
          </div>
        </section>
      ) : null}

      {aVenir.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            À venir · {aVenir.length}
          </h2>
          <ul className="flex flex-col gap-2">
            {aVenir
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
          </ul>
        </section>
      ) : null}

      {joues.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Résultats · {joues.length}
          </h2>
          <ul className="flex flex-col gap-2">
            {joues.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function MatchRow({ match }: { match: CategorieMatch }) {
  const issue = issueDe(match)
  return (
    <li className="flex items-center gap-3.5 rounded-lg border border-border p-3">
      <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-surface-nested">
        <span className="font-ui text-[0.85rem] leading-none text-ink tabular-nums">
          {new Date(match.date).getUTCDate()}
        </span>
        <span className="mt-0.5 font-ui text-[0.58rem] text-ink-disabled">
          {dateCourte(match.date).split(" ")[1]}
        </span>
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-ui text-[0.88rem] text-ink">
            {match.domicile ? "Reçoit" : "Se déplace à"} {match.adversaire}
          </span>
          <span className="rounded-pill border border-border px-2 py-0.5 font-ui text-[0.6rem] tracking-[0.06em] text-ink-disabled uppercase">
            {match.type}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-ui text-[0.7rem] text-ink-disabled">
          <span>
            {dateCourte(match.date)} · {heureCourte(match.date)}
          </span>
          {match.lieu ? (
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <MapPin size={11} /> {match.lieu}
            </span>
          ) : null}
        </span>
      </span>

      {match.termine && issue ? (
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="font-ui text-[0.95rem] text-ink tabular-nums">
            {match.butsPour} - {match.butsContre}
          </span>
          <FormeChip issue={issue} />
        </span>
      ) : (
        <span className="shrink-0 font-ui text-[0.7rem] tracking-[0.06em] text-ink-disabled uppercase">
          À jouer
        </span>
      )}
    </li>
  )
}

/* ── Séances ──────────────────────────────────────────────────────────────── */

function SeancesTab({
  seances,
  onOpen,
}: {
  seances: SeanceClub[]
  onOpen: (id: string) => void
}) {
  if (!seances.length) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={ClipboardList}
          title="Aucune séance"
          description="Aucune séance n'a encore été planifiée pour cette catégorie."
          action={
            <Button variant="outline" asChild>
              <Link to="/pole-technique/programmation">
                Ouvrir le programme annuel
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {seances.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => onOpen(s.id)}
            className="group relative flex w-full items-center gap-3.5 overflow-hidden rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-border-strong"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
            />
            <span className="relative z-10 flex size-11 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-surface-nested">
              <span className="font-ui text-[0.85rem] leading-none text-ink tabular-nums">
                {jourDe(s.date)}
              </span>
              <span className="mt-0.5 font-ui text-[0.58rem] text-ink-disabled">
                {moisCourtDe(s.date)}
              </span>
            </span>
            <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-ui text-[0.88rem] text-ink transition-colors group-hover:text-brand-blue-600">
                Séance {s.numero}
              </span>
              <span className="font-ui text-[0.7rem] text-ink-disabled">
                {heureDe(s.date)} · {s.duree} min · {s.groupe}
              </span>
            </span>
            <span className="relative z-10 flex shrink-0 items-center gap-2">
              <Badge variant={statutVariant[s.statut]}>{s.statut}</Badge>
              <ChevronRight size={16} className="hidden text-ink-disabled sm:block" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ── Programme annuel ─────────────────────────────────────────────────────── */

function ProgrammeTab({
  categorie,
  programmes,
}: {
  categorie: Categorie
  programmes: ProgrammeAnnuel[]
}) {
  // A programme is built per groupe — a catégorie can have several, or none.
  if (programmes.length === 0) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={CalendarDays}
          title="Pas de programme annuel"
          description={`Aucun programme n'a été construit pour ${categorie.nom} cette saison.`}
          action={
            <Button variant="outline" asChild>
              <Link to="/pole-technique/programmation">Ouvrir la programmation</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const sessions = programmes.reduce((n, p) => n + p.sessions.length, 0)
  const planifiees = programmes.reduce(
    (n, p) => n + p.sessions.filter((s) => s.seanceId).length,
    0,
  )

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Chiffre label="Séances au programme" value={String(sessions)} />
        <Chiffre label="Planifiées" value={String(planifiees)} />
        <Chiffre label="À programmer" value={String(sessions - planifiees)} />
      </div>

      {/* One line per groupe — that's the grain a programme is built at. */}
      <ul className="flex flex-col gap-1.5">
        {programmes.map((p) => {
          const faites = p.sessions.filter((s) => s.seanceId).length
          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5"
            >
              <span className="font-ui text-[0.82rem] text-ink">{p.groupe}</span>
              <span className="font-ui text-[0.74rem] text-ink-muted tabular-nums">
                {faites} / {p.sessions.length} planifiées
              </span>
            </li>
          )
        })}
      </ul>

      <Button asChild className="sm:self-start">
        <Link to="/pole-technique/programmation">
          <CalendarDays /> Ouvrir le programme annuel
        </Link>
      </Button>
    </section>
  )
}

/* ── Small shared bits ────────────────────────────────────────────────────── */

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border px-4 py-3.5">
      <span className="flex items-center gap-1.5 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        <Icon size={11} /> {label}
      </span>
      <span className="font-ui text-lg font-semibold text-ink tabular-nums">
        {value}
      </span>
    </div>
  )
}

function Chiffre({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "success" | "danger"
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3.5">
      <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-ui text-lg font-semibold tabular-nums",
          tone === "success"
            ? "text-success"
            : tone === "danger"
              ? "text-danger"
              : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  )
}
