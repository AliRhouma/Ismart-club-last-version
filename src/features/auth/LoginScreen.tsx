import { useNavigate } from "react-router-dom"
import { ArrowRight, Handshake, ShieldCheck, type LucideIcon } from "lucide-react"

import { useData } from "@/data/useData"
import { HOME_PATH } from "@/lib/navigation"
import { adminSession, sponsorSession } from "@/data/seed/session"

/**
 * Sign-in screen — renders OUTSIDE the app shell (no sidebar / top bar).
 *
 * There is no auth in the prototype: you pick a space and the shell follows the
 * role. Two identities are offered so the demo can walk both sides of the
 * product (club back-office ↔ sponsor space) with no dead end either way.
 */
export function LoginScreen() {
  const navigate = useNavigate()
  const { signInAsAdmin, signInAsSponsor } = useData()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-brand font-display text-xl font-bold leading-none text-ink-inverted shadow-glow">
            iS
          </span>
          <div className="text-center">
            <h1 className="font-ui text-xl font-semibold tracking-normal text-ink">
              iSmart Club
            </h1>
            <p className="mt-1 font-body text-sm text-ink-muted">
              Choisissez l'espace auquel vous connecter.
            </p>
          </div>
        </div>

        {/* Role choices */}
        <div className="mt-8 flex flex-col gap-3">
          <RoleCard
            icon={ShieldCheck}
            title="Se connecter en tant qu'admin du club"
            name={adminSession.name}
            subtitle={adminSession.subtitle}
            primary
            onClick={() => {
              signInAsAdmin()
              navigate(HOME_PATH.admin)
            }}
          />
          <RoleCard
            icon={Handshake}
            title="Se connecter en tant que sponsor"
            name={sponsorSession.name}
            subtitle={sponsorSession.subtitle}
            onClick={() => {
              signInAsSponsor()
              navigate(HOME_PATH.sponsor)
            }}
          />
        </div>

        <p className="mt-6 text-center font-body text-[0.72rem] text-ink-disabled">
          Prototype — aucun mot de passe n'est demandé.
        </p>
      </div>
    </div>
  )
}

function RoleCard({
  icon: Icon,
  title,
  name,
  subtitle,
  onClick,
  primary,
}: {
  icon: LucideIcon
  title: string
  name: string
  subtitle: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3.5 rounded-lg border border-border px-4 py-4 text-left transition-colors hover:border-border-strong hover:bg-surface-hover"
    >
      <span
        className={
          primary
            ? "flex size-10 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand"
            : "flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-nested text-info"
        }
      >
        <Icon size={19} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-ui text-[0.88rem] font-medium text-ink">
          {title}
        </div>
        <div className="mt-0.5 truncate font-body text-[0.76rem] text-ink-muted">
          {name} · {subtitle}
        </div>
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 text-ink-disabled transition-colors group-hover:text-ink"
      />
    </button>
  )
}
