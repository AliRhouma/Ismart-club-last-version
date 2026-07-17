import { useNavigate } from "react-router-dom"
import { ArrowRight, Sparkles, Check } from "lucide-react"

import { useData } from "@/data/useData"
import { BackButton } from "@/components/kit/BackButton"

/**
 * Screen 2 — Onboarding. An explainer (not a form): why an offer must exist
 * before sponsors. Offers a demo shortcut that seeds the three suggested
 * offers and jumps straight to the list.
 */
export function DemarrageScreen() {
  const navigate = useNavigate()
  const { addSuggestedOffers } = useData()

  const useSuggested = () => {
    addSuggestedOffers()
    navigate("/sponsoring/offres")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton to="/sponsoring" label="Retour au sponsoring" />

      <div className="rounded-xl border border-border px-8 py-10">
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-1 font-ui text-[0.66rem] font-medium tracking-[0.08em] text-brand-blue-600 uppercase">
          Étape 1 sur 3
        </span>

        <h1 className="mt-4 font-ui text-2xl font-semibold text-ink">
          Créons votre première offre
        </h1>
        <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-ink-muted">
          Une offre décrit une formule de partenariat : son nom, ce qu'elle
          donne droit, combien de partenaires peuvent la souscrire, et quelle
          visibilité chacun reçoit. Vous pourrez en créer autant que vous
          voulez — la plupart des clubs commencent par trois : Or, Argent,
          Bronze.
        </p>

        {/* Visual 3-step stepper */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Step index={1} label="Créer vos offres" active />
          <Arrow />
          <Step index={2} label="Ajouter vos sponsors" soon />
          <Arrow />
          <Step index={3} label="Diffuser les publicités" soon />
        </div>

        {/* Actions */}
        <div className="mt-9 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate("/sponsoring/offres/nouvelle")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim sm:w-auto sm:self-start"
          >
            Créer une offre
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={useSuggested}
            className="inline-flex items-center gap-2 font-ui text-[0.82rem] font-medium text-info transition-opacity hover:opacity-80 sm:self-start"
          >
            <Sparkles size={15} />
            Utiliser les offres suggérées (Or, Argent, Bronze)
          </button>
        </div>
      </div>
    </div>
  )
}

function Step({
  index,
  label,
  active,
  soon,
}: {
  index: number
  label: string
  active?: boolean
  soon?: boolean
}) {
  return (
    <div
      className={cnStep(active)}
      // dimmed when not the active step
      style={soon ? { opacity: 0.55 } : undefined}
    >
      <span
        className={
          active
            ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-info/15 font-ui text-[0.78rem] font-medium text-info"
            : "flex size-7 shrink-0 items-center justify-center rounded-full border border-border-strong font-ui text-[0.78rem] font-medium text-ink-muted"
        }
      >
        {active ? <Check size={14} /> : index}
      </span>
      <div className="min-w-0">
        <div className="font-body text-[0.82rem] text-ink">{label}</div>
        {soon ? (
          <span className="mt-0.5 inline-flex rounded-pill border border-border bg-accent px-1.5 py-px font-ui text-[0.58rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            Bientôt
          </span>
        ) : null}
      </div>
    </div>
  )
}

function cnStep(active?: boolean) {
  return [
    "flex flex-1 items-center gap-3 rounded-lg border px-4 py-3.5",
    active ? "border-info/40" : "border-border",
  ].join(" ")
}

function Arrow() {
  return (
    <div className="hidden items-center justify-center text-ink-disabled sm:flex">
      <ArrowRight size={16} />
    </div>
  )
}
