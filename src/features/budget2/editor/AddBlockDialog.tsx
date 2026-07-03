import { useEffect, useState } from "react"
import { Check, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { FinanceTeam } from "@/data/seed/finance"
import { Field, Select, inputCls } from "@/features/finance/ui"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Mode = "equipe" | "groupe"

/**
 * Adds a block to the Équipes section: either a single team (portée = équipe)
 * or a pooled group of teams (portée = groupe, docs §5). A group carries one
 * set of amounts for the whole cluster — counted once, never per team.
 */
export function AddBlockDialog({
  open,
  onOpenChange,
  draftId,
  teams,
  usedTeamIds,
  onAddTeam,
  onAddedGroup,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  draftId: string
  teams: FinanceTeam[]
  /** Teams that already have an individual block (hidden from the team picker). */
  usedTeamIds: string[]
  onAddTeam: (teamId: string) => void
  onAddedGroup: (groupId: string) => void
}) {
  const { addBudget2Group } = useData()
  const [mode, setMode] = useState<Mode>("equipe")
  const [teamId, setTeamId] = useState("")
  const [label, setLabel] = useState("")
  const [members, setMembers] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setMode("equipe")
      setTeamId("")
      setLabel("")
      setMembers([])
    }
  }, [open])

  const availableTeams = teams.filter((t) => !usedTeamIds.includes(t.id))
  const toggleMember = (id: string) =>
    setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))

  const valid =
    mode === "equipe"
      ? teamId !== ""
      : label.trim().length > 0 && members.length >= 2

  const submit = () => {
    if (!valid) return
    if (mode === "equipe") {
      onAddTeam(teamId)
    } else {
      const id = addBudget2Group({
        draft_id: draftId,
        label: label.trim(),
        team_ids: members,
      })
      onAddedGroup(id)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border-border bg-card sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-ui text-base font-medium text-ink">
            Ajouter un bloc
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-ink-muted">
            Budgétez une équipe seule, ou plusieurs équipes en commun (un montant
            pour le lot, compté une fois).
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="inline-flex gap-1 rounded-pill border border-border p-1">
          {(
            [
              { value: "equipe", label: "Une équipe" },
              { value: "groupe", label: "Un groupe d'équipes" },
            ] as const
          ).map((m) => {
            const on = m.value === mode
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex-1 rounded-pill px-4 py-1.5 font-ui text-[0.74rem] font-medium transition-colors",
                  on
                    ? "border border-border-second bg-surface-nested text-ink"
                    : "border border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="py-1">
          {mode === "equipe" ? (
            availableTeams.length ? (
              <Field label="Équipe" required>
                <Select
                  value={teamId}
                  onChange={setTeamId}
                  options={availableTeams.map((t) => ({ value: t.id, label: t.name }))}
                  placeholder="Choisir une équipe…"
                />
              </Field>
            ) : (
              <p className="rounded-md border border-border px-4 py-3 font-body text-[0.82rem] text-ink-muted">
                Toutes les équipes ont déjà un bloc individuel.
              </p>
            )
          ) : (
            <div className="flex flex-col gap-4">
              <Field label="Nom du groupe" required>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex : Jeunes U11–U15"
                  autoFocus
                  className={inputCls}
                />
              </Field>
              <div className="flex flex-col gap-2">
                <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                  Équipes membres <span className="text-danger">*</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {teams.map((t) => {
                    const on = members.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleMember(t.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-body text-[0.82rem] transition-colors",
                          on
                            ? "border-brand-blue-600/40 bg-brand-blue-600/10 text-brand-blue-600"
                            : "border-border text-ink-subtle hover:border-border-strong hover:text-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 items-center justify-center rounded-sm border",
                            on
                              ? "border-brand-blue-600 bg-brand-blue-600 text-ink-inverted"
                              : "border-border-strong",
                          )}
                        >
                          {on ? <Check size={11} /> : null}
                        </span>
                        {t.name}
                      </button>
                    )
                  })}
                </div>
                <p className="flex items-center gap-1.5 font-body text-[0.72rem] text-ink-disabled">
                  <Users size={12} /> Au moins deux équipes pour une mise en commun.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-1">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Annuler
            </Button>
          </DialogClose>
          <Button type="button" onClick={submit} disabled={!valid}>
            Ajouter le bloc
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
