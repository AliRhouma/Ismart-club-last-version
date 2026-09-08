import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronRight,
  Folder,
  FolderOpen,
  Globe,
  Lock,
  MoreVertical,
  Search,
  Send,
  Settings2,
  Trash2,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  PARTAGE_PAR_DEFAUT,
  PARTAGE_RESSOURCES,
  type PartagePortee,
  type ProgrammeAnnuel,
  type ProgrammePartage,
} from "@/data/seed/programmation"
import { cheminDossier, enfantsDe, type Dossier } from "@/data/seed/dossiers"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { EmptyState } from "@/components/kit/EmptyState"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CONVERSATIONS } from "@/features/messagerie/mock"

type Modale = "message" | "communaute" | "dossier" | null

/**
 * Everything you can do *to* a programme, as opposed to inside it: send it to a
 * conversation, share it with partenaires, file it, delete it. They live behind
 * one three-dots menu so the section header keeps a single visible action.
 */
export function ProgrammeActions({
  programme,
  groupes,
  onSupprime,
  onFait,
}: {
  programme: ProgrammeAnnuel
  /** The groupes running it, e.g. "Groupe A · Groupe B" — for the copy. */
  groupes: string
  /** Called after the programme is deleted, to leave the screen. */
  onSupprime: () => void
  /** Confirmation copy for the shared toast. */
  onFait: (message: string) => void
}) {
  const { updateProgrammeAnnuel, removeProgrammeAnnuel } = useData()
  const [modale, setModale] = useState<Modale>(null)
  const [supprimerOpen, setSupprimerOpen] = useState(false)

  return (
    <>
      <MenuActions
        onMessage={() => setModale("message")}
        onCommunaute={() => setModale("communaute")}
        onDossier={() => setModale("dossier")}
        onSupprimer={() => setSupprimerOpen(true)}
      />

      <EnvoyerModal
        open={modale === "message"}
        onOpenChange={(o) => !o && setModale(null)}
        programme={programme}
        groupes={groupes}
        onEnvoye={(nom) => {
          setModale(null)
          onFait(`Programme envoyé à ${nom}.`)
        }}
      />

      <CommunauteModal
        open={modale === "communaute"}
        onOpenChange={(o) => !o && setModale(null)}
        partage={programme.partage ?? PARTAGE_PAR_DEFAUT}
        onEnregistrer={(partage) => {
          updateProgrammeAnnuel(programme.id, { partage })
          setModale(null)
          onFait("Paramètres de partage enregistrés.")
        }}
      />

      <DossierModal
        open={modale === "dossier"}
        onOpenChange={(o) => !o && setModale(null)}
        dossierId={programme.dossierId}
        onEnregistrer={(dossierId, chemin) => {
          updateProgrammeAnnuel(programme.id, { dossierId })
          setModale(null)
          onFait(`Programme enregistré dans ${chemin}.`)
        }}
      />

      <ConfirmDialog
        open={supprimerOpen}
        onOpenChange={setSupprimerOpen}
        title="Supprimer le programme annuel ?"
        description={`Les ${programme.sessions.length} lignes du programme de ${programme.categorie} seront perdues pour tous ses groupes. Les séances déjà planifiées restent au calendrier.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeProgrammeAnnuel(programme.id)
          setSupprimerOpen(false)
          onSupprime()
        }}
      />
    </>
  )
}

/* ── The menu itself ──────────────────────────────────────────────────────── */

function MenuActions({
  onMessage,
  onCommunaute,
  onDossier,
  onSupprimer,
}: {
  onMessage: () => void
  onCommunaute: () => void
  onDossier: () => void
  onSupprimer: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-md border text-ink-muted transition-colors",
          open
            ? "border-border-strong bg-surface-hover text-ink"
            : "border-border hover:border-border-strong hover:bg-surface-hover hover:text-ink",
        )}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 w-[15rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-deep">
          <MenuRow
            icon={Send}
            label="Envoyer en message"
            onClick={() => run(onMessage)}
          />
          <MenuRow
            icon={Globe}
            label="Partager à la communauté"
            onClick={() => run(onCommunaute)}
          />
          <MenuRow
            icon={Folder}
            label="Enregistrer dans un dossier"
            onClick={() => run(onDossier)}
          />
          <span className="my-1 block h-px bg-border" aria-hidden />
          <MenuRow
            icon={Trash2}
            label="Supprimer"
            danger
            onClick={() => run(onSupprimer)}
          />
        </div>
      ) : null}
    </div>
  )
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Send
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.82rem] transition-colors hover:bg-surface-hover",
        danger ? "text-danger" : "text-ink-subtle hover:text-ink",
      )}
    >
      <Icon size={15} className="shrink-0" />
      {label}
    </button>
  )
}

/* ── Envoyer en message ───────────────────────────────────────────────────── */

/** The messagerie's conversations, picked one at a time — sending a programme
 *  is addressed to a conversation, the same way a file would be. */
function EnvoyerModal({
  open,
  onOpenChange,
  programme,
  groupes,
  onEnvoye,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  programme: ProgrammeAnnuel
  groupes: string
  onEnvoye: (nom: string) => void
}) {
  const [q, setQ] = useState("")
  const [choisi, setChoisi] = useState<string | null>(null)

  const visibles = CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const conversation = CONVERSATIONS.find((c) => c.id === choisi)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer le programme</DialogTitle>
          <DialogDescription>
            {programme.categorie} · {programme.saison} · {groupes} — choisissez
            la conversation qui le reçoit.
          </DialogDescription>
        </DialogHeader>

        <label className="relative block">
          <Search
            size={14}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une conversation…"
            aria-label="Rechercher une conversation"
            className="w-full rounded-md border border-input bg-transparent py-2.5 pr-3.5 pl-9 font-body text-sm text-ink outline-none transition-colors focus:border-border-focus"
          />
        </label>

        {visibles.length === 0 ? (
          <div className="rounded-lg border border-border">
            <EmptyState
              icon={Search}
              title="Aucune conversation"
              description="Aucune conversation ne correspond à cette recherche."
            />
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Conversations"
            className="flex max-h-72 flex-col gap-1.5 overflow-y-auto"
          >
            {visibles.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={choisi === c.id}
                onClick={() => setChoisi(c.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  choisi === c.id
                    ? "border-info bg-info/5"
                    : "border-border hover:border-border-strong",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.72rem] text-ink-muted">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-ui text-[0.86rem] text-ink">
                    {c.name}
                  </span>
                  <span className="block truncate font-body text-[0.74rem] text-ink-muted">
                    {c.context}
                  </span>
                </span>
                {choisi === c.id ? (
                  <Check size={15} className="shrink-0 text-info" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!conversation}
            onClick={() => conversation && onEnvoye(conversation.name)}
          >
            <Send /> Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Partager à la communauté ─────────────────────────────────────────────── */

const PORTEES: {
  value: PartagePortee
  icon: typeof Lock
  label: string
  aide: string
  /** Each scope owns a colour so the choice reads at a glance. */
  teinte: string
  bordure: string
}[] = [
  {
    value: "prive",
    icon: Lock,
    label: "Privé",
    aide: "Visible uniquement par vous",
    teinte: "text-danger",
    bordure: "border-danger",
  },
  {
    value: "partenaires",
    icon: Users,
    label: "Tous les partenaires",
    aide: "Visible par tous vos partenaires",
    teinte: "text-success",
    bordure: "border-success",
  },
  {
    value: "personnalise",
    icon: Settings2,
    label: "Personnalisé",
    aide: "Visible uniquement par les partenaires sélectionnés",
    teinte: "text-warning",
    bordure: "border-warning",
  },
]

function CommunauteModal({
  open,
  onOpenChange,
  partage,
  onEnregistrer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  partage: ProgrammePartage
  onEnregistrer: (partage: ProgrammePartage) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Mounted only while open, so reopening always shows what is saved
          rather than the draft abandoned last time. */}
      {open ? (
        <CommunauteCorps
          onAnnuler={() => onOpenChange(false)}
          partage={partage}
          onEnregistrer={onEnregistrer}
        />
      ) : null}
    </Dialog>
  )
}

function CommunauteCorps({
  partage,
  onAnnuler,
  onEnregistrer,
}: {
  partage: ProgrammePartage
  onAnnuler: () => void
  onEnregistrer: (partage: ProgrammePartage) => void
}) {
  const { partners } = useData()
  const actifs = useMemo(
    () => partners.filter((p) => p.status === "actif"),
    [partners],
  )

  const [ressources, setRessources] = useState<string[]>(partage.ressources)
  const [portee, setPortee] = useState<PartagePortee>(partage.portee)
  const [choisis, setChoisis] = useState<string[]>(partage.partenaireIds)
  const [q, setQ] = useState("")
  const [listeOuverte, setListeOuverte] = useState(false)

  const bascule = (liste: string[], valeur: string) =>
    liste.includes(valeur)
      ? liste.filter((x) => x !== valeur)
      : [...liste, valeur]

  const visibles = actifs.filter((p) =>
    p.name.toLowerCase().includes(q.trim().toLowerCase()),
  )
  const tousChoisis =
    visibles.length > 0 && visibles.every((p) => choisis.includes(p.id))

  return (
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ressources à partager</DialogTitle>
          <DialogDescription className="sr-only">
            Ce que le partage emporte, et qui peut le voir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {PARTAGE_RESSOURCES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={ressources.includes(r)}
              onClick={() => setRessources((liste) => bascule(liste, r))}
              className={cn(
                "rounded-pill border px-3.5 py-1.5 font-ui text-[0.78rem] transition-colors",
                ressources.includes(r)
                  ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                  : "border-border-strong text-ink-muted hover:text-ink",
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <h3 className="font-ui text-[0.95rem] font-medium text-ink">
          Paramètres de partage
        </h3>

        <div role="radiogroup" aria-label="Portée du partage" className="flex flex-col gap-2.5">
          {PORTEES.map((p) => {
            const Icon = p.icon
            const actif = portee === p.value
            return (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => setPortee(p.value)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                  actif ? p.bordure : "border-border hover:border-border-strong",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    actif ? "bg-current" : "bg-transparent",
                    actif ? p.teinte : "",
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "flex items-center gap-2 font-ui text-[0.9rem] font-medium",
                      p.teinte,
                    )}
                  >
                    <Icon size={15} /> {p.label}
                  </span>
                  <span className="mt-0.5 block font-body text-[0.78rem] text-ink-muted">
                    {p.aide}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* The partner picker only exists for the custom scope. */}
        {portee === "personnalise" ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              aria-expanded={listeOuverte}
              onClick={() => setListeOuverte((o) => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink transition-colors hover:border-border-strong"
            >
              <span className={choisis.length ? "text-ink" : "text-ink-disabled"}>
                {choisis.length
                  ? `${choisis.length} partenaire${choisis.length > 1 ? "s" : ""} sélectionné${choisis.length > 1 ? "s" : ""}`
                  : "Sélectionner des partenaires…"}
              </span>
              <ChevronRight
                size={14}
                className={cn(
                  "shrink-0 text-ink-muted transition-transform",
                  listeOuverte && "rotate-90",
                )}
              />
            </button>

            {listeOuverte ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <label className="relative block border-b border-border">
                  <Search
                    size={14}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher…"
                    aria-label="Rechercher un partenaire"
                    className="w-full bg-transparent py-2.5 pr-3.5 pl-9 font-body text-sm text-ink outline-none"
                  />
                </label>

                {visibles.length === 0 ? (
                  <p className="px-3.5 py-4 font-body text-[0.8rem] text-ink-muted">
                    Aucun partenaire ne correspond.
                  </p>
                ) : (
                  <div className="max-h-52 overflow-y-auto">
                    <CaseAPartenaire
                      label="(Tout sélectionner)"
                      coche={tousChoisis}
                      onToggle={() =>
                        setChoisis((prev) =>
                          tousChoisis
                            ? prev.filter(
                                (id) => !visibles.some((p) => p.id === id),
                              )
                            : [
                                ...new Set([
                                  ...prev,
                                  ...visibles.map((p) => p.id),
                                ]),
                              ],
                        )
                      }
                    />
                    {visibles.map((p) => (
                      <CaseAPartenaire
                        key={p.id}
                        label={p.name}
                        couleur={p.color}
                        coche={choisis.includes(p.id)}
                        onToggle={() =>
                          setChoisis((liste) => bascule(liste, p.id))
                        }
                      />
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setListeOuverte(false)}
                  className="w-full border-t border-border py-2 font-ui text-[0.78rem] text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  Fermer
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button
            onClick={() =>
              onEnregistrer({
                ressources,
                portee,
                partenaireIds: portee === "personnalise" ? choisis : [],
              })
            }
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}

function CaseAPartenaire({
  label,
  couleur,
  coche,
  onToggle,
}: {
  label: string
  couleur?: string
  coche: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={coche}
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-hover"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
          coche ? "border-info bg-info text-ink-inverted" : "border-border-strong",
        )}
      >
        {coche ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      {couleur ? (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: couleur }}
        />
      ) : null}
      <span className="truncate font-body text-[0.82rem] text-ink-subtle">
        {label}
      </span>
    </button>
  )
}

/* ── Enregistrer dans un dossier ──────────────────────────────────────────── */

function DossierModal({
  open,
  onOpenChange,
  dossierId,
  onEnregistrer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dossierId?: string
  onEnregistrer: (dossierId: string, chemin: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Mounted only while open, so the tree reopens on what is saved. */}
      {open ? (
        <DossierCorps
          dossierId={dossierId}
          onAnnuler={() => onOpenChange(false)}
          onEnregistrer={onEnregistrer}
        />
      ) : null}
    </Dialog>
  )
}

function DossierCorps({
  dossierId,
  onAnnuler,
  onEnregistrer,
}: {
  dossierId?: string
  onAnnuler: () => void
  onEnregistrer: (dossierId: string, chemin: string) => void
}) {
  const { dossiers } = useData()
  const [choisi, setChoisi] = useState<string | null>(dossierId ?? null)
  // Every branch starts open: the tree is small, and a collapsed root would
  // hide the folder the programme is already filed in.
  const [ouverts, setOuverts] = useState<string[]>(() =>
    dossiers.map((d) => d.id),
  )

  return (
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enregistrer dans un dossier</DialogTitle>
          <DialogDescription>
            {choisi
              ? cheminDossier(dossiers, choisi)
              : "Choisissez le dossier qui accueille ce programme."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-2">
          {enfantsDe(dossiers, null).map((d) => (
            <Branche
              key={d.id}
              dossier={d}
              dossiers={dossiers}
              niveau={0}
              choisi={choisi}
              ouverts={ouverts}
              onChoisir={setChoisi}
              onBasculer={(id) =>
                setOuverts((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                )
              }
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button
            disabled={!choisi}
            onClick={() =>
              choisi && onEnregistrer(choisi, cheminDossier(dossiers, choisi))
            }
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}

function Branche({
  dossier,
  dossiers,
  niveau,
  choisi,
  ouverts,
  onChoisir,
  onBasculer,
}: {
  dossier: Dossier
  dossiers: Dossier[]
  niveau: number
  choisi: string | null
  ouverts: string[]
  onChoisir: (id: string) => void
  onBasculer: (id: string) => void
}) {
  const enfants = enfantsDe(dossiers, dossier.id)
  const ouvert = ouverts.includes(dossier.id)
  const actif = choisi === dossier.id

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 rounded-sm transition-colors",
          actif ? "bg-info/10" : "hover:bg-surface-hover",
        )}
        style={{ paddingLeft: niveau * 16 }}
      >
        <button
          type="button"
          aria-label={ouvert ? "Replier" : "Déplier"}
          onClick={() => onBasculer(dossier.id)}
          disabled={!enfants.length}
          className="flex size-6 shrink-0 items-center justify-center text-ink-disabled disabled:opacity-0"
        >
          <ChevronRight
            size={13}
            className={cn("transition-transform", ouvert && "rotate-90")}
          />
        </button>
        <button
          type="button"
          onClick={() => onChoisir(dossier.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"
        >
          {ouvert && enfants.length ? (
            <FolderOpen
              size={14}
              className={cn("shrink-0", actif ? "text-info" : "text-ink-muted")}
            />
          ) : (
            <Folder
              size={14}
              className={cn("shrink-0", actif ? "text-info" : "text-ink-muted")}
            />
          )}
          <span
            className={cn(
              "truncate font-body text-[0.82rem]",
              actif ? "text-info" : "text-ink-subtle",
            )}
          >
            {dossier.nom}
          </span>
        </button>
      </div>

      {ouvert
        ? enfants.map((e) => (
            <Branche
              key={e.id}
              dossier={e}
              dossiers={dossiers}
              niveau={niveau + 1}
              choisi={choisi}
              ouverts={ouverts}
              onChoisir={onChoisir}
              onBasculer={onBasculer}
            />
          ))
        : null}
    </>
  )
}
