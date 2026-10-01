import type { ReactNode } from "react"
import {
  AlertTriangle,
  Copy,
  Link2,
  Network,
  Shield,
  UserPlus,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/kit/Badge"
import { Button } from "@/components/ui/button"
import type { construirePlan } from "@/features/communaute/import/importHelpers"
import { Panneau } from "@/features/communaute/import/ImportUi"

/* ── Step 4 — Validation ────────────────────────────────────────────────── */

export function EtapeValidation({
  resume,
  ancre,
  club,
  onModifier,
}: {
  resume: ReturnType<typeof construirePlan>
  ancre: string
  club: string
  /** Absent in the visual mode — the recap is then read-only. */
  onModifier?: (etape: number) => void
}) {
  const r = resume
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Bilan
          titre="Structure"
          valeur={`${r.nbUnites} unités`}
          ligne={ancre}
          onModifier={onModifier ? () => onModifier(2) : undefined}
        />
        <Bilan
          titre="Postes"
          valeur={`${r.postesPourvus} pourvus`}
          ligne={`${r.personnes} personnes de votre club · ${r.postesVides.length} à pourvoir`}
          alerte={r.postesVides.length > 0}
          onModifier={onModifier ? () => onModifier(2) : undefined}
        />
        <Bilan
          titre="Documents"
          valeur={`${r.docsLies + r.docsCopies} repris`}
          ligne={`${r.docsLies} liés · ${r.docsCopies} copiés · ${r.docsIgnores} ignorés`}
          onModifier={onModifier ? () => onModifier(3) : undefined}
        />
      </div>

      <Panneau titre="Ce qui va se passer">
        <ul className="flex flex-col gap-2.5 font-body text-[0.86rem] text-ink-subtle">
          <Effet icon={Network}>
            {r.nbUnites} unités ajoutées à votre organigramme ({ancre.toLowerCase()}), qui sera réagencé.
          </Effet>
          {r.nouveauxNoms.length ? (
            <Effet icon={UserPlus}>
              {r.nouveauxNoms.length} nouveau{r.nouveauxNoms.length > 1 ? "x" : ""} membre
              {r.nouveauxNoms.length > 1 ? "s" : ""} créé{r.nouveauxNoms.length > 1 ? "s" : ""} :{" "}
              <span className="text-ink">{r.nouveauxNoms.join(", ")}</span>.
            </Effet>
          ) : null}
          {r.docsCopies ? (
            <Effet icon={Copy}>
              {r.docsCopies} document{r.docsCopies > 1 ? "s" : ""} de {club} ajouté
              {r.docsCopies > 1 ? "s" : ""} à vos Fiches & Documents, en brouillon.
            </Effet>
          ) : null}
          {r.docsLies ? (
            <Effet icon={Link2}>
              {r.docsLies} document{r.docsLies > 1 ? "s" : ""} rattaché{r.docsLies > 1 ? "s" : ""} à vos documents existants.
            </Effet>
          ) : null}
          {r.chartesAEnvoyer ? (
            <Effet icon={Shield}>
              {r.chartesAEnvoyer} charte{r.chartesAEnvoyer > 1 ? "s" : ""} à signer envoyée
              {r.chartesAEnvoyer > 1 ? "s" : ""} — elles apparaîtront « en attente » dans la fiche de chaque membre.
            </Effet>
          ) : null}
        </ul>
      </Panneau>

      {r.postesVides.length ? (
        <Panneau
          titre={
            <span className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-warning" /> Postes à pourvoir
            </span>
          }
          aside={
            onModifier ? (
              <Button size="sm" variant="outline" onClick={() => onModifier(2)}>
                Les attribuer
              </Button>
            ) : null
          }
        >
          <p className="font-body text-[0.8rem] text-ink-muted">
            L'organigramme ne liste que des personnes : ces postes ne seront pas créés tant que
            personne ne les occupe. Leurs fiches restent disponibles dans Fiches & Documents.
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {r.postesVides.map((p) => (
              <li key={`${p.unite}-${p.intitule}`}>
                <Badge variant="warning">
                  {p.intitule} · {p.unite}
                </Badge>
              </li>
            ))}
          </ul>
        </Panneau>
      ) : null}
    </div>
  )
}

function Bilan({
  titre,
  valeur,
  ligne,
  alerte,
  onModifier,
}: {
  titre: string
  valeur: string
  ligne: string
  alerte?: boolean
  onModifier?: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border px-5 py-4">
      <span className="flex items-center justify-between gap-2">
        <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">{titre}</span>
        {onModifier ? (
          <button type="button" onClick={onModifier} className="font-ui text-[0.72rem] text-info transition-opacity hover:opacity-80">
            Modifier
          </button>
        ) : null}
      </span>
      <span className="font-display text-2xl font-semibold text-ink">{valeur}</span>
      <span className={cn("font-body text-[0.78rem]", alerte ? "text-warning" : "text-ink-muted")}>{ligne}</span>
    </div>
  )
}

function Effet({ icon: Icon, children }: { icon: typeof Users; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-ink-muted" />
      <span>{children}</span>
    </li>
  )
}
