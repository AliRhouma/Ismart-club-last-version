import { cn } from "@/lib/utils"
import { initials as toInitials } from "@/lib/tint"

/* Neutral gray gradient fill — avatars are NOT auto-colored per name (design
   rule: one calm accent, no rainbow). The same neutral treatment everywhere. */
const AVATAR_BG = "linear-gradient(135deg, #2e2e2e, #1c1c1c)"

const sizeClasses = {
  sm: "size-7 text-[0.65rem]",
  md: "size-9 text-xs",
  lg: "size-12 text-base",
} as const

export type AvatarSize = keyof typeof sizeClasses

/**
 * Deterministic tinted-initials avatar. The same `name` always renders the
 * same colour (see lib/tint). Falls back to initials when no `src` is given,
 * or when the image fails — handled by the consumer passing only `name`.
 */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string
  src?: string
  size?: AvatarSize
  className?: string
}) {
  return (
    <span
      title={name}
      style={!src ? { background: AVATAR_BG } : undefined}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill font-ui font-medium uppercase select-none",
        sizeClasses[size],
        !src && "text-ink-subtle",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        toInitials(name)
      )}
    </span>
  )
}
