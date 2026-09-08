import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BadgeCheck,
  Bell,
  Check,
  Copy,
  Link2,
  Mail,
  PlayCircle,
  Phone,
  RefreshCw,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Categorie } from "@/data/seed/categories"
import { POSTE_LABEL } from "@/data/seed/categories"
import {
  PROFIL_LABEL,
  STATUT_DEMANDE_LABEL,
  type DemandeInscription,
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
import { Segmented } from "@/features/budget/ui"

const STATUT_VARIANT: Record<StatutDemande, "warning" | "success" | "danger"> = {
  "en-attente": "warning",
  approuvee: "success",
  refusee: "danger",
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

/**
 * Inscriptions — the éducateur's side of the join link: the link he shares, and
 * the requests it brings back. Pending ones come first and stay first, because
 * the only thing that matters here is what is still waiting on him.
 */
export function CategorieInscriptions({ categorie }: { categorie: Categorie }) {
  const navigate = useNavigate()
  const {
    liensInscription,
    demandesInscription,
    creerLienInscription,
    revoquerLienInscription,
    traiterDemande,
  } = useData()

  const [filtre, setFiltre] = useState<StatutDemande | "toutes">("en-attente")
  const [copie, setCopie] = useState(false)
  const [ouverte, setOuverte] = useState<DemandeInscription | null>(null)
  const [refus, setRefus] = useState<DemandeInscription | null>(null)
  const [motif, setMotif] = useState("")

  const lien = liensInscription.find(
    (l) => l.categorieId === categorie.id && l.actif,
  )
  const url = lien ? `${window.location.origin}/rejoindre/${lien.token}` : ""

  const toutes = demandesInscription.filter(
    (d) => d.categorieId === categorie.id,
  )
  const enAttente = toutes.filter((d) => d.statut === "en-attente")
  const visibles =
    filtre === "toutes" ? toutes : toutes.filter((d) => d.statut === filtre)

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // Clipboard is blocked in some contexts; the field is selectable anyway.
    }
  }

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
          onChange={setFiltre}
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
            return (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.74rem] text-ink-muted">
                  {d.joueur.prenom[0]}
                  {d.joueur.nom[0]}
                </span>

                <button
                  type="button"
                  onClick={() => setOuverte(d)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-ui text-[0.9rem] text-ink">
                      {d.joueur.prenom} {d.joueur.nom}
                    </span>
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
                    {PROFIL_LABEL[d.profil]}
                    {d.parent ? ` · ${d.parent.prenom} ${d.parent.nom}` : ""}
                    {d.nouveauCompte ? " · nouveau compte" : ""} · reçue le{" "}
                    {d.soumiseLe}
                  </span>
                </button>

                {d.statut === "en-attente" ? (
                  <span className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMotif("")
                        setRefus(d)
                      }}
                    >
                      <X /> Refuser
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => traiterDemande(d.id, "approuvee")}
                    >
                      <Check /> Approuver
                    </Button>
                  </span>
                ) : (
                  <span className="shrink-0 font-body text-[0.74rem] text-ink-disabled">
                    Traitée le {d.traiteeLe}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* One request's fiche. */}
      <Dialog open={!!ouverte} onOpenChange={(o) => !o && setOuverte(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
          {ouverte ? (
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

              <dl className="grid gap-4 sm:grid-cols-2">
                <Info
                  label="Naissance"
                  valeur={
                    ouverte.joueur.naissance
                      ? ouverte.joueur.naissance.split("-").reverse().join("/")
                      : "—"
                  }
                />
                <Info label="Genre" valeur={ouverte.joueur.genre} />
                <Info
                  label="Poste souhaité"
                  valeur={
                    ouverte.joueur.poste
                      ? (POSTE_LABEL[ouverte.joueur.poste] ??
                        ouverte.joueur.poste)
                      : "Non précisé"
                  }
                />
                <Info
                  label="Niveau"
                  valeur={ouverte.joueur.niveau || "Non précisé"}
                />
              </dl>

              {ouverte.parent ? (
                <section className="flex flex-col gap-2 rounded-lg border border-border p-4">
                  <h3 className="flex items-center gap-2 font-ui text-[0.82rem] font-medium text-ink">
                    <Users size={14} className="text-ink-muted" /> Parent
                  </h3>
                  <p className="font-body text-[0.84rem] text-ink-subtle">
                    {ouverte.parent.prenom} {ouverte.parent.nom}
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
                    <BadgeCheck size={14} className="text-ink-muted" /> Contact
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
                      traiterDemande(ouverte.id, "approuvee")
                      setOuverte(null)
                    }}
                  >
                    <Check /> Approuver
                  </Button>
                </DialogFooter>
              ) : null}
            </>
          ) : null}
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
