import { Link } from "react-router-dom"
import { ArrowLeft, ExternalLink, Printer } from "lucide-react"

/**
 * Compte rendu — a standalone "what's new" report, styled as a simple,
 * professional PDF document: a centered white sheet on a neutral viewer
 * backdrop, a formal masthead + metadata block, a Sommaire with dotted
 * leaders, plainly numbered sections with bullet lists, and captioned
 * figures (live, interactive embeds of the real screens).
 *
 * This page deliberately steps OUTSIDE the app's dark-only design system: it is
 * a document ABOUT the product, not a product screen. It stays on-brand — Rubik
 * type, the neon-green (#00ff87) reserved for the logo mark, one hairline accent
 * and the primary button (dark text on green). No light design tokens exist, so
 * the light palette is explicit hex (justified per CLAUDE.md when no token fits).
 *
 * Each figure embeds the real route via `<route>?embed=1`, which AppShell
 * renders chrome-less; the caption links out to the full page.
 */

/* ── Document palette ─────────────────────────────────────────────────────── */
const C = {
  backdrop: "#e8e8e4", // PDF-viewer gray
  sheet: "#ffffff",
  ink: "#1a1c20", // titles
  ink2: "#3d4046", // body
  ink3: "#83858c", // muted / captions
  line: "#e4e4df", // hairline
  lineStrong: "#d3d3cd",
  green: "#00ff87",
  onGreen: "#0d1a12",
  amber: "#c98a00",
} as const

type Tone = "new" | "refonte" | "wip"

type SectionMeta = {
  id: string
  n: number
  tag?: { label: string; tone: Tone }
  title: string
  path: string
  fig: string
  height: number
}

const SECTIONS: SectionMeta[] = [
  {
    id: "transactions",
    n: 1,
    title: "Transactions",
    path: "/finance/transactions",
    fig: "Écran Transactions — KPI, tableau, historique et demandes",
    height: 600,
  },
  {
    id: "budget2",
    n: 2,
    title: "Budget 2 — nouvelle saisie",
    path: "/budget2/s2-2025-2026/brouillon/d2-reference",
    fig: "Éditeur de budget — saisie en quatre couches",
    height: 640,
  },
  {
    id: "comparaison",
    n: 3,
    title: "Comparaison des budgets",
    path: "/budget2/comparaison",
    fig: "Comparaison de deux budgets, poste par poste",
    height: 620,
  },
  {
    id: "dashboard",
    n: 4,
    tag: { label: "En cours", tone: "wip" },
    title: "Tableau de bord — suivi",
    path: "/budget2/s2-2025-2026/dashboard",
    fig: "Suivi budgétaire — réel vs prévu",
    height: 600,
  },
]

const PRINT_CSS = `
@media print {
  .cr-toolbar { display: none !important; }
  .cr-backdrop { background: #ffffff !important; padding: 0 !important; }
  .cr-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
  .cr-figure { break-inside: avoid; }
  h2 { break-after: avoid; }
  a[href]::after { content: ""; }
}
@page { margin: 16mm; }
`

export function CompteRenduScreen() {
  return (
    <div
      className="cr-backdrop min-h-screen w-full font-body"
      style={{ backgroundColor: C.backdrop, colorScheme: "light" }}
    >
      <style>{PRINT_CSS}</style>

      {/* App chrome — not part of the document (hidden when printing) */}
      <div
        className="cr-toolbar sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-5 py-2.5 backdrop-blur"
        style={{
          borderColor: "rgba(0,0,0,0.08)",
          backgroundColor: "rgba(232,232,228,0.85)",
        }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-ui text-[0.82rem] font-medium transition-colors hover:bg-black/5"
          style={{ color: C.ink2 }}
        >
          <ArrowLeft size={15} /> Retour à l'application
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 font-ui text-[0.82rem] font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: C.green, color: C.onGreen }}
        >
          <Printer size={15} /> Imprimer / PDF
        </button>
      </div>

      {/* The document sheet */}
      <article
        className="cr-sheet mx-auto my-6 max-w-[880px] px-8 py-12 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.28)] md:my-10 md:px-16 md:py-16"
        style={{ backgroundColor: C.sheet }}
      >
        <Masthead />
        <Sommaire />

        {SECTIONS.map((s, i) => (
          <Section key={s.id} meta={s} first={i === 0}>
            {SECTION_BODY[s.id]}
          </Section>
        ))}
      </article>
    </div>
  )
}

/* ── Masthead (document title block) ─────────────────────────────────────── */
function Masthead() {
  return (
    <header>
      <div>
        <div
          className="font-ui text-[0.7rem] font-semibold tracking-[0.2em] uppercase"
          style={{ color: C.ink3 }}
        >
          Compte rendu produit
        </div>
        <h1
          className="mt-3 font-ui text-[2rem] leading-[1.12] font-semibold md:text-[2.35rem]"
          style={{ color: C.ink }}
        >
          Nouveautés — Module Finance
        </h1>
        <span
          className="mt-4 block h-[3px] w-14 rounded-full"
          style={{ backgroundColor: C.green }}
        />
        <p
          className="mt-5 max-w-2xl font-body text-[0.98rem] leading-relaxed"
          style={{ color: C.ink2 }}
        >
          Ce document présente les dernières évolutions du module Finance : le
          suivi des transactions et la nouvelle saisie du budget en quatre
          couches. Chaque section renvoie vers un aperçu interactif de l'écran
          concerné.
        </p>
      </div>

      {/* Metadata block */}
      <dl
        className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y py-5"
        style={{ borderColor: C.line }}
      >
        <MetaItem label="Date" value="3 juillet 2026" />
        <MetaItem label="Module" value="Finance" />
      </dl>
    </header>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        className="font-ui text-[0.62rem] font-medium tracking-[0.12em] uppercase"
        style={{ color: C.ink3 }}
      >
        {label}
      </dt>
      <dd
        className="mt-1 font-ui text-[0.9rem] font-medium"
        style={{ color: C.ink }}
      >
        {value}
      </dd>
    </div>
  )
}

/* ── Sommaire (table of contents, dotted leaders) ────────────────────────── */
function Sommaire() {
  return (
    <section className="mt-11">
      <h2
        className="font-ui text-[0.72rem] font-semibold tracking-[0.16em] uppercase"
        style={{ color: C.ink3 }}
      >
        Sommaire
      </h2>
      <ul className="mt-4 flex flex-col">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="group flex items-baseline gap-3 py-2.5"
            >
              <span
                className="font-ui text-[0.86rem] font-semibold tabular-nums"
                style={{ color: C.ink3 }}
              >
                {s.n}.
              </span>
              <span
                className="font-ui text-[0.95rem] font-medium transition-colors group-hover:opacity-70"
                style={{ color: C.ink }}
              >
                {s.title}
              </span>
              <span
                className="mx-1 min-w-6 flex-1 translate-y-[-3px] self-center border-b border-dotted"
                style={{ borderColor: C.lineStrong }}
                aria-hidden
              />
              {s.tag ? <Tag tone={s.tag.tone}>{s.tag.label}</Tag> : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── Section ──────────────────────────────────────────────────────────────── */
function Section({
  meta,
  first,
  children,
}: {
  meta: SectionMeta
  first?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      id={meta.id}
      className="scroll-mt-16 border-t pt-10"
      style={{ borderColor: C.line, marginTop: first ? "3rem" : "3.5rem" }}
    >
      <div className="flex items-baseline gap-3">
        <span
          className="font-ui text-[1.35rem] font-semibold tabular-nums"
          style={{ color: C.ink3 }}
        >
          {meta.n}.
        </span>
        <h2
          className="flex-1 font-ui text-[1.35rem] font-semibold"
          style={{ color: C.ink }}
        >
          {meta.title}
        </h2>
        {meta.tag ? <Tag tone={meta.tag.tone}>{meta.tag.label}</Tag> : null}
      </div>

      <div className="mt-4 pl-0 sm:pl-7">
        {children}
        <Figure meta={meta} />
      </div>
    </section>
  )
}

/* ── Section bodies (kept declarative, one per section id) ───────────────── */
const SECTION_BODY: Record<string, React.ReactNode> = {
  transactions: (
    <>
      <Lead>
        Un poste de suivi complet des mouvements financiers du club, saison par
        saison. Il réunit quatre briques principales :
      </Lead>
      <BulletList>
        <Bullet term="Les indicateurs (KPI)">
          revenus, dépenses, solde et nombre de transactions — recalculés en
          direct sur la vue filtrée.
        </Bullet>
        <Bullet term="Le tableau des mouvements">
          recherche, filtres avancés (nature, catégorie, portée, équipe,
          paiement, dates), tri, pièces jointes et export CSV.
        </Bullet>
        <Bullet term="L'historique des suppressions">
          toute transaction supprimée est conservée dans l'historique et reste
          restaurable — rien n'est perdu.
        </Bullet>
        <Bullet term="Les demandes de transaction">
          les demandes soumises par les équipes, en attente de validation avant
          d'entrer dans le suivi.
        </Bullet>
      </BulletList>
    </>
  ),
  budget2: (
    <>
      <Lead>
        La nouvelle version change la façon de saisir un budget : au lieu d'une
        longue liste unique, la saisie est répartie en <B>quatre couches</B>{" "}
        claires, remplies dans l'ordre. Le solde prévisionnel reste visible en
        permanence.
      </Lead>
      <BulletList numbered>
        <Bullet term="Général">
          les dépenses générales du club : loyer, charges, assurance, frais
          administratifs…
        </Bullet>
        <Bullet term="Staff">
          les coûts du personnel, ventilés par département — Technique et
          Administratif.
        </Bullet>
        <Bullet term="Équipes">
          équipe par équipe, ou en groupe (mise en commun) — chaque poste compté
          une seule fois.
        </Bullet>
        <Bullet term="Revenus">
          les recettes prévues : sponsors, subventions, cotisations,
          billetterie…
        </Bullet>
      </BulletList>
    </>
  ),
  comparaison: (
    <>
      <Lead>
        Une page dédiée pour comparer deux budgets côte à côte — un brouillon
        face à un autre, ou une saison face à une autre — et arbitrer en toute
        clarté.
      </Lead>
      <BulletList>
        <Bullet term="Deux budgets, au choix">
          sélectionnez A et B parmi tous les brouillons de toutes les saisons, et
          inversez-les d'un clic.
        </Bullet>
        <Bullet term="Écarts poste par poste">
          synthèse (revenus, dépenses, solde), répartition par section, puis
          détail par catégorie avec l'écart chiffré et en pourcentage.
        </Bullet>
      </BulletList>
    </>
  ),
  dashboard: (
    <>
      <Lead>
        Le tableau de bord confronte le <B>réel</B> (les transactions) au{" "}
        <B>prévu</B> (le budget de référence), catégorie par catégorie, et
        signale les dépassements.
      </Lead>
      <Note>
        Écran encore en cours de finalisation — plusieurs détails restent à
        compléter (affinage des alertes, filtres et vues par équipe). Vos retours
        sur cette première version sont les bienvenus.
      </Note>
      <BulletList>
        <Bullet term="KPI réel vs prévu">
          recettes, dépenses et solde réels rapportés au budget prévu, avec taux
          de consommation.
        </Bullet>
        <Bullet term="Suivi par catégorie">
          alertes de dépassement, tableau réel vs prévu et liste des transactions
          réalisées.
        </Bullet>
      </BulletList>
    </>
  ),
}

/* ── Prose primitives ─────────────────────────────────────────────────────── */
function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="max-w-2xl font-body text-[0.96rem] leading-[1.7]"
      style={{ color: C.ink2 }}
    >
      {children}
    </p>
  )
}

function B({ children }: { children: React.ReactNode }) {
  return (
    <strong style={{ color: C.ink, fontWeight: 600 }}>{children}</strong>
  )
}

function BulletList({
  children,
  numbered,
}: {
  children: React.ReactNode
  numbered?: boolean
}) {
  const items = Array.isArray(children) ? children : [children]
  return (
    <ul className="mt-4 flex max-w-2xl flex-col gap-2.5">
      {items.map((child, i) => (
        <li key={i} className="flex gap-3">
          {numbered ? (
            <span
              className="mt-0.5 flex size-[1.15rem] shrink-0 items-center justify-center rounded-full font-ui text-[0.66rem] font-semibold tabular-nums"
              style={{ backgroundColor: "#f0f0ea", color: C.ink2 }}
            >
              {i + 1}
            </span>
          ) : (
            <span
              className="mt-[0.6rem] size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: C.ink3 }}
              aria-hidden
            />
          )}
          {child}
        </li>
      ))}
    </ul>
  )
}

function Bullet({
  term,
  children,
}: {
  term: string
  children: React.ReactNode
}) {
  return (
    <p className="font-body text-[0.92rem] leading-[1.65]" style={{ color: C.ink2 }}>
      <span style={{ color: C.ink, fontWeight: 600 }}>{term}</span> — {children}
    </p>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-4 max-w-2xl border-l-2 py-1 pl-4"
      style={{ borderColor: C.amber }}
    >
      <p className="font-body text-[0.9rem] leading-[1.6]" style={{ color: "#6f5410" }}>
        {children}
      </p>
    </div>
  )
}

/* ── Tag (understated: dot + uppercase label) ────────────────────────────── */
function Tag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const dot: Record<Tone, string> = {
    new: C.green,
    refonte: C.ink,
    wip: C.amber,
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 font-ui text-[0.64rem] font-semibold tracking-[0.1em] uppercase"
      style={{ color: C.ink3 }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: dot[tone] }}
      />
      {children}
    </span>
  )
}

/* ── Figure (captioned live embed) ───────────────────────────────────────── */
function Figure({ meta }: { meta: SectionMeta }) {
  return (
    <figure className="cr-figure mt-6">
      <div
        className="overflow-hidden rounded-md border"
        style={{ borderColor: C.lineStrong, backgroundColor: "#131313" }}
      >
        <iframe
          src={`${meta.path}?embed=1`}
          title={`Aperçu — ${meta.title}`}
          loading="lazy"
          className="block w-full border-0"
          style={{ height: meta.height }}
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <span className="font-body text-[0.78rem]" style={{ color: C.ink3 }}>
          <span style={{ fontWeight: 600, color: C.ink2 }}>
            Figure {meta.n}
          </span>{" "}
          — {meta.fig}. Aperçu interactif défilable.
        </span>
        <a
          href={meta.path}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 font-ui text-[0.85rem] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-opacity hover:opacity-90"
          style={{ backgroundColor: C.green, color: C.onGreen }}
        >
          Ouvrir la page complète <ExternalLink size={15} />
        </a>
      </figcaption>
    </figure>
  )
}

