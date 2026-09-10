import wordmark from "@/assets/brand/logo-ismart.svg"
import mark from "@/assets/brand/logo-ismart-mark.svg"
import { cn } from "@/lib/utils"

/**
 * The iSmart Club brand — the figure with SMART CLUB beside it. It is drawn
 * for a dark ground ("SMART" is white), which is the only ground this app has.
 *
 * `variant="mark"` keeps the figure alone, for slots too narrow for the words:
 * a collapsed sidebar, a tiny mockup. Size it with a height class (`h-8`); the
 * width follows the artwork.
 *
 * Pass `alt=""` when the logo sits inside a link that already carries a label,
 * so a screen reader doesn't announce the name twice.
 */
export function Logo({
  variant = "wordmark",
  alt = "iSmart Club",
  className,
}: {
  variant?: "wordmark" | "mark"
  alt?: string
  className?: string
}) {
  return (
    <img
      src={variant === "mark" ? mark : wordmark}
      alt={alt}
      draggable={false}
      className={cn("block w-auto shrink-0 select-none", className)}
    />
  )
}
