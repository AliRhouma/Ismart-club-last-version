import { useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  Mail,
  MessageSquare,
  Plus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { FicheJoueur, FicheParent } from "@/data/seed/inscriptions"
import { POSTES, POSTE_LABEL } from "@/data/seed/categories"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Étapes du parcours. The link drops you on `accueil`; everything after that
 * depends on two answers — do you already have an account, and are you the
 * joueur or a parent. The five paths of the spec are the five ways through.
 */
type Etape =
  | "accueil"
  | "connexion"
  | "role" // signed in: joueur or parent?
  | "qui" // no account: joueur or parent?
  | "enfants" // parent signed in: which child?
  | "fiche-enfant"
  | "fiche-joueur"
  | "fiche-parent"
  | "attente"

const labelCls =
  "font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase"
const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors focus:border-border-focus"

/**
 * `?flow=` — the four entry points the éducateur can hand out to try a path
 * without walking the first two screens. It only picks the starting step and
 * whether the visitor is signed in; the rest of the parcours is unchanged.
 */
const DEPARTS: Record<string, { etape: Etape; connecte: boolean }> = {
  "joueur-nouveau": { etape: "fiche-joueur", connecte: false },
  "joueur-compte": { etape: "fiche-joueur", connecte: true },
  "parent-nouveau": { etape: "fiche-parent", connecte: false },
  "parent-compte": { etape: "enfants", connecte: true },
}

const ficheJoueurVide: FicheJoueur = {
  prenom: "",
  nom: "",
  naissance: "",
  genre: "Masculin",
  email: "",
  telephone: "",
  poste: "",
  niveau: "",
}

const ficheParentVide: FicheParent = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
}

/**
 * Rejoindre une catégorie — the page an invite link opens, outside the club's
 * shell: whoever follows it is not a member yet, so there is no sidebar, no
 * nav, nothing but the step in front of them.
 */
export function RejoindreScreen() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [params] = useSearchParams()
  const depart = DEPARTS[params.get("flow") ?? ""]
  const {
    liensInscription,
    categories,
    parentEnfants,
    soumettreDemande,
    demandesInscription,
  } = useData()

  const lien = liensInscription.find((l) => l.token === token)
  const categorie = categories.find((c) => c.id === lien?.categorieId)

  const [etape, setEtape] = useState<Etape>(depart?.etape ?? "accueil")
  const [connecte, setConnecte] = useState(depart?.connecte ?? false)
  const [joueur, setJoueur] = useState<FicheJoueur>(ficheJoueurVide)
  const [parent, setParent] = useState<FicheParent>(ficheParentVide)
  const [enfantId, setEnfantId] = useState<string | null>(null)
  const [demandeId, setDemandeId] = useState<string | null>(null)

  // An expired or wrong link says so plainly rather than 404-ing.
  if (!lien || !lien.actif || !categorie)
    return (
      <Cadre titre="Lien indisponible" sousTitre="">
        <p className="font-body text-sm text-ink-muted">
          Ce lien d'inscription n'existe plus ou a été désactivé par
          l'éducateur. Demandez-lui de vous en envoyer un nouveau.
        </p>
      </Cadre>
    )

  const demande = demandesInscription.find((d) => d.id === demandeId) ?? null

  const soumettre = (
    profil: "joueur" | "parent",
    fiche: FicheJoueur,
    parentFiche?: FicheParent,
  ) => {
    const id = soumettreDemande({
      categorieId: categorie.id,
      lienId: lien.id,
      profil,
      nouveauCompte: !connecte,
      joueur: fiche,
      parent: parentFiche,
    })
    setDemandeId(id)
    setEtape("attente")
  }

  const sousTitre = `${categorie.nom} · ${categorie.genre} · ${categorie.joueurs.length} joueurs`

  /* ── 1. Landing ─────────────────────────────────────────────────────── */
  if (etape === "accueil")
    return (
      <Cadre titre={`Rejoindre ${categorie.nom}`} sousTitre={sousTitre}>
        <p className="font-body text-sm text-ink-muted">
          Vous avez reçu ce lien de l'éducateur de {categorie.nom}. Connectez-vous
          ou créez un compte pour envoyer votre demande.
        </p>
        <div className="flex flex-col gap-2.5">
          <Choix
            icon={KeyRound}
            titre="Se connecter"
            aide="J'ai déjà un compte iSmart Club"
            onClick={() => setEtape("connexion")}
          />
          <Choix
            icon={UserPlus}
            titre="Créer un compte"
            aide="Je suis nouveau membre"
            onClick={() => setEtape("qui")}
          />
        </div>
      </Cadre>
    )

  /* ── 2. Sign in (prototype: no auth, you pick and continue) ─────────── */
  if (etape === "connexion")
    return (
      <Cadre
        titre="Se connecter"
        sousTitre={sousTitre}
        onRetour={() => setEtape("accueil")}
      >
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Email</span>
          <input
            type="email"
            defaultValue="nadia.khemiri@example.com"
            className={fieldCls}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Mot de passe</span>
          <input type="password" defaultValue="••••••••" className={fieldCls} />
        </label>
        <Button
          onClick={() => {
            setConnecte(true)
            setEtape("role")
          }}
        >
          Se connecter
        </Button>
      </Cadre>
    )

  /* ── 3. Signed in: joueur or parent? ────────────────────────────────── */
  if (etape === "role")
    return (
      <Cadre
        titre="Vous souhaitez rejoindre cette catégorie en tant que ?"
        sousTitre={sousTitre}
        onRetour={() => setEtape("accueil")}
      >
        <div className="flex flex-col gap-2.5">
          <Choix
            icon={BadgeCheck}
            titre="Joueur"
            aide="Je rejoins l'effectif moi-même"
            onClick={() => setEtape("fiche-joueur")}
          />
          <Choix
            icon={Users}
            titre="Parent"
            aide="J'inscris mon enfant"
            onClick={() => setEtape("enfants")}
          />
        </div>
      </Cadre>
    )

  /* ── 4. No account: who are you? ────────────────────────────────────── */
  if (etape === "qui")
    return (
      <Cadre
        titre="Vous êtes ?"
        sousTitre={sousTitre}
        onRetour={() => setEtape("accueil")}
      >
        <div className="flex flex-col gap-2.5">
          <Choix
            icon={BadgeCheck}
            titre="Joueur"
            aide="Je crée mon compte et je rejoins la catégorie"
            onClick={() => setEtape("fiche-joueur")}
          />
          <Choix
            icon={Users}
            titre="Parent"
            aide="Je crée mon compte, puis la fiche de mon enfant"
            onClick={() => setEtape("fiche-parent")}
          />
        </div>
      </Cadre>
    )

  /* ── 5. Parent signed in: pick the child ────────────────────────────── */
  if (etape === "enfants")
    return (
      <Cadre
        titre="Quel enfant inscrivez-vous ?"
        sousTitre={sousTitre}
        onRetour={() => setEtape("role")}
      >
        {parentEnfants.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">
            Aucun enfant n'est encore rattaché à votre compte. Créez sa fiche
            pour continuer.
          </p>
        ) : (
          <div
            role="radiogroup"
            aria-label="Vos enfants"
            className="flex flex-col gap-2"
          >
            {parentEnfants.map((e) => (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={enfantId === e.id}
                onClick={() => setEnfantId(e.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
                  enfantId === e.id
                    ? "border-info bg-info/5"
                    : "border-border hover:border-border-strong",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.72rem] text-ink-muted">
                  {e.nom.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-ui text-[0.88rem] text-ink">
                    {e.nom}
                  </span>
                  <span className="block font-body text-[0.75rem] text-ink-muted">
                    {e.categorie} · {e.groupe} · né le{" "}
                    {e.naissance.split("-").reverse().join("/")}
                  </span>
                </span>
                {enfantId === e.id ? (
                  <CheckCircle2 size={16} className="shrink-0 text-info" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setJoueur(ficheJoueurVide)
            setEtape("fiche-enfant")
          }}
          className="inline-flex items-center gap-1.5 self-start font-ui text-[0.75rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
        >
          <Plus size={13} /> L'enfant n'a pas encore de fiche
        </button>

        <Button
          disabled={!enfantId}
          onClick={() => {
            const enfant = parentEnfants.find((e) => e.id === enfantId)
            if (!enfant) return
            const [prenom, ...reste] = enfant.nom.split(" ")
            soumettre(
              "parent",
              {
                prenom,
                nom: reste.join(" "),
                naissance: enfant.naissance,
                genre: "Masculin",
                poste: enfant.poste,
                joueurId: enfant.id,
              },
              parent.email ? parent : undefined,
            )
          }}
        >
          Envoyer la demande
        </Button>
      </Cadre>
    )

  /* ── 6. Forms ───────────────────────────────────────────────────────── */
  if (etape === "fiche-parent")
    return (
      <Cadre
        titre="Votre fiche parent"
        sousTitre={sousTitre}
        onRetour={() => setEtape("qui")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ
            label="Prénom"
            value={parent.prenom}
            onChange={(v) => setParent((p) => ({ ...p, prenom: v }))}
          />
          <Champ
            label="Nom"
            value={parent.nom}
            onChange={(v) => setParent((p) => ({ ...p, nom: v }))}
          />
          <Champ
            label="Email"
            type="email"
            value={parent.email}
            onChange={(v) => setParent((p) => ({ ...p, email: v }))}
          />
          <Champ
            label="Téléphone"
            value={parent.telephone}
            onChange={(v) => setParent((p) => ({ ...p, telephone: v }))}
          />
        </div>
        <Button
          disabled={!parent.prenom.trim() || !parent.nom.trim()}
          onClick={() => setEtape("fiche-enfant")}
        >
          Continuer — fiche de l'enfant
        </Button>
      </Cadre>
    )

  if (etape === "fiche-joueur" || etape === "fiche-enfant") {
    const pourEnfant = etape === "fiche-enfant"
    return (
      <Cadre
        titre={pourEnfant ? "Fiche de votre enfant" : "Votre fiche joueur"}
        sousTitre={sousTitre}
        onRetour={() =>
          setEtape(
            pourEnfant
              ? connecte
                ? "enfants"
                : "fiche-parent"
              : connecte
                ? "role"
                : "qui",
          )
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ
            label="Prénom"
            value={joueur.prenom}
            onChange={(v) => setJoueur((j) => ({ ...j, prenom: v }))}
          />
          <Champ
            label="Nom"
            value={joueur.nom}
            onChange={(v) => setJoueur((j) => ({ ...j, nom: v }))}
          />
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Date de naissance</span>
            <input
              type="date"
              value={joueur.naissance}
              onChange={(e) =>
                setJoueur((j) => ({ ...j, naissance: e.target.value }))
              }
              className={fieldCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Genre</span>
            <Select
              value={joueur.genre}
              onValueChange={(v) =>
                setJoueur((j) => ({
                  ...j,
                  genre: v as FicheJoueur["genre"],
                }))
              }
            >
              <SelectTrigger aria-label="Genre">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Masculin">Masculin</SelectItem>
                <SelectItem value="Féminin">Féminin</SelectItem>
              </SelectContent>
            </Select>
          </label>

          {/* A joueur signing up alone gives his own contact details; a child's
              are the parent's, already captured on the previous step. */}
          {pourEnfant ? null : (
            <>
              <Champ
                label="Email"
                type="email"
                value={joueur.email ?? ""}
                onChange={(v) => setJoueur((j) => ({ ...j, email: v }))}
              />
              <Champ
                label="Téléphone"
                value={joueur.telephone ?? ""}
                onChange={(v) => setJoueur((j) => ({ ...j, telephone: v }))}
              />
            </>
          )}

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Poste souhaité</span>
            <Select
              value={joueur.poste || "aucun"}
              onValueChange={(v) =>
                setJoueur((j) => ({ ...j, poste: v === "aucun" ? "" : v }))
              }
            >
              <SelectTrigger aria-label="Poste souhaité">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucun">Non précisé</SelectItem>
                {POSTES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {POSTE_LABEL[code] ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <Champ
            label="Niveau / parcours"
            value={joueur.niveau ?? ""}
            placeholder="Première licence, déjà licencié…"
            onChange={(v) => setJoueur((j) => ({ ...j, niveau: v }))}
          />
        </div>

        <Button
          disabled={!joueur.prenom.trim() || !joueur.nom.trim()}
          onClick={() =>
            soumettre(
              pourEnfant ? "parent" : "joueur",
              joueur,
              pourEnfant ? parent : undefined,
            )
          }
        >
          Envoyer la demande
        </Button>
      </Cadre>
    )
  }

  /* ── 7. Waiting / decision ──────────────────────────────────────────── */
  const statut = demande?.statut ?? "en-attente"
  return (
    <Cadre
      titre={
        statut === "approuvee"
          ? "Demande approuvée"
          : statut === "refusee"
            ? "Demande refusée"
            : "En attente de validation"
      }
      sousTitre={sousTitre}
    >
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border p-4",
          statut === "approuvee"
            ? "border-success/30 bg-success/5"
            : statut === "refusee"
              ? "border-danger/30 bg-danger/5"
              : "border-border",
        )}
      >
        {statut === "approuvee" ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
        ) : statut === "refusee" ? (
          <XCircle size={18} className="mt-0.5 shrink-0 text-danger" />
        ) : (
          <Clock size={18} className="mt-0.5 shrink-0 text-ink-muted" />
        )}
        <p className="font-body text-sm text-ink-muted">
          {statut === "approuvee" ? (
            <>
              L'éducateur a validé votre demande.{" "}
              <span className="text-ink">
                {demande?.joueur.prenom} {demande?.joueur.nom}
              </span>{" "}
              fait maintenant partie de {categorie.nom}.
            </>
          ) : statut === "refusee" ? (
            <>
              {demande?.motif ??
                "L'éducateur n'a pas retenu cette demande pour le moment."}
            </>
          ) : (
            <>
              Votre demande a été envoyée à l'éducateur de {categorie.nom}. Vous
              recevrez une notification dès qu'elle sera traitée.
            </>
          )}
        </p>
      </div>

      {statut === "refusee" ? (
        <Button variant="outline">
          <MessageSquare /> Contacter l'éducateur
        </Button>
      ) : null}

      <p className="font-body text-[0.78rem] text-ink-disabled">
        Demande envoyée le {demande?.soumiseLe} · {categorie.nom}
      </p>

      <Button variant="ghost" onClick={() => navigate("/connexion")}>
        Aller à l'espace iSmart Club
      </Button>
    </Cadre>
  )
}

/* ── Bits ─────────────────────────────────────────────────────────────────── */

/** The one card the whole parcours lives in — centred, no shell around it. */
function Cadre({
  titre,
  sousTitre,
  onRetour,
  children,
}: {
  titre: string
  sousTitre: string
  onRetour?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary font-ui text-[0.82rem] font-bold text-ink-inverted">
            iS
          </span>
          <span className="min-w-0">
            <span className="block font-ui text-[0.86rem] font-medium text-ink">
              iSmart Club
            </span>
            <span className="block font-body text-[0.72rem] text-ink-disabled">
              Inscription
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {onRetour ? (
            <button
              type="button"
              onClick={onRetour}
              className="mb-1 inline-flex items-center gap-1.5 self-start font-ui text-[0.74rem] text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft size={13} /> Retour
            </button>
          ) : null}
          <h1 className="font-ui text-xl font-semibold text-ink">{titre}</h1>
          {sousTitre ? (
            <p className="font-body text-[0.82rem] text-ink-muted">
              {sousTitre}
            </p>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  )
}

function Choix({
  icon: Icon,
  titre,
  aide,
  onClick,
}: {
  icon: typeof Mail
  titre: string
  aide: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-border-strong"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-ui text-[0.92rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
          {titre}
        </span>
        <span className="block font-body text-[0.78rem] text-ink-muted">
          {aide}
        </span>
      </span>
    </button>
  )
}

function Champ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelCls}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldCls}
      />
    </label>
  )
}
