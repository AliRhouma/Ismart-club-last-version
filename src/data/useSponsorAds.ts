import { useMemo } from "react"

import { useData } from "@/data/useData"
import type { SlotKey } from "@/data/seed/sponsoring"

/** One ready-to-render sponsor creative, drawn from a running campaign. */
export type SponsorAd = {
  id: string
  partner: string
  headline: string
  link: string
  color: string
}

/**
 * The pool of sponsor creatives currently on air in ONE ad space: every
 * running campaign (`en_cours`) that activated that space. Each in-app
 * placement asks for its own space, so switching a space off in the campaign
 * wizard really does empty it here.
 */
export function useSponsorAds(space: SlotKey = "planification"): SponsorAd[] {
  const { campaigns, partners } = useData()

  return useMemo<SponsorAd[]>(() => {
    const byPartner = new Map(partners.map((p) => [p.id, p]))
    const out: SponsorAd[] = []
    for (const c of campaigns) {
      if (c.status !== "en_cours") continue
      const slot = c.slots.find((s) => s.key === space)
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
  }, [campaigns, partners, space])
}
