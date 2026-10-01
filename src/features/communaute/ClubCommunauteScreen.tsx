import { useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { Lock, UserPlus } from "lucide-react"

import { useData } from "@/data/useData"
import { RESSOURCE_TYPES, TYPE_PLURIEL, type Ressource, type RessourceType } from "@/data/seed/communaute"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/features/budget/ui"
import { ApercuModal, ClubTile, GrilleRessources } from "@/features/communaute/CommunauteUi"
import { CHEMINS, dateFr } from "@/features/communaute/communauteHelpers"

/**
 * One club of the network. A partenaire opens on everything it shares, filtered
 * by type (counts on every chip, zero included, so "nothing here" is visible
 * before clicking); a club that isn't one yet shows why, and the way in.
 */
export function ClubCommunauteScreen() {
  const { id = "" } = useParams()
  const {
    clubsCommunaute,
    partenariats,
    demandesPartenaire,
    ressourcesCommunaute,
    envoyerDemandePartenaire,
  } = useData()
  const { toast, notify } = useToast()
  const [type, setType] = useState<RessourceType | "tous">("tous")
  const [ouverte, setOuverte] = useState<Ressource | null>(null)

  const club = clubsCommunaute.find((c) => c.id === id)
  if (!club) return <Navigate to={CHEMINS.partenaires} replace />
  const partenariat = partenariats.find((p) => p.clubId === club.id)
  const demande = demandesPartenaire.find((d) => d.clubId === club.id)
  const siennes = ressourcesCommunaute
    .filter((r) => r.clubId === club.id)
    .sort((a, b) => b.le.localeCompare(a.le))
  const visibles = siennes.filter((r) => type === "tous" || r.type === type)

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <div>
        <BackButton to={CHEMINS.partenaires} label="Communauté" />
        <div className="flex flex-col gap-4 rounded-lg border border-border p-5 sm:flex-row sm:items-center">
          <ClubTile nom={club.nom} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-ui text-2xl font-semibold text-ink">{club.nom}</h1>
              {partenariat ? <Badge variant="success" dot>Partenaire</Badge> : null}
            </div>
            <p className="mt-1 font-body text-sm text-ink-muted">
              {club.ville} · identifiant <span className="font-mono text-ink-subtle">{club.identifiant}</span>
              {partenariat ? ` · partenaire depuis ${dateFr(partenariat.depuis)}` : ""}
            </p>
          </div>
        </div>
      </div>

      {partenariat ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-ui text-lg font-medium text-ink">Ressources partagées</h2>
          <Segmented
            value={type}
            onChange={setType}
            className="flex-wrap"
            options={[
              { value: "tous" as const, label: "Tous", badge: siennes.length },
              ...RESSOURCE_TYPES.map((t) => ({
                value: t,
                label: TYPE_PLURIEL[t],
                badge: siennes.filter((r) => r.type === t).length,
              })),
            ]}
          />
          <GrilleRessources
            ressources={visibles}
            onOpen={setOuverte}
            vide={{
              titre: siennes.length
                ? `Aucun ${TYPE_PLURIEL[type as RessourceType]?.toLowerCase() ?? "fichier"} partagé`
                : `${club.nom} n'a encore rien partagé avec vous`,
            }}
          />
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-border">
          <EmptyState
            icon={Lock}
            title="Ce club n'est pas votre partenaire"
            description="Ses ressources ne sont visibles qu'une fois la demande de partenariat acceptée."
            action={
              demande ? (
                <Badge variant="warning" dot>
                  {demande.sens === "envoyee" ? "Demande envoyée" : "Demande reçue — répondez depuis Partenaires"}
                </Badge>
              ) : (
                <Button
                  onClick={() => {
                    envoyerDemandePartenaire(club.id)
                    notify(`Demande envoyée à ${club.nom}.`)
                  }}
                >
                  <UserPlus /> Demander un partenariat
                </Button>
              )
            }
          />
        </div>
      )}

      <ApercuModal ressource={ouverte} onClose={() => setOuverte(null)} onFait={notify} />
      <Toast toast={toast} />
    </div>
  )
}
