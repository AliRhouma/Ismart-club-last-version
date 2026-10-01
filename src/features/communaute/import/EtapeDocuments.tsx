import { useState } from "react"
import { BookOpen, Copy, Link2, Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Fiche } from "@/data/seed/fichesPoste"
import type { DocPartage } from "@/data/seed/organigrammesPartages"
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
  FAMILLES,
  docsUtilises,
  famille,
  meilleurDoc,
  type BrouillonImport,
  type MappingDoc,
} from "@/features/communaute/import/importHelpers"
import { ContenuDoc, IconeDoc } from "@/features/communaute/import/ImportUi"

type Maj = (f: (b: BrouillonImport) => BrouillonImport) => void

const MODES: { value: MappingDoc["mode"]; label: string; icon: typeof Link2 }[] = [
  { value: "lier", label: "Lier", icon: Link2 },
  { value: "copier", label: "Copier", icon: Copy },
  { value: "ignorer", label: "Ignorer", icon: X },
]

/**
 * Step 3 — every document the imported postes rely on, grouped by family. For
 * each: link it to one of ours (suggested by title), import it as a draft
 * copy, or ignore it. "Lire" opens both texts side by side, because you can't
 * decide two documents are "the same" without reading them.
 */
export function EtapeDocuments({
  b,
  maj,
  club,
  documents,
  fiches,
}: {
  b: BrouillonImport
  maj: Maj
  club: string
  documents: DocPartage[]
  fiches: Fiche[]
}) {
  const [lecture, setLecture] = useState<DocPartage | null>(null)
  const usage = docsUtilises(b)
  const utilises = documents.filter((d) => usage.has(d.id))
  const setMode = (id: string, m: MappingDoc) =>
    maj((prev) => ({ ...prev, docs: { ...prev.docs, [id]: m } }))

  const modes = utilises.map((d) => b.docs[d.id]?.mode)
  const compte = (m: MappingDoc["mode"]) => modes.filter((x) => x === m).length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-[0.82rem] text-ink-muted">
          <span className="text-ink">Lier</span> rattache le poste à votre document ·{" "}
          <span className="text-ink">Copier</span> l'ajoute à vos Fiches & Documents en brouillon ·{" "}
          <span className="text-ink">Ignorer</span> ne reprend rien.
        </p>
        <span className="shrink-0 font-ui text-[0.78rem] text-ink-muted tabular-nums">
          {compte("lier")} liés · {compte("copier")} copiés · {compte("ignorer")} ignorés
        </span>
      </div>

      {FAMILLES.map(({ cle, label }) => {
        const docs = utilises.filter((d) => famille(d.type) === cle)
        if (!docs.length) return null
        const candidats = fiches.filter((f) => famille(f.type) === cle)
        return (
          <section key={cle} className="flex flex-col gap-2.5">
            <h3 className="font-ui text-[0.9rem] font-medium text-ink">{label}</h3>
            <ul className="flex flex-col gap-2">
              {docs.map((d) => (
                <LigneDoc
                  key={d.id}
                  d={d}
                  m={b.docs[d.id] ?? { mode: "copier" }}
                  utilisePar={usage.get(d.id) ?? []}
                  candidats={candidats}
                  onMode={(m) => setMode(d.id, m)}
                  onLire={() => setLecture(d)}
                />
              ))}
            </ul>
          </section>
        )
      })}

      {!utilises.length ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center font-body text-[0.84rem] text-ink-disabled">
          Aucun document : les postes retenus n'en utilisent pas.
        </p>
      ) : null}

      <LecteurModal
        doc={lecture}
        club={club}
        mapping={lecture ? b.docs[lecture.id] : undefined}
        candidats={lecture ? fiches.filter((f) => famille(f.type) === famille(lecture.type)) : []}
        onClose={() => setLecture(null)}
        onChoisir={(m) => {
          if (lecture) setMode(lecture.id, m)
          setLecture(null)
        }}
      />
    </div>
  )
}

function LigneDoc({
  d,
  m,
  utilisePar,
  candidats,
  onMode,
  onLire,
}: {
  d: DocPartage
  m: MappingDoc
  utilisePar: string[]
  candidats: Fiche[]
  onMode: (m: MappingDoc) => void
  onLire: () => void
}) {
  const uniques = [...new Set(utilisePar)]
  const choisirMode = (mode: MappingDoc["mode"]) => {
    if (mode === m.mode) return
    if (mode === "lier") {
      const f = meilleurDoc(d, candidats) ?? candidats[0]
      if (f) onMode({ mode: "lier", cibleId: f.id, suggere: false })
    } else onMode({ mode })
  }
  return (
    <li className={cn("flex flex-col gap-3 rounded-lg border px-4 py-3 lg:flex-row lg:items-center", m.mode === "ignorer" ? "border-border opacity-70" : "border-border")}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-nested text-ink-muted">
          <IconeDoc type={d.type} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-ui text-[0.88rem] text-ink">{d.titre}</span>
          <span className="block truncate font-body text-[0.74rem] text-ink-disabled" title={uniques.join(", ")}>
            Utilisé par {uniques.slice(0, 3).join(", ")}
            {uniques.length > 3 ? ` +${uniques.length - 3}` : ""}
          </span>
        </span>
        <button
          type="button"
          onClick={onLire}
          className="inline-flex shrink-0 items-center gap-1.5 font-ui text-[0.76rem] text-info transition-opacity hover:opacity-80"
        >
          <BookOpen size={13} /> Lire
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:w-[27rem] lg:shrink-0">
        <div role="radiogroup" aria-label={`Que faire de « ${d.titre} »`} className="inline-flex shrink-0 gap-1 rounded-pill border border-border p-1">
          {MODES.map(({ value, label, icon: Icon }) => {
            const actif = m.mode === value
            const indispo = value === "lier" && !candidats.length
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={actif}
                disabled={indispo}
                title={indispo ? "Aucun document de ce type dans votre club" : undefined}
                onClick={() => choisirMode(value)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  actif ? "border-border-second bg-surface-nested text-ink" : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                <Icon size={12} /> {label}
              </button>
            )
          })}
        </div>
        {m.mode === "lier" ? (
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <select
              value={m.cibleId}
              onChange={(e) => onMode({ mode: "lier", cibleId: e.target.value, suggere: false })}
              aria-label="Document de votre club"
              className="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1.5 font-body text-[0.8rem] text-ink outline-none focus:border-border-focus"
            >
              {candidats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.titre}
                </option>
              ))}
            </select>
            {m.suggere ? <Sparkles size={13} className="shrink-0 text-info" aria-label="Suggestion" /> : null}
          </span>
        ) : (
          <span className="font-body text-[0.76rem] text-ink-disabled">
            {m.mode === "copier" ? "Sera ajouté en brouillon" : "Non repris"}
          </span>
        )}
      </div>
    </li>
  )
}

/**
 * Side-by-side reader: their document on the left, one of ours on the right
 * (switchable), and the three decisions at the bottom.
 */
function LecteurModal({
  doc,
  club,
  mapping,
  candidats,
  onClose,
  onChoisir,
}: {
  doc: DocPartage | null
  club: string
  mapping?: MappingDoc
  candidats: Fiche[]
  onClose: () => void
  onChoisir: (m: MappingDoc) => void
}) {
  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-xl sm:max-w-5xl">
        {doc ? (
          <Lecteur
            key={doc.id}
            doc={doc}
            club={club}
            mapping={mapping}
            candidats={candidats}
            onClose={onClose}
            onChoisir={onChoisir}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Lecteur({
  doc,
  club,
  mapping,
  candidats,
  onClose,
  onChoisir,
}: {
  doc: DocPartage
  club: string
  mapping?: MappingDoc
  candidats: Fiche[]
  onClose: () => void
  onChoisir: (m: MappingDoc) => void
}) {
  const initial =
    mapping?.mode === "lier" ? mapping.cibleId : (meilleurDoc(doc, candidats)?.id ?? candidats[0]?.id ?? "")
  const [cibleId, setCibleId] = useState(initial)
  const cible = candidats.find((f) => f.id === cibleId)

  return (
    <>
      <DialogHeader>
        <DialogTitle>Lire et comparer</DialogTitle>
        <DialogDescription>
          Comparez le document de {club} avec le vôtre avant de décider.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            {club}
          </span>
          <h3 className="flex items-center gap-2 font-ui text-[0.95rem] font-medium text-ink">
            <IconeDoc type={doc.type} /> {doc.titre}
          </h3>
          <ContenuDoc contenu={doc.contenu} compact />
        </article>

        <article className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            Votre club
          </span>
          {candidats.length ? (
            <>
              <select
                value={cibleId}
                onChange={(e) => setCibleId(e.target.value)}
                aria-label="Document de votre club à comparer"
                className="rounded-md border border-input bg-transparent px-3 py-2 font-ui text-[0.88rem] text-ink outline-none focus:border-border-focus"
              >
                {candidats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.titre}
                  </option>
                ))}
              </select>
              <ContenuDoc contenu={cible?.contenu} compact />
            </>
          ) : (
            <p className="font-body text-[0.84rem] text-ink-disabled">
              Vous n'avez aucun document de ce type — importez une copie pour en créer un.
            </p>
          )}
        </article>
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="ghost" onClick={() => onChoisir({ mode: "ignorer" })}>
          Ignorer
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="outline" onClick={() => onChoisir({ mode: "copier" })}>
            <Copy /> Importer une copie
          </Button>
          {cible ? (
            <Button onClick={() => onChoisir({ mode: "lier", cibleId: cible.id, suggere: false })}>
              <Link2 /> Lier à « {cible.perimetre} »
            </Button>
          ) : null}
        </div>
      </DialogFooter>
    </>
  )
}
