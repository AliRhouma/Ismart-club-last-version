import { useMemo } from "react"

import { useData } from "@/data/useData"

/** One ready-to-render sponsor creative, drawn from a running campaign. */
export type SponsorAd = {
  id: string
  partner: string
  headline: string
  link: string
  color: string
}

/**
 * The pool of sponsor creatives currently on air: every running campaign
 * (`en_cours`) whose offer includes an enabled `calendar_banner` slot. Shared
 * by every in-app ad placement (calendar banner, messagerie…) so they all show
 * the same live sponsors and stay in sync with the Sponsoring module.
 */
export function useSponsorAds(): SponsorAd[] {
  const { campaigns, partners } = useData()

  return useMemo<SponsorAd[]>(() => {
    const byPartner = new Map(partners.map((p) => [p.id, p]))
    const out: SponsorAd[] = []
    for (const c of campaigns) {
      if (c.status !== "en_cours") continue
      const slot = c.slots.find((s) => s.key === "calendar_banner")
      if (!slot) continue
      const partner = byPartner.get(c.partnerId)
      if (!partner) continue
      out.push({
        id: c.id,
        partner: partner.name,
        headline: slot.headline,
        link: slot.link,
        color: c.color,
      })
    }
    return out
  }, [campaigns, partners])
}
