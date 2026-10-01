import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  Check,
  Copy,
  Download,
  Fingerprint,
  Search,
  Share2,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { useData } from "@/data/useData"
import { MOI, monClub } from "@/data/seed/communaute"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge } from "@/components/kit/Badge"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Segmented } from "@/features/budget/ui"
import { ClubTile } from "@/features/communaute/CommunauteUi"
import {
  CHEMINS,
  cheminClub,
  type CommunauteContexte,
} from "@/features/communaute/communauteHelpers"

type Onglet = "profil" | "partages" | "partenaires"

/**
 * Communauté — the club as the network sees it (identity, what it shares,
 * what it took), a finder to add partenaires, and three tabs: Profil (the
 * numbers), Fichiers partagés (our ressources), Partenaires (theirs, the
 * partenaires themselves, and the paramètres de partage).
 */
export function CommunauteShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { partenariats, ressourcesCommunaute, importees } = useData()
  const { toast, notify } = useToast()
  const [copie, setCopie] = useState(false)
  const [recherche, setRecherche] = useState(false)

  const onglet: Onglet = pathname.startsWith(CHEMINS.partenaires)
    ? "partenaires"
    : pathname.startsWith(CHEMINS.partages)
      ? "partages"
      : "profil"

  const partagees = ressourcesCommunaute.filter((r) => r.clubId === MOI).length

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Communauté"
        subtitle="Échangez procédés, programmes et projets de jeu avec vos clubs partenaires."
        actions={
          <Button onClick={() => setRecherche(true)}>
            <UserPlus /> Ajouter un partenaire
          </Button>
        }
      />

      {/* Identity card */}
      <div className="flex flex-col gap-5 rounded-lg border border-border p-5 sm:flex-row sm:items-center">
        <ClubTile nom={monClub.nom} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="font-ui text-xl font-semibold text-ink">{monClub.nom}</h2>
          <p className="font-body text-sm text-ink-muted">{monClub.ville}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Chiffre icon={Users} label="Partenaires" valeur={partenariats.length} />
            <Chiffre icon={Share2} label="Fichiers partagés" valeur={partagees} />
            <Chiffre icon={Download} label="Fichiers importés" valeur={importees.length} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <span className="inline-flex items-center gap-1.5 font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            <Fingerprint size={12} /> Identifiant unique
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(monClub.identifiant).catch(() => {})
              setCopie(true)
              notify("Identifiant copié — donnez-le à un club pour qu'il vous trouve.")
              setTimeout(() => setCopie(false), 1800)
            }}
            title="Copier l'identifiant"
            className="inline-flex items-center gap-2 rounded-md border border-border-strong px-3 py-1.5 font-mono text-sm text-ink transition-colors hover:bg-surface-hover"
          >
            {monClub.identifiant}
            {copie ? <Check size={13} className="text-success" /> : <Copy size={13} className="text-ink-muted" />}
          </button>
        </div>
      </div>

      <RechercheClubs open={recherche} onOpenChange={setRecherche} onFait={notify} />

      <Segmented
        value={onglet}
        onChange={(v) => navigate(CHEMINS[v])}
        options={[
          { value: "profil", label: "Profil" },
          { value: "partages", label: "Fichiers partagés", badge: partagees },
          { value: "partenaires", label: "Partenaires", badge: partenariats.length },
        ]}
        className="self-start"
      />

      <Outlet context={{ notify } satisfies CommunauteContexte} />
      <Toast toast={toast} />
    </div>
  )
}

function Chiffre({
  icon: Icon,
  label,
  valeur,
}: {
  icon: typeof Users
  label: string
  valeur: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-ui text-2xl font-semibold text-ink tabular-nums">{valeur}</span>
      <span className="inline-flex items-center gap-1.5 font-body text-[0.74rem] text-ink-muted">
        <Icon size={12} className="shrink-0" /> <span className="truncate">{label}</span>
      </span>
    </div>
  )
}

/**
 * Add-a-partenaire modal: a search field up top, the matching clubs below.
 * With nothing typed it suggests clubs we're not linked to yet, so the list is
 * never blank. A club privé only comes up on its exact 8-char identifiant.
 * The state of each result is spelled out — already partenaire, demande sent,
 * demande to answer — so nobody sends twice.
 */
function RechercheClubs({
  open,
  onOpenChange,
  onFait,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFait: (msg: string) => void
}) {
  const navigate = useNavigate()
  const {
    clubsCommunaute,
    partenariats,
    demandesPartenaire,
    envoyerDemandePartenaire,
    repondreDemande,
  } = useData()
  const [q, setQ] = useState("")
  const terme = q.trim().toLowerCase()
  const resultats = terme
    ? clubsCommunaute.filter(
        (c) =>
          c.nom.toLowerCase().includes(terme) ||
          c.ville.toLowerCase().includes(terme) ||
          c.identifiant.toLowerCase() === terme,
      )
    : clubsCommunaute.filter((c) => !partenariats.some((p) => p.clubId === c.id)).slice(0, 6)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setQ("")
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-left">Ajouter un partenaire</DialogTitle>
          <DialogDescription className="text-left">
            Cherchez un club par son nom, sa ville ou son identifiant.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-4">
          <label className="relative block">
            <Search
              size={15}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
            />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un club…"
              aria-label="Rechercher un club"
              className="w-full rounded-md border border-input bg-transparent py-2.5 pr-9 pl-10 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Effacer la recherche"
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
              >
                <X size={14} />
              </button>
            ) : null}
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border px-5 py-3">
          <p className="pb-1 font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            {terme
              ? `${resultats.length} résultat${resultats.length > 1 ? "s" : ""}`
              : "Suggestions"}
          </p>

          {resultats.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full border border-border text-ink-disabled">
                <Search size={16} />
              </span>
              <p className="font-body text-sm text-ink">Aucun club ne correspond à « {q.trim()} »</p>
              <p className="max-w-xs font-body text-[0.78rem] text-ink-muted">
                Un club privé ne se trouve que par son identifiant à 8 caractères — demandez-le-lui.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {resultats.map((c) => {
                const partenaire = partenariats.some((p) => p.clubId === c.id)
                const demande = demandesPartenaire.find((d) => d.clubId === c.id)
                return (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <ClubTile nom={c.nom} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-sm text-ink">{c.nom}</span>
                      <span className="block truncate font-body text-[0.72rem] text-ink-muted">
                        {c.ville}
                      </span>
                    </span>
                    {partenaire ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onOpenChange(false)
                          navigate(cheminClub(c.id))
                        }}
                      >
                        Voir
                      </Button>
                    ) : demande?.sens === "envoyee" ? (
                      <Badge variant="warning">Envoyée</Badge>
                    ) : demande?.sens === "recue" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          repondreDemande(demande.id, true)
                          onFait(`${c.nom} est maintenant votre partenaire.`)
                        }}
                      >
                        Accepter
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          envoyerDemandePartenaire(c.id)
                          onFait(`Demande envoyée à ${c.nom}.`)
                        }}
                      >
                        <UserPlus /> Demander
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
