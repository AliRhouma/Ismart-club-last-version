import { useMemo, useState, type ReactNode } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  Check,
  ChevronRight,
  Inbox,
  Library,
  Lock,
  Settings2,
  Trash2,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  MOI,
  RESSOURCE_TYPES,
  TYPE_PLURIEL,
  type ParametresPartage,
  type PorteePartage,
  type Ressource,
  type RessourceType,
} from "@/data/seed/communaute"
import { Badge } from "@/components/kit/Badge"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import { Bar, Segmented } from "@/features/budget/ui"
import {
  ApercuModal,
  CarteRessource,
  ClubTile,
  GrilleRessources,
} from "@/features/communaute/CommunauteUi"
import {
  CHEMINS,
  cheminClub,
  dateFr,
  useCommunaute,
} from "@/features/communaute/communauteHelpers"

const selectCls =
  "rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-ink outline-none transition-colors focus:border-border-focus"

function Titre({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 className="font-ui text-lg font-medium text-ink">{children}</h2>
      {aside}
    </div>
  )
}

/** Shared aperçu + "retirer du partage" confirmation for any grid of cards. */
function useApercu() {
  const { notify } = useCommunaute()
  const { retirerPartage } = useData()
  const [ouverte, setOuverte] = useState<Ressource | null>(null)
  const [aRetirer, setARetirer] = useState<Ressource | null>(null)
  const noeud = (
    <>
      <ApercuModal
        ressource={ouverte}
        onClose={() => setOuverte(null)}
        onFait={notify}
        onRetirer={(r) => setARetirer(r)}
      />
      <ConfirmDialog
        open={!!aRetirer}
        onOpenChange={(o) => !o && setARetirer(null)}
        title="Retirer cette ressource du partage ?"
        description={
          aRetirer
            ? `« ${aRetirer.titre} » ne sera plus visible par vos partenaires. Ceux qui l'ont déjà importée la gardent.`
            : undefined
        }
        confirmLabel="Retirer"
        onConfirm={() => {
          if (!aRetirer) return
          retirerPartage(aRetirer.id)
          notify(`« ${aRetirer.titre} » n'est plus partagée.`)
          setARetirer(null)
          setOuverte(null)
        }}
      />
    </>
  )
  return { ouvrir: setOuverte, noeud }
}

/* ── Profil ─────────────────────────────────────────────────────────────── */

type Tri = "note" | "imports" | "vues"

/**
 * The numbers of what we share. Distributions are sorted bar lists (one hue,
 * read at a glance) rather than a many-colour donut — part-to-whole across
 * eight types reads better as ranked lengths.
 */
export function ProfilOnglet() {
  const { ressourcesCommunaute, importees } = useData()
  const { ouvrir, noeud } = useApercu()
  const [tri, setTri] = useState<Tri>("note")

  const miennes = ressourcesCommunaute.filter((r) => r.clubId === MOI)
  const exportees = miennes.filter((r) => r.imports > 0).length
  const partExportee = miennes.length ? Math.round((exportees / miennes.length) * 100) : 0
  const recues = importees
    .map((i) => ressourcesCommunaute.find((r) => r.id === i.ressourceId))
    .filter((r): r is Ressource => !!r)

  const meilleures = [...miennes]
    .sort((a, b) =>
      tri === "note"
        ? (b.note ?? 0) - (a.note ?? 0) || b.imports - a.imports
        : tri === "imports"
          ? b.imports - a.imports
          : b.vues - a.vues,
    )
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Tuile label="Exportées / non exportées">
          <span className="font-display text-[2.3rem] leading-none font-semibold text-ink">
            {partExportee} %
          </span>
          <Bar sm value={partExportee} />
          <span className="font-body text-[0.76rem] text-ink-muted">
            {exportees} importées par un partenaire · {miennes.length - exportees} pas encore
          </span>
        </Tuile>
        <Tuile label="Nombre total">
          <span className="font-display text-[2.3rem] leading-none font-semibold text-ink">
            {miennes.length}
          </span>
          <span className="font-body text-[0.76rem] text-ink-muted">ressources partagées</span>
        </Tuile>
        <Tuile label="Importations reçues">
          <span className="font-display text-[2.3rem] leading-none font-semibold text-ink">
            {miennes.reduce((n, r) => n + r.imports, 0)}
          </span>
          <span className="font-body text-[0.76rem] text-ink-muted">
            fois que vos ressources ont été reprises
          </span>
        </Tuile>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Distribution titre="Répartition des ressources partagées" ressources={miennes} />
        <Distribution titre="Répartition des ressources importées" ressources={recues} />
      </div>

      <section className="flex flex-col gap-4">
        <Titre
          aside={
            <Segmented
              value={tri}
              onChange={setTri}
              options={[
                { value: "note", label: "Par évaluation" },
                { value: "imports", label: "Par imports" },
                { value: "vues", label: "Par vues" },
              ]}
            />
          }
        >
          Les meilleures ressources partagées
        </Titre>
        <GrilleRessources
          ressources={meilleures}
          onOpen={ouvrir}
          vide={{ titre: "Rien de partagé pour l'instant" }}
        />
      </section>
      {noeud}
    </div>
  )
}

function Tuile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border px-5 py-[1.1rem]">
      <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

function Distribution({ titre, ressources }: { titre: string; ressources: Ressource[] }) {
  const total = ressources.length
  const lignes = RESSOURCE_TYPES.map((t) => ({
    t,
    n: ressources.filter((r) => r.type === t).length,
  })).sort((a, b) => b.n - a.n)
  const max = Math.max(1, ...lignes.map((l) => l.n))
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-ui text-[0.95rem] font-medium text-ink">{titre}</h3>
        <span className="font-ui text-sm text-ink-muted tabular-nums">{total} au total</span>
      </div>
      {total ? (
        <ul className="flex flex-col gap-2.5">
          {lignes.map(({ t, n }) => (
            <li
              key={t}
              title={`${TYPE_PLURIEL[t]} : ${n} (${Math.round((n / total) * 100)} %)`}
              className="grid grid-cols-[9.5rem_1fr_3.5rem] items-center gap-3"
            >
              <span className={cn("truncate font-body text-[0.8rem]", n ? "text-ink-subtle" : "text-ink-disabled")}>
                {TYPE_PLURIEL[t]}
              </span>
              <span className="h-2 overflow-hidden rounded-pill bg-accent">
                <span
                  className="block h-full rounded-pill bg-info transition-[width] duration-500"
                  style={{ width: `${(n / max) * 100}%` }}
                />
              </span>
              <span className={cn("text-right font-ui text-[0.8rem] tabular-nums", n ? "text-ink" : "text-ink-disabled")}>
                {n}
                {n ? <span className="text-ink-disabled"> · {Math.round((n / total) * 100)}%</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body text-[0.82rem] text-ink-disabled">Aucune ressource pour l'instant.</p>
      )}
    </div>
  )
}

/* ── Fichiers partagés ──────────────────────────────────────────────────── */

export function PartagesOnglet() {
  const { ressourcesCommunaute } = useData()
  const { ouvrir, noeud } = useApercu()
  const navigate = useNavigate()
  const [type, setType] = useState<RessourceType | "">("")
  const miennes = ressourcesCommunaute
    .filter((r) => r.clubId === MOI)
    .sort((a, b) => b.le.localeCompare(a.le))
  const visibles = miennes.filter((r) => !type || r.type === type)

  return (
    <section className="flex flex-col gap-4">
      <Titre
        aside={
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RessourceType | "")}
            aria-label="Type de ressource"
            className={selectCls}
          >
            <option value="">Tous les types ({miennes.length})</option>
            {RESSOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_PLURIEL[t]} ({miennes.filter((r) => r.type === t).length})
              </option>
            ))}
          </select>
        }
      >
        Ressources partagées
      </Titre>
      <GrilleRessources
        ressources={visibles}
        onOpen={ouvrir}
        afficherClub={false}
        vide={
          miennes.length
            ? { titre: `Aucun ${type ? TYPE_PLURIEL[type as RessourceType].toLowerCase() : "fichier"} partagé` }
            : {
                titre: "Vous ne partagez encore rien",
                description:
                  "Partagez un procédé ou un programme depuis sa fiche : il apparaîtra ici et chez vos partenaires.",
                action: (
                  <Button variant="outline" onClick={() => navigate(CHEMINS.partenairesParametres)}>
                    <Settings2 /> Paramètres de partage
                  </Button>
                ),
              }
        }
      />
      {noeud}
    </section>
  )
}

/* ── Partenaires (sub-navigation) ───────────────────────────────────────── */

type SousOnglet = "ressources" | "liste" | "parametres"

const SOUS_CHEMINS: Record<SousOnglet, string> = {
  ressources: CHEMINS.partenaires,
  liste: CHEMINS.partenairesListe,
  parametres: CHEMINS.partenairesParametres,
}

export function PartenairesLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { notify } = useCommunaute()
  const { demandesPartenaire } = useData()
  const recues = demandesPartenaire.filter((d) => d.sens === "recue").length
  const sous: SousOnglet = pathname.startsWith(CHEMINS.partenairesListe)
    ? "liste"
    : pathname.startsWith(CHEMINS.partenairesParametres)
      ? "parametres"
      : "ressources"
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ressources", Library, "Ressources", 0],
            ["liste", Users, "Partenaires", recues],
            ["parametres", Settings2, "Paramètres", 0],
          ] as const
        ).map(([v, Icon, label, n]) => (
          <button
            key={v}
            type="button"
            onClick={() => navigate(SOUS_CHEMINS[v])}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3.5 py-2 font-ui text-[0.8rem] transition-colors",
              sous === v
                ? "border-border-second bg-surface-nested text-ink"
                : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
            )}
          >
            <Icon size={14} /> {label}
            {n ? (
              <span className="rounded-pill bg-warning/15 px-1.5 font-ui text-[0.66rem] text-warning">
                {n}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <Outlet context={{ notify }} />
    </div>
  )
}

/** What each partenaire shares — four cards each, then "Voir tout". */
export function RessourcesPartenairesOnglet() {
  const { clubsCommunaute, partenariats, ressourcesCommunaute } = useData()
  const { ouvrir, noeud } = useApercu()

  if (!partenariats.length)
    return (
      <div className="rounded-lg border border-dashed border-border">
        <EmptyState
          icon={Users}
          title="Aucun partenaire"
          description="Cherchez un club en haut de la page et envoyez-lui une demande."
        />
      </div>
    )

  return (
    <section className="flex flex-col gap-4">
      <Titre>Ressources partagées par mes partenaires</Titre>
      {partenariats.map((p) => {
        const club = clubsCommunaute.find((c) => c.id === p.clubId)
        if (!club) return null
        const siennes = ressourcesCommunaute
          .filter((r) => r.clubId === club.id)
          .sort((a, b) => b.le.localeCompare(a.le))
        return (
          <div key={club.id} className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <ClubTile nom={club.nom} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-ui text-[0.95rem] font-medium text-ink">{club.nom}</span>
                <span className="block font-body text-[0.74rem] text-ink-disabled">
                  {siennes.length ? `${siennes.length} ressource${siennes.length > 1 ? "s" : ""}` : "Aucune ressource partagée"}
                </span>
              </span>
              <Link
                to={cheminClub(club.id)}
                className="inline-flex items-center gap-1 font-ui text-[0.78rem] text-info transition-opacity hover:opacity-80"
              >
                Voir tout <ChevronRight size={14} />
              </Link>
            </div>
            {siennes.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {siennes.slice(0, 4).map((r) => (
                  <CarteRessource key={r.id} r={r} onOpen={() => ouvrir(r)} />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border px-4 py-5 text-center font-body text-[0.8rem] text-ink-disabled">
                {club.nom} n'a encore rien partagé avec vous.
              </p>
            )}
          </div>
        )
      })}
      {noeud}
    </section>
  )
}

/** Demandes (to answer / sent) and the partenaires themselves. */
export function MesPartenairesOnglet() {
  const navigate = useNavigate()
  const { notify } = useCommunaute()
  const {
    clubsCommunaute,
    partenariats,
    demandesPartenaire,
    ressourcesCommunaute,
    repondreDemande,
    annulerDemande,
    retirerPartenaire,
  } = useData()
  const [aRetirer, setARetirer] = useState<string | null>(null)
  const club = (id: string) => clubsCommunaute.find((c) => c.id === id)
  const clubARetirer = aRetirer ? club(aRetirer) : null

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <Titre>Demandes de partenaires</Titre>
        {demandesPartenaire.length ? (
          <ul className="flex flex-col gap-2">
            {demandesPartenaire.map((d) => {
              const c = club(d.clubId)
              if (!c) return null
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3">
                  <ClubTile nom={c.nom} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-sm text-ink">{c.nom}</span>
                    <span className="block font-body text-[0.74rem] text-ink-disabled">
                      {d.sens === "recue" ? "Vous a envoyé une demande" : "Demande envoyée"} le {dateFr(d.le)}
                    </span>
                  </span>
                  {d.sens === "recue" ? (
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          repondreDemande(d.id, false)
                          notify(`Demande de ${c.nom} refusée.`)
                        }}
                      >
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          repondreDemande(d.id, true)
                          notify(`${c.nom} est maintenant votre partenaire.`)
                        }}
                      >
                        <Check /> Accepter
                      </Button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Badge variant="warning" dot>
                        En attente
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          annulerDemande(d.id)
                          notify(`Demande à ${c.nom} annulée.`)
                        }}
                        className="font-ui text-[0.74rem] text-ink-muted transition-colors hover:text-ink"
                      >
                        Annuler
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-4 font-body text-[0.82rem] text-ink-disabled">
            <Inbox size={15} /> Aucune demande de partenaire.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <Titre>Mes partenaires</Titre>
        {partenariats.length ? (
          <ul className="flex flex-col gap-2">
            {partenariats.map((p) => {
              const c = club(p.clubId)
              if (!c) return null
              const n = ressourcesCommunaute.filter((r) => r.clubId === c.id).length
              return (
                <li key={c.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
                  <ClubTile nom={c.nom} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-ui text-[0.92rem] text-ink">{c.nom}</span>
                    <span className="block truncate font-body text-[0.74rem] text-ink-disabled">
                      {c.ville} · partenaire depuis {dateFr(p.depuis)} · {n} ressource{n > 1 ? "s" : ""}
                    </span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate(cheminClub(c.id))}>
                    Voir les ressources
                  </Button>
                  <button
                    type="button"
                    aria-label={`Retirer ${c.nom} des partenaires`}
                    title="Retirer le partenaire"
                    onClick={() => setARetirer(c.id)}
                    className="flex size-8 items-center justify-center rounded-md text-ink-disabled transition-colors hover:bg-surface-hover hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border">
            <EmptyState icon={Users} title="Aucun partenaire" description="Cherchez un club en haut de la page." />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!aRetirer}
        onOpenChange={(o) => !o && setARetirer(null)}
        title={`Retirer ${clubARetirer?.nom ?? "ce club"} des partenaires ?`}
        description="Vous ne verrez plus ses ressources, et il ne verra plus les vôtres. Les ressources déjà importées restent dans vos bibliothèques."
        confirmLabel="Retirer"
        onConfirm={() => {
          if (!aRetirer) return
          retirerPartenaire(aRetirer)
          notify(`${clubARetirer?.nom ?? "Le club"} n'est plus votre partenaire.`)
          setARetirer(null)
        }}
      />
    </div>
  )
}

/* ── Paramètres de partage ──────────────────────────────────────────────── */

const PORTEES: { value: PorteePartage; label: string }[] = [
  { value: "prive", label: "Privé" },
  { value: "partenaires", label: "Tous les partenaires" },
  { value: "personnalise", label: "Partenaires choisis" },
]

/**
 * Who sees what, per resource type. Edited as a draft — nothing applies until
 * "Enregistrer", and the button only lights up once something changed.
 */
export function ParametresOnglet() {
  const { notify } = useCommunaute()
  const { parametresPartage, enregistrerParametresPartage, clubsCommunaute, partenariats } =
    useData()
  const [b, setB] = useState<ParametresPartage>(() => structuredClone(parametresPartage))
  const [ouvert, setOuvert] = useState<RessourceType | null>(null)
  const modifie = useMemo(
    () => JSON.stringify(b) !== JSON.stringify(parametresPartage),
    [b, parametresPartage],
  )
  const partenaires = partenariats
    .map((p) => clubsCommunaute.find((c) => c.id === p.clubId))
    .filter((c): c is NonNullable<typeof c> => !!c)

  const majType = (t: RessourceType, patch: Partial<ParametresPartage["parType"][RessourceType]>) =>
    setB((prev) => ({ ...prev, parType: { ...prev.parType, [t]: { ...prev.parType[t], ...patch } } }))

  return (
    <section className="flex flex-col gap-4">
      <Titre
        aside={
          <Button
            disabled={!modifie}
            onClick={() => {
              enregistrerParametresPartage(b)
              notify("Paramètres de partage enregistrés.")
            }}
          >
            <Check /> Enregistrer
          </Button>
        }
      >
        Paramètres de partage des ressources
      </Titre>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <span className="block font-ui text-[0.9rem] text-ink">Visibilité de l'équipe</span>
          <span className="block font-body text-[0.78rem] text-ink-muted">
            {b.visibiliteEquipe === "publique"
              ? "Les autres clubs vous trouvent par votre nom."
              : "Seuls les clubs qui ont votre identifiant peuvent vous trouver."}
          </span>
        </span>
        <select
          value={b.visibiliteEquipe}
          onChange={(e) => setB((prev) => ({ ...prev, visibiliteEquipe: e.target.value as "publique" | "privee" }))}
          aria-label="Visibilité de l'équipe"
          className={selectCls}
        >
          <option value="publique">Publique</option>
          <option value="privee">Privée</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="hidden grid-cols-[minmax(0,1fr)_14rem_minmax(0,1fr)] gap-4 border-b border-border px-4 py-2.5 font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase md:grid">
          <span>Type de ressource</span>
          <span>Visibilité</span>
          <span>Clubs</span>
        </div>
        <ul className="divide-y divide-border">
          {RESSOURCE_TYPES.map((t) => {
            const reglage = b.parType[t]
            const choisis = partenaires.filter((c) => reglage.clubIds.includes(c.id))
            return (
              <li key={t} className="flex flex-col gap-3 px-4 py-3">
                <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_14rem_minmax(0,1fr)] md:gap-4">
                  <span className="flex items-center gap-2 font-body text-sm text-ink">
                    {reglage.portee === "prive" ? <Lock size={13} className="text-ink-disabled" /> : null}
                    {TYPE_PLURIEL[t]}
                  </span>
                  <select
                    value={reglage.portee}
                    onChange={(e) => majType(t, { portee: e.target.value as PorteePartage })}
                    aria-label={`Visibilité — ${TYPE_PLURIEL[t]}`}
                    className={selectCls}
                  >
                    {PORTEES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {reglage.portee === "personnalise" ? (
                      <>
                        {choisis.map((c) => (
                          <span key={c.id} className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.7rem] text-brand-blue-600">
                            {c.nom}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => setOuvert(ouvert === t ? null : t)}
                          className="font-ui text-[0.74rem] text-info transition-opacity hover:opacity-80"
                        >
                          {choisis.length ? "Modifier" : "Choisir des clubs"}
                        </button>
                      </>
                    ) : (
                      <span className="font-body text-[0.8rem] text-ink-disabled">
                        {reglage.portee === "partenaires" ? `Les ${partenaires.length} partenaires` : "—"}
                      </span>
                    )}
                  </span>
                </div>

                {reglage.portee === "personnalise" && ouvert === t ? (
                  <div className="flex flex-wrap gap-2 rounded-md border border-border p-3">
                    {partenaires.map((c) => {
                      const on = reglage.clubIds.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            majType(t, {
                              clubIds: on ? reglage.clubIds.filter((x) => x !== c.id) : [...reglage.clubIds, c.id],
                            })
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-ui text-[0.76rem] transition-colors",
                            on
                              ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                              : "border-border-strong text-ink-muted hover:text-ink",
                          )}
                        >
                          {on ? <Check size={12} /> : null}
                          {c.nom}
                        </button>
                      )
                    })}
                  </div>
                ) : null}

                {t === "Programme annuel" && reglage.portee !== "prive" ? (
                  <div className="ml-4 flex flex-col gap-2 border-l border-border pl-4">
                    {(
                      [
                        ["criteres", "Critères d'évaluation"],
                        ["etapesProjet", "Étapes de projet de jeu"],
                        ["seances", "Séances"],
                      ] as const
                    ).map(([cle, label]) => (
                      <Interrupteur
                        key={cle}
                        label={`Inclure : ${label}`}
                        actif={b.programmeInclut[cle]}
                        onChange={(v) =>
                          setB((prev) => ({ ...prev, programmeInclut: { ...prev.programmeInclut, [cle]: v } }))
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
      {modifie ? (
        <p className="font-body text-[0.78rem] text-warning">Modifications non enregistrées.</p>
      ) : null}
    </section>
  )
}

function Interrupteur({
  label,
  actif,
  onChange,
}: {
  label: string
  actif: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 font-body text-[0.84rem] text-ink-subtle md:max-w-md">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        onClick={() => onChange(!actif)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-pill border transition-colors",
          actif ? "border-info bg-info" : "border-border-strong bg-transparent",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-3.5 rounded-full transition-[left]",
            actif ? "left-[1.1rem] bg-ink-inverted" : "left-0.5 bg-ink-muted",
          )}
        />
      </button>
    </label>
  )
}
