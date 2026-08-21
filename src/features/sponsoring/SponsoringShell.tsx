import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/kit/PageHeader"

/**
 * The Sponsoring module's front chrome: one "Sponsoring" title and the three
 * route-linked tabs (Mes partenaires · Espaces publicitaires · Campagnes) that
 * every top-level sponsoring screen shares. Detail/drill-in screens (a
 * partenaire, the packs, an offer form, a demande) don't use it — they carry a
 * BackButton instead.
 *
 * Each tab screen renders this itself, passing its own `active` value and
 * per-tab `actions`, so the toolbar stays specific to the tab (Espaces owns
 * "Packs", Campagnes owns "Demandes de campagne"). Route-linked, neutral
 * active à la the Catégories / Budget2 tab bars (design-system rule: tabs are
 * never green).
 */
export type SponsoringTab = "partenaires" | "emplacements" | "campagnes"

const TABS: { value: SponsoringTab; label: string; path: string }[] = [
  { value: "partenaires", label: "Mes partenaires", path: "/sponsoring/partenaires" },
  {
    value: "emplacements",
    label: "Espaces publicitaires",
    path: "/sponsoring/emplacements",
  },
  { value: "campagnes", label: "Campagnes", path: "/sponsoring/campagnes" },
]

export function SponsoringShell({
  active,
  subtitle,
  actions,
  children,
}: {
  active: SponsoringTab
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <PageHeader title="Sponsoring" subtitle={subtitle} actions={actions} />

      <div className="mt-5 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex gap-1 rounded-pill border border-border p-1">
          {TABS.map((t) => {
            const on = t.value === active
            return (
              <Link
                key={t.value}
                to={t.path}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-pill px-4 py-1.5 font-ui text-[0.78rem] font-medium whitespace-nowrap transition-colors",
                  on
                    ? "border border-border-second bg-surface-nested text-ink"
                    : "border border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            )
          })}
        </div>
      </div>

      {children}
    </>
  )
}
