import { ArrowLeft, ExternalLink, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { initials } from "@/lib/tint"
import type { SponsorAd } from "@/data/useSponsorAds"
import { Button } from "@/components/ui/button"

/**
 * Sponsored conversation — the messaging-native ad pattern (Messenger /
 * Telegram / LinkedIn): the sponsor appears as a row in the conversation list
 * and, when opened, as a one-way chat thread with a call-to-action.
 *
 * Fed by the same live-campaign pool as the calendar banner (useSponsorAds).
 * The sponsor's colour is used only on its own logo chip (product artwork) —
 * everything else stays on-brand (blue "Sponsorisé" tag, neutral bubbles).
 */

/* ── Colour logo chip (the sponsor's mark) ──────────────────────────────── */

export function SponsorLogo({ ad, size = 36 }: { ad: SponsorAd; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md font-ui font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        // Sponsor artwork, not chrome — the one sanctioned use of the colour.
        backgroundImage: `linear-gradient(135deg, ${ad.color}, ${ad.color}cc)`,
      }}
    >
      {initials(ad.partner)}
    </span>
  )
}

/* ── List row ───────────────────────────────────────────────────────────── */

export function SponsoredRow({
  ad,
  active,
  onClick,
}: {
  ad: SponsorAd
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
        active ? "bg-surface-nested" : "hover:bg-surface-hover",
      )}
    >
      <SponsorLogo ad={ad} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate font-ui text-[0.86rem]",
              active ? "font-medium text-ink" : "text-ink-subtle",
            )}
          >
            {ad.partner}
          </span>
          <span className="ml-auto shrink-0 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-1.5 py-0.5 font-ui text-[0.56rem] font-medium tracking-[0.06em] text-brand-blue-600 uppercase">
            Sponsorisé
          </span>
        </span>
        <span className="truncate font-body text-[0.76rem] text-ink-muted">
          {ad.headline}
        </span>
      </span>
    </button>
  )
}

/* ── Chat thread ────────────────────────────────────────────────────────── */

export function SponsorThread({
  ad,
  onBack,
}: {
  ad: SponsorAd
  onBack?: () => void
}) {
  // Two short sponsor "messages" — the intro and the headline.
  const bubbles = [`${ad.partner}, partenaire officiel du club.`, ad.headline]

  return (
    <>
      {/* Header. */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        {onBack ? (
          <button
            type="button"
            aria-label="Retour aux conversations"
            onClick={onBack}
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink lg:hidden"
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}
        <SponsorLogo ad={ad} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-ui text-[0.95rem] font-medium text-ink">
            {ad.partner}
          </h2>
          <p className="font-body text-[0.74rem] text-ink-muted">
            Message sponsorisé
          </p>
        </div>
        <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] text-brand-blue-600 uppercase">
          Sponsorisé
        </span>
      </div>

      {/* Messages. */}
      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <span className="rounded-pill border border-border px-3 py-0.5 font-body text-[0.66rem] text-ink-muted">
              Publicité
            </span>
          </div>

          {bubbles.map((text, i) => (
            <div key={i} className="flex items-end gap-2">
              {i === bubbles.length - 1 ? (
                <SponsorLogo ad={ad} size={28} />
              ) : (
                <span className="w-7 shrink-0" />
              )}
              <div className="max-w-[78%] rounded-lg rounded-tl-sm bg-surface-nested px-3 py-2">
                <p className="font-body text-[0.84rem] leading-relaxed text-ink-subtle">
                  {text}
                </p>
              </div>
            </div>
          ))}

          {/* Call-to-action bubble. */}
          <div className="flex items-end gap-2 pl-9">
            <div className="max-w-[78%] rounded-lg border border-border px-4 py-3">
              <p className="font-ui text-[0.82rem] font-medium text-ink">
                {ad.headline}
              </p>
              <p className="mt-0.5 font-body text-[0.74rem] text-ink-muted">
                En savoir plus sur {ad.partner}.
              </p>
              <Button asChild size="sm" className="mt-3">
                <a href={ad.link} target="_blank" rel="noopener noreferrer">
                  Découvrir
                  <ExternalLink size={14} />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* One-way notice in place of the composer. */}
      <div className="flex items-center justify-center gap-2 border-t border-border px-5 py-3.5">
        <Info size={13} className="shrink-0 text-ink-disabled" />
        <p className="font-body text-[0.74rem] text-ink-muted">
          Contenu sponsorisé — vous ne pouvez pas répondre à cette conversation.
        </p>
      </div>
    </>
  )
}
