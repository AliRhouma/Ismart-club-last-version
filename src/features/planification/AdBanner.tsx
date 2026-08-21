import { useEffect, useState } from "react"
import { ExternalLink, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { initials } from "@/lib/tint"
import { useSponsorAds } from "@/data/useSponsorAds"
import type { SlotKey } from "@/data/seed/sponsoring"

/**
 * Sponsor banner — an ad space come to life, on whichever surface hosts it:
 * `accueil` on the dashboard, `planification` in the calendar, `match_detail`
 * on a match or the résultats page.
 *
 * It reads the store's running campaigns for that space (via useSponsorAds) and
 * renders each one's creative as a full-width banner. The spaces are
 * `rotational`, so when more than one sponsor qualifies the banner auto-rotates
 * between them (manual dots).
 *
 * The colored fill is the sponsor's *artwork* (product content), not app chrome
 * — the one place a gradient fill is sanctioned (see campaignUi `Creative`).
 * Dismissible; once closed it stays closed for the session (local state).
 */

const ROTATE_MS = 7000

export function AdBanner({ space = "planification" }: { space?: SlotKey }) {
  const ads = useSponsorAds(space)

  const [dismissed, setDismissed] = useState(false)
  const [index, setIndex] = useState(0)

  // Auto-rotate through the sponsors when there's more than one.
  useEffect(() => {
    if (ads.length < 2 || dismissed) return
    const t = setInterval(
      () => setIndex((i) => (i + 1) % ads.length),
      ROTATE_MS,
    )
    return () => clearInterval(t)
  }, [ads.length, dismissed])

  // Keep the index valid if the pool shrinks.
  useEffect(() => {
    if (index >= ads.length) setIndex(0)
  }, [ads.length, index])

  if (dismissed || ads.length === 0) return null
  const ad = ads[Math.min(index, ads.length - 1)]

  return (
    <div className="relative overflow-hidden rounded-lg border border-border">
      <a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group/ad flex items-center gap-4 px-5 py-4 transition-[filter] hover:brightness-105"
        style={{
          // Sponsor artwork, not chrome — see the note at the top of this file.
          backgroundImage: `linear-gradient(135deg, ${ad.color}, ${ad.color}cc)`,
        }}
      >
        {/* soft corner wash, as most real ad creatives have */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10"
        />

        {/* Sponsor logo chip. */}
        <span
          className="relative flex size-11 shrink-0 items-center justify-center rounded-md bg-white/90 font-ui text-sm font-semibold"
          style={{ color: ad.color }}
        >
          {initials(ad.partner)}
        </span>

        {/* Copy. */}
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-ui text-[0.62rem] font-medium tracking-[0.08em] text-white/70 uppercase">
              Sponsorisé
            </span>
            <span className="truncate font-ui text-[0.72rem] font-medium text-white/85">
              · {ad.partner}
            </span>
          </div>
          <p className="mt-0.5 truncate font-ui text-[0.98rem] font-medium text-white">
            {ad.headline}
          </p>
        </div>

        {/* CTA. */}
        <span className="relative hidden shrink-0 items-center gap-1.5 rounded-md bg-white/15 px-3 py-2 font-ui text-[0.78rem] font-medium text-white transition-colors group-hover/ad:bg-white/25 sm:inline-flex">
          Découvrir
          <ExternalLink size={14} />
        </span>
      </a>

      {/* Rotation dots (only when there are several sponsors). */}
      {ads.length > 1 ? (
        <div className="pointer-events-auto absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {ads.map((a, i) => (
            <button
              key={a.id}
              type="button"
              aria-label={`Afficher ${a.partner}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "w-4 bg-white"
                  : "w-1.5 bg-white/45 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      ) : null}

      {/* Dismiss. */}
      <button
        type="button"
        aria-label="Masquer la publicité"
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-black/20 hover:text-white"
      >
        <X size={15} />
      </button>
    </div>
  )
}
