import { useState } from "react"
import {
  ClipboardList,
  CornerDownRight,
  EyeOff,
  ListChecks,
  Network,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { OrgMembre } from "@/data/seed/organigramme"
import type { DocPartage } from "@/data/seed/organigrammesPartages"
import { Button } from "@/components/ui/button"
import {
  descendants,
  enfantsDe,
  estPourvu,
  ordreArbre,
  type Affectation,
  type BrouillonImport,
  type PosteB,
  type UniteB,
} from "@/features/communaute/import/importHelpers"
import { Puce } from "@/features/communaute/import/ImportUi"

const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

type Maj = (f: (b: BrouillonImport) => BrouillonImport) => void

/**
 * Step 2 — the tree on the left (where am I, what's left to fill), the
 * selected unité on the right (its name, where it hangs, its postes and who
 * takes each one). Excluding a unité is reversible: it greys out, its
 * sous-unités move up to its parent, nothing is lost until the import.
 */
export function EtapeStructure({
  b,
  maj,
  club,
  ancre,
  membres,
  documents,
}: {
  b: BrouillonImport
  maj: Maj
  /** Partner club name ("F.C. 93"). */
  club: string
  /** Where the imported tree will hang, e.g. "Racine" or "Sous Présidence". */
  ancre: string
  membres: OrgMembre[]
  documents: DocPartage[]
}) {
  const [selId, setSelId] = useState(b.unites[0]?.id ?? "")
  const sel = b.unites.find((u) => u.id === selId) ?? b.unites[0]

  const tous = b.unites.filter((u) => u.inclus).flatMap((u) => u.postes)
  const pourvus = tous.filter(estPourvu).length
  const suggeres = tous.filter((p) => p.affectation.kind === "membre" && p.affectation.suggere).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-4 py-3 font-body text-[0.82rem] text-ink-muted">
        <span className="text-ink">{tous.length} postes</span>
        <span className="text-ink-disabled">·</span>
        <span className="text-success">{pourvus} pourvus</span>
        <span className="text-ink-disabled">·</span>
        <span className={tous.length - pourvus ? "text-warning" : ""}>
          {tous.length - pourvus} à pourvoir
        </span>
        {suggeres ? (
          <>
            <span className="text-ink-disabled">·</span>
            <span className="inline-flex items-center gap-1 text-info">
              <Sparkles size={13} /> {suggeres} suggestions à vérifier
            </span>
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ── Tree ── */}
        <nav aria-label="Arbre importé" className="flex flex-col gap-1 self-start rounded-lg border border-border p-2 lg:sticky lg:top-4">
          <span className="flex items-center gap-2 px-2 py-1.5 font-ui text-[0.7rem] tracking-[0.06em] text-ink-disabled uppercase">
            <CornerDownRight size={12} /> {ancre}
          </span>
          {ordreArbre(b.unites).map(({ u, niveau }) => {
            const p = u.postes.length
            const ok = u.postes.filter(estPourvu).length
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelId(u.id)}
                style={{ paddingLeft: 8 + niveau * 16 }}
                className={cn(
                  "flex items-center gap-2 rounded-md py-2 pr-2 text-left transition-colors",
                  u.id === sel?.id ? "bg-surface-nested text-ink" : "text-ink-subtle hover:bg-surface-hover",
                )}
              >
                <Network size={13} className="shrink-0 text-ink-disabled" />
                <span className={cn("min-w-0 flex-1 truncate font-body text-[0.84rem]", !u.inclus && "text-ink-disabled line-through")}>
                  {u.nom || "Sans nom"}
                </span>
                {!u.inclus ? (
                  <EyeOff size={13} className="shrink-0 text-ink-disabled" />
                ) : p ? (
                  <span className={cn("shrink-0 font-ui text-[0.7rem] tabular-nums", ok < p ? "text-warning" : "text-ink-disabled")}>
                    {ok}/{p}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>

        {/* ── Selected unité ── */}
        {sel ? (
          <div className="rounded-lg border border-border p-5">
            <EditeurUnite
              b={b}
              maj={maj}
              uniteId={sel.id}
              club={club}
              ancre={ancre}
              membres={membres}
              documents={documents}
              onSelect={setSelId}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}


/**
 * Edit one unité of the import: its name, where it hangs, whether it comes
 * along, and its postes. Shared by the guided step and the visual mode.
 */
export function EditeurUnite({
  b,
  maj,
  uniteId,
  club,
  ancre,
  membres,
  documents,
  onSelect,
}: {
  b: BrouillonImport
  maj: Maj
  uniteId: string
  club: string
  ancre: string
  membres: OrgMembre[]
  documents: DocPartage[]
  /** Called when the edited unité changes (a sous-unité added, this one deleted). */
  onSelect: (id: string) => void
}) {
  const sel = b.unites.find((u) => u.id === uniteId)
  const setSelId = onSelect
  const majUnite = (id: string, patch: Partial<UniteB>) =>
    maj((prev) => ({
      ...prev,
      unites: prev.unites.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }))
  const majPoste = (uid: string, pid: string, patch: Partial<PosteB>) =>
    maj((prev) => ({
      ...prev,
      unites: prev.unites.map((u) =>
        u.id === uid
          ? { ...u, postes: u.postes.map((p) => (p.id === pid ? { ...p, ...patch } : p)) }
          : u,
      ),
    }))

  const ajouterSousUnite = (parentId: string) => {
    const id = crypto.randomUUID()
    maj((prev) => ({
      ...prev,
      unites: [
        ...prev.unites,
        { id, nom: "Nouvelle unité", parentId, inclus: true, source: false, postes: [] },
      ],
    }))
    setSelId(id)
  }
  const supprimerUnite = (u: UniteB) => {
    // Only unités added during the import can be deleted; theirs get excluded.
    maj((prev) => ({
      ...prev,
      unites: prev.unites
        .filter((x) => x.id !== u.id)
        .map((x) => (x.parentId === u.id ? { ...x, parentId: u.parentId } : x)),
    }))
    setSelId(u.parentId ?? b.unites[0]?.id ?? "")
  }

  const parentsPossibles = sel
    ? b.unites.filter(
        (u) => u.inclus && u.id !== sel.id && !descendants(b.unites, sel.id).includes(u.id),
      )
    : []

  if (!sel) return null

  return (
  <div className="flex flex-col gap-4">
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)]">
      <label className="flex flex-col gap-1.5">
        <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">Nom de l'unité</span>
        <input
          value={sel.nom}
          onChange={(e) => majUnite(sel.id, { nom: e.target.value })}
          disabled={!sel.inclus}
          className={cn(fieldCls, "font-ui text-[0.95rem]")}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">Rattachée à</span>
        <select
          value={sel.parentId ?? ""}
          onChange={(e) => majUnite(sel.id, { parentId: e.target.value || null })}
          disabled={!sel.inclus}
          className={fieldCls}
        >
          <option value="">{ancre}</option>
          {parentsPossibles.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nom}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3.5 py-2.5">
      <span className="font-body text-[0.82rem] text-ink-muted">
        {sel.inclus
          ? sel.source
            ? `Unité de ${club}, importée.`
            : "Unité ajoutée pendant l'import."
          : `Cette unité ne sera pas importée${enfantsDe(b.unites, sel.id).length ? " — ses sous-unités remontent d'un niveau" : ""}.`}
      </span>
      {sel.source ? (
        <Button size="sm" variant="outline" onClick={() => majUnite(sel.id, { inclus: !sel.inclus })}>
          {sel.inclus ? <EyeOff /> : <Plus />}
          {sel.inclus ? "Ne pas importer" : "Réintégrer"}
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="text-danger hover:text-danger" onClick={() => supprimerUnite(sel)}>
          <Trash2 /> Supprimer
        </Button>
      )}
    </div>

    {sel.inclus ? (
      <>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-ui text-[0.9rem] font-medium text-ink">Postes</h3>
          <span className="font-body text-[0.76rem] text-ink-disabled">
            Les personnes de {club} ne sont pas importées.
          </span>
        </div>
        {sel.postes.length ? (
          <ul className="flex flex-col gap-2.5">
            {sel.postes.map((p) => (
              <LignePoste
                key={p.id}
                p={p}
                club={club}
                membres={membres}
                documents={documents}
                onChange={(patch) => majPoste(sel.id, p.id, patch)}
                onRetirer={() =>
                  majUnite(sel.id, { postes: sel.postes.filter((x) => x.id !== p.id) })
                }
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed border-border px-4 py-5 text-center font-body text-[0.82rem] text-ink-disabled">
            Aucun poste dans cette unité{sel.source ? ` chez ${club}` : ""}. Ajoutez-en un si besoin.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              majUnite(sel.id, {
                postes: [
                  ...sel.postes,
                  { id: crypto.randomUUID(), intitule: "Nouveau poste", occupant: null, affectation: { kind: "vide" }, roles: [], charteIds: [] },
                ],
              })
            }
          >
            <UserPlus /> Ajouter un poste
          </Button>
          <Button size="sm" variant="outline" onClick={() => ajouterSousUnite(sel.id)}>
            <Plus /> Ajouter une sous-unité
          </Button>
        </div>
      </>
    ) : null}
  </div>
  )
}
/** One poste: its title, who holds it at the partner, and who takes it here. */
function LignePoste({
  p,
  club,
  membres,
  documents,
  onChange,
  onRetirer,
}: {
  p: PosteB
  club: string
  membres: OrgMembre[]
  documents: DocPartage[]
  onChange: (patch: Partial<PosteB>) => void
  onRetirer: () => void
}) {
  const a = p.affectation
  const valeur = a.kind === "membre" ? `m:${a.membreId}` : a.kind
  const setAff = (aff: Affectation) => onChange({ affectation: aff })
  const fiche = documents.find((d) => d.id === p.ficheId)
  const pourvu = estPourvu(p)

  return (
    <li className={cn("flex flex-col gap-3 rounded-lg border p-3.5", pourvu ? "border-border" : "border-warning/30")}>
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 gap-2.5 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-ui text-[0.62rem] tracking-[0.08em] text-ink-disabled uppercase">Intitulé du poste</span>
            <input value={p.intitule} onChange={(e) => onChange({ intitule: e.target.value })} className={fieldCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 font-ui text-[0.62rem] tracking-[0.08em] text-ink-disabled uppercase">
              Confié à
              {a.kind === "membre" && a.suggere ? (
                <span className="inline-flex items-center gap-1 normal-case tracking-normal text-info">
                  <Sparkles size={11} /> suggestion
                </span>
              ) : null}
            </span>
            <select
              value={valeur}
              onChange={(e) => {
                const v = e.target.value
                if (v === "vide") setAff({ kind: "vide" })
                else if (v === "nouveau") setAff({ kind: "nouveau", nom: "" })
                else setAff({ kind: "membre", membreId: v.slice(2), suggere: false })
              }}
              className={cn(fieldCls, !pourvu && "text-warning")}
            >
              <option value="vide">À pourvoir</option>
              <optgroup label="Membres de votre club">
                {membres.map((m) => (
                  <option key={m.id} value={`m:${m.id}`}>
                    {m.nom} — {m.role}
                  </option>
                ))}
              </optgroup>
              <option value="nouveau">+ Nouveau membre…</option>
            </select>
          </label>
          {a.kind === "nouveau" ? (
            <label className="flex flex-col gap-1 md:col-start-2">
              <span className="font-ui text-[0.62rem] tracking-[0.08em] text-ink-disabled uppercase">Nom du nouveau membre</span>
              <input
                autoFocus
                value={a.nom}
                onChange={(e) => setAff({ kind: "nouveau", nom: e.target.value })}
                placeholder="Prénom Nom"
                className={fieldCls}
              />
            </label>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRetirer}
          aria-label="Retirer ce poste"
          title="Retirer ce poste"
          className="mt-5 flex size-8 shrink-0 items-center justify-center rounded-md text-ink-disabled transition-colors hover:bg-surface-hover hover:text-danger"
        >
          <X size={15} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {p.occupant ? (
          <span className="mr-1 font-body text-[0.74rem] text-ink-disabled">
            Chez {club} : {p.occupant}
          </span>
        ) : p.intitule && !p.occupant && p.ficheId ? (
          <span className="mr-1 font-body text-[0.74rem] text-ink-disabled">Vacant chez {club}</span>
        ) : null}
        {fiche ? (
          <Puce>
            <ClipboardList size={11} /> {fiche.perimetre}
          </Puce>
        ) : null}
        {p.roles.length ? (
          <Puce>
            <ListChecks size={11} /> {p.roles.map((r) => r.libelle).join(", ")}
          </Puce>
        ) : null}
        {p.charteIds.length ? (
          <Puce>
            <Shield size={11} /> {p.charteIds.length} charte{p.charteIds.length > 1 ? "s" : ""}
          </Puce>
        ) : null}
      </div>
    </li>
  )
}
