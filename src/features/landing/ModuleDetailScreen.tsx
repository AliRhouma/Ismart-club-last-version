import { useEffect, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react"

import { MODULES, findModule, siblingModules } from "@/features/landing/modules"
import "@/features/landing/landing.css"

const PLATFORM_URL = "https://pprod.ismart-club.com/auth/login"

/** Same reveal-on-scroll as the landing page. Keyed on the slug so the
 *  observer is rebuilt when you jump from one module to the next. */
function useScrollReveal(key: string) {
  useEffect(() => {
    const nodes = document.querySelectorAll(".lp-reveal")
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible")
        }),
      { threshold: 0.12 },
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [key])
}

/**
 * One module's page — reached from the "Voir les détails" button on a module
 * card. Same design language as the landing page (`.lp` scope): the page is
 * the long answer to a card's three lines.
 */
export function ModuleDetailScreen() {
  const { slug } = useParams()
  const mod = findModule(slug)
  const [scrolled, setScrolled] = useState(false)

  useScrollReveal(slug ?? "")

  /* A route change is not a page load — bring the reader back to the top. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [slug])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* An unknown slug is a typo, not a state to design for — back to the grid. */
  if (!mod) return <Navigate to="/landing#modules" replace />

  const { prev, next } = siblingModules(mod.slug)
  const Icon = mod.icon
  const others = MODULES.filter((m) => m.slug !== mod.slug).slice(0, 4)

  return (
    <div className="lp">
      <div className="lp-grain" aria-hidden />

      <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
        <Link className="lp-logo" to="/landing">
          <span className="lp-logo-mark">iS</span>
          <span className="lp-logo-word">iSMART CLUB</span>
        </Link>
        <ul className="lp-nav-links">
          <li>
            <Link to="/landing#modules">Modules</Link>
          </li>
          <li>
            <Link to="/landing#communaute">Communauté</Link>
          </li>
          <li>
            <Link to="/landing#offre">Pack Découverte</Link>
          </li>
        </ul>
        <div className="lp-nav-actions">
          <a className="lp-nav-signin" href={PLATFORM_URL}>
            Se connecter
          </a>
          <Link className="lp-nav-cta" to="/landing#contact">
            Demander le Pack
          </Link>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section className="lp-detail-hero">
        <div className="lp-detail-inner">
          <div className="lp-crumbs">
            <Link to="/landing">Accueil</Link>
            <ChevronRight size={13} />
            <Link to="/landing#modules">Modules</Link>
            <ChevronRight size={13} />
            <span>{mod.name}</span>
          </div>

          <div className="lp-detail-head">
            <div className="lp-detail-icon">
              <Icon size={34} strokeWidth={1.4} />
            </div>
            <div>
              <div className="lp-section-label">{mod.pole}</div>
              <h1 className="lp-title lp-detail-title">{mod.name}</h1>
              <p className="lp-detail-tagline">{mod.tagline}</p>
            </div>
          </div>

          <p className="lp-desc lp-detail-intro">{mod.intro}</p>

          <div className="lp-module-tags lp-detail-tags">
            {mod.tags.map((t) => (
              <span className="lp-module-tag" key={t}>
                {t}
              </span>
            ))}
          </div>

          <div className="lp-detail-roles">
            <span className="lp-detail-roles-label">Qui l'utilise</span>
            <div className="lp-detail-roles-list">
              {mod.roles.map((r) => (
                <span className="lp-detail-role" key={r}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="lp-detail-actions">
            <Link className="lp-btn-primary lp-btn-primary--xl" to="/landing#contact">
              Demander le Pack Découverte
            </Link>
            <Link className="lp-btn-ghost" to="/landing#modules">
              <ArrowLeft size={16} style={{ marginRight: 8 }} />
              Tous les modules
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ HIGHLIGHTS — what it changes ════════ */}
      <section className="lp-detail-section">
        <div className="lp-detail-inner">
          <div className="lp-reveal">
            <div className="lp-section-label">Ce que ça change</div>
            <h2 className="lp-title lp-detail-h2">
              Concrètement, sur le terrain
            </h2>
          </div>

          <div className="lp-hl-grid lp-reveal">
            {mod.highlights.map((h) => {
              const HIcon = h.icon
              return (
                <article className="lp-hl-card" key={h.title}>
                  <div className="lp-hl-icon">
                    <HIcon size={22} strokeWidth={1.6} />
                  </div>
                  <h3 className="lp-hl-title">{h.title}</h3>
                  <p className="lp-hl-text">{h.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════ CAPABILITIES ════════ */}
      <section className="lp-detail-section lp-detail-section--alt">
        <div className="lp-detail-inner">
          <div className="lp-reveal">
            <div className="lp-section-label">Fonctionnalités</div>
            <h2 className="lp-title lp-detail-h2">Ce que contient le module</h2>
          </div>

          <div className="lp-cap-grid lp-reveal">
            {mod.capabilities.map((c) => (
              <div className="lp-cap-card" key={c.title}>
                <h3 className="lp-cap-title">{c.title}</h3>
                <ul className="lp-cap-list">
                  {c.items.map((it) => (
                    <li key={it}>
                      <Check size={14} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ STEPS ════════ */}
      <section className="lp-detail-section">
        <div className="lp-detail-inner">
          <div className="lp-reveal">
            <div className="lp-section-label">Comment ça se met en place</div>
            <h2 className="lp-title lp-detail-h2">Trois étapes, pas trente</h2>
          </div>

          <div className="lp-steps lp-reveal">
            {mod.steps.map((s, i) => (
              <div className="lp-step" key={s.title}>
                <div className="lp-step-num">0{i + 1}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-text">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="lp-outcomes lp-reveal">
            {mod.outcomes.map((o) => (
              <div className="lp-outcome" key={o.label}>
                <div className="lp-outcome-value">{o.value}</div>
                <div className="lp-outcome-label">{o.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ OTHER MODULES ════════ */}
      <section className="lp-detail-section lp-detail-section--alt">
        <div className="lp-detail-inner">
          <div className="lp-reveal">
            <div className="lp-section-label">Le reste de la plateforme</div>
            <h2 className="lp-title lp-detail-h2">
              Un module ne travaille <span className="lp-green">jamais seul</span>
            </h2>
            <p className="lp-desc" style={{ marginTop: "1rem" }}>
              Les modules partagent la même saison, les mêmes catégories et le
              même annuaire — c'est ce qui évite de saisir deux fois la même
              information.
            </p>
          </div>

          <div className="lp-others-grid lp-reveal">
            {others.map((o) => {
              const OIcon = o.icon
              return (
                <Link
                  className="lp-other-card"
                  key={o.slug}
                  to={`/landing/modules/${o.slug}`}
                >
                  <span className="lp-other-icon">
                    <OIcon size={20} strokeWidth={1.5} />
                  </span>
                  <span className="lp-other-body">
                    <span className="lp-other-name">{o.name}</span>
                    <span className="lp-other-pole">{o.pole}</span>
                  </span>
                  <ArrowRight size={16} className="lp-other-arrow" />
                </Link>
              )
            })}
          </div>

          <div className="lp-prevnext lp-reveal">
            {prev ? (
              <Link className="lp-prevnext-link" to={`/landing/modules/${prev.slug}`}>
                <ArrowLeft size={15} />
                <span>
                  <span className="lp-prevnext-label">Module précédent</span>
                  <span className="lp-prevnext-name">{prev.name}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                className="lp-prevnext-link lp-prevnext-link--next"
                to={`/landing/modules/${next.slug}`}
              >
                <span>
                  <span className="lp-prevnext-label">Module suivant</span>
                  <span className="lp-prevnext-name">{next.name}</span>
                </span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="lp-recap">
        <div className="lp-recap-inner lp-reveal">
          <div className="lp-recap-icon">
            <Sparkles size={20} />
          </div>
          <div className="lp-recap-text">
            <strong>Pack Découverte 2026-2027 — 1 € HT par licencié</strong>
            <span>
              {mod.name} et les 33 autres modules, pour l'ensemble du club.
            </span>
          </div>
          <Link className="lp-btn-primary" to="/landing#contact">
            Demander le Pack
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">
              © 2026 iSmart Club. Tous droits réservés.
            </div>
            <div className="lp-footer-links">
              <Link to="/landing#modules">Modules</Link>
              <Link to="/landing#offre">Pack Découverte</Link>
              <Link to="/landing#contact">Contact</Link>
              <a href={PLATFORM_URL}>Connexion</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
