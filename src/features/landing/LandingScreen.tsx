import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  Download,
  FolderTree,
  Info,
  Layers,
  MessageSquare,
  RefreshCw,
  Send,
  Share2,
  Shield,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react"

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
const STEP_IMAGE =
  "https://res.cloudinary.com/dceefnpod/image/upload/v1773402732/Gemini_Generated_Image_z1e5b4z1e5b4z1e5_1_tsxyra.png"

const PLATFORM_URL = "https://pprod.ismart-club.com/auth/login"

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

/* ── Modules — grouped as the platform's own navigation groups them ────── */
const MODULES: {
  icon: ReactNode
  name: string
  desc: string
  tags: string[]
}[] = [
  {
    icon: <Users size={24} strokeWidth={1.5} />,
    name: "Ressources humaines",
    desc: "Joueurs, éducateurs, membres et parents dans un seul annuaire, avec des profils et des permissions par rôle.",
    tags: ["Joueurs", "Éducateurs", "Parents", "Profils"],
  },
  {
    icon: <Layers size={24} strokeWidth={1.5} />,
    name: "Catégories & groupes",
    desc: "Chaque catégorie a son effectif, ses groupes, son staff, ses résultats et son taux de présence, saison après saison.",
    tags: ["Effectif", "Groupes", "Résultats"],
  },
  {
    icon: <Target size={24} strokeWidth={1.5} />,
    name: "Projet de jeu",
    desc: "Le modèle de jeu du club, décliné en étapes par phase, et appliqué aux catégories concernées.",
    tags: ["Modèle de jeu", "Étapes", "Par catégorie"],
  },
  {
    icon: <Calendar size={24} strokeWidth={1.5} />,
    name: "Programmation annuelle",
    desc: "La saison entière planifiée : chaque séance sait quel principe de jeu elle doit travailler, semaine après semaine.",
    tags: ["36 semaines", "Cycles", "Principes"],
  },
  {
    icon: <ClipboardList size={24} strokeWidth={1.5} />,
    name: "Procédés & séances",
    desc: "Une bibliothèque de procédés classée par principe, et des séances construites à partir d'elle en quelques clics.",
    tags: ["Bibliothèque", "Séances", "Matériel"],
  },
  {
    icon: <BarChart3 size={24} strokeWidth={1.5} />,
    name: "Analyse & suivi",
    desc: "Présences, évaluations individuelles et de groupe, notes de match et tests physiques rattachés à chaque joueur.",
    tags: ["Présences", "Évaluations", "Tests"],
  },
  {
    icon: <FolderTree size={24} strokeWidth={1.5} />,
    name: "Structuration",
    desc: "Organigramme, tâches, réunions, formations, qualifications et documents — le fonctionnement du club, écrit.",
    tags: ["Organigramme", "Tâches", "Documents"],
  },
  {
    icon: <Wallet size={24} strokeWidth={1.5} />,
    name: "Finances",
    desc: "Budget prévisionnel, transactions réelles et collectes, avec la comparaison prévu / réel mois par mois.",
    tags: ["Budget", "Transactions", "Collectes"],
  },
  {
    icon: <MessageSquare size={24} strokeWidth={1.5} />,
    name: "Communication",
    desc: "Messagerie par groupe, sondages, convocations et courrier sortant vers les joueurs, le staff et les parents.",
    tags: ["Messagerie", "Sondages", "Convocations"],
  },
]

/* ── Features, presented one by one on the timeline ───────────────────────
   Same alternating rail as the coach landing's "étapes", but each entry is a
   feature of the platform rather than a step of a process. `stat` carries the
   one number that makes the feature concrete.                              */
const FEATURES: {
  num: string
  icon: ReactNode
  tag: string
  title: string
  desc: string
  points: string[]
  stat: string | null
  media: string
  isVideo: boolean
  caption: string
}[] = [
  {
    num: "01",
    icon: <Target size={13} />,
    tag: "Projet de jeu",
    title: "Le modèle de jeu du club",
    desc: "Écrivez une fois la façon de jouer du club, découpée par phase de jeu et illustrée sur le terrain. Chaque catégorie s'y rattache — l'école de foot et les seniors parlent enfin le même langage.",
    points: [
      "Système et animations, offensives comme défensives",
      "Étapes classées par phase de jeu",
      "Appliqué aux catégories concernées",
    ],
    stat: "Jusqu'à 31 étapes par projet, schéma à l'appui.",
    media: VIDEO_PROCEDES,
    isVideo: true,
    caption: "Une étape du projet de jeu, schéma et consignes",
  },
  {
    num: "02",
    icon: <Calendar size={13} />,
    tag: "Programmation",
    title: "La saison programmée d'avance",
    desc: "Chaque semaine de la saison sait ce qu'elle doit travailler. L'éducateur n'ouvre plus une page blanche : il déroule un programme cohérent avec le projet de jeu du club.",
    points: [
      "Programme annuel par équipe et par groupe",
      "Chaque séance rattachée à un principe de jeu",
      "Évaluations et séances spécifiques positionnées",
    ],
    stat: "36 semaines, 108 séances programmées par équipe.",
    media: VIDEO_PROGRAMMATION,
    isVideo: true,
    caption: "Le programme annuel, semaine par semaine",
  },
  {
    num: "03",
    icon: <ClipboardList size={13} />,
    tag: "Procédés",
    title: "Une bibliothèque qui reste au club",
    desc: "Jeux, situations et exercices rangés par principe de jeu, avec durée, surface, effectif, matériel et schéma. Le contenu appartient au club, pas à l'éducateur qui s'en va.",
    points: [
      "Classés par phase et principe de jeu",
      "Jeu, situation ou exercice",
      "Filtres par type, auteur et catégorie",
    ],
    stat: "544 fiches procédés déjà partagées dans le réseau.",
    media: VIDEO_BIBLIOTHEQUE,
    isVideo: true,
    caption: "La bibliothèque, filtrée par principe de jeu",
  },
  {
    num: "04",
    icon: <Layers size={13} />,
    tag: "Séances",
    title: "Des séances construites en quelques clics",
    desc: "La séance se compose depuis la bibliothèque : on choisit les procédés, le reste suit. Matériel, durée, thème et contrôles terrain sont déjà là.",
    points: [
      "Procédés repris depuis la bibliothèque",
      "Matériel, durée et intensité cible",
      "Contrôles sécurité et hydratation",
    ],
    stat: "De la ligne du programme à la séance prête : un clic.",
    media: VIDEO_SEANCE,
    isVideo: true,
    caption: "Une séance et ses procédés",
  },
  {
    num: "05",
    icon: <Users size={13} />,
    tag: "Catégories & effectifs",
    title: "Chaque catégorie, sa photo complète",
    desc: "Effectif, groupes, staff, calendrier et résultats réunis sur une même page. En un coup d'œil : qui est là, qui vient s'entraîner, comment l'équipe se comporte.",
    points: [
      "Effectif par groupe et par poste",
      "Taux de présence par joueur",
      "Résultats, bilan et forme de la saison",
    ],
    stat: "Toutes les catégories, de U6 aux seniors.",
    media: APP_SCREENSHOT,
    isVideo: false,
    caption: "Une catégorie : effectif, résultats et séances",
  },
  {
    num: "06",
    icon: <BarChart3 size={13} />,
    tag: "Analyse & suivi",
    title: "Le progrès, en chiffres",
    desc: "Présences, évaluations individuelles et de groupe, notes de match et tests physiques rattachés à chaque joueur — et comparables d'une saison à l'autre.",
    points: [
      "Évaluations individuelles et de groupe",
      "Tests physiques et dominantes techniques",
      "Notes de match et assiduité",
    ],
    stat: "Un historique qui suit le joueur de catégorie en catégorie.",
    media: STEP_IMAGE,
    isVideo: false,
    caption: "Suivi des présences et des évaluations",
  },
  {
    num: "07",
    icon: <Wallet size={13} />,
    tag: "Administration & finances",
    title: "Le club vu depuis le bureau",
    desc: "Organigramme, tâches, réunions, documents, budget prévisionnel et transactions réelles. La partie invisible du club, enfin tenue au même endroit que le terrain.",
    points: [
      "Budget prévisionnel comparé au réel, mois par mois",
      "Transactions, collectes et rapports",
      "Organigramme, tâches, réunions et documents",
    ],
    stat: "Le bureau décide sur des faits, pas des impressions.",
    media: APP_SCREENSHOT,
    isVideo: false,
    caption: "Budget prévisionnel et suivi des transactions",
  },
]

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

function useJourney() {
  const timelineRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const onScroll = useCallback(() => {
    if (!timelineRef.current || !progressRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const h = window.innerHeight
    const progress =
      rect.top < h * 0.5
        ? Math.min(1, (h * 0.5 - rect.top) / (rect.bottom - rect.top))
        : 0
    progressRef.current.style.height = `${progress * 100}%`
    timelineRef.current.querySelectorAll(".lp-j-step").forEach((step) => {
      if (step.getBoundingClientRect().top < h * 0.75)
        step.classList.add("lp-j-step--active")
    })
  }, [])
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])
  return { timelineRef, progressRef }
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

  useScrollReveal()
  const { timelineRef, progressRef } = useJourney()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      setSticky(window.scrollY > 600)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /** Every CTA on the page points at the same place: the offer section. */
  const goToOffer = () => {
    document.getElementById("offre")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="lp">
      <div className="lp-grain" aria-hidden />

      <nav className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
        <a className="lp-logo" href="#hero">
          <span className="lp-logo-mark">iS</span>
          <span className="lp-logo-word">iSMART CLUB</span>
        </a>
        <ul className="lp-nav-links">
          <li>
            <a href="#modules">Modules</a>
          </li>
          <li>
            <a href="#fonctionnalites">Fonctionnalités</a>
          </li>
          <li>
            <a href="#communaute">Communauté</a>
          </li>
          <li>
            <a href="#offre">Offre</a>
          </li>
        </ul>
        <button className="lp-nav-cta" onClick={goToOffer}>
          Devenir partenaire
        </button>
      </nav>

      <div className="lp-canvas">
        {/* ════════ HERO ════════ */}
        <section id="hero" className="lp-hero">
          <button className="lp-badge-strip" onClick={goToOffer}>
            <span className="lp-badge-pulse" />
            <span className="lp-badge-text">
              Offre d'août — 1 € par membre, toute la saison
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
                onClick={goToOffer}
              >
                Devenir partenaire iSmart Club
              </button>
              <span className="lp-cta-note">
                <Check size={13} /> 1 € par membre · toute la saison 2025-2026
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

            <div className="lp-video-container lp-reveal">
              <div className="lp-video-wrapper">
                <video
                  src={VIDEO_PROGRAMMATION}
                  muted
                  playsInline
                  loop
                  autoPlay
                  preload="metadata"
                  aria-label="Aperçu d'iSmart Club"
                />
              </div>
              <div className="lp-video-glow" />
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
              <div className="lp-offer-tag">Offre d'août</div>
              <div>
                <button className="lp-btn-primary" onClick={goToOffer}>
                  Devenir partenaire iSmart Club
                </button>
              </div>
              <p className="lp-solution-cta-note">
                1 € par membre pour toute la saison — sans engagement de
                reconduction.
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
            {MODULES.map((m) => (
              <article className="lp-module-card" key={m.name}>
                <div className="lp-module-icon">{m.icon}</div>
                <h3 className="lp-module-name">{m.name}</h3>
                <p className="lp-module-desc">{m.desc}</p>
                <div className="lp-module-tags">
                  {m.tags.map((t) => (
                    <span className="lp-module-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <span className="lp-module-glow" />
              </article>
            ))}
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

      {/* ════════ OFFER ════════ */}
      <section id="offre" className="lp-offer">
        <div className="lp-offer-inner">
          <div className="lp-reveal">
            <div className="lp-section-label lp-section-label--center">
              Offre partenaire — août
            </div>
            <h2 className="lp-title">
              1 € par membre.
              <br />
              <span className="lp-green">Toute la saison.</span>
            </h2>
          </div>

          <div className="lp-offer-card lp-reveal">
            <div className="lp-offer-price">
              <span className="lp-offer-amount">1 €</span>
              <span className="lp-offer-unit">
                par membre
                <span>pour la saison entière</span>
              </span>
            </div>

            <p className="lp-offer-lead">
              Pendant le mois d'août, devenez partenaire iSmart Club et équipez
              tout votre club pour un euro par licencié — accès complet aux 34
              modules, pour tous vos éducateurs et toutes vos catégories.
            </p>

            <div className="lp-offer-examples">
              <div className="lp-offer-example">
                <div className="lp-offer-example-members">120 membres</div>
                <div className="lp-offer-example-price">120 €</div>
                <div className="lp-offer-example-per">soit 10 € par mois</div>
              </div>
              <div className="lp-offer-example">
                <div className="lp-offer-example-members">300 membres</div>
                <div className="lp-offer-example-price">300 €</div>
                <div className="lp-offer-example-per">soit 25 € par mois</div>
              </div>
              <div className="lp-offer-example">
                <div className="lp-offer-example-members">600 membres</div>
                <div className="lp-offer-example-price">600 €</div>
                <div className="lp-offer-example-per">soit 50 € par mois</div>
              </div>
            </div>

            <div className="lp-offer-checks">
              <span>
                <Check size={14} /> Accès complet
              </span>
              <span>
                <Check size={14} /> Utilisateurs illimités
              </span>
              <span>
                <Check size={14} /> Reprise de vos données
              </span>
              <span>
                <Check size={14} /> Sans engagement
              </span>
            </div>

            {/* CTA #3 — the offer's own button */}
            <button
              className="lp-btn-primary lp-btn-primary--xl"
              onClick={() =>
                document
                  .getElementById("contact")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Devenir partenaire iSmart Club
            </button>

            <p className="lp-offer-deadline">
              Offre valable pour toute adhésion signée avant le 31 août 2026.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ FEATURES — one per rail entry ════════ */}
      <section id="fonctionnalites" className="lp-journey">
        <div className="lp-j-header lp-reveal">
          <div className="lp-section-label lp-section-label--center">
            Les fonctionnalités
          </div>
          <h2 className="lp-j-header-title">
            Chaque outil du club,
            <br />
            <em>en détail</em>
          </h2>
          <p className="lp-j-header-sub">
            Sept fonctionnalités qui portent le quotidien d'un club — reliées
            entre elles par la même saison, les mêmes catégories et le même
            projet de jeu.
          </p>
        </div>

        <div className="lp-j-timeline" ref={timelineRef}>
          <div className="lp-j-track">
            <div className="lp-j-progress" ref={progressRef} />
          </div>

          {FEATURES.map((feature, i) => (
            <div
              key={feature.num}
              className={`lp-j-step ${i % 2 !== 0 ? "lp-j-step--reversed" : ""}`}
            >
              <div className="lp-j-dot">
                <span>{feature.num}</span>
              </div>

              <div className="lp-j-text">
                <div className="lp-j-tag">
                  {feature.icon}
                  {feature.tag}
                </div>
                <h3 className="lp-j-title">{feature.title}</h3>
                <p className="lp-j-desc">{feature.desc}</p>
                <ul className="lp-j-features">
                  {feature.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {feature.stat ? (
                  <div className="lp-j-bridge">{feature.stat}</div>
                ) : null}
              </div>

              <div className="lp-j-media-side">
                <div className="lp-j-media">
                  {feature.isVideo ? (
                    <video
                      src={feature.media}
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                      aria-label={feature.caption}
                    />
                  ) : (
                    <img
                      src={feature.media}
                      alt={feature.caption}
                      loading="lazy"
                    />
                  )}
                  <p className="lp-j-caption">{feature.caption}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA #4 — closing the feature rail */}
        <div className="lp-j-closing lp-reveal">
          <div className="lp-j-closing-badge">
            Sept fonctionnalités, une seule plateforme.
          </div>
          <p>
            Aucune n'est vendue à part : le projet de jeu nourrit la
            programmation, la programmation crée les séances, les séances
            alimentent le suivi. Tout est compris dans l'offre partenaire.
          </p>
          <div className="lp-j-closing-cta">
            <button className="lp-btn-primary" onClick={goToOffer}>
              Devenir partenaire iSmart Club
            </button>
            <span className="lp-cta-note">
              <Check size={12} /> 1 € par membre pour toute la saison
            </span>
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
                Devenir partenaire iSmart Club, c'est rejoindre les clubs qui
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

      {/* ════════ DEVICES ════════ */}
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

      {/* ════════ PRICING ════════ */}
      <section className="lp-pricing">
        <div className="lp-pricing-inner">
          <div className="lp-section-label lp-section-label--center">Tarifs</div>
          <h2 className="lp-title lp-reveal">
            Un tarif par club, pas par utilisateur
          </h2>

          <div className="lp-pricing-banner lp-reveal">
            <div className="lp-pricing-banner-icon">
              <Sparkles size={20} />
            </div>
            <div className="lp-pricing-banner-text">
              <strong>Offre d'août — 1 € par membre, toute la saison</strong>
              <span>
                Le club entier équipé pour le prix d'un café par licencié.
              </span>
            </div>
            <div className="lp-pricing-banner-checks">
              <span>
                <Check size={13} /> Accès complet
              </span>
              <span>
                <Check size={13} /> Sans engagement
              </span>
            </div>
          </div>

          <div className="lp-pricing-grid lp-reveal">
            <div className="lp-plan">
              <div className="lp-plan-tag">Standard</div>
              <div className="lp-plan-title">Formule Club</div>
              <div className="lp-plan-price-row">
                <span className="lp-plan-price">3 €</span>
                <span className="lp-plan-price-then">
                  par membre / an — tarif normal
                </span>
              </div>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                <li>Les 34 modules de la plateforme</li>
                <li>Éducateurs et dirigeants illimités</li>
                <li>Espaces joueurs et parents</li>
                <li>Une saison complète</li>
              </ul>
              {/* CTA #5 */}
              <button
                className="lp-plan-btn lp-plan-btn--outline"
                onClick={goToOffer}
              >
                Demander un devis
              </button>
            </div>

            <div className="lp-plan lp-plan--featured">
              <div className="lp-plan-badge">Août uniquement</div>
              <div className="lp-plan-pill lp-plan-pill--gold">
                Offre partenaire
              </div>
              <div className="lp-plan-tag lp-plan-tag--gold">Partenaire</div>
              <div className="lp-plan-title">Formule Partenaire</div>
              <div className="lp-plan-price-row">
                <span className="lp-plan-price">1 €</span>
                <span className="lp-plan-price-then">
                  par membre — la saison entière
                </span>
              </div>
              <div className="lp-plan-include">
                Tout ce que contient la Formule Club, plus :
              </div>
              <ul className="lp-plan-features">
                <li>Reprise de vos données existantes</li>
                <li>Accompagnement au démarrage</li>
                <li>Accès au module Communauté</li>
                <li>Tarif bloqué sur toute la saison</li>
              </ul>
              {/* CTA #6 */}
              <button
                className="lp-plan-btn lp-plan-btn--filled"
                onClick={() =>
                  document
                    .getElementById("contact")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Devenir partenaire iSmart Club
              </button>
            </div>
          </div>
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
              Dites-nous combien de licenciés compte votre club : nous vous
              renvoyons le montant exact de l'offre d'août et un accès de
              démonstration.
            </p>
            <div className="lp-contact-info">
              <div className="lp-contact-info-item">
                <span className="lp-contact-info-icon">
                  <Send size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="lp-contact-info-label">Email</div>
                  <div className="lp-contact-info-value">
                    contact@ismart-club.com
                  </div>
                </div>
              </div>
              <div className="lp-contact-info-item">
                <span className="lp-contact-info-icon">
                  <Building2 size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <div className="lp-contact-info-label">Déjà partenaire ?</div>
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
                    Nombre de membres
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
                  Demander l'offre partenaire <ArrowRight size={16} />
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
            <span className="lp-sticky-badge">Offre d'août</span>
            <span>
              <strong>1 €</strong> par membre — toute la saison
            </span>
          </div>
          <button className="lp-sticky-btn" onClick={goToOffer}>
            Devenir partenaire
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
              <a href="#offre">Offre</a>
              <a href="#contact">Contact</a>
              <a href={PLATFORM_URL}>Connexion</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
