import logoWordmark from "@/assets/brand/logo-ismart.svg"
import logoMark from "@/assets/brand/logo-ismart-mark.svg"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Clock,
  Download,
  Info,
  RefreshCw,
  Send,
  Share2,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"

import { MODULES } from "@/features/landing/modules"
import "@/features/landing/landing.css"

/* ── Media ────────────────────────────────────────────────────────────────
   Reused from the iSmart Coach landing page, per the brief — the two sites
   share one asset library until club-specific captures exist.            */
const VIDEO_PROCEDES =
  "https://res.cloudinary.com/dceefnpod/video/upload/v1777034065/Prodede_details_WEB_MP4_montage_1_toqlbd.mp4"
const VIDEO_BIBLIOTHEQUE =
  "https://res.cloudinary.com/dceefnpod/video/upload/v1777034068/Prodede_Bib_WEB_MP4_montage_ay62di.mp4"
const VIDEO_PROGRAMMATION =
  "https://res.cloudinary.com/dceefnpod/video/upload/v1777033234/Prog_Ann_Web_hltxcl.mp4"
const VIDEO_SEANCE =
  "https://res.cloudinary.com/dceefnpod/video/upload/v1777033235/Seance_WEB_MP4_montage_qtgsri.mp4"
const APP_SCREENSHOT =
  "https://res.cloudinary.com/dceefnpod/image/upload/v1776761932/Rectangle_31467_jmwty4.png"

const PLATFORM_URL = "https://pprod.ismart-club.com/auth/login"

/** Laptop / phone mock-ups — hidden for now. Flip to `true` to bring the
 *  "Au bureau comme au bord du terrain" section back; nothing else changes. */
const SHOW_DEVICE_MOCKUPS = false

/* ── Hero showcase ─────────────────────────────────────────────────────── */
const HERO_FEATURES = [
  {
    id: "procedes",
    title: "Une bibliothèque commune",
    subtitle: "Procédés partagés par tout le club",
    url: VIDEO_BIBLIOTHEQUE,
  },
  {
    id: "programmation",
    title: "Une saison programmée",
    subtitle: "36 semaines, 108 séances par équipe",
    url: VIDEO_PROGRAMMATION,
  },
  {
    id: "seances",
    title: "Des séances prêtes",
    subtitle: "Matériel, durée, consignes",
    url: VIDEO_SEANCE,
  },
  {
    id: "detail",
    title: "Un même langage",
    subtitle: "Du projet de jeu au terrain",
    url: VIDEO_PROCEDES,
  },
]

/* The module grid reads `MODULES` from ./modules — the same records the module
   detail pages render, so a card and its page never diverge. */

/* ── Hooks ────────────────────────────────────────────────────────────── */
function useScrollReveal() {
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
  }, [])
}


/* ── Hero showcase ────────────────────────────────────────────────────── */
const SLIDE_MS = 6000

function HeroShowcase() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fading, setFading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const current = HERO_FEATURES[active]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    setFading(true)
    setProgress(0)
    const t = window.setTimeout(() => {
      video.src = current.url
      video.load()
      video.play().catch(() => {})
      setFading(false)
    }, 220)
    return () => window.clearTimeout(t)
  }, [active, current.url])

  useEffect(() => {
    const start = performance.now()
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / SLIDE_MS)
      setProgress(p)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else setActive((i) => (i + 1) % HERO_FEATURES.length)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [active])

  return (
    <div className="lp-showcase">
      <div className={`lp-showcase-frame ${fading ? "is-fading" : ""}`}>
        <video
          ref={videoRef}
          className="lp-showcase-video"
          muted
          playsInline
          preload="auto"
          aria-label={current.title}
        />
      </div>

      <div className="lp-showcase-nav" role="tablist" aria-label="Modules iSmart Club">
        {HERO_FEATURES.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`lp-showcase-item ${i === active ? "is-active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="lp-showcase-item-head">
              <span className="lp-showcase-item-num">0{i + 1}</span>
              <span className="lp-showcase-item-titles">
                <span className="lp-showcase-item-title">{f.title}</span>
                <span className="lp-showcase-item-sub">{f.subtitle}</span>
              </span>
            </span>
            <span className="lp-showcase-bar">
              <span
                className="lp-showcase-bar-fill"
                style={{
                  width: `${i < active ? 100 : i === active ? progress * 100 : 0}%`,
                }}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="lp-showcase-mobile">
        <div className="lp-showcase-mobile-head">
          <span className="lp-showcase-mobile-num">
            0{active + 1} / 0{HERO_FEATURES.length}
          </span>
          <span>
            <span className="lp-showcase-mobile-title">{current.title}</span>
            <span className="lp-showcase-mobile-sub">{current.subtitle}</span>
          </span>
        </div>
        <div className="lp-showcase-bar">
          <div
            className="lp-showcase-bar-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="lp-showcase-dots" role="tablist">
          {HERO_FEATURES.map((f, i) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={f.title}
              className={`lp-showcase-dot ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export function LandingScreen() {
  const [scrolled, setScrolled] = useState(false)
  const [sticky, setSticky] = useState(false)
  const [sent, setSent] = useState(false)
  const { hash } = useLocation()

  useScrollReveal()

  /* Coming back from a module page with `/landing#modules`: React Router does
     not honour the hash on its own, so land the reader on the right section. */
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (!el) return
    const t = window.setTimeout(
      () => el.scrollIntoView({ behavior: "auto", block: "start" }),
      0,
    )
    return () => window.clearTimeout(t)
  }, [hash])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      setSticky(window.scrollY > 600)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /** Every CTA on the page lands on the contact form — that is the one
   *  action the page asks for. */
  const goToForm = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="lp">
      <div className="lp-grain" aria-hidden />

      <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
        <a className="lp-logo" href="#hero">
          <img
            className="lp-logo-img lp-logo-img--word"
            src={logoWordmark}
            alt="iSmart Club"
          />
          <img
            className="lp-logo-img lp-logo-img--mark"
            src={logoMark}
            alt="iSmart Club"
          />
        </a>
        <ul className="lp-nav-links">
          <li>
            <a href="#modules">Modules</a>
          </li>
          <li>
            <a href="#communaute">Communauté</a>
          </li>
          <li>
            <a href="#offre">Pack Découverte</a>
          </li>
        </ul>
        <div className="lp-nav-actions">
          <a className="lp-nav-signin" href={PLATFORM_URL}>
            Se connecter
          </a>
          <button className="lp-nav-cta" onClick={goToForm}>
            Demander le Pack
          </button>
        </div>
      </nav>

      <div className="lp-canvas">
        {/* ════════ HERO ════════ */}
        <section id="hero" className="lp-hero">
          <button className="lp-badge-strip" onClick={goToForm}>
            <span className="lp-badge-pulse" />
            <span className="lp-badge-text">
              Pack Découverte 2026-2027 — 1 € HT par licencié
            </span>
            <span className="lp-badge-arrow">→</span>
          </button>

          <h1 className="lp-hero-title">
            Tout le club.
            <br />
            Une seule <em>plateforme.</em>
          </h1>

          <p className="lp-hero-sub">
            Du projet de jeu au budget, iSmart Club réunit le terrain et le
            bureau dans un même outil — pour que chaque catégorie travaille avec
            la même méthode.
          </p>

          <HeroShowcase />

          <div className="lp-hero-actions">
            <div className="lp-hero-cta-stack">
              <button
                className="lp-btn-primary lp-btn-primary--xl"
                onClick={goToForm}
              >
                Demander le Pack Découverte
              </button>
              <span className="lp-cta-note">
                <Check size={13} /> 1 € HT par licencié · l'ensemble du club ·
                saison 2026-2027
              </span>
            </div>
            <a className="lp-btn-ghost" href="#modules">
              Voir les modules
            </a>
          </div>

          <div className="lp-scroll-indicator">
            <div className="lp-scroll-line" />
          </div>
        </section>

        {/* ════════ PROBLEM ════════ */}
        <div className="lp-problem">
          <div className="lp-problem-head lp-reveal">
            <div className="lp-section-label lp-section-label--center">
              Le quotidien d'un club
            </div>
            <h2 className="lp-title" style={{ maxWidth: 640, margin: "0 auto" }}>
              Un club, dix outils, aucune vue d'ensemble
            </h2>
            <p
              className="lp-desc"
              style={{ maxWidth: 660, margin: "1.25rem auto 0" }}
            >
              Les licences dans un tableur, les séances dans un carnet, les
              présences sur un groupe de messagerie et le budget dans un autre
              fichier. Personne n'a la photo complète.
            </p>
          </div>

          <div className="lp-problem-grid lp-reveal">
            <div className="lp-problem-card">
              <div className="lp-problem-icon">
                <Clock size={28} strokeWidth={1.5} />
              </div>
              <h3>Du temps perdu en administratif</h3>
              <p>
                Convocations, présences, documents et relances se refont
                manuellement chaque semaine, dans chaque catégorie.
              </p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">
                <Share2 size={28} strokeWidth={1.5} />
              </div>
              <h3>Une méthode qui se perd</h3>
              <p>
                Chaque éducateur travaille à sa façon. Quand il part, son
                contenu et sa méthode partent avec lui.
              </p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon">
                <BarChart3 size={28} strokeWidth={1.5} />
              </div>
              <h3>Des décisions sans données</h3>
              <p>
                Effectifs, assiduité, résultats, budget : les chiffres existent,
                mais jamais au même endroit ni au bon moment.
              </p>
            </div>
          </div>
        </div>

        <div className="lp-pivot lp-reveal">
          <div className="lp-pivot-left" />
          <span className="lp-pivot-text">
            Il existe une meilleure façon de faire vivre un club.
          </span>
          <div className="lp-pivot-right" />
        </div>

        {/* ════════ SOLUTION ════════ */}
        <section className="lp-solution">
          <div className="lp-solution-inner">
            <div className="lp-solution-head lp-reveal">
              <div className="lp-section-label lp-section-label--center">
                La solution
              </div>
              <h2 className="lp-title" style={{ maxWidth: 760, margin: "0 auto" }}>
                iSmart Club donne au club{" "}
                <span className="lp-green">un seul système</span>
              </h2>
              <p
                className="lp-desc"
                style={{ maxWidth: 620, margin: "1rem auto 0" }}
              >
                34 modules pensés pour le pôle technique, le pôle administratif
                et le bureau — reliés entre eux, sur une seule saison.
              </p>
            </div>


            <div className="lp-pillars lp-reveal">
              <div className="lp-pillar">
                <div className="lp-pillar-icon">
                  <Zap size={24} strokeWidth={1.8} color="var(--green)" />
                </div>
                <h4 className="lp-pillar-title">Un club prêt en une saison</h4>
                <p className="lp-pillar-desc">
                  Importez vos catégories, vos licenciés et vos compétitions, et
                  commencez immédiatement.
                </p>
              </div>
              <div className="lp-pillar lp-pillar--featured">
                <div className="lp-pillar-icon">
                  <Users size={24} strokeWidth={1.8} color="var(--green)" />
                </div>
                <h4 className="lp-pillar-title">Un rôle pour chacun</h4>
                <p className="lp-pillar-desc">
                  Dirigeants, éducateurs, joueurs et parents : chacun voit ce
                  qui le concerne, et rien d'autre.
                </p>
              </div>
              <div className="lp-pillar">
                <div className="lp-pillar-icon">
                  <Shield size={24} strokeWidth={1.8} color="var(--green)" />
                </div>
                <h4 className="lp-pillar-title">La méthode reste au club</h4>
                <p className="lp-pillar-desc">
                  Projet de jeu, programmation et procédés appartiennent au
                  club, pas aux personnes de passage.
                </p>
              </div>
            </div>

            {/* CTA #2 — the offer, mid-page */}
            <div className="lp-solution-cta lp-reveal">
              <div className="lp-offer-tag">Offre de lancement</div>
              <div>
                <button className="lp-btn-primary" onClick={goToForm}>
                  Demander le Pack Découverte
                </button>
              </div>
              <p className="lp-solution-cta-note">
                1 € HT par licencié pour la saison 2026-2027, à l'échelle du
                club entier.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ════════ MODULES ════════ */}
      <section id="modules" className="lp-modules">
        <div className="lp-modules-inner">
          <div className="lp-modules-head lp-reveal">
            <div className="lp-section-label lp-section-label--center">
              Les modules
            </div>
            <h2 className="lp-title lp-center">
              Conçu pour <span className="lp-green">tout le club</span>
            </h2>
            <p
              className="lp-desc"
              style={{ maxWidth: 600, margin: "1rem auto 0" }}
            >
              Le pôle technique, le pôle administratif et les finances dans une
              seule plateforme — reliés par la même saison et les mêmes
              catégories.
            </p>
          </div>

          <div className="lp-modules-grid lp-reveal">
            {MODULES.map((m) => {
              const Icon = m.icon
              return (
                <article className="lp-module-card" key={m.slug}>
                  <div className="lp-module-icon">
                    <Icon size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="lp-module-name">{m.name}</h3>
                  <p className="lp-module-desc">{m.desc}</p>
                  <div className="lp-module-tags">
                    {m.tags.map((t) => (
                      <span className="lp-module-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  {/* The card sells the module in three lines; this button is
                      where the reader goes for the long version. */}
                  <Link
                    className="lp-module-cta"
                    to={`/landing/modules/${m.slug}`}
                  >
                    Voir les détails
                    <ArrowRight size={14} />
                  </Link>
                  <span className="lp-module-glow" />
                </article>
              )
            })}
          </div>

          <div className="lp-modules-footnote lp-reveal">
            <div className="lp-modules-footnote-inner">
              <Info size={15} />
              <p>
                Compétitions, calendriers et résultats officiels peuvent être
                importés depuis les données ouvertes de votre ligue — sans
                ressaisie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ OFFER — Pack Découverte 2026-2027 ════════ */}
      <section id="offre" className="lp-offer">
        <div className="lp-offer-inner">
          <div className="lp-reveal">
            <div className="lp-section-label lp-section-label--center">
              Offre de lancement
            </div>
            <h2 className="lp-title">
              Pack Découverte
              <br />
              <span className="lp-green">2026-2027</span>
            </h2>
            <p className="lp-desc lp-center" style={{ margin: "1.25rem auto 0" }}>
              Une offre de lancement destinée aux clubs de football qui
              souhaitent découvrir iSmart Club pendant la saison 2026-2027.
            </p>
          </div>

          <div className="lp-offer-card lp-reveal">
            <div className="lp-offer-price">
              <span className="lp-offer-amount">1 €</span>
              <span className="lp-offer-unit">
                HT par licencié
                <span>
                  calculé sur le nombre total de licenciés du club — joueurs et
                  membres du staff
                </span>
              </span>
            </div>

            <p className="lp-offer-lead">
              Contrairement à un abonnement classique, le Pack Découverte permet
              au club de déployer la plateforme à l'échelle de toute sa
              structure.
            </p>

            {/* The single condition of the offer: it is club-wide or nothing. */}
            <div className="lp-offer-scope">
              <Building2 size={15} />
              <p>
                <strong>L'offre est globale</strong> — il n'est pas possible
                d'équiper uniquement une équipe ou une catégorie. L'objectif est
                de permettre à l'ensemble des éducateurs, dirigeants et
                catégories de travailler avec le même outil et la même
                méthodologie.
              </p>
            </div>

            <div className="lp-offer-includes-head">
              Le Pack Découverte comprend
            </div>
            <ul className="lp-offer-includes">
              <li>
                <Check size={15} />
                L'accès à l'ensemble des fonctionnalités d'iSmart Club
              </li>
              <li>
                <Check size={15} />
                L'accès pour tous les éducateurs, dirigeants et membres du staff
              </li>
              <li>
                <Check size={15} />
                L'accès pour toutes les catégories du club
              </li>
              <li>
                <Check size={15} />
                Les mises à jour de la plateforme pendant toute la saison
              </li>
              <li>
                <Check size={15} />
                L'accompagnement au déploiement et le support technique
              </li>
            </ul>

            <div className="lp-offer-examples-head">
              Quelle que soit la taille de votre club
            </div>
            <div className="lp-offer-examples">
              <div className="lp-offer-example">
                <div className="lp-offer-example-members">80 licenciés</div>
                <div className="lp-offer-example-price">80 € HT</div>
                <div className="lp-offer-example-per">
                  pour la saison entière
                </div>
              </div>
              <div className="lp-offer-example">
                <div className="lp-offer-example-members">250 licenciés</div>
                <div className="lp-offer-example-price">250 € HT</div>
                <div className="lp-offer-example-per">
                  pour la saison entière
                </div>
              </div>
              <div className="lp-offer-example">
                <div className="lp-offer-example-members">700 licenciés</div>
                <div className="lp-offer-example-price">700 € HT</div>
                <div className="lp-offer-example-per">
                  pour la saison entière
                </div>
              </div>
            </div>

            {/* CTA #3 — the offer's own button */}
            <button
              className="lp-btn-primary lp-btn-primary--xl"
              onClick={goToForm}
            >
              Demander le Pack Découverte
            </button>

            <p className="lp-offer-deadline">
              Offre valable uniquement pour la saison 2026-2027, dans le cadre
              du lancement d'iSmart Club. Elle permet aux clubs de tester la
              plateforme dans des conditions optimales avant le passage à la
              grille tarifaire standard, à partir de la saison suivante.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ COMMUNITY ════════ */}
      <section id="communaute" className="lp-community">
        <div className="lp-community-head lp-reveal">
          <div className="lp-section-label lp-section-label--center">
            Communauté
          </div>
          <h2 className="lp-title">
            Un club n'avance jamais
            <br />
            <span className="lp-green">tout seul</span>
          </h2>
          <p className="lp-desc" style={{ maxWidth: 660, margin: "1rem auto 0" }}>
            Le module communauté relie les clubs partenaires : ressources
            partagées, contenus importés et méthodes échangées entre éducateurs.
          </p>
        </div>

        <div className="lp-community-grid">
          <div className="lp-community-card lp-reveal">
            <div className="lp-community-icon">
              <RefreshCw size={24} />
            </div>
            <h3>Partage entre clubs partenaires</h3>
            <p>
              Publiez vos procédés, vos programmations et vos projets de jeu, et
              accédez à ceux des autres clubs du réseau.
            </p>
            <div className="lp-community-stats">
              <div>
                <div className="lp-community-stat-num">592</div>
                <div className="lp-community-stat-label">
                  ressources partagées
                </div>
              </div>
              <div>
                <div className="lp-community-stat-num">544</div>
                <div className="lp-community-stat-label">fiches procédés</div>
              </div>
              <div>
                <div className="lp-community-stat-num">23</div>
                <div className="lp-community-stat-label">
                  programmations annuelles
                </div>
              </div>
            </div>
            <div className="lp-community-ring" />
            <div className="lp-community-ring lp-community-ring--2" />
          </div>

          <div className="lp-community-card lp-reveal">
            <div className="lp-community-icon">
              <Download size={24} />
            </div>
            <h3>Import dans votre espace</h3>
            <p>
              Reprenez une ressource du réseau et adaptez-la à votre club en
              quelques clics :
            </p>
            <ul className="lp-community-list">
              <li>
                <ArrowRight size={14} />
                <span>Projets de jeu</span>
              </li>
              <li>
                <ArrowRight size={14} />
                <span>Programmations annuelles</span>
              </li>
              <li>
                <ArrowRight size={14} />
                <span>Procédés d'entraînement</span>
              </li>
              <li>
                <ArrowRight size={14} />
                <span>Critères d'évaluation</span>
              </li>
            </ul>
          </div>

          <div className="lp-community-card lp-community-card--wide lp-reveal">
            <div className="lp-community-icon">
              <Users size={24} />
            </div>
            <div>
              <h3>Un réseau de clubs, pas un logiciel de plus</h3>
              <p>
                Rejoindre iSmart Club, c'est rejoindre les clubs qui
                mutualisent leur méthodologie plutôt que de la reconstruire
                chacun de leur côté.
              </p>
            </div>
          </div>
        </div>

        <div className="lp-community-bonus lp-reveal">
          <Sparkles size={16} />
          <p>
            Les ressources publiées par les éducateurs iSmart Coach sont
            également accessibles depuis le module communauté.
          </p>
        </div>
      </section>

      {/* ════════ DEVICES — temporarily hidden ════════ */}
      {SHOW_DEVICE_MOCKUPS ? (
        <section className="lp-devices">
          <div className="lp-devices-inner">
            <div className="lp-reveal">
              <div className="lp-section-label lp-section-label--center">
                Partout avec vous
              </div>
              <h2 className="lp-title">
                Au bureau comme
                <br />
                au bord du terrain
              </h2>
            </div>

            <div className="lp-devices-hero lp-reveal">
              <div>
                <div className="lp-laptop-bezel">
                  <div className="lp-laptop-toolbar">
                    <span className="lp-laptop-dots" />
                  </div>
                  <div className="lp-laptop-screen">
                    <img
                      src={APP_SCREENSHOT}
                      alt="iSmart Club sur ordinateur"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="lp-laptop-bottom">
                  <div className="lp-laptop-notch" />
                </div>
                <div className="lp-laptop-shadow" />
              </div>
              <div className="lp-phone">
                <div className="lp-phone-notch" />
                <div className="lp-phone-screen">
                  <img
                    src={APP_SCREENSHOT}
                    alt="iSmart Club sur mobile"
                    loading="lazy"
                  />
                </div>
                <div className="lp-phone-indicator" />
              </div>
              <div className="lp-devices-glow" />
            </div>
          </div>
        </section>
      ) : null}

      {/* The launch offer is a single pack, so there is no tariff grid to
          compare — the standard grid only arrives the season after. A short
          recap band carries the offer one more time before the contact form. */}
      <section className="lp-recap">
        <div className="lp-recap-inner lp-reveal">
          <div className="lp-recap-icon">
            <Sparkles size={20} />
          </div>
          <div className="lp-recap-text">
            <strong>Pack Découverte 2026-2027 — 1 € HT par licencié</strong>
            <span>
              Une seule formule, pour l'ensemble du club. Tarification standard
              à partir de la saison suivante.
            </span>
          </div>
          {/* CTA #5 */}
          <button
            className="lp-btn-primary"
            onClick={goToForm}
          >
            Demander le Pack
          </button>
        </div>
      </section>
      {/* ════════ CONTACT ════════ */}
      <section id="contact" className="lp-contact">
        <div className="lp-contact-inner">
          <div className="lp-contact-left lp-reveal">
            <div className="lp-section-label">Nous contacter</div>
            <h2 className="lp-title">
              Une question ?<br />
              <span className="lp-green">On vous répond.</span>
            </h2>
            <p className="lp-desc" style={{ marginTop: "1rem" }}>
              Dites-nous combien de licenciés compte votre club — joueurs et
              staff — et nous vous renvoyons le montant exact du Pack Découverte
              ainsi qu'un accès de démonstration.
            </p>
            <div className="lp-contact-info">
              <div className="lp-contact-info-item">
                <span className="lp-contact-info-icon">
                  <Send size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="lp-contact-info-label">Email</div>
                  <a
                    className="lp-contact-info-value lp-contact-mail"
                    href="mailto:support@ismart-club.com"
                  >
                    support@ismart-club.com
                  </a>
                </div>
              </div>
              <div className="lp-contact-info-item">
                <span className="lp-contact-info-icon">
                  <Building2 size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="lp-contact-info-label">Déjà client ?</div>
                  <a
                    className="lp-contact-info-value"
                    href={PLATFORM_URL}
                    style={{ color: "var(--green)", textDecoration: "none" }}
                  >
                    Accéder à la plateforme →
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="lp-contact-right lp-reveal">
            <form
              className="lp-form-card"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
            >
              <div className="lp-form-row">
                <div className="lp-form-field">
                  <label className="lp-form-label" htmlFor="lp-club">
                    Club
                  </label>
                  <input
                    id="lp-club"
                    className="lp-form-input"
                    type="text"
                    placeholder="AS Marsa"
                  />
                </div>
                <div className="lp-form-field">
                  <label className="lp-form-label" htmlFor="lp-membres">
                    Licenciés du club
                  </label>
                  <input
                    id="lp-membres"
                    className="lp-form-input"
                    type="text"
                    placeholder="250"
                  />
                </div>
              </div>
              <div className="lp-form-field">
                <label className="lp-form-label" htmlFor="lp-email">
                  Email
                </label>
                <input
                  id="lp-email"
                  className="lp-form-input"
                  type="email"
                  placeholder="vous@votreclub.com"
                />
              </div>
              <div className="lp-form-field">
                <label className="lp-form-label" htmlFor="lp-message">
                  Message
                </label>
                <textarea
                  id="lp-message"
                  className="lp-form-input lp-form-textarea"
                  placeholder="Parlez-nous de votre club…"
                  rows={5}
                />
              </div>
              {sent ? (
                <div className="lp-form-sent">
                  <Check size={16} /> Message envoyé — nous revenons vers vous
                  sous 24 h.
                </div>
              ) : (
                <button className="lp-form-btn" type="submit">
                  Demander le Pack Découverte <ArrowRight size={16} />
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ════════ STICKY CTA — #7 ════════ */}
      <div className={`lp-sticky ${sticky ? "lp-sticky--visible" : ""}`}>
        <div className="lp-sticky-inner">
          <div className="lp-sticky-text">
            <span className="lp-sticky-badge">Pack Découverte</span>
            <span>
              <strong>1 € HT</strong> par licencié — saison 2026-2027
            </span>
          </div>
          <button className="lp-sticky-btn" onClick={goToForm}>
            Demander le Pack
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">
              © 2026 iSmart Club. Tous droits réservés.
            </div>
            <div className="lp-footer-links">
              <a href="#modules">Modules</a>
              <a href="#offre">Pack Découverte</a>
              <a href="#contact">Contact</a>
              <a href={PLATFORM_URL}>Connexion</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
