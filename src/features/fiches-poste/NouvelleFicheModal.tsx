import { useMemo, useState } from "react"
import { Building2, Check, Search, User, Users, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  FICHE_TYPES,
  annuaire,
  posteGroupes,
  staffGroupes,
  type FicheType,
  type MembreLie,
  type SelectableGroup,
} from "@/data/seed/fichesPoste"
import { Avatar } from "@/components/kit/Avatar"
import { Button } from "@/components/ui/button"
import { Field, Select, inputCls } from "@/features/finance/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** The three ways to scope a document, as a segmented control. */
const SCOPES = [
  { id: "group", label: "Par unité", icon: Users },
  { id: "post", label: "Par Poste", icon: Building2 },
  { id: "member", label: "Individuel", icon: User },
] as const

type Scope = (typeof SCOPES)[number]["id"]

/** Selected-item chip — removable, brand blue like every other tag. */
function PickedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.7rem] text-brand-blue-600">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer ${label}`}
        className="opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={11} />
      </button>
    </span>
  )
}

/** Square checkbox — empty + bordered at rest, blue when selected (rule 3/4). */
function Tick({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
        on
          ? "border-brand-blue-600 bg-brand-blue-600 text-white"
          : "border-border-strong text-transparent",
      )}
    >
      <Check size={11} strokeWidth={3} />
    </span>
  )
}

/** One selectable row inside the picker (a group, a poste family, a member). */
function PickRow({
  on,
  onToggle,
  children,
}: {
  on: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-surface-hover"
    >
      {children}
      <Tick on={on} />
    </button>
  )
}

/**
 * "Nouveau document" — type, title, and who the document binds. The members
 * picker is the heart of it: three ways in (group / poste / person) that all
 * feed one selection, echoed back as chips so you never lose track of what
 * you've picked across the tabs.
 */
export function NouvelleFicheModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (fiche: {
    titre: string
    type: FicheType
    perimetre: string
    membres: MembreLie[]
  }) => void
}) {
  const [type, setType] = useState<FicheType>("")
  const [titre, setTitre] = useState("")
  const [scope, setScope] = useState<Scope>("group")
  const [query, setQuery] = useState("")
  const [groups, setGroups] = useState<string[]>([])
  const [posts, setPosts] = useState<string[]>([])
  const [members, setMembers] = useState<string[]>([])

  const reset = () => {
    setType("")
    setTitre("")
    setScope("group")
    setQuery("")
    setGroups([])
    setPosts([])
    setMembers([])
  }

  const toggle = (
    set: React.Dispatch<React.SetStateAction<string[]>>,
    id: string,
  ) => set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  /** Everything picked, across the three tabs — the source of the chip row. */
  const picked = useMemo(() => {
    const find = (list: SelectableGroup[], ids: string[]) =>
      list.filter((g) => ids.includes(g.id))
    return [
      ...find(staffGroupes, groups).map((g) => ({
        key: g.id,
        label: g.label,
        drop: () => toggle(setGroups, g.id),
      })),
      ...find(posteGroupes, posts).map((g) => ({
        key: g.id,
        label: g.label,
        drop: () => toggle(setPosts, g.id),
      })),
      ...annuaire
        .filter((m) => members.includes(m.id))
        .map((m) => ({
          key: m.id,
          label: m.nom,
          drop: () => toggle(setMembers, m.id),
        })),
    ]
  }, [groups, posts, members])

  /** Individuel tab — searchable, then grouped by the member's staff group. */
  const annuaireParGroupe = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = annuaire.filter(
      (m) =>
        !q ||
        m.nom.toLowerCase().includes(q) ||
        m.poste.toLowerCase().includes(q) ||
        m.groupe.toLowerCase().includes(q),
    )
    return matches.reduce<Record<string, typeof annuaire>>((acc, m) => {
      ;(acc[m.groupe] ??= []).push(m)
      return acc
    }, {})
  }, [query])

  /**
   * The périmètre shown in the list: one pick keeps its own name, several
   * become a count, none means the document is open to everyone.
   */
  const perimetre =
    picked.length === 0
      ? "Tous membres"
      : picked.length === 1
        ? picked[0].label
        : `${picked.length} sélections`

  /**
   * The picked individuals — plus everyone in a picked unité of the
   * organigramme — become the document's "Membres concernés" rows.
   */
  const membresLies = (): MembreLie[] =>
    annuaire
      .filter(
        (m) =>
          members.includes(m.id) ||
          m.uniteIds.some((u) => groups.includes(u)),
      )
      .map((m) => ({
        id: m.id,
        nom: m.nom,
        role: m.poste,
        groupe: m.groupe,
        depuis: "—",
        statut: "Concerné" as const,
      }))

  const submit = () => {
    const clean = titre.trim()
    if (!clean) return
    onCreate({ titre: clean, type, perimetre, membres: membresLies() })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-h-[92vh] gap-5 overflow-y-auto rounded-xl border-border bg-card sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="font-ui text-base font-medium text-ink">
            Nouveau document
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-ink-muted">
            Créer un nouveau document pour le club.
          </DialogDescription>
        </DialogHeader>

        <Field label="Type de document">
          <Select
            value={type}
            onChange={(v) => setType(v as FicheType)}
            options={FICHE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </Field>

        <Field label="Titre du document" required>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
            placeholder="ex. Règlement Intérieur 2025"
            autoFocus
            className={inputCls}
          />
        </Field>

        {/* Not a <Field>: that wraps its children in a <label>, which would
            swallow the picker's own buttons. Plain block + heading instead. */}
        <div className="flex flex-col gap-1.5">
          <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            Membres concernés
          </span>
          <div className="overflow-hidden rounded-lg border border-border">
            {/* Segmented control — active tab is neutral, never green. */}
            <div className="flex border-b border-border">
              {SCOPES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScope(id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 font-ui text-[0.75rem] transition-colors",
                    scope === id
                      ? "bg-surface-nested text-ink"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {scope === "group" || scope === "post" ? (
                <>
                  <p className="px-3.5 pt-2.5 pb-1 font-body text-[0.72rem] text-ink-disabled">
                    {scope === "group"
                      ? "Sélectionner un ou plusieurs groupes"
                      : "Sélectionner par catégorie de poste"}
                  </p>
                  {(scope === "group" ? staffGroupes : posteGroupes).map((g) => {
                    const ids = scope === "group" ? groups : posts
                    const set = scope === "group" ? setGroups : setPosts
                    return (
                      <PickRow
                        key={g.id}
                        on={ids.includes(g.id)}
                        onToggle={() => toggle(set, g.id)}
                      >
                        <span className="flex-1 font-body text-sm text-ink-subtle">
                          {g.label}
                        </span>
                        <span className="font-body text-[0.72rem] text-ink-disabled">
                          {g.count} membres
                        </span>
                      </PickRow>
                    )
                  })}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 border-b border-border px-3.5 py-2">
                    <Search size={13} className="shrink-0 text-ink-disabled" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher un membre…"
                      className="w-full bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink-disabled"
                    />
                  </div>
                  {Object.entries(annuaireParGroupe).map(([groupe, list]) => (
                    <div key={groupe}>
                      <p className="px-3.5 pt-3 pb-1 font-ui text-[0.66rem] tracking-[0.08em] text-ink-disabled uppercase">
                        {groupe}
                      </p>
                      {list.map((m) => (
                        <PickRow
                          key={m.id}
                          on={members.includes(m.id)}
                          onToggle={() => toggle(setMembers, m.id)}
                        >
                          <Avatar name={m.nom} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-body text-sm text-ink-subtle">
                              {m.nom}
                            </span>
                            <span className="block truncate font-body text-[0.72rem] text-ink-disabled">
                              {m.poste}
                            </span>
                          </span>
                        </PickRow>
                      ))}
                    </div>
                  ))}
                  {Object.keys(annuaireParGroupe).length === 0 ? (
                    <p className="px-3.5 py-6 text-center font-body text-sm text-ink-disabled">
                      Aucun membre ne correspond.
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {/* Selection recap — the one place you see picks from all three tabs. */}
            <div className="border-t border-border px-3.5 py-2.5">
              {picked.length === 0 ? (
                <p className="font-body text-[0.72rem] text-ink-disabled italic">
                  Aucun membre sélectionné — document accessible à tous par défaut
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {picked.map((p) => (
                    <PickedChip key={p.key} label={p.label} onRemove={p.drop} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={submit} disabled={!titre.trim()}>
            Créer le document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
