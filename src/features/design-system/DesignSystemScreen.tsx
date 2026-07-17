import { useState, type ReactNode } from "react"
import {
  Plus,
  Filter,
  Trash2,
  Sparkles,
  ArrowRight,
  Inbox,
  Users,
  Search,
  ChevronRight,
  Info,
  FileSpreadsheet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge } from "@/components/kit/Badge"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { DataTable, type Column } from "@/components/kit/DataTable"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { FormSheet } from "@/components/kit/FormSheet"
import { Placeholder } from "@/components/kit/Placeholder"
import { NotificationsMenu } from "@/components/NotificationsMenu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  Stat,
  Bar,
  Segmented,
  LinkBtn,
  Panel,
  TeamChip,
  CatTag,
  NumInput,
} from "@/features/budget/ui"
import {
  Crumbs,
  StatusBadge as Budget2StatusBadge,
  Budget2Tabs,
  Figure,
} from "@/features/budget2/ui"
import { StatutBadge, AssigneeCell } from "@/features/objectifs/ui"
import {
  Creative,
  EditableCreative,
  IconButton,
  LinkRow,
  SlotStats,
} from "@/features/sponsoring/campaignUi"
import { Pencil } from "lucide-react"

/* ────────────────────────────────────────────────────────────────────────
   Design System — a single in-app gallery of every component the product
   reuses. It reads the real kit (nothing is re-styled here), so a designer
   can scan the full palette, type scale, and component states in one place.
   Referenced screens for layout: budget/ui (Panel/Stat rhythm) and the kit
   components' own doc comments.
   ──────────────────────────────────────────────────────────────────────── */

/** A titled block that groups related specimens. */
function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2 className="font-ui text-lg font-medium tracking-normal text-ink">
          {title}
        </h2>
        {description ? (
          <p className="font-body text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** A single labeled demo cell — static card: transparent + border. */
function Specimen({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-5">
      <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </span>
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {children}
      </div>
    </div>
  )
}

/** Colour token swatch. Uses var(--…) directly — the whole point is to show
    the raw token value, so no utility maps here. */
function Swatch({
  token,
  hex,
  note,
}: {
  token: string
  hex: string
  note?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-14 w-full rounded-md border border-border"
        style={{ background: `var(--${token})` }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[0.7rem] text-ink-subtle">
          --{token}
        </span>
        <span className="font-mono text-[0.68rem] text-ink-disabled">
          {hex}
        </span>
        {note ? (
          <span className="font-body text-[0.68rem] text-ink-muted">
            {note}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/* ── Sample data for the DataTable specimen ─────────────────────────────── */
type DemoRow = { id: string; name: string; role: string; status: ReactNode }
const demoRows: DemoRow[] = [
  {
    id: "r1",
    name: "Yassine Ben Ali",
    role: "Éducateur U15",
    status: <Badge variant="success">Actif</Badge>,
  },
  {
    id: "r2",
    name: "Sofia Trabelsi",
    role: "Préparatrice physique",
    status: <Badge variant="warning">En congé</Badge>,
  },
  {
    id: "r3",
    name: "Karim Jebali",
    role: "Analyste vidéo",
    status: <Badge variant="danger">Suspendu</Badge>,
  },
]

const demoColumns: Column<DemoRow>[] = [
  {
    id: "name",
    header: "Membre",
    cell: (r) => (
      <div className="flex items-center gap-2.5">
        <Avatar name={r.name} size="sm" />
        <span className="text-ink">{r.name}</span>
      </div>
    ),
  },
  { id: "role", header: "Rôle", cell: (r) => r.role },
  { id: "status", header: "Statut", align: "right", cell: (r) => r.status },
]

export function DesignSystemScreen() {
  const [seg, setSeg] = useState<"apercu" | "detail" | "archive">("apercu")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [num, setNum] = useState(30)
  const [emptied, setEmptied] = useState(false)

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
      <PageHeader
        title="Design System"
        subtitle="Tous les composants réutilisés dans l'application — palette, typographie et états, au même endroit."
        actions={
          <Badge variant="info" dot>
            Référence vivante
          </Badge>
        }
      />

      {/* ── Foundations: colours ─────────────────────────────────────────── */}
      <Section
        title="Couleurs"
        description="Deux surfaces near-black, une seule accent verte réservée aux boutons, un bleu calme pour tout le reste, et le statut sémantique."
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          <Swatch token="background" hex="#131313" note="Page" />
          <Swatch token="surface" hex="#181818" note="Élément / carte" />
          <Swatch token="surface-nested" hex="#1d1d1d" note="Fond imbriqué" />
          <Swatch token="border" hex="#252525" note="Bordure par défaut" />
          <Swatch token="border-strong" hex="#404040" note="Inputs / hover" />
          <Swatch token="green" hex="#00ff87" note="Boutons primaires" />
          <Swatch token="brand-blue-600" hex="#0091ff" note="Tags / liens" />
          <Swatch token="accent" hex="#60a5fa" note="Accent interactif" />
          <Swatch token="success" hex="#00ff87" note="Positif" />
          <Swatch token="warning" hex="#e6a817" note="Priorité" />
          <Swatch token="danger" hex="#e5484d" note="Erreur / sortant" />
          <Swatch token="purple" hex="#7f77dd" note="IA uniquement" />
        </div>
      </Section>

      {/* ── Foundations: typography ──────────────────────────────────────── */}
      <Section
        title="Typographie"
        description="Rubik partout. La hiérarchie vient de la taille et de la couleur — pas du gras (regular 400 par défaut, semibold réservé aux titres et grands chiffres)."
      >
        <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
          <p className="font-ui text-3xl font-semibold text-ink">
            Titre H1 — 30 / semibold
          </p>
          <p className="font-ui text-2xl font-semibold text-ink">
            Titre H2 — 24 / semibold
          </p>
          <p className="font-ui text-base font-medium text-ink-subtle">
            Sous-titre H3 — 16 / medium
          </p>
          <p className="font-body text-sm text-ink-muted">
            Corps de texte — 14 / regular. La couleur muette porte l'essentiel
            du texte secondaire.
          </p>
          <p className="font-ui text-[0.68rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Overline / label — 12 / uppercase / tracking large
          </p>
          <p className="font-mono text-sm text-ink-subtle">
            Mono — +216 55 123 456 · ID-4F2A
          </p>
        </div>
      </Section>

      {/* ── Buttons ──────────────────────────────────────────────────────── */}
      <Section
        title="Boutons"
        description="Le vert est le seul remplissage plein (action primaire). Le reste est vide + bordé. Le violet est exclusivement réservé aux actions IA."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Variantes">
            <Button>Action primaire</Button>
            <Button variant="outline">Secondaire</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">
              <Trash2 /> Supprimer
            </Button>
            <Button className="bg-purple text-white hover:bg-purple/90">
              <Sparkles /> Assistant IA
            </Button>
            <Button variant="link">Lien</Button>
          </Specimen>
          <Specimen label="Tailles & états">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Ajouter">
              <Plus />
            </Button>
            <Button disabled>Désactivé</Button>
            <Button variant="outline">
              <Filter /> Filtrer
            </Button>
          </Specimen>
        </div>
      </Section>

      {/* ── Badges & tags ────────────────────────────────────────────────── */}
      <Section
        title="Badges & tags"
        description="Statut sémantique en pastille ; tags de catégorie en bleu de marque. Le vert n'apparaît jamais en badge décoratif."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Badge — statut">
            <Badge>Défaut</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success" dot>
              Confirmée
            </Badge>
            <Badge variant="warning" dot>
              À confirmer
            </Badge>
            <Badge variant="danger" dot>
              En retard
            </Badge>
          </Specimen>
          <Specimen label="Tags — équipe & catégorie">
            <Badge variant="home">Domicile</Badge>
            <Badge variant="away">Extérieur</Badge>
            <TeamChip>U13 · Poule A</TeamChip>
            <CatTag>Technique</CatTag>
            <CatTag flagged>À vérifier</CatTag>
          </Specimen>
        </div>
      </Section>

      {/* ── Avatars ──────────────────────────────────────────────────────── */}
      <Section
        title="Avatars"
        description="Dégradé gris neutre — pas de couleur par nom. Trois tailles."
      >
        <Specimen label="Tailles sm · md · lg">
          <Avatar name="Yassine Ben Ali" size="sm" />
          <Avatar name="Sofia Trabelsi" size="md" />
          <Avatar name="Karim Jebali" size="lg" />
          <div className="flex -space-x-2">
            <Avatar name="Amine Ok" className="ring-2 ring-background" />
            <Avatar name="Lina Ben" className="ring-2 ring-background" />
            <Avatar name="Nour Ha" className="ring-2 ring-background" />
          </div>
        </Specimen>
      </Section>

      {/* ── Inputs ───────────────────────────────────────────────────────── */}
      <Section
        title="Champs de saisie"
        description="Fond transparent + bordure ; au focus, seule la couleur de la bordure change (pas d'anneau, pas de vert)."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Texte & recherche" className="flex-col !items-stretch">
            <Input placeholder="Nom du membre…" />
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-disabled" />
              <Input placeholder="Rechercher…" className="pl-9" />
            </div>
            <Input disabled placeholder="Champ désactivé" />
          </Specimen>
          <Specimen label="Numérique avec unité" className="flex-col !items-stretch">
            <NumInput value={num} suffix="%" onChange={setNum} />
            <NumInput value={1200} suffix="DT" onChange={() => {}} />
          </Specimen>
        </div>
      </Section>

      {/* ── Stats & progress ─────────────────────────────────────────────── */}
      <Section
        title="Statistiques & progression"
        description="Grands chiffres en semibold ; positif en vert, négatif en rouge ; barres de consommation en bleu (ambre à l'approche de la limite)."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Solde" value="12 480 DT" tone="positive" delta="+8,2 % ce mois" dtone="up" />
          <Stat label="Dépenses" value="4 210 DT" tone="negative" delta="−3,1 %" dtone="down" />
          <Stat label="Membres actifs" value="86" delta="sur 92 inscrits" />
        </div>
        <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-body text-xs text-ink-muted">
              <span>Budget consommé</span>
              <span>62 %</span>
            </div>
            <Bar value={62} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-body text-xs text-ink-muted">
              <span>Quota séances</span>
              <span className="text-warning">91 %</span>
            </div>
            <Bar value={91} warn />
          </div>
        </div>
      </Section>

      {/* ── Segmented / tabs & inline link ───────────────────────────────── */}
      <Section
        title="Contrôles segmentés & liens inline"
        description="État actif neutre (jamais vert). Les « + ajouter » inline sont en bleu, majuscules, tracking léger."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Segmented (interactif)">
            <Segmented
              value={seg}
              onChange={setSeg}
              options={[
                { value: "apercu", label: "Aperçu" },
                { value: "detail", label: "Détail", badge: 4 },
                { value: "archive", label: "Archive" },
              ]}
            />
          </Specimen>
          <Specimen label="Lien inline">
            <LinkBtn>
              <Plus className="size-3.5" /> Ajouter une ligne
            </LinkBtn>
            <LinkBtn>
              Voir tout <ArrowRight className="size-3.5" />
            </LinkBtn>
          </Specimen>
        </div>
      </Section>

      {/* ── Panel + data table ───────────────────────────────────────────── */}
      <Section
        title="Panneau & tableau de données"
        description="Le tableau générique gère les états chargement, vide et lignes cliquables."
      >
        <Panel
          title="Effectif technique"
          action={
            <LinkBtn>
              <Plus className="size-3.5" /> Nouveau
            </LinkBtn>
          }
        >
          <DataTable
            columns={demoColumns}
            data={emptied ? [] : demoRows}
            getRowId={(r) => r.id}
            onRowClick={() => {}}
            empty={{
              icon: Inbox,
              title: "Aucun membre",
              description: "La liste a été vidée pour la démo.",
              action: (
                <Button size="sm" variant="outline" onClick={() => setEmptied(false)}>
                  Restaurer les lignes
                </Button>
              ),
            }}
          />
          <div className="mt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEmptied((e) => !e)}
            >
              {emptied ? "Remplir le tableau" : "Vider le tableau"}
            </Button>
          </div>
        </Panel>

        <Specimen label="État chargement (shimmer)" className="!block">
          <DataTable
            columns={demoColumns}
            data={[]}
            getRowId={(r) => r.id}
            loading
            skeletonRows={3}
          />
        </Specimen>
      </Section>

      {/* ── Empty state & skeleton ───────────────────────────────────────── */}
      <Section
        title="État vide & squelettes"
        description="Un état vide soigné vend le prototype mieux qu'une liste pleine."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border">
            <EmptyState
              icon={Users}
              title="Aucun joueur pour l'instant"
              description="Ajoutez un premier joueur pour construire l'effectif."
              action={
                <Button size="sm">
                  <Plus /> Ajouter un joueur
                </Button>
              }
            />
          </div>
          <Specimen label="Skeleton" className="flex-col !items-stretch">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </Specimen>
        </div>
      </Section>

      {/* ── Overlays & navigation controls ───────────────────────────────── */}
      <Section
        title="Overlays & navigation"
        description="Modale de confirmation (préférée aux panneaux latéraux) et bouton retour icône seule."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Modale de confirmation">
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 /> Supprimer le membre
            </Button>
          </Specimen>
          <Specimen label="Bouton retour (top-left des écrans)">
            <BackButton to={-1} label="Retour à la liste" className="mb-0" />
            <span className="font-body text-sm text-ink-muted">
              Icône seule — la destination est dans l'info-bulle.
            </span>
          </Specimen>
          <Specimen label="Formulaire (modale create/edit)">
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Plus /> Nouveau membre
            </Button>
            <span className="font-body text-sm text-ink-muted">
              En-tête + corps défilant + pied Annuler / Enregistrer.
            </span>
          </Specimen>
          <Specimen label="Notifications (menu du bandeau)">
            <NotificationsMenu />
            <span className="font-body text-sm text-ink-muted">
              La cloche du haut de page — cliquez pour ouvrir le panneau.
            </span>
          </Specimen>
        </div>
      </Section>

      {/* ── Structural primitives ────────────────────────────────────────── */}
      <Section
        title="Primitives structurelles"
        description="Séparateur, info-bulle et section repliable — la brique des groupes de navigation."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Séparateur (horizontal & vertical)" className="flex-col !items-stretch">
            <span className="font-body text-sm text-ink-muted">Section A</span>
            <Separator />
            <span className="font-body text-sm text-ink-muted">Section B</span>
            <div className="flex h-6 items-center gap-3 pt-1 text-sm text-ink-muted">
              <span>Actif</span>
              <Separator orientation="vertical" />
              <span>Archivé</span>
              <Separator orientation="vertical" />
              <span>Tous</span>
            </div>
          </Specimen>
          <Specimen label="Info-bulle (tooltip)">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="En savoir plus">
                    <Info />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Passez la souris pour ce contexte</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-body text-sm text-ink-muted">
              Survolez l'icône.
            </span>
          </Specimen>
          <Specimen label="Section repliable (collapsible)" className="!block">
            <Collapsible defaultOpen className="group/dc w-full">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 font-ui text-sm text-ink-subtle transition-colors hover:border-border-strong">
                <span>Pôle Technique</span>
                <ChevronRight className="size-4 text-ink-muted transition-transform group-data-[state=open]/dc:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1.5 flex flex-col gap-1 pl-3">
                <span className="rounded-md px-3 py-1.5 font-body text-sm text-ink-muted">
                  Catégories
                </span>
                <span className="rounded-md px-3 py-1.5 font-body text-sm text-ink-muted">
                  Compétitions
                </span>
                <span className="rounded-md px-3 py-1.5 font-body text-sm text-ink-muted">
                  Composition
                </span>
              </CollapsibleContent>
            </Collapsible>
          </Specimen>
        </div>
      </Section>

      {/* ── Placeholder screen ───────────────────────────────────────────── */}
      <Section
        title="Écran d'attente (placeholder)"
        description="Rendu sur toute route pas encore construite — garde la navigation vivante plutôt qu'une page morte."
      >
        <div className="overflow-hidden rounded-lg border border-border p-4">
          <Placeholder title="Réunions" icon={FileSpreadsheet} />
        </div>
      </Section>

      {/* ── Module — Budget 2 ────────────────────────────────────────────── */}
      <Section
        title="Module · Budget 2"
        description="Fil d'Ariane, badge de statut de brouillon, onglets de saison et chiffre monétaire."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Fil d'Ariane (Crumbs)" className="!block">
            <Crumbs
              items={[
                { label: "Budget", to: "/budget2" },
                { label: "Saison 2025-26", to: "/budget2" },
                { label: "Brouillon" },
              ]}
            />
          </Specimen>
          <Specimen label="Badge de statut">
            <Budget2StatusBadge status="brouillon" />
            <Budget2StatusBadge status="valide" />
            <Budget2StatusBadge status="archive" />
          </Specimen>
          <Specimen label="Onglets de saison (route-linked)" className="!block">
            <Budget2Tabs seasonId="demo" active="brouillon" draftCount={3} />
          </Specimen>
          <Specimen label="Chiffre monétaire (Figure)">
            <Figure label="Recettes" value="18 400 DT" tone="positive" big />
            <Figure label="Dépenses" value="12 190 DT" tone="negative" />
            <Figure label="Solde" value="6 210 DT" align="right" />
          </Specimen>
        </div>
      </Section>

      {/* ── Module — Objectifs ───────────────────────────────────────────── */}
      <Section
        title="Module · Objectifs techniques"
        description="Badge de statut de revue et cellule d'assignés (avatars empilés)."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Badge de statut">
            <StatutBadge statut="En attente" />
            <StatutBadge statut="Accepté" />
            <StatutBadge statut="Refusé" />
          </Specimen>
          <Specimen label="Cellule d'assignés">
            <AssigneeCell
              assignes={["Yassine Ben Ali", "Sofia Trabelsi", "Karim Jebali", "Amine Ok"]}
            />
          </Specimen>
        </div>
      </Section>

      {/* ── Module — Sponsoring ──────────────────────────────────────────── */}
      <Section
        title="Module · Sponsoring (campagnes)"
        description="Visuel de campagne (dessiné, pas chargé), sa variante éditable, bouton icône, ligne de lien et stats de slot."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Specimen label="Visuel (Creative)">
            <Creative
              name="Délice Danone"
              headline="Buvez malin, jouez fort"
              color="#0091ff"
              className="h-24 w-40"
            />
            <Creative
              name="Ooredoo"
              headline="Le sponsor officiel"
              color="#e5484d"
              className="h-24 w-40"
              compact
            />
          </Specimen>
          <Specimen label="Visuel éditable (au survol)">
            <EditableCreative>
              <Creative
                name="Délice Danone"
                headline="Survolez pour éditer"
                color="#7f77dd"
                className="h-24 w-40"
              />
            </EditableCreative>
          </Specimen>
          <Specimen label="Bouton icône (en-tête de carte)">
            <IconButton icon={Pencil} label="Modifier" />
            <IconButton icon={Plus} label="Ajouter" />
            <IconButton icon={Trash2} label="Supprimer" />
          </Specimen>
          <Specimen label="Ligne de lien" className="!block">
            <LinkRow link="https://delice.tn/campagne-ligue-2025" />
          </Specimen>
          <Specimen label="Stats de slot" className="!block">
            <SlotStats
              views={48200}
              clicks={1340}
              ctr="2,8 %"
              extra="20 matchs · 6 jours"
            />
          </Specimen>
        </div>
      </Section>

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Nouveau membre"
        description="Exemple de formulaire — aucune donnée n'est enregistrée ici."
        onSubmit={() => {
          setFormName("")
          setFormOpen(false)
        }}
      >
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-sm text-ink-subtle">Nom complet</span>
            <Input
              placeholder="ex. Yassine Ben Ali"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-sm text-ink-subtle">Rôle</span>
            <Input placeholder="ex. Éducateur U15" />
          </label>
        </div>
      </FormSheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer ce membre ?"
        description="Cette action est irréversible dans une vraie application. Ici, c'est une simple démonstration."
        confirmLabel="Supprimer"
        onConfirm={() => setConfirmOpen(false)}
      />
    </div>
  )
}
