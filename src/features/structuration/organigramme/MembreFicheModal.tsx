import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  ListChecks,
  Plus,
  Shield,
  X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Fiche, MembreLie, MembreLieStatut } from "@/data/seed/fichesPoste"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { Button } from "@/components/ui/button"
import { StatutBadge } from "@/features/fiches-poste/ui"

import { Shell } from "./modals"

const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

const estCharte = (f: Fiche) => f.type === "Charte" || f.type === "Règlement"

/**
 * One membre of the organigramme, as the club's documents describe him: the
 * rôles he holds (listes des rôles), the poste he fills (fiche de poste) and
 * the chartes he signed or still has to sign. Everything is read from — and
 * written back to — the fiches themselves, so the Fiches & Documents pages
 * show the same thing.
 */
export function MembreFicheModal({
  membreId,
  onClose,
  onNotify,
}: {
  membreId: string
  onClose: () => void
  onNotify: (msg: string) => void
}) {
  const navigate = useNavigate()
  const { orgMembres, orgUnites, fiches, updateFiche } = useData()
  const membre = orgMembres.find((m) => m.id === membreId)
  if (!membre) return null

  const unites = orgUnites.filter((u) =>
    u.membres.some((a) => a.membreId === membreId),
  )
  const lien = (f: Fiche) => f.membres.find((m) => m.id === membreId)
  const roles = fiches.filter((f) => f.type === "Liste des Rôles" && lien(f))
  const postes = fiches.filter((f) => f.type === "Fiche de Poste" && lien(f))
  const chartes = fiches.filter((f) => estCharte(f) && lien(f))
  const chartesSignees = chartes.filter((f) => !lien(f)?.enAttente).length

  /* ── Mutations — all on the fiche's membres list ── */
  const lier = (f: Fiche, statut: MembreLieStatut, extra: Partial<MembreLie> = {}) =>
    updateFiche(f.id, {
      membres: [
        ...f.membres,
        {
          id: membre.id,
          nom: membre.nom,
          role: membre.role,
          groupe: unites[0]?.nom ?? "—",
          depuis: new Date().toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          }),
          statut,
          ...extra,
        },
      ],
    })
  const delier = (f: Fiche) =>
    updateFiche(f.id, { membres: f.membres.filter((m) => m.id !== membreId) })
  const signer = (f: Fiche) =>
    updateFiche(f.id, {
      membres: f.membres.map((m) =>
        m.id === membreId ? { ...m, enAttente: false } : m,
      ),
    })

  const ouvrir = (f: Fiche) => navigate(`/structuration/fiches-poste/${f.id}`)
  const prenom = membre.nom.split(" ")[0]

  return (
    <Shell
      title={membre.nom}
      description={[membre.role, ...unites.map((u) => u.nom)].join(" · ")}
      onClose={onClose}
      width="sm:max-w-[640px]"
      footer={
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      <div className="mb-5 flex items-center gap-4">
        <Avatar name={membre.nom} size="lg" />
        <div className="grid flex-1 grid-cols-3 gap-2">
          <Chiffre label="Rôles" valeur={String(roles.length)} />
          <Chiffre
            label="Fiche de poste"
            valeur={postes.length ? String(postes.length) : "—"}
            alerte={!postes.length}
          />
          <Chiffre
            label="Chartes signées"
            valeur={chartes.length ? `${chartesSignees}/${chartes.length}` : "—"}
            alerte={chartesSignees < chartes.length}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ── Rôles ── */}
        <Bloc icon={ListChecks} titre="Rôles">
          {roles.length ? (
            <ul className="flex flex-col gap-2">
              {roles.map((f) => {
                const l = lien(f)!
                return (
                  <Ligne key={f.id} onRetirer={() => {
                    delier(f)
                    onNotify(`${prenom} retiré de « ${f.titre} ».`)
                  }}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-sm text-ink">
                        {l.role}
                      </span>
                      <LienDoc fiche={f} onOpen={() => ouvrir(f)} />
                    </span>
                    {l.enAttente ? <EnAttente /> : null}
                  </Ligne>
                )
              })}
            </ul>
          ) : (
            <Vide>Aucun rôle attribué dans une liste des rôles.</Vide>
          )}
          <AjoutRole
            candidates={fiches.filter(
              (f) => f.type === "Liste des Rôles" && !lien(f),
            )}
            onAjouter={(f, role) => {
              lier(f, "Assigné", { role, enAttente: true })
              onNotify(`Rôle « ${role} » attribué à ${prenom}.`)
            }}
          />
        </Bloc>

        {/* ── Fiche de poste ── */}
        <Bloc icon={ClipboardList} titre="Fiche de poste">
          {postes.length ? (
            <ul className="flex flex-col gap-2">
              {postes.map((f) => {
                const l = lien(f)!
                const missions =
                  f.contenu?.sections.reduce((n, s) => n + s.points.length, 0) ?? 0
                return (
                  <li
                    key={f.id}
                    className="rounded-lg border border-border p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => ouvrir(f)}
                          className="group inline-flex max-w-full items-center gap-1 text-left font-ui text-sm font-medium text-ink transition-colors hover:text-brand-blue-600"
                        >
                          <span className="truncate">{f.perimetre}</span>
                          <ArrowUpRight size={13} className="shrink-0" />
                        </button>
                        <span className="mt-1 flex flex-wrap items-center gap-2">
                          <StatutBadge statut={f.statut} />
                          {l.enAttente ? <EnAttente /> : null}
                          <span className="font-body text-[0.72rem] text-ink-disabled">
                            Titulaire depuis {l.depuis}
                          </span>
                        </span>
                      </span>
                      <RetirerBtn
                        onClick={() => {
                          delier(f)
                          onNotify(`${prenom} n'est plus titulaire de « ${f.perimetre} ».`)
                        }}
                      />
                    </div>
                    {f.contenu?.objectif ? (
                      <p className="mt-2.5 font-body text-[0.8rem] text-ink-subtle">
                        {f.contenu.objectif}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-[0.74rem] text-ink-muted">
                      {f.contenu?.rattachement ? (
                        <span>Rattaché à {f.contenu.rattachement}</span>
                      ) : null}
                      {missions ? <span>{missions} missions</span> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Vide>Aucune fiche de poste — le poste n'est pas encore décrit.</Vide>
          )}
          <AjoutSimple
            libelle="Associer une fiche de poste"
            candidates={fiches.filter(
              (f) => f.type === "Fiche de Poste" && !lien(f),
            )}
            onAjouter={(f) => {
              lier(f, "Titulaire")
              onNotify(`${prenom} est titulaire de « ${f.perimetre} ».`)
            }}
          />
        </Bloc>

        {/* ── Chartes & règlement ── */}
        <Bloc icon={Shield} titre="Chartes & règlement">
          {chartes.length ? (
            <ul className="flex flex-col gap-2">
              {chartes.map((f) => {
                const l = lien(f)!
                return (
                  <Ligne key={f.id} onRetirer={() => {
                    delier(f)
                    onNotify(`« ${f.titre} » retirée pour ${prenom}.`)
                  }}>
                    <span className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => ouvrir(f)}
                        className="block max-w-full truncate text-left font-body text-sm text-ink transition-colors hover:text-brand-blue-600"
                      >
                        {f.titre}
                      </button>
                      <span className="block font-body text-[0.72rem] text-ink-disabled">
                        {f.perimetre}
                      </span>
                    </span>
                    {l.enAttente ? (
                      <span className="flex shrink-0 items-center gap-2">
                        <EnAttente />
                        <button
                          type="button"
                          onClick={() => {
                            signer(f)
                            onNotify(`${prenom} a signé « ${f.titre} ».`)
                          }}
                          className="font-ui text-[0.72rem] text-info transition-opacity hover:opacity-80"
                        >
                          Marquer signée
                        </button>
                      </span>
                    ) : (
                      <Badge variant="success">
                        <Check size={11} />
                        {l.statut === "Validé" ? "Validé" : "Signée"}
                      </Badge>
                    )}
                  </Ligne>
                )
              })}
            </ul>
          ) : (
            <Vide>Aucune charte signée.</Vide>
          )}
          <AjoutSimple
            libelle="Faire signer une charte"
            candidates={fiches.filter((f) => estCharte(f) && !lien(f))}
            onAjouter={(f) => {
              lier(f, f.type === "Règlement" ? "Validé" : "Signataire", {
                enAttente: true,
              })
              onNotify(`« ${f.titre} » envoyée à ${prenom} pour signature.`)
            }}
          />
        </Bloc>
      </div>
    </Shell>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Chiffre({
  label,
  valeur,
  alerte,
}: {
  label: string
  valeur: string
  alerte?: boolean
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <div
        className={cn(
          "font-display text-xl font-semibold tabular-nums",
          alerte ? "text-warning" : "text-ink",
        )}
      >
        {valeur}
      </div>
      <div className="mt-0.5 truncate font-ui text-[0.6rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </div>
    </div>
  )
}

function Bloc({
  icon: Icon,
  titre,
  children,
}: {
  icon: LucideIcon
  titre: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-ui text-[0.9rem] font-medium text-ink">
        <Icon size={15} className="text-ink-muted" />
        {titre}
      </h3>
      {children}
    </section>
  )
}

function Ligne({
  onRetirer,
  children,
}: {
  onRetirer: () => void
  children: ReactNode
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5">
      {children}
      <RetirerBtn onClick={onRetirer} />
    </li>
  )
}

function RetirerBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Retirer"
      title="Retirer"
      className="flex size-7 shrink-0 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-danger"
    >
      <X size={14} />
    </button>
  )
}

function LienDoc({ fiche, onOpen }: { fiche: Fiche; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block max-w-full truncate text-left font-body text-[0.72rem] text-ink-muted transition-colors hover:text-brand-blue-600"
    >
      {fiche.titre}
    </button>
  )
}

function EnAttente() {
  return (
    <Badge variant="warning" dot>
      En attente
    </Badge>
  )
}

function Vide({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-3.5 py-3 font-body text-[0.8rem] text-ink-disabled">
      {children}
    </p>
  )
}

function AjoutLien({
  libelle,
  onClick,
}: {
  libelle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 self-start font-ui text-[0.7rem] font-medium tracking-[0.05em] text-info uppercase transition-opacity hover:opacity-80"
    >
      <Plus size={13} /> {libelle}
    </button>
  )
}

/** "+ Associer…" → a select of the documents not linked yet, then Ajouter. */
function AjoutSimple({
  libelle,
  candidates,
  onAjouter,
}: {
  libelle: string
  candidates: Fiche[]
  onAjouter: (f: Fiche) => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [choix, setChoix] = useState("")
  if (!candidates.length) return null
  if (!ouvert) return <AjoutLien libelle={libelle} onClick={() => setOuvert(true)} />
  const f = candidates.find((c) => c.id === choix)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row">
      <select
        autoFocus
        value={choix}
        onChange={(e) => setChoix(e.target.value)}
        aria-label={libelle}
        className={fieldCls}
      >
        <option value="">Choisir un document…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titre}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setOuvert(false)}>
          Annuler
        </Button>
        <Button
          size="sm"
          disabled={!f}
          onClick={() => {
            if (!f) return
            onAjouter(f)
            setOuvert(false)
            setChoix("")
          }}
        >
          Ajouter
        </Button>
      </div>
    </div>
  )
}

/** A rôle needs its liste and its own wording ("Référent vidéo"…). */
function AjoutRole({
  candidates,
  onAjouter,
}: {
  candidates: Fiche[]
  onAjouter: (f: Fiche, role: string) => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [choix, setChoix] = useState("")
  const [role, setRole] = useState("")
  if (!candidates.length) return null
  if (!ouvert)
    return <AjoutLien libelle="Attribuer un rôle" onClick={() => setOuvert(true)} />
  const f = candidates.find((c) => c.id === choix)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <select
        autoFocus
        value={choix}
        onChange={(e) => setChoix(e.target.value)}
        aria-label="Liste des rôles"
        className={fieldCls}
      >
        <option value="">Choisir une liste des rôles…</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titre}
          </option>
        ))}
      </select>
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Rôle tenu (ex. Référent vidéo)"
        aria-label="Rôle tenu"
        className={fieldCls}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setOuvert(false)}>
          Annuler
        </Button>
        <Button
          size="sm"
          disabled={!f || !role.trim()}
          onClick={() => {
            if (!f || !role.trim()) return
            onAjouter(f, role.trim())
            setOuvert(false)
            setChoix("")
            setRole("")
          }}
        >
          Attribuer
        </Button>
      </div>
    </div>
  )
}
