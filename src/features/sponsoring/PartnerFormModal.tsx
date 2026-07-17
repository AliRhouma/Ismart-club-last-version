import { useMemo, useState } from "react"
import { Check, Search, X, UserRound, Link2Off } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  blankPartner,
  type Offer,
  type Partner,
} from "@/data/seed/sponsoring"
import { Avatar } from "@/components/kit/Avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { TierBadge } from "@/features/sponsoring/ui"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/**
 * Add / edit a partenaire. Three things only: a name, a description, and the
 * sponsor account it's linked to.
 *
 * The account link is the interesting one — a sponsor signs up on iSmart Club to
 * follow its own campaigns, and the admin picks which of those accounts this
 * partenaire *is*. It's optional: clubs routinely sign a partner months before
 * that partner has an account, so "Aucun compte" is a first-class choice, not a
 * failure to fill the form.
 *
 * Referenced OffreFormScreen (field styling, footer) and the Objectif modal
 * (header + close button) to stay on-brand.
 */
export function PartnerFormModal({
  offer,
  editing,
  onClose,
  onSaved,
}: {
  /** Offer whose seat this partenaire takes. */
  offer: Offer
  /** Existing partenaire when editing, null when creating. */
  editing: Partner | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const { sponsorAccounts, partners, addPartner, updatePartner } = useData()

  const [draft, setDraft] = useState<Omit<Partner, "id">>(() =>
    editing ? { ...editing } : blankPartner(offer.id),
  )
  const [query, setQuery] = useState("")

  const set = <K extends keyof Omit<Partner, "id">>(
    key: K,
    val: Omit<Partner, "id">[K],
  ) => setDraft((d) => ({ ...d, [key]: val }))

  // An account belongs to a single partenaire — show the others as taken.
  const takenBy = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of partners) {
      if (p.accountId && p.id !== editing?.id) map.set(p.accountId, p.name)
    }
    return map
  }, [partners, editing?.id])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sponsorAccounts
    return sponsorAccounts.filter((a) =>
      [a.company, a.contact, a.sector, a.email].some((f) =>
        f.toLowerCase().includes(q),
      ),
    )
  }, [sponsorAccounts, query])

  const selected =
    sponsorAccounts.find((a) => a.id === draft.accountId) ?? null

  const submit = () => {
    const clean: Omit<Partner, "id"> = {
      ...draft,
      name: draft.name.trim() || "Sans nom",
      description: draft.description.trim(),
    }
    if (editing) {
      updatePartner(editing.id, clean)
      onSaved(`Partenaire « ${clean.name} » mis à jour`)
    } else {
      addPartner(clean)
      onSaved(`Partenaire « ${clean.name} » ajouté à l'offre ${offer.name}`)
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[560px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              {editing ? "Modifier le partenaire" : "Ajouter un partenaire"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 flex items-center gap-2 font-body text-[0.78rem] text-ink-muted">
              <span>Sur l'offre</span>
              <TierBadge name={offer.name} color={offer.color} size="sm" />
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

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Nom du partenaire
            </span>
            <input
              autoFocus
              className={inputCls}
              placeholder="Délice Danone"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Description
            </span>
            <textarea
              rows={3}
              className={cn(inputCls, "resize-none")}
              placeholder="Partenaire historique du club, présent sur les maillots depuis 2019."
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <span className="font-body text-[0.72rem] leading-snug text-ink-disabled">
              Ce texte apparaîtra sur la fiche du partenaire dans l'annuaire du
              club.
            </span>
          </label>

          {/* Compte sponsor */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                Compte sponsor
              </span>
              <span className="font-body text-[0.72rem] text-ink-disabled">
                Optionnel
              </span>
            </div>
            <p className="font-body text-[0.75rem] leading-relaxed text-ink-muted">
              Rattachez ce partenaire à son compte iSmart Club pour qu'il puisse
              suivre ses campagnes de son côté. Vous pourrez le faire plus tard.
            </p>

            <div className="relative flex items-center">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 text-ink-disabled"
              />
              <input
                className={cn(inputCls, "pl-9")}
                placeholder="Rechercher une entreprise, un contact, un secteur…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[236px] overflow-y-auto rounded-lg border border-border">
              {/* "Aucun compte" — always first, always available. */}
              <AccountRow
                selected={draft.accountId === null}
                onSelect={() => set("accountId", null)}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-pill border border-border text-ink-disabled">
                  <Link2Off size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[0.84rem] text-ink">
                    Aucun compte pour l'instant
                  </div>
                  <div className="truncate font-body text-[0.74rem] text-ink-muted">
                    Le partenaire sera visible côté club uniquement
                  </div>
                </div>
              </AccountRow>

              {results.length === 0 ? (
                <div className="border-t border-border px-4 py-6 text-center">
                  <p className="font-body text-[0.8rem] text-ink-muted">
                    Aucun compte ne correspond à « {query} ».
                  </p>
                  <p className="mt-1 font-body text-[0.74rem] text-ink-disabled">
                    Le sponsor doit d'abord créer son compte iSmart Club.
                  </p>
                </div>
              ) : (
                results.map((account) => {
                  const taken = takenBy.get(account.id)
                  return (
                    <AccountRow
                      key={account.id}
                      selected={draft.accountId === account.id}
                      disabled={Boolean(taken)}
                      onSelect={() => set("accountId", account.id)}
                    >
                      <Avatar name={account.company} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-body text-[0.84rem] text-ink">
                            {account.company}
                          </span>
                          {account.status === "pending" ? (
                            <span className="shrink-0 rounded-pill border border-warning/25 bg-warning/10 px-2 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] text-warning uppercase">
                              Invitation en attente
                            </span>
                          ) : null}
                        </div>
                        <div className="truncate font-body text-[0.74rem] text-ink-muted">
                          {taken
                            ? `Déjà rattaché à « ${taken} »`
                            : `${account.contact} · ${account.sector}`}
                        </div>
                      </div>
                    </AccountRow>
                  )
                })
              )}
            </div>

            {selected ? (
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-surface-nested px-3.5 py-3">
                <UserRound size={14} className="mt-0.5 shrink-0 text-info" />
                <p className="font-body text-[0.76rem] leading-relaxed text-ink-muted">
                  <span className="text-ink">{selected.contact}</span> pourra
                  suivre les campagnes de ce partenaire depuis{" "}
                  <span className="font-mono text-[0.72rem] text-ink-subtle">
                    {selected.email}
                  </span>
                  .
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!draft.name.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Check size={16} />
            {editing ? "Enregistrer" : "Ajouter le partenaire"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** One selectable row of the account picker (selected = blue, per rule 3). */
function AccountRow({
  selected,
  disabled,
  onSelect,
  children,
}: {
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 border-t border-border px-3.5 py-3 text-left transition-colors first:border-t-0",
        disabled
          ? "cursor-not-allowed opacity-45"
          : "hover:bg-surface-hover",
        selected && "bg-info/5",
      )}
    >
      {children}
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-info bg-info" : "border-border-strong",
        )}
      >
        {selected ? <Check size={11} className="text-ink-inverted" /> : null}
      </span>
    </button>
  )
}
