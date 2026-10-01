import { useMemo, useState, type ReactNode } from "react"
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  FileText,
  Info,
  ListChecks,
  ListOrdered,
  Network,
  Shield,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { OrgPartage } from "@/data/seed/organigrammesPartages"
import { BackButton } from "@/components/kit/BackButton"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Steps } from "@/components/kit/Steps"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/features/budget/ui"
import { ClubTile } from "@/features/communaute/CommunauteUi"
import { cheminClub, nomDuClub } from "@/features/communaute/communauteHelpers"
import {
  brouillonInitial,
  construirePlan,
  ordreArbre,
  type BrouillonImport,
  type ResumeImport,
} from "@/features/communaute/import/importHelpers"
import { Panneau, Puce } from "@/features/communaute/import/ImportUi"
import { EtapeStructure } from "@/features/communaute/import/EtapeStructure"
import { EtapeDocuments } from "@/features/communaute/import/EtapeDocuments"
import { EtapeValidation } from "@/features/communaute/import/EtapeValidation"
import { VueVisuelle } from "@/features/communaute/import/VueVisuelle"

const ETAPES = ["Aperçu", "Structure & postes", "Documents", "Validation"]

/**
 * Import a partner's organigramme and make it ours. The partner's people never
 * travel — its tree and documents do: every poste becomes a slot to fill with
 * someone of our club, every document is linked to one of ours, copied, or
 * dropped. Everything is a local draft until the last button.
 */
export type ModeImport = "guide" | "visuel"

/**
 * Import a partner's organigramme and make it ours. The partner's people never
 * travel — its tree and documents do: every poste becomes a slot to fill with
 * someone of our club, every document is linked to one of ours, copied, or
 * dropped. Everything is a local draft until the import button.
 *
 * Two ways through the same draft: a guided 4-step flow, or a visual mode
 * where the imported organigramme is edited directly on the chart. The mode
 * sits in the URL (?mode=), and switching keeps every choice made so far.
 */
export function ImportOrganigrammeScreen() {
  const { id = "" } = useParams()
  const { ressourcesCommunaute, organigrammesPartages } = useData()
  const ressource = ressourcesCommunaute.find((r) => r.id === id)
  const partage = organigrammesPartages[id]
  if (!ressource || !partage) return <Navigate to="/communaute/partenaires" replace />
  return (
    <Import ressourceId={id} clubId={ressource.clubId} titre={ressource.titre} partage={partage} />
  )
}

function Import({
  ressourceId,
  clubId,
  titre,
  partage,
}: {
  ressourceId: string
  clubId: string
  titre: string
  partage: OrgPartage
}) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const mode = params.get("mode") as ModeImport | null
  const { clubsCommunaute, orgMembres, orgUnites, fiches, importerOrganigramme } = useData()
  const club = nomDuClub(clubsCommunaute, clubId)
  const [quitter, setQuitter] = useState(false)
  const [b, setB] = useState<BrouillonImport>(() => brouillonInitial(partage, orgMembres, fiches))
  const maj = (f: (x: BrouillonImport) => BrouillonImport) => setB(f)

  const ancre =
    b.placement.kind === "racine"
      ? "Nouvelle branche à la racine"
      : `Sous « ${orgUnites.find((u) => u.id === (b.placement as { uniteId: string }).uniteId)?.nom ?? "—"} »`

  const resume = useMemo(
    () => construirePlan(b, partage, { ressourceId, club, orgUnites, orgMembres, fiches }),
    [b, partage, ressourceId, club, orgUnites, orgMembres, fiches],
  )

  const retour = cheminClub(clubId)
  const importer = () => {
    importerOrganigramme(resume.plan)
    navigate("/structuration/organigramme", {
      state: {
        toast: `Organigramme de ${club} importé : ${resume.nbUnites} unités ajoutées.`,
      },
    })
  }
  const choisirMode = (m: ModeImport) => setParams({ mode: m }, { replace: true })

  return (
    <div className={cn("mx-auto flex flex-col gap-6", mode === "visuel" ? "max-w-[1400px]" : "max-w-[1200px]")}>
      <div>
        <BackButton to={retour} label={club} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <ClubTile nom={club} size="md" />
            <div className="min-w-0">
              <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                Importer un organigramme
              </span>
              <h1 className="truncate font-ui text-2xl font-semibold text-ink">{titre}</h1>
              <p className="font-body text-sm text-ink-muted">
                Partagé par {club} · saison {partage.saison}
              </p>
            </div>
          </div>
          {mode ? (
            <Segmented
              value={mode}
              onChange={choisirMode}
              options={[
                { value: "guide", label: "Mode guidé" },
                { value: "visuel", label: "Mode visuel" },
              ]}
            />
          ) : null}
        </div>
      </div>

      {!mode ? (
        <ChoixMode onChoisir={choisirMode} club={club} />
      ) : mode === "visuel" ? (
        <VueVisuelle
          b={b}
          maj={maj}
          club={club}
          ancre={ancre}
          partage={partage}
          resume={resume}
          onImporter={importer}
          onAnnuler={() => setQuitter(true)}
        />
      ) : (
        <Assistant
          b={b}
          maj={maj}
          club={club}
          ancre={ancre}
          partage={partage}
          resume={resume}
          onImporter={importer}
          onAnnuler={() => setQuitter(true)}
        />
      )}

      <ConfirmDialog
        open={quitter}
        onOpenChange={setQuitter}
        title="Abandonner l'import ?"
        description="Vos choix de structure, de postes et de documents seront perdus. Rien n'a été ajouté à votre club."
        confirmLabel="Abandonner"
        onConfirm={() => navigate(retour)}
      />
    </div>
  )
}

/* ── Mode choice (landing on the import without ?mode=) ─────────────────── */

function ChoixMode({ onChoisir, club }: { onChoisir: (m: ModeImport) => void; club: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CarteMode
        icon={ListOrdered}
        titre="Mode guidé"
        aide={`4 étapes : aperçu, structure & postes, documents, validation. Idéal pour un premier import de ${club}.`}
        onClick={() => onChoisir("guide")}
      />
      <CarteMode
        icon={Network}
        titre="Mode visuel"
        aide="L'organigramme importé s'affiche comme un vrai organigramme : cliquez une unité pour la modifier et voyez le résultat en direct."
        onClick={() => onChoisir("visuel")}
      />
    </div>
  )
}

function CarteMode({
  icon: Icon,
  titre,
  aide,
  onClick,
}: {
  icon: typeof Network
  titre: string
  aide: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-background p-5 text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <span className="relative z-10 flex size-11 items-center justify-center rounded-md border border-border bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
        <Icon size={20} />
      </span>
      <span className="relative z-10 font-ui text-[1.05rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
        {titre}
      </span>
      <span className="relative z-10 font-body text-sm text-ink-muted">{aide}</span>
    </button>
  )
}

/* ── Guided mode ────────────────────────────────────────────────────────── */

type PropsMode = {
  b: BrouillonImport
  maj: (f: (x: BrouillonImport) => BrouillonImport) => void
  club: string
  ancre: string
  partage: OrgPartage
  resume: ResumeImport
  onImporter: () => void
  onAnnuler: () => void
}

function Assistant({ b, maj, club, ancre, partage, resume, onImporter, onAnnuler }: PropsMode) {
  const { orgMembres, fiches } = useData()
  const [etape, setEtape] = useState(1)

  return (
    <>
      <div className="rounded-lg border border-border px-4 py-3">
        <Steps steps={ETAPES} current={etape} onSelect={setEtape} />
      </div>

      {etape === 1 ? (
        <EtapeApercu b={b} maj={maj} partage={partage} club={club} />
      ) : etape === 2 ? (
        <EtapeStructure
          b={b}
          maj={maj}
          club={club}
          ancre={ancre}
          membres={orgMembres}
          documents={partage.documents}
        />
      ) : etape === 3 ? (
        <EtapeDocuments b={b} maj={maj} club={club} documents={partage.documents} fiches={fiches} />
      ) : (
        <EtapeValidation resume={resume} ancre={ancre} club={club} onModifier={setEtape} />
      )}

      {/* Sticky action bar — always the same place, always the next step. */}
      <div className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-background/95 backdrop-blur sm:-mx-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" onClick={onAnnuler}>
            Annuler
          </Button>
          <div className="flex items-center gap-2">
            <span className="hidden font-body text-[0.78rem] text-ink-disabled sm:inline">
              Étape {etape} sur {ETAPES.length}
            </span>
            {etape > 1 ? (
              <Button variant="outline" onClick={() => setEtape(etape - 1)}>
                <ArrowLeft /> Retour
              </Button>
            ) : null}
            {etape < ETAPES.length ? (
              <Button onClick={() => setEtape(etape + 1)} disabled={etape === 2 && resume.nbUnites === 0}>
                Continuer <ArrowRight />
              </Button>
            ) : (
              <Button onClick={onImporter} disabled={resume.nbUnites === 0}>
                <Check /> Importer l'organigramme
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Step 1 — Aperçu & placement ────────────────────────────────────────── */

function EtapeApercu({
  b,
  maj,
  partage,
  club,
}: {
  b: BrouillonImport
  maj: (f: (x: BrouillonImport) => BrouillonImport) => void
  partage: OrgPartage
  club: string
}) {
  const { orgUnites } = useData()
  const postes = partage.unites.flatMap((u) => u.postes)
  const docs = partage.documents
  const nb = (t: string) => docs.filter((d) => d.type === t).length
  const sous = b.placement.kind === "sous" ? b.placement.uniteId : orgUnites[0]?.id ?? ""

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Panneau titre={`L'organigramme de ${club}`} aside={<Puce>{partage.unites.length} unités</Puce>}>
        <ul className="flex flex-col">
          {ordreArbre(b.unites.filter((u) => u.source)).map(({ u, niveau }) => (
            <li key={u.id} style={{ paddingLeft: niveau * 20 }} className="border-l border-transparent">
              <div className={cn("flex flex-col gap-1.5 py-2.5", niveau > 0 && "border-l border-border pl-4")}>
                <span className="flex items-center gap-2 font-ui text-[0.9rem] text-ink">
                  <Network size={14} className="text-ink-disabled" /> {u.nom}
                </span>
                {u.postes.length ? (
                  <span className="flex flex-wrap gap-1.5 pl-6">
                    {u.postes.map((p) => (
                      <span
                        key={p.id}
                        title={p.occupant ? `Chez ${club} : ${p.occupant}` : `Vacant chez ${club}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-body text-[0.76rem] text-ink-subtle"
                      >
                        {p.intitule}
                        {p.ficheId ? <ClipboardList size={11} className="text-ink-disabled" /> : null}
                        {p.charteIds.length ? <Shield size={11} className="text-ink-disabled" /> : null}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="pl-6 font-body text-[0.76rem] text-ink-disabled">Aucun poste</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panneau>

      <div className="flex flex-col gap-4">
        <Panneau titre="Ce qui est partagé">
          <ul className="grid grid-cols-2 gap-3">
            <Stat icon={Network} n={partage.unites.length} label="unités" />
            <Stat icon={Users} n={postes.length} label="postes" />
            <Stat icon={ClipboardList} n={nb("Fiche de Poste")} label="fiches de poste" />
            <Stat icon={Shield} n={nb("Charte") + nb("Règlement")} label="chartes" />
            <Stat icon={ListChecks} n={nb("Liste des Rôles")} label="listes des rôles" />
            <Stat icon={FileText} n={docs.length} label="documents au total" />
          </ul>
        </Panneau>

        <Panneau titre="Où placer cette structure ?">
          <div role="radiogroup" className="flex flex-col gap-2">
            <Choix
              actif={b.placement.kind === "racine"}
              onClick={() => maj((x) => ({ ...x, placement: { kind: "racine" } }))}
              titre="Nouvelle branche indépendante"
              aide="À côté de votre organigramme actuel."
            />
            <Choix
              actif={b.placement.kind === "sous"}
              onClick={() => maj((x) => ({ ...x, placement: { kind: "sous", uniteId: sous } }))}
              titre="Sous une de mes unités"
              aide="Le comité importé devient une sous-unité."
            >
              {b.placement.kind === "sous" ? (
                <select
                  value={sous}
                  onChange={(e) => maj((x) => ({ ...x, placement: { kind: "sous", uniteId: e.target.value } }))}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Unité de rattachement"
                  className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-ink outline-none focus:border-border-focus"
                >
                  {orgUnites.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom}
                    </option>
                  ))}
                </select>
              ) : null}
            </Choix>
          </div>
        </Panneau>

        <p className="flex gap-2.5 rounded-lg border border-border px-4 py-3 font-body text-[0.8rem] text-ink-muted">
          <Info size={15} className="mt-0.5 shrink-0 text-info" />
          <span>
            Les personnes de {club} ne sont pas importées : à l'étape suivante, chaque poste est
            confié à quelqu'un de votre club. Rien n'est modifié avant la validation.
          </span>
        </p>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, n, label }: { icon: typeof Users; n: number; label: string }) {
  return (
    <li className="flex flex-col gap-0.5 rounded-md border border-border px-3 py-2.5">
      <span className="font-ui text-xl font-semibold text-ink tabular-nums">{n}</span>
      <span className="inline-flex items-center gap-1.5 font-body text-[0.74rem] text-ink-muted">
        <Icon size={12} /> {label}
      </span>
    </li>
  )
}

function Choix({
  actif,
  onClick,
  titre,
  aide,
  children,
}: {
  actif: boolean
  onClick: () => void
  titre: string
  aide: string
  children?: ReactNode
}) {
  return (
    <div
      role="radio"
      aria-checked={actif}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "cursor-pointer rounded-lg border p-3.5 transition-colors",
        actif ? "border-info" : "border-border hover:border-border-strong",
      )}
    >
      <span className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
            actif ? "border-info" : "border-border-strong",
          )}
        >
          {actif ? <span className="size-2 rounded-full bg-info" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-ui text-[0.88rem] text-ink">{titre}</span>
          <span className="block font-body text-[0.76rem] text-ink-muted">{aide}</span>
          {children}
        </span>
      </span>
    </div>
  )
}
