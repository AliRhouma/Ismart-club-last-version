import { Smartphone } from "lucide-react"

import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import {
  AdSlot,
  AnnuaireMock,
  CalendarMock,
  EmplacementCard,
  FeedMock,
  MatchMock,
  NotificationEmptySlot,
  NotificationMock,
  PhoneFrame,
  SplashMock,
  WebFrame,
} from "@/features/sponsoring/emplacementMocks"

/**
 * Screen — "Espaces publicitaires". A static gallery: one mock per ad
 * placement, showing WHERE a sponsor appears in the club app. Every slot is
 * rendered empty ("Espace disponible") — no data, no logic, just the surface
 * and the emplacement.
 *
 * The surfaces themselves live in emplacementMocks and are shared with the
 * campaign screens; this screen is simply the variant where every slot is empty.
 */
export function EmplacementsScreen() {
  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/sponsoring/offres" label="Retour aux offres" />
      <PageHeader
        title="Espaces publicitaires"
        subtitle="Où vos sponsors apparaissent dans l'app du club. Ces espaces restent vides tant qu'aucun partenaire n'est rattaché."
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <EmplacementCard slotKey="partners_page">
          <WebFrame title="ismartclub.tn — Nos partenaires">
            <AnnuaireMock
              slot={
                <div className="flex size-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-info/40 bg-info/5 text-info">
                  <span className="font-ui text-[0.6rem] font-medium">
                    Disponible
                  </span>
                </div>
              }
            />
          </WebFrame>
        </EmplacementCard>

        <EmplacementCard slotKey="calendar_banner">
          <PhoneFrame>
            <CalendarMock slot={<AdSlot sub="Bannière · 320×80" />} />
          </PhoneFrame>
        </EmplacementCard>

        <EmplacementCard slotKey="home_feed">
          <PhoneFrame>
            <FeedMock
              slot={<AdSlot label="Carte sponsorisée" sub="Espace disponible" />}
            />
          </PhoneFrame>
        </EmplacementCard>

        <EmplacementCard slotKey="match_detail">
          <PhoneFrame>
            <MatchMock
              slot={
                <AdSlot label="Match présenté par…" sub="Espace disponible" />
              }
            />
          </PhoneFrame>
        </EmplacementCard>

        <EmplacementCard slotKey="splash">
          <PhoneFrame dark>
            <SplashMock
              slot={
                <AdSlot
                  icon={Smartphone}
                  label="Écran d'ouverture"
                  sub="Plein écran · 3 s"
                  tall
                  className="w-full"
                />
              }
            />
          </PhoneFrame>
        </EmplacementCard>

        <EmplacementCard slotKey="notification">
          <PhoneFrame dark>
            <NotificationMock slot={<NotificationEmptySlot />} />
          </PhoneFrame>
        </EmplacementCard>
      </div>
    </div>
  )
}
