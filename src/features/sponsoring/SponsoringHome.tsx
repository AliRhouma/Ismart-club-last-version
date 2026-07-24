import { Navigate, useNavigate } from "react-router-dom"
import {
  Handshake,
  ArrowRight,
  LayoutList,
  Eye,
  MousePointerClick,
} from "lucide-react"

import { useData } from "@/data/useData"
import { PageHeader } from "@/components/kit/PageHeader"

/**
 * Screen 1 — Sponsoring module home / empty state.
 *
 * Once the club has offers, this route is just the module's front door, so it
 * forwards to the offers list. Before that, it's the invitation to join.
 * References the Documents/Éducateurs empty states for tone and spacing.
 */
export function SponsoringHome() {
  const { offers } = useData()
  const navigate = useNavigate()

  if (offers.length > 0) {
    return <Navigate to="/sponsoring/partenaires" replace />
  }

  return (
    <>
      <PageHeader
        title="Sponsoring"
        subtitle="Valorisez vos partenaires et générez des revenus pour le club."
      />

      <div className="mt-8 flex justify-center">
        <div className="w-full max-w-xl rounded-xl border border-border px-8 py-12 text-center shadow-glow">
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-surface-nested text-ink-subtle">
            <Handshake className="size-7" strokeWidth={1.5} />
          </div>

          <h2 className="mt-5 font-ui text-xl font-medium text-ink">
            Lancez votre programme sponsors
          </h2>
          <p className="mx-auto mt-2.5 max-w-md font-body text-sm leading-relaxed text-ink-muted">
            Créez des offres de sponsoring (Or, Argent, Bronze…), définissez les
            espaces publicitaires que chaque offre donne, puis rattachez vos
            partenaires. Vos sponsors apparaîtront dans le calendrier, le fil
            d'actualité et la page partenaires du club.
          </p>

          <div className="mx-auto mt-7 grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-3">
            <ValuePoint icon={LayoutList} label="Définissez vos formules" />
            <ValuePoint icon={Eye} label="Contrôlez la visibilité" />
            <ValuePoint icon={MousePointerClick} label="Suivez les vues et les clics" />
          </div>

          <button
            type="button"
            onClick={() => navigate("/sponsoring/demarrage")}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
          >
            Rejoindre le programme sponsors
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

function ValuePoint({
  icon: Icon,
  label,
}: {
  icon: typeof Eye
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-border px-3 py-4">
      <Icon size={18} className="text-info" strokeWidth={1.75} />
      <span className="font-body text-[0.76rem] leading-snug text-ink-muted">
        {label}
      </span>
    </div>
  )
}
