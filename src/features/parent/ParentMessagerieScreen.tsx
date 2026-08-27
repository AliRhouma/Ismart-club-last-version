import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Smile,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { ParentEnfant } from "@/data/seed/parent"
import type {
  ParentConversation,
  ParentConvKind,
  ParentMessage,
} from "@/data/seed/parentMessages"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import { PageHeader } from "@/components/kit/PageHeader"
import { Button } from "@/components/ui/button"
import { parentPlanningPath, shortDay } from "@/features/parent/shared"

/**
 * Espace parent — Messagerie.
 *
 * A parent doesn't have one inbox per child, he has ONE inbox: l'éducateur de
 * Taha, la cellule médicale de Rayan et le secrétariat pour Aziz écrivent tous
 * au même endroit. So the screen is a single family list sorted by activity —
 * and the whole design problem is making « c'est à propos de quel enfant ? »
 * impossible to miss: chaque ligne porte la pastille de l'enfant, le fil ouvert
 * s'ouvre sur un bandeau « Au sujet de … », et un filtre en tête de liste
 * réduit la boîte à un seul enfant.
 *
 * Référence de mise en page : la messagerie du club
 * (`features/messagerie/MessagerieScreen.tsx`) pour les deux panneaux et le
 * composeur, l'accueil parent pour la densité et les pastilles enfant.
 */

/* ── Interlocuteur meta ─────────────────────────────────────────────────── */

const KIND_META: Record<ParentConvKind, { label: string; icon: LucideIcon }> = {
  educateur: { label: "Éducateur", icon: UserCog },
  groupe: { label: "Groupe de parents", icon: Users },
  club: { label: "Service du club", icon: Building2 },
}

/* ── Dates ──────────────────────────────────────────────────────────────── */

/** Day separator inside a thread: "Aujourd'hui" / "Hier" / "mar. 18 août". */
function dayLabel(iso: string, today: string): string {
  if (iso === today) return "Aujourd'hui"
  if (iso === shiftIso(today, -1)) return "Hier"
  return shortDay(iso)
}

/** Compact last-activity label on a list row: "14:32" / "Hier" / "18 août". */
function activityLabel(msg: ParentMessage | undefined, today: string): string {
  if (!msg) return ""
  if (msg.date === today) return msg.time
  if (msg.date === shiftIso(today, -1)) return "Hier"
  return shortDay(msg.date).replace(/^\S+\s/, "")
}

function shiftIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number)
  const next = new Date(y, m - 1, d + delta)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
}

/* ── La pastille enfant — le repère de tout l'écran ─────────────────────── */

/**
 * Which child a conversation is about. Neutral chrome on purpose (the avatar
 * carries the identity); the blue is kept for the active filter above.
 */
function EnfantPill({
  enfant,
  className,
}: {
  enfant: ParentEnfant
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 self-start rounded-pill border border-border-strong py-[0.15rem] pr-2 pl-[0.15rem] font-ui text-[0.66rem] text-ink-subtle",
        className,
      )}
    >
      <Avatar
        name={enfant.nom}
        size="sm"
        className="size-[1.05rem] text-[0.45rem]"
      />
      {enfant.nom.split(" ")[0]}
      <span className="text-ink-disabled">· {enfant.categorie}</span>
    </span>
  )
}

/* ── Filtre par enfant ──────────────────────────────────────────────────── */

function EnfantFilter({
  enfants,
  value,
  counts,
  total,
  onChange,
}: {
  enfants: ParentEnfant[]
  /** "" = toute la famille. */
  value: string
  /** Unread per child. */
  counts: Record<string, number>
  /** Unread across the family. */
  total: number
  onChange: (enfantId: string) => void
}) {
  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-pill border py-1 pr-2.5 font-ui text-[0.74rem] transition-colors",
      active
        ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
    )

  const badge = (n: number, active: boolean) =>
    n ? (
      <span
        className={cn(
          "flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-ui text-[0.6rem]",
          active ? "bg-brand-blue-600/20" : "bg-accent text-ink-subtle",
        )}
      >
        {n}
      </span>
    ) : null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange("")}
        className={cn(chip(value === ""), "pl-2.5")}
      >
        Tous
        {badge(total, value === "")}
      </button>

      {enfants.map((enfant) => {
        const active = value === enfant.id
        return (
          <button
            key={enfant.id}
            type="button"
            onClick={() => onChange(enfant.id)}
            className={cn(chip(active), "pl-1")}
          >
            <Avatar name={enfant.nom} size="sm" className="size-5 text-[0.5rem]" />
            {enfant.nom.split(" ")[0]}
            {badge(counts[enfant.id] ?? 0, active)}
          </button>
        )
      })}
    </div>
  )
}

/* ── Ligne de conversation ──────────────────────────────────────────────── */

function ConversationRow({
  conv,
  enfant,
  today,
  active,
  onClick,
}: {
  conv: ParentConversation
  enfant: ParentEnfant
  today: string
  active: boolean
  onClick: () => void
}) {
  const last = conv.messages.at(-1)
  const preview = last
    ? `${last.mine ? "Vous : " : ""}${last.text}`
    : "Aucun message pour l'instant"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
        active ? "bg-surface-nested" : "hover:bg-surface-hover",
      )}
    >
      <span className="relative mt-0.5 shrink-0">
        <Avatar name={conv.name} size="md" />
        {conv.online ? (
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-success" />
        ) : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "truncate font-ui text-[0.86rem]",
              active ? "font-medium text-ink" : "text-ink-subtle",
            )}
          >
            {conv.name}
          </span>
          <span className="ml-auto shrink-0 font-body text-[0.66rem] text-ink-disabled">
            {activityLabel(last, today)}
          </span>
        </span>

        {/* Le repère : de quel enfant parle-t-on. */}
        <EnfantPill enfant={enfant} />

        <span className="flex items-center gap-2">
          <span className="truncate font-body text-[0.76rem] text-ink-muted">
            {preview}
          </span>
          {conv.unread ? (
            <span className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-brand-blue-600 px-1 font-ui text-[0.62rem] font-medium text-white">
              {conv.unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}

/* ── Bulle ──────────────────────────────────────────────────────────────── */

function Bubble({ msg, showAuthor }: { msg: ParentMessage; showAuthor: boolean }) {
  if (msg.mine) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-lg rounded-tr-sm bg-brand-blue-600 px-3 py-2">
          <p className="font-body text-[0.84rem] leading-relaxed text-white">
            {msg.text}
          </p>
          <span className="mt-1 block text-right font-body text-[0.62rem] text-white/60">
            {msg.time}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <Avatar name={msg.author} size="sm" className="mb-4" />
      <div className="max-w-[78%] rounded-lg rounded-tl-sm bg-surface-nested px-3 py-2">
        {showAuthor ? (
          <span className="mb-0.5 block font-ui text-[0.7rem] font-medium text-info">
            {msg.author}
          </span>
        ) : null}
        <p className="font-body text-[0.84rem] leading-relaxed text-ink-subtle">
          {msg.text}
        </p>
        <span className="mt-1 block font-body text-[0.62rem] text-ink-disabled">
          {msg.time}
        </span>
      </div>
    </div>
  )
}

/* ── Écran ──────────────────────────────────────────────────────────────── */

export function ParentMessagerieScreen() {
  const navigate = useNavigate()
  const { enfantId } = useParams()
  const {
    parentEnfants,
    parentConversations,
    envoyerMessageParent,
    lireConversationParent,
  } = useData()

  const today = todayISO()
  // Le filtre vit dans l'URL (/parent/messagerie/:enfantId), pas dans un state :
  // on peut envoyer un parent directement sur la boîte d'un seul enfant.
  const filtre = parentEnfants.some((c) => c.id === enfantId) ? enfantId! : ""
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState("")

  // Mobile = un seul panneau à la fois (liste, puis fil en plein écran).
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")

  const enfantsById = useMemo(() => {
    const map: Record<string, ParentEnfant> = {}
    for (const c of parentEnfants) map[c.id] = c
    return map
  }, [parentEnfants])

  // Non-lus par enfant + total — dérivés en render, jamais stockés.
  const { unreadParEnfant, unreadTotal } = useMemo(() => {
    const counts: Record<string, number> = {}
    let total = 0
    for (const c of parentConversations) {
      if (!c.unread) continue
      counts[c.enfantId] = (counts[c.enfantId] ?? 0) + c.unread
      total += c.unread
    }
    return { unreadParEnfant: counts, unreadTotal: total }
  }, [parentConversations])

  // La boîte : toute la famille, la plus récente en haut.
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return parentConversations
      .filter((c) => (filtre ? c.enfantId === filtre : true))
      .filter((c) => {
        if (!q) return true
        const enfant = enfantsById[c.enfantId]
        return (
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          (enfant?.nom.toLowerCase().includes(q) ?? false) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => {
        const la = a.messages.at(-1)
        const lb = b.messages.at(-1)
        if (!la) return 1
        if (!lb) return -1
        return (
          lb.date.localeCompare(la.date) || lb.time.localeCompare(la.time)
        )
      })
  }, [parentConversations, enfantsById, filtre, query])

  // Le fil ouvert est DÉDUIT de la liste visible : si un changement de filtre
  // ou une recherche l'en sort, on retombe sur le premier fil sans effet.
  const [wantedId, setWantedId] = useState("")
  const conv = list.find((c) => c.id === wantedId) ?? list[0]
  const selectedId = conv?.id ?? ""
  const enfant = conv ? enfantsById[conv.enfantId] : undefined

  const openConversation = (id: string) => {
    setWantedId(id)
    setMobileView("chat")
    lireConversationParent(id)
  }

  // Ouvrir un fil (y compris celui sélectionné par défaut) le marque comme lu.
  useEffect(() => {
    if (conv?.unread) lireConversationParent(conv.id)
  }, [conv, lireConversationParent])

  // Toujours coller au dernier message à l'ouverture / à l'envoi. `mobileView`
  // compte : sur téléphone le fil est encore masqué au moment du clic, et on
  // ne peut pas faire défiler un panneau caché.
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [conv?.messages.length, selectedId, mobileView])

  const send = () => {
    const text = draft.trim()
    if (!text || !conv) return
    envoyerMessageParent(conv.id, text)
    setDraft("")
  }

  const KindIcon = conv ? KIND_META[conv.kind].icon : Users

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-[1400px] flex-col gap-5">
      {/* En-tête — masqué sur mobile dès qu'un fil prend l'écran. */}
      <div className={cn("lg:block", mobileView === "chat" ? "hidden" : "block")}>
        <PageHeader
          title="Messagerie"
          subtitle={
            unreadTotal
              ? `${unreadTotal} message${unreadTotal > 1 ? "s" : ""} non lu${unreadTotal > 1 ? "s" : ""} — toutes les conversations de vos ${parentEnfants.length} enfants`
              : `Toutes les conversations du club, pour vos ${parentEnfants.length} enfants`
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Gauche — la boîte familiale. */}
        <aside
          className={cn(
            "w-full shrink-0 flex-col overflow-hidden rounded-lg border border-border lg:flex lg:w-[340px]",
            mobileView === "chat" ? "hidden" : "flex",
          )}
        >
          <div className="flex flex-col gap-3 border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 transition-colors focus-within:border-focus">
              <Search size={15} className="shrink-0 text-ink-disabled" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un enfant, un éducateur…"
                className="min-w-0 flex-1 bg-transparent font-body text-[0.82rem] text-ink placeholder:text-ink-disabled focus:outline-none"
              />
            </div>
            <EnfantFilter
              enfants={parentEnfants}
              value={filtre}
              counts={unreadParEnfant}
              total={unreadTotal}
              onChange={(id) =>
                navigate(id ? `/parent/messagerie/${id}` : "/parent/messagerie")
              }
            />
          </div>

          <div className="flex-1 divide-y divide-border overflow-auto">
            {list.length ? (
              list.map((c) => (
                <ConversationRow
                  key={c.id}
                  conv={c}
                  enfant={enfantsById[c.enfantId]}
                  today={today}
                  active={c.id === selectedId}
                  onClick={() => openConversation(c.id)}
                />
              ))
            ) : (
              <EmptyState
                icon={Search}
                title="Aucune conversation"
                description={
                  query
                    ? "Aucun fil ne correspond à cette recherche."
                    : "Le club n'a encore ouvert aucune conversation pour cet enfant."
                }
                className="py-12"
              />
            )}
          </div>
        </aside>

        {/* Droite — le fil. */}
        <section
          className={cn(
            "min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border lg:flex",
            mobileView === "list" ? "hidden" : "flex",
          )}
        >
          {conv && enfant ? (
            <>
              {/* Bandeau enfant — la première chose lue en ouvrant un fil. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-surface-nested px-4 py-2.5 sm:px-5">
                <Avatar name={enfant.nom} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-ui text-[0.8rem] text-ink">
                    Au sujet de {enfant.nom}
                  </p>
                  <p className="truncate font-body text-[0.72rem] text-ink-muted">
                    {enfant.categorie} · {enfant.groupe} — n° {enfant.numero}
                  </p>
                </div>
                <Link
                  to={parentPlanningPath(enfant.id)}
                  className="inline-flex shrink-0 items-center gap-1 font-ui text-[0.74rem] text-info transition-colors hover:text-brand-blue-700"
                >
                  Son planning
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* En-tête de l'interlocuteur. */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
                <button
                  type="button"
                  aria-label="Retour aux conversations"
                  onClick={() => setMobileView("list")}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink lg:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={conv.name} size="md" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-ui text-[0.95rem] font-medium text-ink">
                    {conv.name}
                  </h2>
                  <p className="flex items-center gap-1.5 font-body text-[0.74rem] text-ink-muted">
                    <KindIcon size={12} className="shrink-0" />
                    <span className="truncate">{conv.role}</span>
                    {conv.online ? (
                      <>
                        <span className="text-ink-disabled">·</span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-success">
                          <span className="size-1.5 rounded-full bg-success" />
                          En ligne
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>

              {/* Messages, groupés par jour. */}
              <div className="flex-1 overflow-auto px-5 py-4">
                {conv.messages.length ? (
                  <div className="flex flex-col gap-3">
                    {conv.messages.map((m, i) => {
                      const prev = conv.messages[i - 1]
                      const newDay = !prev || prev.date !== m.date
                      const showAuthor =
                        !m.mine &&
                        (newDay || prev.author !== m.author || !!prev.mine)
                      return (
                        <Fragment key={m.id}>
                          {newDay ? (
                            <div className="flex items-center justify-center py-1">
                              <span className="rounded-pill border border-border px-3 py-0.5 font-body text-[0.66rem] text-ink-muted">
                                {dayLabel(m.date, today)}
                              </span>
                            </div>
                          ) : null}
                          <Bubble msg={m} showAuthor={showAuthor} />
                        </Fragment>
                      )
                    })}
                    <div ref={endRef} />
                  </div>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="Aucun message"
                    description={`Ce fil concerne ${enfant.nom.split(" ")[0]}. Écrivez le premier message.`}
                    className="h-full"
                  />
                )}
              </div>

              {/* Composeur. */}
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2 rounded-md border border-input px-2 py-1.5 transition-colors focus-within:border-focus">
                  <button
                    type="button"
                    aria-label="Joindre un fichier"
                    className="flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                  >
                    <Paperclip size={17} />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={`Écrire à ${conv.name}…`}
                    className="min-w-0 flex-1 bg-transparent px-1 font-body text-[0.86rem] text-ink placeholder:text-ink-disabled focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Emoji"
                    className="flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                  >
                    <Smile size={17} />
                  </button>
                  <Button
                    size="icon-sm"
                    aria-label="Envoyer"
                    onClick={send}
                    disabled={!draft.trim()}
                    className="shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Aucune conversation ouverte"
              description="Sélectionnez un enfant dans le filtre pour retrouver ses échanges avec le club."
              className="h-full"
              action={
                filtre ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/parent/messagerie")}
                  >
                    Voir toute la famille
                  </Button>
                ) : undefined
              }
            />
          )}
        </section>
      </div>
    </div>
  )
}
