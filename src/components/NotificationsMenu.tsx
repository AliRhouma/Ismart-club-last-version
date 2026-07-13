import { useEffect, useRef, useState } from "react"
import {
  Bell,
  FileText,
  MessageSquareReply,
  ScrollText,
  Target,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { AppNotif } from "@/data/seed/notifications"

/**
 * Notifications dropdown for the top-bar bell. The list now comes from the
 * store, so runtime events (e.g. creating a technical objective) push new
 * unread notifications here. Clicking an `objectif` notification marks it read
 * and opens that objective's review modal (mounted globally in AppShell).
 * Opens as a popover under the bell; closes on outside click or Escape.
 */

const KIND_ICON = {
  fiche: FileText,
  reponse: MessageSquareReply,
  charte: ScrollText,
  objectif: Target,
} as const

const TABS = [
  { key: "tous", label: "Tous" },
  { key: "non-lus", label: "Non lus" },
] as const

function NotifRow({
  notif,
  onSelect,
}: {
  notif: AppNotif
  onSelect: (notif: AppNotif) => void
}) {
  const Icon = KIND_ICON[notif.kind]
  const actionable = notif.kind === "objectif"
  return (
    <button
      type="button"
      onClick={() => onSelect(notif)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover",
        notif.unread && "bg-surface-hover/60",
      )}
    >
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-nested text-accent">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-ui text-sm font-semibold text-ink">
            {notif.title}
          </span>
          {notif.unread && (
            <span className="size-2 shrink-0 rounded-full bg-accent" />
          )}
        </span>
        <span className="mt-0.5 block text-xs text-ink-disabled">
          Reçue {notif.date}
        </span>
        <span className="mt-1 block text-sm text-ink-muted">{notif.body}</span>
        {actionable && (
          <span className="mt-1.5 inline-block font-ui text-xs font-medium text-accent">
            Ouvrir la fiche →
          </span>
        )}
      </span>
    </button>
  )
}

export function NotificationsMenu() {
  const { notifications, markNotifRead, openObjectifReview } = useData()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("tous")
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const unreadCount = notifications.filter((n) => n.unread).length
  const rows =
    tab === "non-lus" ? notifications.filter((n) => n.unread) : notifications

  const handleSelect = (notif: AppNotif) => {
    markNotifRead(notif.id)
    if (notif.kind === "objectif" && notif.objectifId) {
      openObjectifReview(notif.objectifId)
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        title="Notifications"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
          open
            ? "border-border-strong bg-surface text-ink"
            : "border-transparent bg-surface text-ink-muted hover:border-border-strong hover:text-ink",
        )}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/40">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <h2 className="font-ui text-sm font-semibold text-ink">
              Notifications
            </h2>
          </div>

          <div className="flex items-center gap-1 border-b border-border px-3 pb-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  tab === t.key
                    ? "bg-surface-nested text-ink"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                {t.label}
                {t.key === "non-lus" && unreadCount > 0 && (
                  <span className="ml-1 text-accent">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-[min(460px,60vh)] divide-y divide-border overflow-y-auto">
            {rows.length > 0 ? (
              rows.map((n) => (
                <NotifRow key={n.id} notif={n} onSelect={handleSelect} />
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-ink-muted">
                Aucune notification non lue.
              </div>
            )}
          </div>

          {rows.length > 0 && (
            <button
              type="button"
              className="w-full border-t border-border py-2.5 text-center text-xs font-medium text-accent transition-colors hover:bg-surface-hover"
            >
              Charger plus
            </button>
          )}
        </div>
      )}
    </div>
  )
}
