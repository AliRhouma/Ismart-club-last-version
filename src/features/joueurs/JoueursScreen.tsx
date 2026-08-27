import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Check,
  Layers,
  Search,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  POSTES,
  POSTE_LABEL,
  type Categorie,
  type CategorieJoueur,
} from "@/data/seed/categories"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, inputCls } from "@/features/finance/ui"
import { tauxDe, tauxMoyen, pluriel } from "@/features/pole-technique/categorieUi"

/**
 * Ressources humaines — Joueurs.
 *
 * The club's whole effectif, read the way it is organised: a joueur belongs to
 * a catégorie (U10, U12, Minime, Senior…) and, inside it, to a groupe (A, B,
 * C). Landing on "toutes les catégories" would be a 450-row dump, so the page
 * opens on the catégories themselves and drills into one roster — which is
 * also the grain a convocation is built at (Séance ▸ Convocation).
 *
 * Referenced CategoryDetailScreen (effectif rows, taux de présence bar) and
 * the Documents grid (navigable-card anatomy) for the catégorie tiles.
 */
export function JoueursScreen() {
  const { categories, updateJoueurGroupe } = useData()
  const { toast, notify } = useToast()

  const [categorieId, setCategorieId] = useState("")
  const [groupeId, setGroupeId] = useState("")
  const [q, setQ] = useState("")
  const [fiche, setFiche] = useState<{ categorie: Categorie; joueur: CategorieJoueur } | null>(null)

  const totalJoueurs = categories.reduce((n, c) => n + c.joueurs.length, 0)
  const totalGroupes = categories.reduce((n, c) => n + c.groupes.length, 0)

  const categorie = categories.find((c) => c.id === categorieId) ?? null

  // Search runs across the whole club — a coach looking for "Hamza" doesn't
  // know which catégorie he is in.
  const resultats = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return []
    const rows: { categorie: Categorie; joueur: CategorieJoueur }[] = []
    for (const c of categories) {
      for (const j of c.joueurs) {
        if (
          j.nom.toLowerCase().includes(query) ||
          (POSTE_LABEL[j.poste] ?? j.poste).toLowerCase().includes(query) ||
          c.nom.toLowerCase().includes(query)
        ) {
          rows.push({ categorie: c, joueur: j })
        }
      }
    }
    return rows
  }, [categories, q])

  // The live fiche row, so a groupe change re-renders the modal underneath.
  const ficheLive = fiche
    ? (() => {
        const c = categories.find((x) => x.id === fiche.categorie.id)
        const j = c?.joueurs.find((x) => x.id === fiche.joueur.id)
        return c && j ? { categorie: c, joueur: j } : null
      })()
    : null

  const pickCategorie = (id: string) => {
    setCategorieId(id)
    setGroupeId("")
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Joueurs"
        subtitle={`${totalJoueurs} joueurs · ${categories.length} catégories · ${totalGroupes} groupes`}
        actions={
          categorie ? (
            <Button variant="outline" size="sm" onClick={() => pickCategorie("")}>
              Toutes les catégories
            </Button>
          ) : null
        }
      />

      {/* Toolbar: recherche (tout le club) + catégorie. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un joueur dans tout le club…"
            className={cn(inputCls, "pl-9")}
          />
          {q ? (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => setQ("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-disabled transition-colors hover:text-ink"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
        <div className="sm:w-64">
          <Select
            value={categorieId}
            onChange={pickCategorie}
            placeholder="Toutes les catégories"
            options={categories.map((c) => ({
              value: c.id,
              label: `${c.nom} · ${pluriel(c.joueurs.length, "joueur")}`,
            }))}
          />
        </div>
      </div>

      {q ? (
        <SearchResults
          rows={resultats}
          onOpen={(row) => setFiche(row)}
        />
      ) : categorie ? (
        <CategorieRoster
          categorie={categorie}
          groupeId={groupeId}
          onGroupe={setGroupeId}
          onOpen={(joueur) => setFiche({ categorie, joueur })}
        />
      ) : (
        <CategoriesGrid categories={categories} onPick={pickCategorie} />
      )}

      {ficheLive ? (
        <JoueurFiche
          categorie={ficheLive.categorie}
          joueur={ficheLive.joueur}
          onClose={() => setFiche(null)}
          onMove={(groupe) => {
            updateJoueurGroupe(ficheLive.categorie.id, ficheLive.joueur.id, groupe.id)
            notify(`${ficheLive.joueur.nom} déplacé vers ${groupe.nom}`)
          }}
        />
      ) : null}

      <Toast toast={toast} />
    </div>
  )
}

/* ── Catégories (landing) ───────────────────────────────────────────────── */

function CategoriesGrid({
  categories,
  onPick,
}: {
  categories: Categorie[]
  onPick: (id: string) => void
}) {
  if (!categories.length) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={Layers}
          title="Aucune catégorie"
          description="Créez une catégorie dans le Pôle Technique pour y rattacher des joueurs."
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => {
        const taux = tauxMoyen(c)
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
            />
            <div className="relative z-10 flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-ui text-[1.05rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
                    {c.nom}
                  </h3>
                  <p className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
                    {pluriel(c.joueurs.length, "joueur")} ·{" "}
                    {pluriel(c.groupes.length, "groupe")}
                  </p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
                  <Users size={18} />
                </span>
              </div>

              {/* Répartition — one segment per groupe, widths = head-count. */}
              {c.joueurs.length ? (
                <div className="flex flex-col gap-2">
                  <span className="flex h-1.5 overflow-hidden rounded-pill bg-surface-nested">
                    {c.groupes.map((g, i) => {
                      const n = c.joueurs.filter((j) => j.groupeId === g.id).length
                      const pct = (n / c.joueurs.length) * 100
                      return (
                        <span
                          key={g.id}
                          style={{ width: `${pct}%` }}
                          className={cn(
                            "block h-full",
                            i % 3 === 0
                              ? "bg-brand-blue-600"
                              : i % 3 === 1
                                ? "bg-info"
                                : "bg-border-strong",
                          )}
                        />
                      )
                    })}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 font-body text-[0.74rem] text-ink-muted">
                    {c.groupes.map((g) => (
                      <span key={g.id}>
                        {g.nom} ·{" "}
                        <span className="tabular-nums text-ink-subtle">
                          {c.joueurs.filter((j) => j.groupeId === g.id).length}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
              ) : (
                <p className="font-body text-[0.78rem] text-ink-disabled">
                  Catégorie à constituer — aucun joueur rattaché.
                </p>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="font-body text-[0.76rem] text-ink-muted">
                  {taux === null ? "Présence non relevée" : `Présence ${taux} %`}
                </span>
                <ArrowRight
                  size={15}
                  className="shrink-0 text-ink-disabled transition-colors group-hover:text-brand-blue-600"
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ── Un effectif, groupe par groupe ─────────────────────────────────────── */

function CategorieRoster({
  categorie,
  groupeId,
  onGroupe,
  onOpen,
}: {
  categorie: Categorie
  groupeId: string
  onGroupe: (id: string) => void
  onOpen: (joueur: CategorieJoueur) => void
}) {
  const groupes = groupeId
    ? categorie.groupes.filter((g) => g.id === groupeId)
    : categorie.groupes

  const sansGroupe = categorie.joueurs.filter(
    (j) => !categorie.groupes.some((g) => g.id === j.groupeId),
  )

  if (!categorie.joueurs.length) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={Users}
          title={`${categorie.nom} — effectif vide`}
          description="Aucun joueur n'est rattaché à cette catégorie pour l'instant."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Groupe chips — the same switcher as the catégorie detail screen. */}
      {categorie.groupes.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={groupeId === ""} onClick={() => onGroupe("")}>
            Tous les groupes · {categorie.joueurs.length}
          </Chip>
          {categorie.groupes.map((g) => (
            <Chip
              key={g.id}
              active={groupeId === g.id}
              onClick={() => onGroupe(g.id)}
            >
              {g.nom} ·{" "}
              {categorie.joueurs.filter((j) => j.groupeId === g.id).length}
            </Chip>
          ))}
        </div>
      ) : null}

      {groupes.map((g) => {
        const rows = sortJoueurs(
          categorie.joueurs.filter((j) => j.groupeId === g.id),
        )
        return (
          <section key={g.id} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
              {categorie.nom} — {g.nom}
              <span className="font-normal text-ink-disabled">
                · {pluriel(rows.length, "joueur")}
              </span>
            </h2>
            {rows.length ? (
              <ul className="overflow-hidden rounded-lg border border-border">
                {rows.map((j, i) => (
                  <JoueurRow
                    key={j.id}
                    joueur={j}
                    onClick={() => onOpen(j)}
                    first={i === 0}
                  />
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-border px-4 py-6 text-center font-body text-[0.82rem] text-ink-disabled">
                Groupe vide — déplacez-y un joueur depuis sa fiche.
              </p>
            )}
          </section>
        )
      })}

      {/* A joueur whose groupe was removed still has to be reachable. */}
      {!groupeId && sansGroupe.length ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.08em] text-warning uppercase">
            Sans groupe · {sansGroupe.length}
          </h2>
          <ul className="overflow-hidden rounded-lg border border-border">
            {sortJoueurs(sansGroupe).map((j, i) => (
              <JoueurRow
                key={j.id}
                joueur={j}
                onClick={() => onOpen(j)}
                first={i === 0}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

/* ── Recherche (tout le club) ───────────────────────────────────────────── */

function SearchResults({
  rows,
  onOpen,
}: {
  rows: { categorie: Categorie; joueur: CategorieJoueur }[]
  onOpen: (row: { categorie: Categorie; joueur: CategorieJoueur }) => void
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={Search}
          title="Aucun joueur trouvé"
          description="Essayez un autre nom, un poste (« gardien ») ou une catégorie."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        {pluriel(rows.length, "résultat")}
      </h2>
      <ul className="overflow-hidden rounded-lg border border-border">
        {rows.slice(0, 60).map((row, i) => (
          <JoueurRow
            key={`${row.categorie.id}-${row.joueur.id}`}
            joueur={row.joueur}
            contexte={`${row.categorie.nom} · ${
              row.categorie.groupes.find((g) => g.id === row.joueur.groupeId)?.nom ??
              "Sans groupe"
            }`}
            onClick={() => onOpen(row)}
            first={i === 0}
          />
        ))}
      </ul>
      {rows.length > 60 ? (
        <p className="font-body text-[0.76rem] text-ink-disabled">
          60 premiers résultats affichés — affinez la recherche.
        </p>
      ) : null}
    </div>
  )
}

/* ── Pièces partagées ───────────────────────────────────────────────────── */

/** Postes in pitch order, then alphabetical — an effectif reads that way. */
function sortJoueurs(rows: CategorieJoueur[]): CategorieJoueur[] {
  return [...rows].sort((a, b) => {
    const pa = POSTES.indexOf(a.poste)
    const pb = POSTES.indexOf(b.poste)
    return (
      (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a.nom.localeCompare(b.nom)
    )
  })
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] transition-colors",
        active
          ? "border-border-second bg-surface-nested text-ink"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}

function JoueurRow({
  joueur,
  contexte,
  onClick,
  first,
}: {
  joueur: CategorieJoueur
  contexte?: string
  onClick: () => void
  first: boolean
}) {
  const taux = tauxDe(joueur.presences, joueur.seances)
  return (
    <li className={cn(!first && "border-t border-border")}>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-hover sm:px-4"
      >
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
          <span className="truncate font-ui text-[0.88rem] text-ink">
            {joueur.nom}
          </span>
          <span className="truncate font-ui text-[0.72rem] text-ink-muted">
            {POSTE_LABEL[joueur.poste] ?? joueur.poste}
            {contexte ? ` · ${contexte}` : ""}
          </span>
        </span>

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
      </button>
    </li>
  )
}

/* ── Fiche joueur (modal) ───────────────────────────────────────────────── */

function JoueurFiche({
  categorie,
  joueur,
  onClose,
  onMove,
}: {
  categorie: Categorie
  joueur: CategorieJoueur
  onClose: () => void
  onMove: (groupe: { id: string; nom: string }) => void
}) {
  const taux = tauxDe(joueur.presences, joueur.seances)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[460px]">
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-nested font-ui text-[0.68rem] text-ink-muted">
            {joueur.photo ? (
              <img src={joueur.photo} alt="" className="size-full object-cover" />
            ) : (
              joueur.poste
            )}
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-ui text-base font-medium text-ink">
              {joueur.nom}
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {POSTE_LABEL[joueur.poste] ?? joueur.poste} · {categorie.nom}
            </DialogDescription>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 py-4">
          <Mini label="Présences" value={`${joueur.presences}/${joueur.seances}`} />
          <Mini label="Taux" value={taux === null ? "—" : `${taux} %`} />
          <Mini label="Naissance" value={joueur.naissance ?? "—"} mono />
        </div>

        {/* Changer de groupe — a durable move inside the catégorie. For a
            one-off move (one séance only) the convocation builder is the right
            place, and this modal says so. */}
        <div className="border-t border-border px-5 py-4">
          <h4 className="font-ui text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            Groupe dans la catégorie
          </h4>
          <div className="mt-3 flex flex-col gap-1.5">
            {categorie.groupes.map((g) => {
              const active = g.id === joueur.groupeId
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => !active && onMove(g)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-left font-ui text-[0.85rem] transition-colors",
                    active
                      ? "border-info/40 bg-info/10 text-ink"
                      : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                  )}
                >
                  {g.nom}
                  {active ? (
                    <Check size={15} className="shrink-0 text-info" />
                  ) : (
                    <span className="font-body text-[0.74rem] text-ink-disabled">
                      Déplacer ici
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-3 font-body text-[0.76rem] text-ink-disabled">
            Pour un déplacement valable sur une seule séance, utilisez le mode
            « Déplacements » de la{" "}
            <Link
              to="/planification"
              className="text-info transition-colors hover:text-ink"
            >
              convocation
            </Link>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Mini({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border px-3 py-2.5">
      <span
        className={cn(
          "truncate text-[0.88rem] text-ink",
          mono ? "font-mono text-[0.78rem]" : "font-ui",
        )}
      >
        {value}
      </span>
      <span className="font-ui text-[0.62rem] tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </span>
    </div>
  )
}
