import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  Check,
  Copy,
  Link2,
  Link2Off,
  Mail,
  Merge,
  MessageSquare,
  PlayCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Categorie } from "@/data/seed/categories"
import { POSTES, POSTE_LABEL } from "@/data/seed/categories"
import {
  PROFIL_LABEL,
  SCENARIOS,
  SCENARIO_INFO,
  STATUT_DEMANDE_LABEL,
  type DemandeInscription,
  type ScenarioDemande,
  type StatutDemande,
} from "@/data/seed/inscriptions"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Segmented } from "@/features/budget/ui"

const STATUT_VARIANT: Record<StatutDemande, "warning" | "success" | "danger"> = {
  "en-attente": "warning",
  approuvee: "success",
  refusee: "danger",
}

/** One glyph per situation — the row is scanned before it is read. */
const SCENARIO_ICON: Record<ScenarioDemande, typeof Users> = {
  "creation-comptes": UserPlus,
  "rattachement-compte": Merge,
  "enfant-rattache": BadgeCheck,
  fratrie: Users,
  "joueur-nouveau-compte": UserRound,
  "joueur-compte-existant": ShieldCheck,
  "transfert-club": ArrowLeftRight,
  "changement-categorie": CalendarClock,
  "doublon-effectif": AlertTriangle,
  "lien-revoque": Link2Off,
}

/** A request left unanswered this long is worth chasing. */
const RAPPEL_JOURS = 3

/**
 * The four ways in, as the spec lays them out. They open the same link the
 * families get, `?flow=` only skipping ahead to that path's first real step —
 * so the éducateur can walk each one without re-typing the first two screens.
 */
const PARCOURS = [
  { flow: "joueur-nouveau", label: "Joueur · nouveau compte" },
  { flow: "joueur-compte", label: "Joueur · compte existant" },
  { flow: "parent-nouveau", label: "Parent · nouveau compte" },
  { flow: "parent-compte", label: "Parent · compte existant" },
] as const

/** "dd/mm/yyyy" → days elapsed. Requests carry the French stamp, not an ISO one. */
function joursDepuis(fr: string): number {
  const [d, m, y] = fr.split("/").map(Number)
  if (!d || !m || !y) return 0
  const diff = Date.now() - new Date(y, m - 1, d).getTime()
  return Math.max(0, Math.floor(diff / 864e5))
}

/** "2013-11-02" → "02/11/2013". */
const enFr = (iso: string) =>
  iso ? iso.split("-").reverse().join("/") : "—"

/** "2013-11-02" → 12, counted on the birthday and not on 1 January. */
function ageDe(naissance: string): number | null {
  const [a, m, j] = naissance.split("-").map(Number)
  if (!a || !m || !j) return null
  const today = new Date()
  let age = today.getFullYear() - a
  const passe =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= j)
  if (!passe) age -= 1
  return age >= 0 ? age : null
}

/**
 * Inscriptions — the éducateur's side of the join link: the link he shares, and
 * the requests it brings back. Pending ones come first and stay first, because
 * the only thing that matters here is what is still waiting on him.
 *
 * Every request carries its scenario, because "approuver" does not mean the
 * same thing twice: one creates a family from nothing, one attaches a joueur
 * the club already has, one commits to a transfert. The row says which; the
 * fiche spells out what accepting it will actually do.
 */
export function CategorieInscriptions({ categorie }: { categorie: Categorie }) {
  const navigate = useNavigate()
  const {
    liensInscription,
    demandesInscription,
    categories,
    creerLienInscription,
    revoquerLienInscription,
    traiterDemande,
  } = useData()

  const [filtre, setFiltre] = useState<StatutDemande | "toutes">("en-attente")
  const [cas, setCas] = useState<ScenarioDemande | "tous">("tous")
  const [copie, setCopie] = useState(false)
  const [ouverte, setOuverte] = useState<DemandeInscription | null>(null)
  const [refus, setRefus] = useState<DemandeInscription | null>(null)
  const [motif, setMotif] = useState("")
  /** Approving is a placement, not a click: which groupe, which poste. */
  const [affecter, setAffecter] = useState<DemandeInscription | null>(null)
  const [groupeChoisi, setGroupeChoisi] = useState("")
  const [posteChoisi, setPosteChoisi] = useState("")

  const lien = liensInscription.find(
    (l) => l.categorieId === categorie.id && l.actif,
  )
  const url = lien ? `${window.location.origin}/rejoindre/${lien.token}` : ""

  const toutes = demandesInscription.filter(
    (d) => d.categorieId === categorie.id,
  )
  const enAttente = toutes.filter((d) => d.statut === "en-attente")
  const parStatut =
    filtre === "toutes" ? toutes : toutes.filter((d) => d.statut === filtre)
  const visibles =
    cas === "tous" ? parStatut : parStatut.filter((d) => d.scenario === cas)

  /** Only the situations this catégorie actually has, in the canonical order. */
  const casPresents = SCENARIOS.filter((s) =>
    parStatut.some((d) => d.scenario === s),
  )

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // Clipboard is blocked in some contexts; the field is selectable anyway.
    }
  }

  /**
   * Approving opens the placement, never the effectif straight away: an
   * éducateur decides the groupe and the poste, the family never proposes one.
   * The poste the club already knows (a joueur it has) is a starting point,
   * not an answer.
   */
  const ouvrirAffectation = (d: DemandeInscription) => {
    setGroupeChoisi(d.groupeAffecteId ?? categorie.groupes[0]?.id ?? "")
    setPosteChoisi(d.joueur.poste ?? "")
    setAffecter(d)
  }

  /** Everything the fiche has to say beyond the demande itself. */
  const contexte = (d: DemandeInscription) => ({
    fratrie: d.fratrieId
      ? toutes.filter((x) => x.fratrieId === d.fratrieId && x.id !== d.id)
      : [],
    doublon: categorie.joueurs.find(
      (j) =>
        j.nom.toLowerCase() ===
        `${d.joueur.prenom} ${d.joueur.nom}`.toLowerCase(),
    ),
    suggeree: d.categorieSuggereeId
      ? (categories.find((c) => c.id === d.categorieSuggereeId)?.nom ??
        d.categorieSuggereeId.toUpperCase())
      : null,
    revoque: d.lienId
      ? liensInscription.find((l) => l.id === d.lienId && !l.actif)
      : undefined,
  })

  return (
    <div className="flex flex-col gap-5">
      {/* The link the éducateur shares. */}
      <section className="flex flex-col gap-3.5 rounded-lg border border-border p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-ui text-[0.95rem] font-medium text-ink">
              Lien d'inscription
            </h2>
            <p className="font-body text-[0.8rem] text-ink-muted">
              Partagez-le par WhatsApp ou SMS : joueurs et parents s'inscrivent
              eux-mêmes, vous validez.
            </p>
          </div>
          {lien ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => revoquerLienInscription(lien.id)}
            >
              <X /> Désactiver
            </Button>
          ) : null}
          <Button
            variant={lien ? "outline" : "default"}
            size="sm"
            onClick={() => creerLienInscription(categorie.id)}
          >
            {lien ? <RefreshCw /> : <Link2 />}
            {lien ? "Régénérer" : "Générer le lien"}
          </Button>
        </div>

        {lien ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={url}
              aria-label="Lien d'inscription"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-3.5 py-2.5 font-mono text-[0.8rem] text-ink-subtle outline-none"
            />
            <Button variant="outline" size="sm" onClick={copier}>
              {copie ? <Check /> : <Copy />}
              {copie ? "Copié" : "Copier"}
            </Button>
          </div>
        ) : (
          <p className="font-body text-[0.8rem] text-ink-disabled">
            Aucun lien actif pour {categorie.nom}.
          </p>
        )}
        {lien ? (
          <p className="font-body text-[0.74rem] text-ink-disabled">
            Créé le {lien.creeLe} · régénérer un lien désactive le précédent.
          </p>
        ) : null}

        {/* Ouvrir le lien à la place d'un joueur ou d'un parent. Navigation
            interne : le store est en mémoire, un nouvel onglet repartirait de
            zéro et la demande envoyée ne reviendrait jamais ici. */}
        {lien ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3.5">
            <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              Ouvrir le lien comme
            </span>
            <div className="flex flex-wrap gap-2">
              {PARCOURS.map((p) => (
                <Button
                  key={p.flow}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/rejoindre/${lien.token}?flow=${p.flow}`)
                  }
                >
                  <PlayCircle /> {p.label}
                </Button>
              ))}
            </div>
            <p className="font-body text-[0.74rem] text-ink-disabled">
              Le parcours complet reste accessible depuis le lien lui-même.
            </p>
          </div>
        ) : null}
      </section>

      {/* The desk. */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={filtre}
          onChange={(v) => {
            setFiltre(v)
            setCas("tous")
          }}
          options={[
            { value: "en-attente", label: `En attente · ${enAttente.length}` },
            { value: "approuvee", label: "Approuvées" },
            { value: "refusee", label: "Refusées" },
            { value: "toutes", label: "Toutes" },
          ]}
        />
        <p className="ml-auto font-body text-sm text-ink-muted">
          <span className="text-ink">{visibles.length}</span> demande
          {visibles.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Les cas présents, comptés. Deux demandes ne demandent pas le même
          travail : c'est le seul tri qui aide vraiment à vider la pile. */}
      {casPresents.length > 1 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <CasPuce
            actif={cas === "tous"}
            onClick={() => setCas("tous")}
            label="Tous les cas"
            n={parStatut.length}
          />
          {casPresents.map((s) => (
            <CasPuce
              key={s}
              actif={cas === s}
              onClick={() => setCas(cas === s ? "tous" : s)}
              icon={SCENARIO_ICON[s]}
              label={SCENARIO_INFO[s].label}
              n={parStatut.filter((d) => d.scenario === s).length}
            />
          ))}
        </div>
      ) : null}

      {visibles.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Users}
            title="Aucune demande"
            description={
              filtre === "en-attente"
                ? "Rien n'attend votre validation. Partagez le lien pour recruter."
                : "Aucune demande dans cet état."
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibles.map((d) => {
            const jours = joursDepuis(d.soumiseLe)
            const aRelancer = d.statut === "en-attente" && jours >= RAPPEL_JOURS
            const info = SCENARIO_INFO[d.scenario]
            const Icon = SCENARIO_ICON[d.scenario]
            return (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.74rem] text-ink-muted">
                  {d.joueur.prenom[0]}
                  {d.joueur.nom[0]}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-ui text-[0.9rem] text-ink">
                      {d.joueur.prenom} {d.joueur.nom}
                    </span>
                    <Badge variant={info.ton}>
                      <Icon size={11} aria-hidden /> {info.label}
                    </Badge>
                    <Badge variant={STATUT_VARIANT[d.statut]}>
                      {STATUT_DEMANDE_LABEL[d.statut]}
                    </Badge>
                    {aRelancer ? (
                      <span className="inline-flex items-center gap-1.5 rounded-pill border border-warning/30 bg-warning/10 px-2.5 py-0.5 font-ui text-[0.68rem] text-warning">
                        <Bell size={11} /> {jours} j sans réponse
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate font-body text-[0.76rem] text-ink-muted">
                    {info.resume} · reçue le {d.soumiseLe}
                  </span>
                </div>

                <span className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOuverte(d)}
                  >
                    Détails
                  </Button>
                  {d.statut === "en-attente" ? (
                    <Button size="sm" onClick={() => ouvrirAffectation(d)}>
                      <Check /> Approuver
                    </Button>
                  ) : (
                    <span className="font-body text-[0.74rem] text-ink-disabled">
                      Traitée le {d.traiteeLe}
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* One request, and above all: which of the ten situations it is, and
          what saying yes to it actually commits the club to. */}
      <Dialog open={!!ouverte} onOpenChange={(o) => !o && setOuverte(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-lg">
          {ouverte
            ? (() => {
                const info = SCENARIO_INFO[ouverte.scenario]
                const Icon = SCENARIO_ICON[ouverte.scenario]
                const ctx = contexte(ouverte)
                const age = ageDe(ouverte.joueur.naissance)
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle>
                        {ouverte.joueur.prenom} {ouverte.joueur.nom}
                      </DialogTitle>
                      <DialogDescription>
                        {PROFIL_LABEL[ouverte.profil]} · demande reçue le{" "}
                        {ouverte.soumiseLe} pour {categorie.nom}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Le scénario, en tête : c'est lui qui décide de tout le
                        reste de la fiche. */}
                    <section
                      className={cn(
                        "flex flex-col gap-3 rounded-lg border p-4",
                        TON_CADRE[info.ton],
                      )}
                    >
                      <h3 className="flex items-center gap-2 font-ui text-[0.88rem] font-medium text-ink">
                        <Icon size={15} className={TON_ICONE[info.ton]} />
                        {info.label}
                      </h3>
                      <p className="font-body text-[0.84rem] leading-relaxed text-ink-subtle">
                        {info.recit}
                      </p>

                      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                        <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                          Ce qu'approuver déclenche
                        </span>
                        <ul className="flex flex-col gap-1.5">
                          {info.aFaire.map((a) => (
                            <li
                              key={a}
                              className="flex items-start gap-2 font-body text-[0.82rem] text-ink-muted"
                            >
                              <Check
                                size={13}
                                className="mt-0.5 shrink-0 text-info"
                                aria-hidden
                              />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>

                    {/* Les faits propres à ce dossier, quand il y en a. */}
                    {ouverte.emailConflit ? (
                      <Fait
                        icon={Merge}
                        titre="Adresse déjà utilisée"
                        ton="warning"
                      >
                        <span className="font-mono text-[0.78rem] text-ink">
                          {ouverte.emailConflit}
                        </span>{" "}
                        est déjà rattachée à une fiche joueur. Le parent demande
                        à récupérer cette fiche sur son compte
                        {ouverte.compteEmail ? (
                          <>
                            {" "}
                            <span className="font-mono text-[0.78rem] text-ink">
                              {ouverte.compteEmail}
                            </span>
                          </>
                        ) : null}
                        , pas à en créer une seconde.
                      </Fait>
                    ) : null}

                    {ctx.fratrie.length ? (
                      <Fait icon={Users} titre="Envoyé avec" ton="info">
                        {ctx.fratrie.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setOuverte(f)}
                            className="mt-1 flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-surface-hover"
                          >
                            <span className="min-w-0 flex-1 truncate font-ui text-[0.84rem] text-ink">
                              {f.joueur.prenom} {f.joueur.nom}
                            </span>
                            <Badge variant={STATUT_VARIANT[f.statut]}>
                              {STATUT_DEMANDE_LABEL[f.statut]}
                            </Badge>
                          </button>
                        ))}
                        <span className="mt-2 block">
                          Les deux demandes sont indépendantes : celle-ci se
                          décide seule.
                        </span>
                      </Fait>
                    ) : null}

                    {ouverte.clubActuel ? (
                      <Fait
                        icon={ArrowLeftRight}
                        titre="Licence en cours"
                        ton="warning"
                      >
                        Le joueur est encore licencié à{" "}
                        <span className="text-ink">{ouverte.clubActuel}</span>.
                        Sans lettre de sortie, l'inscription reste provisoire.
                      </Fait>
                    ) : null}

                    {ctx.suggeree ? (
                      <Fait
                        icon={CalendarClock}
                        titre="Catégorie d'âge"
                        ton="warning"
                      >
                        Né le {enFr(ouverte.joueur.naissance)}
                        {age !== null ? ` (${age} ans)` : ""}, il relève de{" "}
                        <span className="text-ink">{ctx.suggeree}</span> et non
                        de {categorie.nom}. Approuver revient à le surclasser.
                      </Fait>
                    ) : null}

                    {ouverte.scenario === "doublon-effectif" && ctx.doublon ? (
                      <Fait
                        icon={AlertTriangle}
                        titre="Déjà dans l'effectif"
                        ton="danger"
                      >
                        <span className="text-ink">{ctx.doublon.nom}</span> (
                        {POSTE_LABEL[ctx.doublon.poste] ?? ctx.doublon.poste})
                        figure déjà dans {categorie.nom}. Vérifiez avant
                        d'approuver : une seconde fiche se retrouvera partout,
                        des convocations aux évaluations.
                      </Fait>
                    ) : null}

                    {ctx.revoque ? (
                      <Fait icon={Link2Off} titre="Lien d'origine" ton="default">
                        Reçue via{" "}
                        <span className="font-mono text-[0.78rem] text-ink">
                          /rejoindre/{ctx.revoque.token}
                        </span>
                        , créé le {ctx.revoque.creeLe} et désactivé depuis. La
                        demande, elle, est toujours valable.
                      </Fait>
                    ) : null}

                    {/* La fiche elle-même. */}
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Info
                        label="Naissance"
                        valeur={
                          ouverte.joueur.naissance
                            ? `${enFr(ouverte.joueur.naissance)}${
                                age !== null ? ` · ${age} ans` : ""
                              }`
                            : "—"
                        }
                      />
                      <Info label="Genre" valeur={ouverte.joueur.genre} />
                      <Info
                        label="Affectation"
                        valeur={
                          ouverte.statut === "approuvee"
                            ? [
                                categorie.groupes.find(
                                  (g) => g.id === ouverte.groupeAffecteId,
                                )?.nom,
                                ouverte.joueur.poste
                                  ? (POSTE_LABEL[ouverte.joueur.poste] ??
                                    ouverte.joueur.poste)
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"
                            : "À définir à l'approbation"
                        }
                      />
                      <Info
                        label="Parcours"
                        valeur={ouverte.joueur.niveau || "Non précisé"}
                      />
                    </dl>

                    {ouverte.parent ? (
                      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
                        <h3 className="flex items-center gap-2 font-ui text-[0.82rem] font-medium text-ink">
                          <Users size={14} className="text-ink-muted" /> Parent
                          <span className="ml-auto font-body text-[0.72rem] font-normal text-ink-disabled">
                            {ouverte.compteEmail
                              ? "Compte existant"
                              : "Compte à créer"}
                          </span>
                        </h3>
                        <p className="font-body text-[0.84rem] text-ink-subtle">
                          {ouverte.parent.prenom} {ouverte.parent.nom}
                          {ouverte.parent.genre
                            ? ` · ${ouverte.parent.genre}`
                            : ""}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-[0.78rem] text-ink-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail size={12} /> {ouverte.parent.email}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={12} /> {ouverte.parent.telephone}
                          </span>
                        </p>
                      </section>
                    ) : (
                      <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
                        <h3 className="flex items-center gap-2 font-ui text-[0.82rem] font-medium text-ink">
                          <BadgeCheck size={14} className="text-ink-muted" />{" "}
                          Contact
                          <span className="ml-auto font-body text-[0.72rem] font-normal text-ink-disabled">
                            {ouverte.compteEmail
                              ? "Compte existant"
                              : "Compte à créer"}
                          </span>
                        </h3>
                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-[0.78rem] text-ink-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail size={12} /> {ouverte.joueur.email || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={12} /> {ouverte.joueur.telephone || "—"}
                          </span>
                        </p>
                      </section>
                    )}

                    {ouverte.message ? (
                      <p className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-nested p-3.5 font-body text-[0.82rem] text-ink-muted italic">
                        <MessageSquare
                          size={14}
                          className="mt-0.5 shrink-0 text-ink-disabled"
                          aria-hidden
                        />
                        « {ouverte.message} »
                      </p>
                    ) : null}

                    {ouverte.motif ? (
                      <p className="rounded-lg border border-danger/30 bg-danger/5 p-3.5 font-body text-[0.82rem] text-ink-muted">
                        {ouverte.motif}
                      </p>
                    ) : null}

                    {ouverte.statut === "en-attente" ? (
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setMotif("")
                            setRefus(ouverte)
                            setOuverte(null)
                          }}
                        >
                          <X /> Refuser
                        </Button>
                        <Button
                          onClick={() => {
                            ouvrirAffectation(ouverte)
                            setOuverte(null)
                          }}
                        >
                          <Check /> Approuver
                        </Button>
                      </DialogFooter>
                    ) : null}
                  </>
                )
              })()
            : null}
        </DialogContent>
      </Dialog>

      {/* Approving is where the joueur gets a place: a groupe to train with and
          a poste to play. Neither was asked of the family — this dialog is the
          only screen in the parcours where they are decided. */}
      <Dialog open={!!affecter} onOpenChange={(o) => !o && setAffecter(null)}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approuver et placer le joueur</DialogTitle>
            <DialogDescription>
              {affecter
                ? `${affecter.joueur.prenom} ${affecter.joueur.nom} rejoint ${categorie.nom}. Choisissez son groupe et son poste : c'est ce qui l'ajoute à l'effectif.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Groupe
              </span>
              <Select value={groupeChoisi} onValueChange={setGroupeChoisi}>
                <SelectTrigger aria-label="Groupe">
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {categorie.groupes.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Poste
              </span>
              <Select value={posteChoisi} onValueChange={setPosteChoisi}>
                <SelectTrigger aria-label="Poste">
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  {POSTES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {POSTE_LABEL[code] ?? code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          {/* Le cas du dossier ne disparaît pas au moment de valider. */}
          {affecter ? (
            <p className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-nested px-3.5 py-3 font-body text-[0.8rem] leading-relaxed text-ink-muted">
              <ShieldCheck
                size={15}
                className="mt-0.5 shrink-0 text-ink-disabled"
                aria-hidden
              />
              {SCENARIO_INFO[affecter.scenario].aFaire.join(", ")}.
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setAffecter(null)}>
              Annuler
            </Button>
            <Button
              disabled={!groupeChoisi || !posteChoisi}
              onClick={() => {
                if (affecter)
                  traiterDemande(affecter.id, "approuvee", undefined, {
                    groupeId: groupeChoisi,
                    poste: posteChoisi,
                  })
                setAffecter(null)
              }}
            >
              <Check /> Ajouter à l'effectif
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refusing takes a reason — the family sees it. */}
      <Dialog open={!!refus} onOpenChange={(o) => !o && setRefus(null)}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              {refus
                ? `${refus.joueur.prenom} ${refus.joueur.nom} recevra ce message avec la réponse.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Effectif complet pour cette saison, catégorie d'âge différente…"
            aria-label="Motif du refus"
            className="w-full resize-y rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors focus:border-border-focus"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRefus(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (refus)
                  traiterDemande(refus.id, "refusee", motif.trim() || undefined)
                setRefus(null)
              }}
            >
              Refuser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ── Bits ─────────────────────────────────────────────────────────────────── */

const TON_CADRE = {
  default: "border-border bg-surface-nested",
  info: "border-brand-blue-600/30 bg-brand-blue-600/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-danger/30 bg-danger/5",
} as const

const TON_ICONE = {
  default: "text-ink-muted",
  info: "text-brand-blue-600",
  warning: "text-warning",
  danger: "text-danger",
} as const

/** A filter pill: one situation, counted. */
function CasPuce({
  actif,
  onClick,
  icon: Icon,
  label,
  n,
}: {
  actif: boolean
  onClick: () => void
  icon?: typeof Users
  label: string
  n: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-ui text-[0.74rem] transition-colors",
        actif
          ? "border-brand-blue-600/40 bg-brand-blue-600/10 text-brand-blue-600"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      {Icon ? <Icon size={12} aria-hidden /> : null}
      {label}
      <span className={actif ? "text-brand-blue-600" : "text-ink-disabled"}>
        {n}
      </span>
    </button>
  )
}

/** One case-specific fact, framed by how much it should worry the éducateur. */
function Fait({
  icon: Icon,
  titre,
  ton,
  children,
}: {
  icon: typeof Users
  titre: string
  ton: keyof typeof TON_CADRE
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col gap-1.5 rounded-lg border p-3.5", TON_CADRE[ton])}>
      <h4 className="flex items-center gap-2 font-ui text-[0.78rem] font-medium text-ink">
        <Icon size={13} className={TON_ICONE[ton]} aria-hidden /> {titre}
      </h4>
      <p className="font-body text-[0.82rem] leading-relaxed text-ink-muted">
        {children}
      </p>
    </section>
  )
}

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </dt>
      <dd className={cn("font-body text-[0.86rem] text-ink")}>{valeur}</dd>
    </div>
  )
}
