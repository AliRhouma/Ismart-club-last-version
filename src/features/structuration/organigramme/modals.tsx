import { useMemo, useState, type ReactNode } from "react"
import {
  ArrowRight,
  Check,
  ListTodo,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { Avatar } from "@/components/kit/Avatar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/kit/EmptyState"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  OrgMembre,
  OrgTache,
  OrgUnite,
} from "@/data/seed/organigramme"

import { statutMeta, TacheRow } from "./ui"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/* ── Shared modal shell — one close X, centered ─────────────────────────── */

function Shell({
  title,
  description,
  onClose,
  width = "sm:max-w-[560px]",
  footer,
  bodyKey,
  children,
}: {
  title: string
  description: string
  onClose: () => void
  width?: string
  footer?: ReactNode
  /** Change it to remount the scroll area — resets scroll between steps. */
  bodyKey?: string
  children: ReactNode
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden rounded-xl border-border bg-surface p-0",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {description}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-border-strong hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div
          key={bodyKey}
          className="flex max-h-[62vh] flex-col overflow-y-auto px-5 py-4"
        >
          {children}
        </div>

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/* ── Gérer les membres ──────────────────────────────────────────────────── */

/**
 * Pick the membres affected to a unité. Selecting keeps the tâches a member
 * already carries here; unselecting drops them with the affectation.
 */
export function MembresModal({
  unite,
  onClose,
  onSaved,
}: {
  unite: OrgUnite
  onClose: () => void
  onSaved: (count: number) => void
}) {
  const { orgMembres, setOrgUniteMembres } = useData()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>(() =>
    unite.membres.map((a) => a.membreId),
  )

  const filtered = orgMembres.filter(
    (m) =>
      m.nom.toLowerCase().includes(query.toLowerCase()) ||
      m.role.toLowerCase().includes(query.toLowerCase()),
  )

  const save = () => {
    setOrgUniteMembres(
      unite.id,
      selected.map((id) => ({
        membreId: id,
        taches: unite.membres.find((a) => a.membreId === id)?.taches ?? [],
      })),
    )
    onSaved(selected.length)
    onClose()
  }

  return (
    <Shell
      title={`Membres — ${unite.nom || "Unité"}`}
      description="Sélectionnez les personnes rattachées à cette unité."
      onClose={onClose}
      width="sm:max-w-[680px]"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save}>
            <UserCheck size={15} /> Enregistrer ({selected.length})
          </Button>
        </>
      }
    >
      <div className="relative mb-4">
        <Search
          size={15}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-disabled"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou par rôle…"
          className={cn(inputCls, "pl-9")}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun membre"
          description="Aucune personne ne correspond à cette recherche."
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((m) => {
            const on = selected.includes(m.id)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  setSelected((prev) =>
                    on ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                  )
                }
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  on
                    ? "border-brand-blue-600/40 bg-brand-blue-600/5"
                    : "border-border hover:border-border-strong",
                )}
              >
                <Avatar name={m.nom} size="md" />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-body text-sm text-ink">
                    {m.nom}
                  </span>
                  <span className="block truncate font-body text-[0.72rem] text-ink-muted">
                    {m.role}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-sm border",
                    on
                      ? "border-brand-blue-600 bg-brand-blue-600 text-white"
                      : "border-border-strong text-transparent",
                  )}
                >
                  <Check size={12} />
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Shell>
  )
}

/* ── Aperçu d'une unité ─────────────────────────────────────────────────── */

export function UniteApercuModal({
  unite,
  parent,
  membresById,
  onClose,
}: {
  unite: OrgUnite
  parent: OrgUnite | null
  membresById: Record<string, OrgMembre>
  onClose: () => void
}) {
  const nbTaches = unite.membres.reduce((s, a) => s + a.taches.length, 0)

  return (
    <Shell
      title={unite.nom || "Unité sans nom"}
      description={
        parent ? `Rattachée à ${parent.nom}` : "Unité racine de l'organigramme"
      }
      onClose={onClose}
      width="sm:max-w-[560px]"
      footer={
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border px-4 py-3">
          <div className="font-display text-2xl font-semibold text-ink">
            {unite.membres.length}
          </div>
          <div className="mt-1 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
            Membres
          </div>
        </div>
        <div className="rounded-lg border border-border px-4 py-3">
          <div className="font-display text-2xl font-semibold text-ink">
            {nbTaches}
          </div>
          <div className="mt-1 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
            Tâches en cours
          </div>
        </div>
      </div>

      {unite.membres.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun membre affecté"
          description="Utilisez « Gérer les membres » sur la carte pour en rattacher."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {unite.membres.map((a) => {
            const m = membresById[a.membreId]
            if (!m) return null
            return (
              <li
                key={a.membreId}
                className="rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.nom} size="md" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-body text-sm text-ink">
                      {m.nom}
                    </span>
                    <span className="block truncate font-body text-[0.72rem] text-ink-muted">
                      {m.role}
                    </span>
                  </span>
                  <span className="font-body text-[0.72rem] text-ink-muted tabular-nums">
                    {a.taches.length} tâche{a.taches.length > 1 ? "s" : ""}
                  </span>
                </div>
                {a.taches.length > 0 ? (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {a.taches.map((t) => (
                      <TacheRow key={t.id} tache={t} />
                    ))}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Shell>
  )
}

/* ── Relation transverse ────────────────────────────────────────────────── */

export function RelationModal({
  relationId,
  onClose,
  onDeleted,
}: {
  relationId: string
  onClose: () => void
  onDeleted: (libelle: string) => void
}) {
  const { orgRelations, orgUnites, updateOrgRelation, removeOrgRelation } =
    useData()
  const relation = orgRelations.find((r) => r.id === relationId)
  const source = orgUnites.find((u) => u.id === relation?.sourceId)
  const target = orgUnites.find((u) => u.id === relation?.targetId)

  if (!relation) return null

  return (
    <Shell
      title="Relation transverse"
      description="Un lien nommé, hors hiérarchie, entre deux unités."
      onClose={onClose}
      footer={
        <>
          <Button
            variant="ghost"
            className="text-danger hover:text-danger"
            onClick={() => {
              removeOrgRelation(relation.id)
              onDeleted(relation.libelle)
              onClose()
            }}
          >
            <Trash2 size={15} /> Supprimer
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-border px-4 py-3">
        <span className="min-w-0 flex-1 truncate font-body text-sm text-ink">
          {source?.nom ?? "—"}
        </span>
        <ArrowRight size={15} className="shrink-0 text-brand-blue-600" />
        <span className="min-w-0 flex-1 truncate text-right font-body text-sm text-ink">
          {target?.nom ?? "—"}
        </span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
          Libellé
        </span>
        <input
          autoFocus
          value={relation.libelle}
          onChange={(e) =>
            updateOrgRelation(relation.id, { libelle: e.target.value })
          }
          placeholder="Ex. Reporting hebdomadaire"
          className={inputCls}
        />
      </label>
    </Shell>
  )
}

/* ── Réaffecter une tâche ───────────────────────────────────────────────── */

type Source = { uniteId: string; membreId: string; tache: OrgTache }

/**
 * Two-step transfer: pick a tâche anywhere on the organigramme, then pick the
 * membre it should move to. The store does the move, so both cards update at
 * once.
 */
export function TacheTransfertModal({
  membresById,
  onClose,
  onMoved,
}: {
  membresById: Record<string, OrgMembre>
  onClose: () => void
  onMoved: (titre: string, vers: string) => void
}) {
  const { orgUnites, moveOrgTache } = useData()
  const [source, setSource] = useState<Source | null>(null)

  const porteurs = useMemo(
    () =>
      orgUnites.flatMap((u) =>
        u.membres
          .filter((a) => a.taches.length > 0)
          .map((a) => ({ unite: u, affectation: a })),
      ),
    [orgUnites],
  )

  return (
    <Shell
      title="Réaffecter une tâche"
      description={
        source
          ? "Étape 2 — choisissez le membre qui reprend la tâche."
          : "Étape 1 — choisissez la tâche à déplacer."
      }
      onClose={onClose}
      width="sm:max-w-[640px]"
      bodyKey={source ? "cible" : "tache"}
      footer={
        <>
          {source ? (
            <Button variant="ghost" onClick={() => setSource(null)}>
              Changer de tâche
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </>
      }
    >
      {!source ? (
        porteurs.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="Aucune tâche à réaffecter"
            description="Aucun membre de l'organigramme ne porte de tâche pour l'instant."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {porteurs.map(({ unite, affectation }) => {
              const m = membresById[affectation.membreId]
              if (!m) return null
              return (
                <div
                  key={`${unite.id}:${affectation.membreId}`}
                  className="rounded-lg border border-border px-3 py-3"
                >
                  <div className="mb-2.5 flex items-center gap-3">
                    <Avatar name={m.nom} size="md" />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate font-body text-sm text-ink">
                        {m.nom}
                      </span>
                      <span className="block truncate font-body text-[0.72rem] text-ink-muted">
                        {m.role} · {unite.nom}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {affectation.taches.map((t) => (
                      <TacheRow
                        key={t.id}
                        tache={t}
                        onClick={() =>
                          setSource({
                            uniteId: unite.id,
                            membreId: affectation.membreId,
                            tache: t,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-brand-blue-600/30 bg-brand-blue-600/5 px-4 py-3">
            {(() => {
              const { icon: Icon, cls } = statutMeta[source.tache.statut]
              return <Icon size={15} className={cn("mt-0.5 shrink-0", cls)} />
            })()}
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-body text-sm text-ink">
                {source.tache.titre}
              </span>
              <span className="block font-body text-[0.72rem] text-ink-muted">
                Portée par {membresById[source.membreId]?.nom}
              </span>
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {orgUnites
              .filter((u) => u.membres.length > 0)
              .map((u) => (
                <div key={u.id}>
                  <div className="mb-1.5 font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                    {u.nom}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {u.membres.map((a) => {
                      const m = membresById[a.membreId]
                      if (!m) return null
                      const isSource =
                        u.id === source.uniteId && a.membreId === source.membreId
                      return (
                        <button
                          key={a.membreId}
                          type="button"
                          disabled={isSource}
                          onClick={() => {
                            moveOrgTache(
                              {
                                uniteId: source.uniteId,
                                membreId: source.membreId,
                                tacheId: source.tache.id,
                              },
                              { uniteId: u.id, membreId: a.membreId },
                            )
                            onMoved(source.tache.titre, m.nom)
                            onClose()
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors",
                            isSource
                              ? "cursor-not-allowed opacity-45"
                              : "hover:border-border-strong",
                          )}
                        >
                          <Avatar name={m.nom} size="sm" />
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="block truncate font-body text-[0.82rem] text-ink">
                              {m.nom}
                            </span>
                            <span className="block truncate font-body text-[0.7rem] text-ink-muted">
                              {m.role}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </Shell>
  )
}
