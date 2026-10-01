import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Bold,
  ChevronDown,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Table,
  Type,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

/** Styles de paragraphe proposés par « Texte normal ». */
const STYLES = [
  { tag: "p", label: "Texte normal" },
  { tag: "h1", label: "Titre 1" },
  { tag: "h2", label: "Titre 2" },
  { tag: "h3", label: "Titre 3" },
] as const

/**
 * Surligneur : la teinte du token --warning (#e6a817) à 35 %. Valeur brute car
 * elle est écrite dans le HTML de la note, hors de portée des classes.
 */
const SURLIGNAGE = "rgba(230, 168, 23, 0.35)"

const TABLEAU =
  "<table><tbody>" +
  "<tr><td><br></td><td><br></td><td><br></td></tr>".repeat(3) +
  "</tbody></table><p><br></p>"

/**
 * A small rich-text field — toolbar + editable area — for the notes of a
 * séance. Built on the browser's own editing (contentEditable + execCommand):
 * enough for bold, lists, a heading or a table in a prototype, with no editor
 * library. The value is HTML.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const zone = useRef<HTMLDivElement>(null)
  const [actifs, setActifs] = useState<Record<string, boolean>>({})
  const [style, setStyle] = useState<string>("p")
  const [menu, setMenu] = useState(false)

  // Le HTML initial n'est posé qu'une fois : réécrire innerHTML à chaque frappe
  // ramènerait le curseur au début.
  useEffect(() => {
    if (zone.current && zone.current.innerHTML !== value)
      zone.current.innerHTML = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Boutons actifs selon la sélection courante.
  useEffect(() => {
    const lire = () => {
      const sel = document.getSelection()
      if (!sel?.anchorNode || !zone.current?.contains(sel.anchorNode)) return
      setActifs({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      })
      const bloc = String(document.queryCommandValue("formatBlock") || "p").toLowerCase()
      setStyle(STYLES.some((s) => s.tag === bloc) ? bloc : "p")
    }
    document.addEventListener("selectionchange", lire)
    return () => document.removeEventListener("selectionchange", lire)
  }, [])

  const emettre = () => onChange(zone.current?.innerHTML ?? "")

  const commande = (cmd: string, arg?: string) => {
    zone.current?.focus()
    document.execCommand(cmd, false, arg)
    emettre()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Barre d'outils — onMouseDown évite de perdre la sélection. */}
      <div
        role="toolbar"
        aria-label="Mise en forme"
        className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5"
      >
        <Outil icon={Undo2} label="Annuler" onClick={() => commande("undo")} />
        <Outil icon={Redo2} label="Rétablir" onClick={() => commande("redo")} />
        <Separateur />

        <span className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menu}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMenu((m) => !m)}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 font-ui text-[0.8rem] font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            <Type size={15} className="text-ink-muted" />
            {STYLES.find((s) => s.tag === style)?.label}
            <ChevronDown size={13} className="text-ink-muted" />
          </button>
          {menu ? (
            <>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setMenu(false)}
                className="fixed inset-0 z-20 cursor-default"
              />
              <span
                role="menu"
                className="absolute top-9 left-0 z-30 flex min-w-40 flex-col rounded-md border border-border bg-background p-1 shadow-deep"
              >
                {STYLES.map((s) => (
                  <button
                    key={s.tag}
                    type="button"
                    role="menuitem"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      commande("formatBlock", s.tag)
                      setStyle(s.tag)
                      setMenu(false)
                    }}
                    className={cn(
                      "rounded-sm px-2.5 py-1.5 text-left font-ui transition-colors hover:bg-surface-hover",
                      s.tag === "p" && "text-[0.82rem]",
                      s.tag === "h1" && "text-base font-semibold",
                      s.tag === "h2" && "text-[0.95rem] font-semibold",
                      s.tag === "h3" && "text-[0.88rem] font-medium",
                      s.tag === style ? "text-ink" : "text-ink-muted",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </span>
            </>
          ) : null}
        </span>
        <Separateur />

        <Outil icon={Bold} label="Gras" actif={actifs.bold} onClick={() => commande("bold")} />
        <Outil icon={Italic} label="Italique" actif={actifs.italic} onClick={() => commande("italic")} />
        <Outil
          icon={Underline}
          label="Souligné"
          actif={actifs.underline}
          onClick={() => commande("underline")}
        />
        <Outil
          icon={Highlighter}
          label="Surligner"
          onClick={() => commande("hiliteColor", SURLIGNAGE)}
        />
        <Separateur />

        <Outil
          icon={List}
          label="Liste à puces"
          actif={actifs.insertUnorderedList}
          onClick={() => commande("insertUnorderedList")}
        />
        <Outil
          icon={ListOrdered}
          label="Liste numérotée"
          actif={actifs.insertOrderedList}
          onClick={() => commande("insertOrderedList")}
        />
        <Separateur />

        <Outil icon={Table} label="Insérer un tableau" onClick={() => commande("insertHTML", TABLEAU)} />
      </div>

      <div
        ref={zone}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        aria-label={placeholder}
        data-placeholder={placeholder}
        onInput={emettre}
        className={cn(
          "min-h-44 px-4 py-3.5 font-body text-sm leading-relaxed text-ink outline-none",
          // Placeholder tant que la note est vide.
          "empty:before:pointer-events-none empty:before:text-ink-disabled empty:before:content-[attr(data-placeholder)]",
          // Le contenu mis en forme.
          "[&_h1]:mb-1 [&_h1]:font-ui [&_h1]:text-lg [&_h1]:font-semibold",
          "[&_h2]:mb-1 [&_h2]:font-ui [&_h2]:text-base [&_h2]:font-semibold",
          "[&_h3]:mb-1 [&_h3]:font-ui [&_h3]:text-[0.95rem] [&_h3]:font-medium",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5",
        )}
      />
    </div>
  )
}

function Outil({
  icon: Icon,
  label,
  actif,
  onClick,
}: {
  icon: LucideIcon
  label: string
  actif?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={actif}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-sm transition-colors",
        actif
          ? "bg-surface-nested text-ink"
          : "text-ink-muted hover:bg-surface-hover hover:text-ink",
      )}
    >
      <Icon size={16} />
    </button>
  )
}

function Separateur(): ReactNode {
  return <span aria-hidden className="mx-1.5 h-5 w-px bg-border" />
}
