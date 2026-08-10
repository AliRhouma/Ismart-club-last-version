import { useState } from "react"
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select } from "@/features/finance/ui"
import type { CompositionJoueur, CompositionRoles } from "@/data/seed/compositions"

type Onglet =
  | "capitaines"
  | "penaltys"
  | "coupsFrancsDirects"
  | "coupsFrancsIndirects"
  | "corners"
  | "listeAlternative"

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "capitaines", label: "Capitaines" },
  { id: "penaltys", label: "Penaltys" },
  { id: "coupsFrancsDirects", label: "Coups francs directs" },
  { id: "coupsFrancsIndirects", label: "Coups francs indirects" },
  { id: "corners", label: "Corners" },
  { id: "listeAlternative", label: "Liste alternative" },
]

/** Ordered list of tireurs for one situation: 1er, 2e, 3e… */
function Ordre({
  ids,
  joueurs,
  onChange,
  vide,
}: {
  ids: string[]
  joueurs: CompositionJoueur[]
  onChange: (ids: string[]) => void
  vide: string
}) {
  const restants = joueurs.filter((j) => !ids.includes(j.id))
  const bouger = (i: number, d: -1 | 1) => {
    const next = [...ids]
    const k = i + d
    if (k < 0 || k >= next.length) return
    ;[next[i], next[k]] = [next[k], next[i]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {ids.length === 0 ? (
        <p className="rounded-md border border-border px-3 py-5 text-center font-body text-[0.78rem] text-ink-disabled">
          {vide}
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {ids.map((id, i) => {
            const j = joueurs.find((x) => x.id === id)
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.66rem] text-ink-muted tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-body text-[0.82rem] text-ink">
                  {j?.nom ?? "Joueur retiré"}
                </span>
                <button
                  type="button"
                  aria-label="Monter"
                  disabled={i === 0}
                  onClick={() => bouger(i, -1)}
                  className="flex size-6 items-center justify-center rounded-sm text-ink-disabled transition-colors enabled:hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  aria-label="Descendre"
                  disabled={i === ids.length - 1}
                  onClick={() => bouger(i, 1)}
                  className="flex size-6 items-center justify-center rounded-sm text-ink-disabled transition-colors enabled:hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  aria-label={`Retirer ${j?.nom ?? ""}`}
                  onClick={() => onChange(ids.filter((x) => x !== id))}
                  className="flex size-6 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:text-danger"
                >
                  <X size={13} />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {restants.length > 0 ? (
        <div className="flex items-center gap-2">
          <Select
            value=""
            onChange={(v) => v && onChange([...ids, v])}
            options={restants.map((j) => ({
              value: j.id,
              label: `${j.nom} — ${j.poste}`,
            }))}
            placeholder="Ajouter un joueur…"
          />
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-ink-disabled">
            <Plus size={15} />
          </span>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Rôles & coups de pied arrêtés — captains plus the pecking order for each set
 * piece. Only joueurs actually on the pitch can be picked, so the sheet can't
 * name a taker who isn't playing.
 */
export function RolesModal({
  roles,
  joueurs,
  onChange,
  onClose,
}: {
  roles: CompositionRoles
  joueurs: CompositionJoueur[]
  onChange: (roles: CompositionRoles) => void
  onClose: () => void
}) {
  const [onglet, setOnglet] = useState<Onglet>("capitaines")

  const options = [
    { value: "", label: "Non défini" },
    ...joueurs.map((j) => ({ value: j.id, label: `${j.nom} — ${j.poste}` })),
  ]

  const configurees =
    (roles.capitaine ? 1 : 0) +
    (roles.viceCapitaine ? 1 : 0) +
    roles.penaltys.length +
    roles.coupsFrancsDirects.length +
    roles.coupsFrancsIndirects.length +
    roles.corners.length +
    roles.listeAlternative.length

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[680px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Rôles & coups de pied arrêtés
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              Capitaines et ordre prioritaire des tireurs.
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

        <div className="flex max-h-[62vh] flex-col overflow-hidden sm:flex-row">
          {/* Tabs — a row on a phone, a rail on desktop */}
          <nav className="-mx-1 flex shrink-0 gap-1 overflow-x-auto border-b border-border px-4 py-3 sm:mx-0 sm:w-[190px] sm:flex-col sm:overflow-y-auto sm:border-r sm:border-b-0">
            {ONGLETS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOnglet(o.id)}
                className={cn(
                  "shrink-0 rounded-md border px-3 py-1.5 text-left font-ui text-[0.76rem] font-medium whitespace-nowrap transition-colors sm:whitespace-normal",
                  onglet === o.id
                    ? "border-border-second bg-surface-nested text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {o.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-4">
            {joueurs.length === 0 ? (
              <p className="rounded-md border border-border px-3 py-6 text-center font-body text-[0.8rem] text-ink-disabled">
                Placez d'abord des joueurs sur le terrain.
              </p>
            ) : onglet === "capitaines" ? (
              <div className="flex flex-col gap-3">
                {(
                  [
                    { key: "capitaine", tag: "C", titre: "Capitaine officiel" },
                    { key: "viceCapitaine", tag: "VC", titre: "Remplaçant capitaine" },
                  ] as const
                ).map(({ key, tag, titre }) => (
                  <div key={key} className="rounded-lg border border-border p-3.5">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-nested font-ui text-[0.6rem] text-ink-muted">
                        {tag}
                      </span>
                      <span className="font-ui text-[0.86rem] font-medium text-ink">
                        {titre}
                      </span>
                    </div>
                    <Select
                      value={roles[key] ?? ""}
                      onChange={(v) => onChange({ ...roles, [key]: v || null })}
                      options={options}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Ordre
                ids={roles[onglet]}
                joueurs={joueurs}
                onChange={(ids) => onChange({ ...roles, [onglet]: ids })}
                vide={
                  onglet === "listeAlternative"
                    ? "Aucun joueur en liste alternative."
                    : "Aucun tireur désigné — le premier de la liste tire en premier."
                }
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <span className="font-body text-[0.76rem] text-ink-muted tabular-nums">
            {configurees} affectation{configurees > 1 ? "s" : ""} configurée
            {configurees > 1 ? "s" : ""}
          </span>
          <Button onClick={onClose}>Terminé</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
