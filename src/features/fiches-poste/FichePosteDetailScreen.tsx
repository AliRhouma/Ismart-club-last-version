import { useNavigate, useParams } from "react-router-dom"
import { Calendar, ExternalLink, User, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useData } from "@/data/useData"
import type { MembreLie } from "@/data/seed/fichesPoste"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { BackButton } from "@/components/kit/BackButton"
import { DataTable, type Column } from "@/components/kit/DataTable"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import {
  MembreStatutBadge,
  StatutBadge,
  TypeBadge,
  TypeTile,
} from "@/features/fiches-poste/ui"

/** One "label: value" pair on the header's meta row. */
function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <span className="flex items-center gap-1.5 font-body text-[0.78rem] text-ink-disabled">
      <Icon size={13} />
      {label}:{" "}
      <span className="font-medium text-ink-subtle">{value}</span>
    </span>
  )
}

export function FichePosteDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fiches } = useData()

  const fiche = fiches.find((f) => f.id === id)

  if (!fiche) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col">
        <BackButton to="/structuration/fiches-poste" label="Retour aux documents" />
        <div className="rounded-lg border border-border">
          <EmptyState
            title="Document introuvable"
            description="Ce document n'existe plus ou a été supprimé."
          />
        </div>
      </div>
    )
  }

  const columns: Column<MembreLie>[] = [
    {
      id: "membre",
      header: "Membre",
      cell: (m) => (
        <span className="flex items-center gap-3">
          <Avatar name={m.nom} size="sm" />
          <span className="font-ui font-medium text-ink">{m.nom}</span>
        </span>
      ),
    },
    { id: "role", header: "Rôle", cell: (m) => m.role },
    {
      id: "groupe",
      header: "Groupe",
      cell: (m) => <Badge variant="info">{m.groupe}</Badge>,
    },
    {
      id: "depuis",
      header: "Depuis",
      width: "110px",
      cell: (m) => <span className="text-ink-muted">{m.depuis}</span>,
    },
    {
      id: "statut",
      header: "Statut",
      width: "140px",
      cell: (m) => <MembreStatutBadge statut={m.statut} />,
    },
  ]

  const nb = fiche.membres.length

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <BackButton to="/structuration/fiches-poste" label="Retour aux documents" />

      <div className="flex flex-col gap-4">
        {/* Identity card — what the document is, and the one thing you came
            to do with it (open it) as the only filled button on screen. */}
        <div className="rounded-lg border border-border p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <TypeTile type={fiche.type} size="lg" />
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <TypeBadge type={fiche.type} />
                  <StatutBadge statut={fiche.statut} />
                  <span className="font-mono text-[0.7rem] text-ink-disabled">
                    {fiche.version}
                  </span>
                </div>
                <h1 className="font-ui text-xl font-semibold text-ink">
                  {fiche.titre}
                </h1>
                <p className="mt-1 font-body text-sm text-ink-muted">
                  {fiche.perimetre}
                </p>
              </div>
            </div>

            <Button
              className="shrink-0"
              onClick={() => navigate("/documents")}
            >
              <ExternalLink /> Ouvrir le document
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4">
            <Meta icon={Calendar} label="Mis à jour" value={fiche.majLe} />
            <Meta icon={User} label="Auteur" value={fiche.auteur} />
            <Meta
              icon={Users}
              label="Membres"
              value={`${nb} concerné${nb > 1 ? "s" : ""}`}
            />
          </div>
        </div>

        {/* Who the document binds — the reason this screen exists. */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-ui text-sm font-medium text-ink">
              Membres concernés
            </h2>
            <p className="font-body text-[0.78rem] text-ink-muted">
              Personnes liées à ce document
            </p>
          </div>
          <DataTable
            columns={columns}
            data={fiche.membres}
            getRowId={(m) => m.id}
            empty={{
              icon: Users,
              title: "Aucun membre lié",
              description:
                "Ce document ne cible personne en particulier — il s'applique à tous.",
            }}
          />
        </div>
      </div>
    </div>
  )
}
