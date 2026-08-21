import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Users,
  Video,
  MoreVertical,
  MessageSquare,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar } from "@/components/kit/Avatar"
import { Button } from "@/components/ui/button"
import { useSponsorAds } from "@/data/useSponsorAds"
import {
  SponsoredRow,
  SponsorThread,
} from "@/features/messagerie/SponsoredConversation"
import {
  CONV_TYPES,
  CONVERSATIONS,
  type ChatMessage,
  type ConvType,
  type Conversation,
} from "@/features/messagerie/mock"

/** Synthetic id for the sponsored conversation (not a real conv). */
const SPONSORED_ID = "__sponsored__"

/* ── Conversation row (left list) ───────────────────────────────────────── */

function ConversationRow({
  conv,
  active,
  onClick,
}: {
  conv: Conversation
  active: boolean
  onClick: () => void
}) {
  const last = conv.messages.at(-1)
  const preview = last
    ? `${last.mine ? "Vous : " : ""}${last.text}`
    : "Aucun message"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
        active ? "bg-surface-nested" : "hover:bg-surface-hover",
      )}
    >
      <span className="relative shrink-0">
        <Avatar name={conv.name} size="md" />
        {conv.online ? (
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-success" />
        ) : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate font-ui text-[0.86rem]",
              active ? "font-medium text-ink" : "text-ink-subtle",
            )}
          >
            {conv.name}
          </span>
          <span className="ml-auto shrink-0 font-body text-[0.66rem] text-ink-disabled">
            {conv.lastTime}
          </span>
        </span>
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

/* ── Message bubble ─────────────────────────────────────────────────────── */

function Bubble({ msg, showAuthor }: { msg: ChatMessage; showAuthor: boolean }) {
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

/* ── Chat header action button ──────────────────────────────────────────── */

function HeaderIcon({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-md border border-border text-ink-muted transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-ink"
    >
      <Icon size={16} />
    </button>
  )
}

/* ── Conversation-type tabs (full-width, sits under the search bar) ─────── */

function TypeTabs({
  value,
  onChange,
}: {
  value: ConvType
  onChange: (value: ConvType) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-pill border border-border p-1">
      {CONV_TYPES.map((t) => {
        const active = t.value === value
        const count = CONVERSATIONS.filter((c) => c.type === t.value).length
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-pill px-2 py-1.5 font-ui text-[0.74rem] font-medium transition-colors",
              active
                ? "border border-border-second bg-surface-nested text-ink"
                : "border border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[0.62rem]",
                active ? "bg-surface-hover" : "bg-accent",
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Screen ─────────────────────────────────────────────────────────────── */

export function MessagerieScreen() {
  const [type, setType] = useState<ConvType>("groupe")

  // Locally-sent messages, per conversation. Pure UI state (resets on refresh) —
  // lets the composer feel alive without any real messaging logic.
  const [sent, setSent] = useState<Record<string, ChatMessage[]>>({})
  const [draft, setDraft] = useState("")

  // Mobile is single-pane (app pattern): the list, then the chat full-screen
  // with a back arrow. On lg+ both panes always show, so this is ignored there.
  const [mobileView, setMobileView] = useState<"list" | "chat">("list")
  const openConversation = (id: string) => {
    setSelectedId(id)
    setMobileView("chat")
  }
  const backToList = () => setMobileView("list")

  const list = useMemo(
    () => CONVERSATIONS.filter((c) => c.type === type),
    [type],
  )

  // The sponsored conversation — drawn from the live campaign pool, shown as a
  // row in every tab. We surface just the first sponsor on air.
  const sponsoredAd = useSponsorAds("messagerie")[0] ?? null

  const [selectedId, setSelectedId] = useState(list[0]?.id ?? "")
  // When switching tabs, land on the first conversation of that type — but keep
  // the sponsored thread open if that's what's selected (it exists in every tab).
  useEffect(() => {
    if (selectedId === SPONSORED_ID) return
    if (!list.some((c) => c.id === selectedId)) {
      setSelectedId(list[0]?.id ?? "")
    }
  }, [list, selectedId])

  const isSponsored = selectedId === SPONSORED_ID && sponsoredAd !== null
  const conv = isSponsored
    ? undefined
    : (list.find((c) => c.id === selectedId) ?? list[0])

  const messages = useMemo(() => {
    if (!conv) return []
    return [...conv.messages, ...(sent[conv.id] ?? [])]
  }, [conv, sent])

  // Auto-scroll to the newest message on select / send.
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, selectedId])

  const send = () => {
    const text = draft.trim()
    if (!text || !conv) return
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      author: "Moi",
      text,
      time: "À l'instant",
      mine: true,
    }
    setSent((prev) => ({ ...prev, [conv.id]: [...(prev[conv.id] ?? []), msg] }))
    setDraft("")
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] w-full max-w-[1400px] flex-col gap-4">
      {/* Header — hidden on mobile once a chat takes over the screen. */}
      <div
        className={cn(
          "min-w-0 flex-col gap-1 lg:flex",
          mobileView === "chat" ? "hidden" : "flex",
        )}
      >
        <h1 className="font-ui text-2xl font-semibold tracking-normal text-ink">
          Messagerie
        </h1>
        <p className="font-body text-sm text-ink-muted">
          Groupes, séances et matchs du club
        </p>
      </div>

      {/* Two-pane on lg+, single-pane (list ⇄ chat) on smaller screens. */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left — conversation list. Hidden on mobile once a chat is open. */}
        <aside
          className={cn(
            "w-full shrink-0 flex-col overflow-hidden rounded-lg border border-border lg:flex lg:w-[320px]",
            mobileView === "chat" ? "hidden" : "flex",
          )}
        >
          {/* Search + type tabs. */}
          <div className="flex flex-col gap-3 border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-md border border-input px-3 py-2 transition-colors focus-within:border-focus">
              <Search size={15} className="shrink-0 text-ink-disabled" />
              <input
                placeholder="Rechercher une conversation"
                className="min-w-0 flex-1 bg-transparent font-body text-[0.82rem] text-ink placeholder:text-ink-disabled focus:outline-none"
              />
            </div>
            <TypeTabs value={type} onChange={setType} />
          </div>

          <div className="flex-1 divide-y divide-border overflow-auto">
            {list.map((c, i) => (
              <Fragment key={c.id}>
                <ConversationRow
                  conv={c}
                  active={c.id === selectedId}
                  onClick={() => openConversation(c.id)}
                />
                {/* Sponsored conversation — slotted into the list like a chat. */}
                {sponsoredAd && i === 1 ? (
                  <SponsoredRow
                    ad={sponsoredAd}
                    active={selectedId === SPONSORED_ID}
                    onClick={() => openConversation(SPONSORED_ID)}
                  />
                ) : null}
              </Fragment>
            ))}
          </div>
        </aside>

        {/* Right — chat. On mobile it takes over the screen while a chat is open. */}
        <section
          className={cn(
            "min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border lg:flex",
            mobileView === "list" ? "hidden" : "flex",
          )}
        >
          {isSponsored && sponsoredAd ? (
            <SponsorThread ad={sponsoredAd} onBack={backToList} />
          ) : conv ? (
            <>
              {/* Chat header. */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
                <button
                  type="button"
                  aria-label="Retour aux conversations"
                  onClick={backToList}
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
                    <Users size={12} className="shrink-0" />
                    {conv.context}
                    {conv.online ? (
                      <>
                        <span className="text-ink-disabled">·</span>
                        <span className="inline-flex items-center gap-1 text-success">
                          <span className="size-1.5 rounded-full bg-success" />
                          En ligne
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-2 sm:flex">
                    <HeaderIcon icon={Phone} label="Appel audio" />
                    <HeaderIcon icon={Video} label="Appel vidéo" />
                    <HeaderIcon icon={Search} label="Rechercher" />
                  </span>
                  <HeaderIcon icon={MoreVertical} label="Plus d'options" />
                </div>
              </div>

              {/* Messages. */}
              <div className="flex-1 overflow-auto px-5 py-4">
                {messages.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center">
                      <span className="rounded-pill border border-border px-3 py-0.5 font-body text-[0.66rem] text-ink-muted">
                        Aujourd'hui
                      </span>
                    </div>
                    {messages.map((m, i) => {
                      const prev = messages[i - 1]
                      const showAuthor =
                        !m.mine && (!prev || prev.author !== m.author || !!prev.mine)
                      return <Bubble key={m.id} msg={m} showAuthor={showAuthor} />
                    })}
                    <div ref={endRef} />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-surface-nested text-ink-disabled">
                      <MessageSquare size={22} />
                    </span>
                    <p className="font-ui text-[0.9rem] font-medium text-ink">
                      Aucun message
                    </p>
                    <p className="max-w-[16rem] font-body text-[0.8rem] text-ink-muted">
                      Démarrez la conversation avec ce groupe.
                    </p>
                  </div>
                )}
              </div>

              {/* Composer. */}
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
                    placeholder="Écrire un message…"
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
          ) : null}
        </section>
      </div>
    </div>
  )
}
