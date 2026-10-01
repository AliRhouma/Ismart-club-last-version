import { useEffect, useRef, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  Check,
  ClipboardCheck,
  Download,
  Eye,
  ListChecks,
  Network,
  Star,
  Target,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  MOI,
  type Ressource,
  type RessourceType,
} from "@/data/seed/communaute"
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
  dateFr,
  graine,
  initialesClub,
  nomDuClub,
} from "@/features/communaute/communauteHelpers"

/* ── Club tile ───────────────────────────────────────────────────────────── */

export function ClubTile({ nom, size = "md" }: { nom: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md border border-border bg-surface-nested font-ui font-medium text-ink-subtle",
        size === "sm" && "size-8 text-[0.66rem]",
        size === "md" && "size-10 text-[0.74rem]",
        size === "lg" && "size-16 rounded-lg text-lg",
      )}
    >
      {initialesClub(nom)}
    </span>
  )
}

/* ── Vignette — a drawn preview per resource type ────────────────────────── */

const TRAIT = "var(--neutral-300)"
const BLEU = "var(--brand-blue-600)"
const NEUTRE = "var(--neutral-500)"

/**
 * No uploaded images in the prototype, so every ressource gets a small
 * drawing of what it is — a tactical board for a procédé, a planning grid for
 * a programme, curves for an évaluation… Seeded by the id, so the same card
 * always looks the same.
 */
export function Vignette({
  type,
  id,
  className,
}: {
  type: RessourceType
  id: string
  className?: string
}) {
  const rnd = graine(id)
  let dessin: ReactNode
  if (type === "Procédé") {
    const joueurs = Array.from({ length: 8 }, (_, i) => ({
      x: 22 + rnd() * 116,
      y: 18 + rnd() * 64,
      bleu: i % 2 === 0,
    }))
    const [a, b] = joueurs
    dessin = (
      <>
        <rect x="10" y="8" width="140" height="84" rx="2" fill="none" stroke={TRAIT} />
        <line x1="80" y1="8" x2="80" y2="92" stroke={TRAIT} />
        <circle cx="80" cy="50" r="11" fill="none" stroke={TRAIT} />
        <rect x="10" y="34" width="12" height="32" fill="none" stroke={TRAIT} />
        <rect x="138" y="34" width="12" height="32" fill="none" stroke={TRAIT} />
        <path
          d={`M${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 14} ${b.x} ${b.y}`}
          fill="none"
          stroke={BLEU}
          strokeDasharray="3 3"
        />
        {joueurs.map((j, i) => (
          <circle key={i} cx={j.x} cy={j.y} r="3.4" fill={j.bleu ? BLEU : NEUTRE} />
        ))}
      </>
    )
  } else if (type === "Projet de jeu") {
    const lignes = [[80], [40, 67, 93, 120], [52, 80, 108], [45, 80, 115]]
    dessin = (
      <>
        <rect x="10" y="8" width="140" height="84" rx="2" fill="none" stroke={TRAIT} />
        <line x1="10" y1="50" x2="150" y2="50" stroke={TRAIT} />
        {lignes.map((xs, li) =>
          xs.map((x) => (
            <circle key={`${li}-${x}`} cx={x} cy={84 - li * 20} r="3.6" fill={li === 0 ? NEUTRE : BLEU} />
          )),
        )}
        <path d="M80 64 L80 36" stroke={BLEU} strokeDasharray="3 3" />
      </>
    )
  } else if (type === "Programme annuel") {
    dessin = (
      <>
        {Array.from({ length: 5 }, (_, l) =>
          Array.from({ length: 12 }, (_, c) => (
            <rect
              key={`${l}-${c}`}
              x={12 + c * 11.6}
              y={14 + l * 15}
              width="9.6"
              height="11"
              rx="1.5"
              fill={BLEU}
              opacity={0.15 + Math.round(rnd() * 4) * 0.18}
            />
          )),
        )}
      </>
    )
  } else if (type === "Modèle d'évaluation") {
    const courbe = (couleur: string) => {
      const pts = Array.from({ length: 9 }, (_, i) => `${14 + i * 16.5},${22 + rnd() * 56}`)
      return <polyline points={pts.join(" ")} fill="none" stroke={couleur} strokeWidth="2" strokeLinejoin="round" />
    }
    dessin = (
      <>
        {[25, 50, 75].map((y) => (
          <line key={y} x1="12" y1={y} x2="150" y2={y} stroke={TRAIT} strokeDasharray="2 4" />
        ))}
        {courbe(NEUTRE)}
        {courbe(BLEU)}
      </>
    )
  } else if (type === "Questionnaire") {
    dessin = (
      <>
        {Array.from({ length: 4 }, (_, l) => (
          <g key={l}>
            <rect x="14" y={14 + l * 19} width="44" height="6" rx="3" fill={TRAIT} />
            {Array.from({ length: 7 }, (_, c) => (
              <rect
                key={c}
                x={66 + c * 12}
                y={11 + l * 19}
                width="9"
                height="12"
                rx="2"
                fill={c === Math.floor(rnd() * 7) ? BLEU : "none"}
                stroke={TRAIT}
              />
            ))}
          </g>
        ))}
      </>
    )
  } else {
    const Icon = type === "Défi" ? Target : type === "Organigramme" ? Network : type === "Séance" ? ListChecks : ClipboardCheck
    return (
      <span className={cn("flex items-center justify-center text-ink-disabled", className)}>
        <Icon size={28} strokeWidth={1.5} />
      </span>
    )
  }
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      {dessin}
    </svg>
  )
}

/* ── Stats row ───────────────────────────────────────────────────────────── */

export function StatsRessource({ r }: { r: Ressource }) {
  return (
    <span className="flex items-center gap-3 font-ui text-[0.74rem] text-ink-muted tabular-nums">
      <span className="inline-flex items-center gap-1" title="Vues">
        <Eye size={13} /> {r.vues}
      </span>
      <span className="inline-flex items-center gap-1" title="Importations">
        <Download size={13} /> {r.imports}
      </span>
      {r.note != null ? (
        <span className="inline-flex items-center gap-1" title="Note moyenne">
          <Star size={13} className="fill-current text-warning" />
          <span className="text-ink">{r.note.toFixed(1).replace(".", ",")}</span>
        </span>
      ) : null}
    </span>
  )
}

/* ── Ressource card ─────────────────────────────────────────────────────── */

/**
 * One shared ressource. Navigable card (fluid fill on hover); the whole card
 * opens the aperçu. For a partner's ressource the import sits in the footer as
 * its own quiet button, so "look" and "take" stay two distinct gestures.
 */
export function CarteRessource({
  r,
  onOpen,
  afficherClub = true,
}: {
  r: Ressource
  onOpen: () => void
  afficherClub?: boolean
}) {
  const navigate = useNavigate()
  const { clubsCommunaute, importees, importerRessource } = useData()
  const importee = importees.some((i) => i.ressourceId === r.id)
  const aMoi = r.clubId === MOI
  // An organigramme is never copied blindly — it opens the mapping flow.
  const importer = () =>
    r.type === "Organigramme" ? navigate(`/communaute/import/${r.id}`) : importerRessource(r.id)
  const cats = r.categories.slice(0, 3)
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <button
        type="button"
        onClick={onOpen}
        className="relative z-10 flex flex-1 flex-col gap-3 p-3.5 text-left"
      >
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-ui text-[0.78rem] text-ink-muted">
            {afficherClub ? (aMoi ? "Mon club" : nomDuClub(clubsCommunaute, r.clubId)) : dateFr(r.le)}
          </span>
          <Badge variant="info">{r.type}</Badge>
        </span>
        <span className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-md border border-border bg-surface-nested p-2">
          <Vignette type={r.type} id={r.id} className="size-full" />
        </span>
        <span className="line-clamp-2 min-h-[2.5rem] font-ui text-[0.92rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
          {r.titre}
        </span>
        {cats.length ? (
          <span className="flex flex-wrap gap-1">
            {cats.map((c) => (
              <span key={c} className="rounded-pill border border-border px-2 py-0.5 font-ui text-[0.66rem] text-ink-muted">
                {c}
              </span>
            ))}
            {r.categories.length > cats.length ? (
              <span className="px-1 py-0.5 font-ui text-[0.66rem] text-ink-disabled">
                +{r.categories.length - cats.length}
              </span>
            ) : null}
          </span>
        ) : null}
      </button>
      <span className="relative z-10 flex items-center justify-between gap-2 border-t border-border px-3.5 py-2.5">
        <StatsRessource r={r} />
        {aMoi ? (
          <span className="font-body text-[0.7rem] text-ink-disabled">
            {afficherClub ? dateFr(r.le) : r.visibilite}
          </span>
        ) : importee && r.type !== "Organigramme" ? (
          <span className="inline-flex items-center gap-1 font-ui text-[0.72rem] text-success">
            <Check size={13} /> Importée
          </span>
        ) : (
          <button
            type="button"
            onClick={importer}
            className="inline-flex items-center gap-1 rounded-md border border-border-strong px-2 py-1 font-ui text-[0.72rem] text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Download size={12} /> Importer
          </button>
        )}
      </span>
    </div>
  )
}

export function GrilleRessources({
  ressources,
  onOpen,
  afficherClub,
  vide,
}: {
  ressources: Ressource[]
  onOpen: (r: Ressource) => void
  afficherClub?: boolean
  vide: { titre: string; description?: string; action?: ReactNode }
}) {
  if (!ressources.length)
    return (
      <div className="rounded-lg border border-dashed border-border">
        <EmptyState
          title={vide.titre}
          description={vide.description}
          action={vide.action}
        />
      </div>
    )
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ressources.map((r) => (
        <CarteRessource key={r.id} r={r} onOpen={() => onOpen(r)} afficherClub={afficherClub} />
      ))}
    </div>
  )
}

/* ── Aperçu ─────────────────────────────────────────────────────────────── */

export function ApercuModal({
  ressource,
  onClose,
  onFait,
  onRetirer,
}: {
  ressource: Ressource | null
  onClose: () => void
  onFait: (msg: string) => void
  /** Ours only — stop sharing it (the caller confirms). */
  onRetirer?: (r: Ressource) => void
}) {
  return (
    <Dialog open={!!ressource} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-2xl">
        {ressource ? (
          <Apercu
            key={ressource.id}
            r={ressource}
            onClose={onClose}
            onFait={onFait}
            onRetirer={onRetirer}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Apercu({
  r: initiale,
  onClose,
  onFait,
  onRetirer,
}: {
  r: Ressource
  onClose: () => void
  onFait: (msg: string) => void
  onRetirer?: (r: Ressource) => void
}) {
  const navigate = useNavigate()
  const {
    clubsCommunaute,
    ressourcesCommunaute,
    importees,
    importerRessource,
    voirRessource,
    organigrammesPartages,
  } = useData()
  const org = organigrammesPartages[initiale.id]
  // Read the live row so the vue / import counters tick in place.
  const r = ressourcesCommunaute.find((x) => x.id === initiale.id) ?? initiale
  const aMoi = r.clubId === MOI
  const importee = importees.some((i) => i.ressourceId === r.id)
  const compte = useRef(false)
  useEffect(() => {
    if (compte.current || aMoi) return
    compte.current = true
    voirRessource(r.id)
  }, [aMoi, r.id, voirRessource])

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{r.type}</Badge>
          <span className="font-body text-[0.78rem] text-ink-muted">
            {aMoi ? "Partagée par votre club" : nomDuClub(clubsCommunaute, r.clubId)} · {dateFr(r.le)}
          </span>
        </div>
        <DialogTitle className="text-left">{r.titre}</DialogTitle>
        <DialogDescription className="sr-only">Aperçu de la ressource partagée</DialogDescription>
      </DialogHeader>

      {org ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            {org.unites.length} unités · {org.unites.reduce((n, u) => n + u.postes.length, 0)} postes ·{" "}
            {org.documents.length} documents
          </span>
          <ul className="flex flex-col gap-1">
            {org.unites.map((u) => {
              let niveau = 0
              let p = u.parentId
              while (p) {
                niveau++
                p = org.unites.find((x) => x.id === p)?.parentId ?? null
              }
              return (
                <li
                  key={u.id}
                  style={{ paddingLeft: niveau * 18 }}
                  className="flex items-center gap-2 font-body text-[0.84rem] text-ink-subtle"
                >
                  <Network size={13} className="shrink-0 text-ink-disabled" />
                  <span className="truncate">{u.nom}</span>
                  <span className="shrink-0 font-ui text-[0.7rem] text-ink-disabled">
                    {u.postes.length} poste{u.postes.length > 1 ? "s" : ""}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-border bg-surface-nested p-4">
          <Vignette type={r.type} id={r.id} className="size-full" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatsRessource r={r} />
        {r.categories.length ? (
          <span className="flex flex-wrap gap-1">
            {r.categories.map((c) => (
              <span key={c} className="rounded-pill border border-border px-2 py-0.5 font-ui text-[0.66rem] text-ink-muted">
                {c}
              </span>
            ))}
          </span>
        ) : null}
      </div>

      {aMoi ? (
        <p className="rounded-md border border-border px-3.5 py-2.5 font-body text-[0.8rem] text-ink-muted">
          Visible par : <span className="text-ink">{r.visibilite}</span>. Réglez le partage par
          type de ressource dans Partenaires › Paramètres.
        </p>
      ) : null}

      <DialogFooter className="gap-2 sm:justify-between">
        {aMoi && onRetirer ? (
          <Button
            variant="ghost"
            className="text-danger hover:text-danger"
            onClick={() => onRetirer(r)}
          >
            <Trash2 /> Retirer du partage
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {!aMoi && org ? (
            <Button onClick={() => navigate(`/communaute/import/${r.id}`)}>
              <Download /> {importee ? "Importer à nouveau" : "Importer et adapter"}
            </Button>
          ) : !aMoi ? (
            <Button
              disabled={importee}
              onClick={() => {
                importerRessource(r.id)
                onFait(`« ${r.titre} » importée dans votre bibliothèque.`)
              }}
            >
              {importee ? <Check /> : <Download />}
              {importee ? "Déjà importée" : "Importer dans ma bibliothèque"}
            </Button>
          ) : null}
        </div>
      </DialogFooter>
    </>
  )
}
