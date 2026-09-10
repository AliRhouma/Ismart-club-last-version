import { useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  Mail,
  Loader2,
  MessageSquare,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  CLUB_NOM,
  type FicheJoueur,
  type FicheParent,
} from "@/data/seed/inscriptions"
import { POSTES, POSTE_LABEL } from "@/data/seed/categories"
import { SAISON_ACTIVE } from "@/data/seed/programmation"
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
 * An account already on the platform. Its kind is a property of the account,
 * not a question — signing in as Nadia says "parent" as surely as signing in
 * as Firas says "joueur", so the parcours never asks again.
 *
 * Two of them, because the demo needs one of each; a real sign-in would resolve
 * the same shape from the credentials.
 */
type Compte = {
  email: string
  /** "Mme" / "M." — the invitation addresses a person, not a row. */
  civilite: string
  nom: string
  role: "joueur" | "parent"
  /** Joueurs only — their fiche is already known, so the form opens filled. */
  fiche?: FicheJoueur
}

const COMPTE_PARENT: Compte = {
  email: "nadia.khemiri@example.com",
  civilite: "Mme",
  nom: "Nadia Khemiri",
  role: "parent",
}

const COMPTE_JOUEUR: Compte = {
  email: "firas.zouari@example.com",
  civilite: "M.",
  nom: "Firas Zouari",
  role: "joueur",
  fiche: {
    prenom: "Firas",
    nom: "Zouari",
    naissance: "2011-05-22",
    genre: "Masculin",
    email: "firas.zouari@example.com",
    telephone: "+216 20 559 174",
    poste: "DC",
    niveau: "Trois saisons en U13 puis U15",
  },
}

const COMPTES = [COMPTE_PARENT, COMPTE_JOUEUR]

/**
 * `?flow=` — the four entry points the éducateur can hand out to try a path
 * without walking the first two screens. It only picks the starting step and
 * whether the visitor is signed in; the rest of the parcours is unchanged.
 */
const DEPARTS: Record<string, { etape: Etape; compte: Compte | null }> = {
  "joueur-nouveau": { etape: "fiche-joueur", compte: null },
  "joueur-compte": { etape: "fiche-joueur", compte: COMPTE_JOUEUR },
  "parent-nouveau": { etape: "fiche-parent", compte: null },
  "parent-compte": { etape: "enfants", compte: COMPTE_PARENT },
}

/**
 * A row of the child picker. A parent who already has an account arrives with
 * the children attached to it; one who has just created his account arrives
 * with none and fills the list himself — same screen either way, which is what
 * makes "l'enfant n'a pas encore de fiche" a step and not a different path.
 */
type EnfantChoix = FicheJoueur & { id: string }

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

/**
 * A child's fiche opens filled in, on an address the club already has on file:
 * submitting it is what surfaces the "email déjà utilisé" refusal, which is the
 * case worth showing — the answer is to have the club link the existing joueur
 * rather than create a second one.
 */
const ficheEnfantParDefaut: FicheJoueur = {
  prenom: "Mehdi",
  nom: "Sassi",
  naissance: "2013-11-02",
  genre: "Masculin",
  email: "rayan.belkacem@example.com",
  telephone: "",
  adresse: "12 rue de Carthage",
  ville: "Tunis",
  poste: "GB",
  niveau: "",
}

const ficheParentVide: FicheParent = {
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
}

/** "2016-03-11" → 10, on the day the birthday falls, not on 1 January. */
function ageDe(naissance: string): number | null {
  const [a, m, j] = naissance.split("-").map(Number)
  if (!a || !m || !j) return null
  const today = new Date()
  let age = today.getFullYear() - a
  // Counted on the birthday, not on 1 January: a joueur born in December is
  // still the younger age until December.
  const passe =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= j)
  if (!passe) age -= 1
  return age >= 0 ? age : null
}

/** A fact picked out of a muted sentence — the invitation's one emphasis. */
function Fort({ children }: { children: React.ReactNode }) {
  return <span className="font-ui font-medium text-ink">{children}</span>
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
    signInAsParent,
  } = useData()

  const lien = liensInscription.find((l) => l.token === token)
  const categorie = categories.find((c) => c.id === lien?.categorieId)

  const [etape, setEtape] = useState<Etape>(depart?.etape ?? "accueil")
  /** Signed-in account, or null while the visitor is still a stranger. */
  const [compte, setCompte] = useState<Compte | null>(depart?.compte ?? null)
  const connecte = !!compte
  const [joueur, setJoueur] = useState<FicheJoueur>(
    depart?.compte?.fiche ?? ficheJoueurVide,
  )
  const [parent, setParent] = useState<FicheParent>(ficheParentVide)
  const [enfantId, setEnfantId] = useState<string | null>(null)
  /** Fiches created during this parcours — rattachées au compte à la volée. */
  const [enfantsAjoutes, setEnfantsAjoutes] = useState<EnfantChoix[]>([])
  const [demandeId, setDemandeId] = useState<string | null>(null)
  /**
   * The message shown while moving to the next step. A parcours that jumps
   * instantly reads as one long form; a short beat — with copy saying what is
   * happening — makes each step land as its own moment. Going *back* stays
   * instant: nothing is being done, you are just returning.
   */
  const [chargement, setChargement] = useState<string | null>(null)
  const allerA = (suivante: Etape, message: string) => {
    setChargement(message)
    setTimeout(() => {
      setEtape(suivante)
      setChargement(null)
    }, 700)
  }

  /** Back to square one — identity included. */
  const retourAccueil = () => {
    setCompte(null)
    setEmail("")
    setErreur(false)
    setEtape("accueil")
  }

  /** Raised when an add is refused because the email belongs to someone. */
  const [emailRefuse, setEmailRefuse] = useState(false)

  const [email, setEmail] = useState("")
  const [erreur, setErreur] = useState(false)

  // An expired or wrong link says so plainly rather than 404-ing.
  if (!lien || !lien.actif || !categorie)
    return (
      <Cadre titre="Lien indisponible">
        <p className="font-body text-sm text-ink-muted">
          Ce lien d'inscription n'existe plus ou a été désactivé par
          l'éducateur. Demandez-lui de vous en envoyer un nouveau.
        </p>
      </Cadre>
    )

  if (chargement)
    return (
      <Cadre titre="">
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 size={22} className="animate-spin text-info" />
          <p className="font-body text-[0.86rem] text-ink-muted">{chargement}</p>
        </div>
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
    allerA("attente", "Envoi de votre demande…")
  }

  // A brand-new account has nothing attached to it yet: only a parent who
  // signed in brings the children the club already knows.
  const enfants: EnfantChoix[] = [
    ...(connecte
      ? parentEnfants.map((e) => {
          const [prenom, ...reste] = e.nom.split(" ")
          return {
            id: e.id,
            prenom,
            nom: reste.join(" "),
            naissance: e.naissance,
            genre: "Masculin" as const,
            poste: e.poste,
            joueurId: e.id,
          }
        })
      : []),
    ...enfantsAjoutes,
  ]

  const educateur = categorie.educateurs[0] ?? "L'éducateur"

  /**
   * Addresses the club already has: the accounts, and everyone written on a
   * demande. Typing one of them means the person exists somewhere — the club
   * has to link him, not duplicate him.
   */
  const emailsConnus = new Set(
    [
      ...COMPTES.map((c) => c.email),
      ...demandesInscription.flatMap((d) =>
        [d.joueur.email, d.parent?.email].filter((e): e is string => !!e),
      ),
    ].map((e) => e.toLowerCase()),
  )

  /**
   * The invitation, in the words a family would actually read: who they are,
   * who invited them, to what, and where. The wording follows the account —
   * a parent registers a child, a joueur joins himself.
   */
  const invitation = compte
    ? {
        salutation: `Bonjour ${compte.civilite} ${compte.nom}`,
        texte: (
          <>
            <Fort>{educateur}</Fort> vous invite à{" "}
            {compte.role === "parent"
              ? "inscrire votre enfant dans son équipe"
              : "rejoindre son équipe"}{" "}
            <Fort>{categorie.nom}</Fort> du <Fort>{CLUB_NOM}</Fort>, pour la
            saison <Fort>{SAISON_ACTIVE}</Fort>.
          </>
        ),
      }
    : null

  /* ── 1. Landing ─────────────────────────────────────────────────────── */
  if (etape === "accueil")
    return (
      <Cadre titre="Vous êtes invité">
        {/* One sentence rather than a title, a subtitle and a numbered list:
            who invited you, to which team, at which club, for which season.
            The four facts are picked out of the muted line so they read at a
            glance — no card repeating them underneath. */}
        <p className="font-body text-[0.92rem] leading-relaxed text-ink-muted">
          <Fort>{educateur}</Fort> vous a envoyé ce lien pour rejoindre son
          équipe <Fort>{categorie.nom}</Fort> du <Fort>{CLUB_NOM}</Fort>, pour
          la saison <Fort>{SAISON_ACTIVE}</Fort>.
        </p>

        <div className="flex flex-col gap-2.5">
          <Choix
            icon={KeyRound}
            titre="Se connecter"
            aide="J'ai déjà un compte iSmart Club"
            onClick={() => allerA("connexion", "Un instant…")}
          />
          <Choix
            icon={UserPlus}
            titre="Créer un compte"
            aide="Je suis nouveau membre"
            onClick={() => allerA("qui", "Un instant…")}
          />
        </div>

        <p className="flex items-center gap-2 font-body text-[0.76rem] text-ink-disabled">
          <ShieldCheck size={13} className="shrink-0" />
          Votre demande sera validée par{" "}
          {categorie.educateurs[0] ?? "l'éducateur"}.
        </p>
      </Cadre>
    )

  /* ── 2. Sign in (prototype: no auth, you pick and continue) ─────────── */
  if (etape === "connexion")
    return (
      <Cadre titre="Se connecter" onRetour={retourAccueil}>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErreur(false)
            }}
            placeholder="vous@example.com"
            className={cn(fieldCls, erreur && "border-danger")}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Mot de passe</span>
          <input type="password" defaultValue="••••••••" className={fieldCls} />
        </label>

        {erreur ? (
          <p className="font-body text-[0.78rem] text-danger">
            Aucun compte ne correspond à cet email.
          </p>
        ) : null}

        {/* No auth behind this: the two demo accounts are offered openly so the
            parcours can be walked from either side. */}
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3.5">
          <span className={labelCls}>Comptes de démonstration</span>
          {COMPTES.map((c) => (
            <button
              key={c.email}
              type="button"
              onClick={() => {
                setEmail(c.email)
                setErreur(false)
              }}
              className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface-hover"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-nested text-ink-muted">
                {c.role === "parent" ? (
                  <Users size={13} />
                ) : (
                  <BadgeCheck size={13} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-ui text-[0.8rem] text-ink">
                  {c.nom}
                </span>
                <span className="block truncate font-mono text-[0.7rem] text-ink-disabled">
                  {c.email}
                </span>
              </span>
              <span className="shrink-0 font-ui text-[0.68rem] tracking-[0.06em] text-ink-disabled uppercase">
                {c.role === "parent" ? "Parent" : "Joueur"}
              </span>
            </button>
          ))}
        </div>

        <Button
          onClick={() => {
            const trouve = COMPTES.find(
              (c) => c.email.toLowerCase() === email.trim().toLowerCase(),
            )
            if (!trouve) return setErreur(true)
            setCompte(trouve)
            // The account already says what it is: a parent goes to his
            // children, a joueur to his own fiche. No role question.
            if (trouve.role === "parent")
              return allerA("enfants", "Connexion en cours…")
            setJoueur(trouve.fiche ?? ficheJoueurVide)
            allerA("fiche-joueur", "Connexion en cours…")
          }}
        >
          Se connecter
        </Button>
      </Cadre>
    )

  /* ── 4. No account: who are you? ────────────────────────────────────── */
  if (etape === "qui")
    return (
      <Cadre titre="Vous êtes ?" onRetour={retourAccueil}>
        <div className="flex flex-col gap-2.5">
          <Choix
            icon={BadgeCheck}
            titre="Joueur"
            aide="Je crée mon compte et je rejoins la catégorie"
            onClick={() => allerA("fiche-joueur", "Préparation du formulaire…")}
          />
          <Choix
            icon={Users}
            titre="Parent"
            aide="Je crée mon compte, puis la fiche de mon enfant"
            onClick={() => allerA("fiche-parent", "Préparation du formulaire…")}
          />
        </div>
      </Cadre>
    )

  /* ── 5. Parent: pick the child ──────────────────────────────────────── */
  if (etape === "enfants")
    return (
      <Cadre
        titre="Quel enfant inscrivez-vous ?"
        invitation={invitation}
        onRetour={() =>
          connecte ? retourAccueil() : setEtape("fiche-parent")
        }
      >
        {enfants.length === 0 ? (
          /* Nothing attached yet — the add is the only thing to do, so it is
             the primary action and the card says why the list is empty. */
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-surface-nested text-ink-disabled">
              <Users size={20} />
            </span>
            <span>
              <span className="block font-ui text-[0.9rem] font-medium text-ink">
                Aucun enfant rattaché
              </span>
              <span className="mt-1 block font-body text-[0.8rem] text-ink-muted">
                Créez la fiche de votre enfant : elle sera rattachée à votre
                compte, puis envoyée à l'éducateur.
              </span>
            </span>
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Vos enfants"
            className="flex flex-col gap-2"
          >
            {enfants.map((e) => (
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
                  {(e.prenom[0] ?? "") + (e.nom[0] ?? "")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-ui text-[0.88rem] text-ink">
                    {e.prenom} {e.nom}
                  </span>
                  <span className="block font-body text-[0.75rem] text-ink-muted">
                    {e.naissance
                      ? [
                          `Né le ${e.naissance.split("-").reverse().join("/")}`,
                          ageDe(e.naissance) !== null
                            ? `${ageDe(e.naissance)} ans`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "Date de naissance à compléter"}
                  </span>
                </span>
                {enfantId === e.id ? (
                  <CheckCircle2 size={16} className="shrink-0 text-info" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        <Button
          variant={enfants.length === 0 ? "default" : "outline"}
          onClick={() => {
            setJoueur(ficheEnfantParDefaut)
            allerA("fiche-enfant", "Nouvelle fiche…")
          }}
        >
          <Plus /> Ajouter un enfant
        </Button>

        {enfants.length > 0 ? (
          <Button
            disabled={!enfantId}
            onClick={() => {
              const enfant = enfants.find((e) => e.id === enfantId)
              if (!enfant) return
              // `id` belongs to the picker, not to the fiche.
              soumettre(
                "parent",
                {
                  prenom: enfant.prenom,
                  nom: enfant.nom,
                  naissance: enfant.naissance,
                  genre: enfant.genre,
                  poste: enfant.poste,
                  niveau: enfant.niveau,
                  joueurId: enfant.joueurId,
                },
                parent.prenom ? parent : undefined,
              )
            }}
          >
            Envoyer la demande
          </Button>
        ) : null}
      </Cadre>
    )

  /* ── 6. Forms ───────────────────────────────────────────────────────── */
  if (etape === "fiche-parent") {
    const complet =
      !!parent.prenom.trim() && !!parent.nom.trim() && !!parent.email.trim()

    return (
      <Cadre
        titre="Votre fiche parent"
        invitation={invitation}
        onRetour={() => setEtape("qui")}
      >
        <Bloc titre="Informations personnelles">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ
              label="Prénom"
              requis
              value={parent.prenom}
              onChange={(v) => setParent((p) => ({ ...p, prenom: v }))}
            />
            <Champ
              label="Nom"
              requis
              value={parent.nom}
              onChange={(v) => setParent((p) => ({ ...p, nom: v }))}
            />
            <Champ
              label="Email"
              requis
              type="email"
              value={parent.email}
              onChange={(v) => setParent((p) => ({ ...p, email: v }))}
            />
            <Champ
              label="Téléphone"
              value={parent.telephone}
              placeholder="+216 20 000 000"
              onChange={(v) => setParent((p) => ({ ...p, telephone: v }))}
            />
            <Champ
              label="Adresse"
              value={parent.adresse ?? ""}
              placeholder="12 rue de Carthage"
              onChange={(v) => setParent((p) => ({ ...p, adresse: v }))}
            />
            <Champ
              label="Ville"
              value={parent.ville ?? ""}
              placeholder="Tunis"
              onChange={(v) => setParent((p) => ({ ...p, ville: v }))}
            />

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Date de naissance</span>
              <input
                type="date"
                value={parent.naissance ?? ""}
                onChange={(e) =>
                  setParent((p) => ({ ...p, naissance: e.target.value }))
                }
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>
                Genre <Etoile />
              </span>
              <Select
                value={parent.genre ?? "Père"}
                onValueChange={(v) =>
                  setParent((p) => ({
                    ...p,
                    genre: v as FicheParent["genre"],
                  }))
                }
              >
                <SelectTrigger aria-label="Genre">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Père">Père</SelectItem>
                  <SelectItem value="Mère">Mère</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </Bloc>

        <p className="font-body text-[0.74rem] text-ink-disabled">
          <Etoile /> Champs obligatoires.
        </p>

        <Button
          disabled={!complet}
          onClick={() => allerA("enfants", "Création de votre compte…")}
        >
          Créer mon compte
        </Button>
      </Cadre>
    )
  }

  if (etape === "fiche-joueur" || etape === "fiche-enfant") {
    const pourEnfant = etape === "fiche-enfant"
    // A joueur signing up alone must be reachable; a child's email is
    // optional, since his parent's contact is already on the account.
    const emailRequis = !pourEnfant
    const emailPris =
      !!joueur.email?.trim() &&
      emailsConnus.has(joueur.email.trim().toLowerCase())
    const complet =
      !!joueur.prenom.trim() &&
      !!joueur.nom.trim() &&
      !!joueur.naissance &&
      !!joueur.poste &&
      (!emailRequis || !!joueur.email?.trim())

    return (
      <Cadre
        titre={pourEnfant ? "Fiche de votre enfant" : "Votre fiche joueur"}
        invitation={
          pourEnfant
            ? {
                salutation: "Remplir la fiche de l'enfant",
                texte:
                  "Ces informations l'ajoutent à votre compte ; vous l'inscrirez ensuite à l'équipe.",
              }
            : invitation
        }
        onRetour={() =>
          pourEnfant
            ? setEtape("enfants")
            : connecte
              ? retourAccueil()
              : setEtape("qui")
        }
      >
        <Bloc titre="Informations personnelles">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ
              label="Prénom"
              requis
              value={joueur.prenom}
              onChange={(v) => setJoueur((j) => ({ ...j, prenom: v }))}
            />
            <Champ
              label="Nom"
              requis
              value={joueur.nom}
              onChange={(v) => setJoueur((j) => ({ ...j, nom: v }))}
            />

            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>
                Date de naissance <Etoile />
              </span>
              <input
                type="date"
                value={joueur.naissance}
                aria-required
                onChange={(e) =>
                  setJoueur((j) => ({ ...j, naissance: e.target.value }))
                }
                className={fieldCls}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>
                Sexe <Etoile />
              </span>
              <Select
                value={joueur.genre}
                onValueChange={(v) =>
                  setJoueur((j) => ({ ...j, genre: v as FicheJoueur["genre"] }))
                }
              >
                <SelectTrigger aria-label="Sexe">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculin">Masculin</SelectItem>
                  <SelectItem value="Féminin">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </label>

            {/* Derived from the date, never typed: two fields that can disagree
                are two fields that will. */}
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Âge</span>
              <input
                readOnly
                value={
                  joueur.naissance && ageDe(joueur.naissance) !== null
                    ? `${ageDe(joueur.naissance)} ans`
                    : ""
                }
                placeholder="—"
                aria-label="Âge"
                className={cn(fieldCls, "text-ink-muted")}
              />
            </label>

            <Champ
              label="Email"
              requis={emailRequis}
              type="email"
              value={joueur.email ?? ""}
              placeholder={pourEnfant ? "Facultatif" : undefined}
              onChange={(v) => {
                setEmailRefuse(false)
                setJoueur((j) => ({ ...j, email: v }))
              }}
            />
            {pourEnfant ? null : (
              <Champ
                label="Téléphone"
                value={joueur.telephone ?? ""}
                placeholder="+216 20 000 000"
                onChange={(v) => setJoueur((j) => ({ ...j, telephone: v }))}
              />
            )}

            <Champ
              label="Adresse"
              value={joueur.adresse ?? ""}
              placeholder="12 rue de Carthage"
              onChange={(v) => setJoueur((j) => ({ ...j, adresse: v }))}
            />
            <Champ
              label="Ville"
              value={joueur.ville ?? ""}
              placeholder="Tunis"
              onChange={(v) => setJoueur((j) => ({ ...j, ville: v }))}
            />
          </div>
        </Bloc>

        <Bloc titre="Informations du joueur">
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>
              Poste <Etoile />
            </span>
            <Select
              value={joueur.poste || ""}
              onValueChange={(v) => setJoueur((j) => ({ ...j, poste: v }))}
            >
              <SelectTrigger aria-label="Poste">
                <SelectValue placeholder="Sélectionner un poste" />
              </SelectTrigger>
              <SelectContent>
                {POSTES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {POSTE_LABEL[code] ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </Bloc>

        {pourEnfant && emailRefuse ? (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-3"
          >
            <AlertTriangle
              size={15}
              className="mt-0.5 shrink-0 text-danger"
              aria-hidden
            />
            <span className="font-body text-[0.8rem] text-ink-muted">
              <span className="text-ink">Cet email est déjà utilisé.</span>{" "}
              Contactez l'administration du club pour rattacher votre enfant à
              votre compte, plutôt que de créer une seconde fiche.
            </span>
          </p>
        ) : null}

        <p className="font-body text-[0.74rem] text-ink-disabled">
          <Etoile /> Champs obligatoires.
        </p>

        <Button
          disabled={!complet}
          onClick={() => {
            // A child's fiche is attached to the account first; the demande is
            // sent from the picker, once he is selected — as in the spec.
            if (pourEnfant) {
              // The club already knows this address: adding here would create a
              // second fiche for someone it can simply attach.
              if (emailPris) return setEmailRefuse(true)
              const id = crypto.randomUUID()
              setEnfantsAjoutes((prev) => [...prev, { ...joueur, id }])
              setEnfantId(id)
              allerA("enfants", "Rattachement de l'enfant…")
              return
            }
            soumettre("joueur", joueur)
          }}
        >
          {pourEnfant ? "Ajouter l'enfant" : "Envoyer la demande"}
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

      <Button
        variant="ghost"
        onClick={() => {
          if (compte?.role !== "parent") return navigate("/connexion")
          signInAsParent()
          navigate("/parent")
        }}
      >
        {compte?.role === "parent"
          ? "Aller à mon espace parent"
          : "Aller à l'espace iSmart Club"}
      </Button>
    </Cadre>
  )
}

/* ── Bits ─────────────────────────────────────────────────────────────────── */

/**
 * The one card the whole parcours lives in — centred, no shell around it.
 * It carries two things every screen needs: who is asking (the club), and
 * where you are in the request (the step rail). Without those the screens read
 * as unrelated forms.
 */
function Cadre({
  titre,
  invitation,
  onRetour,
  children,
}: {
  titre: string
  /** Shown once signed in: who is addressed, and what they are invited to. */
  invitation?: { salutation: string; texte: React.ReactNode } | null
  onRetour?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:p-8">
        {/* Brand bar: the mark centred and large — this card is the club's
            front door for a family who has never seen the product. The back
            button floats at the top-left so it never pushes the logo off axis. */}
        <div className="relative flex flex-col items-center gap-3 border-b border-border pt-1 pb-5 text-center">
          {onRetour ? (
            <button
              type="button"
              onClick={onRetour}
              aria-label="Retour"
              title="Retour"
              className="absolute top-0 left-0 inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink focus:border-border-focus"
            >
              <ArrowLeft size={16} />
            </button>
          ) : null}

          {/* The one place green and bold are intentional (design system §logo),
              and the one raised surface here worth the brand glow. */}
          <span className="shadow-glow flex size-16 items-center justify-center rounded-xl bg-primary font-ui text-2xl font-bold text-ink-inverted">
            iS
          </span>
          <span>
            <span className="block font-ui text-lg font-semibold text-ink">
              iSmart Club
            </span>
            <span className="mt-0.5 block font-body text-[0.78rem] text-ink-muted">
              Demande d'inscription à une catégorie
            </span>
          </span>
        </div>

        {invitation ? (
          <div className="flex flex-col gap-1.5">
            <p className="font-ui text-[0.95rem] font-medium text-ink">
              {invitation.salutation}
            </p>
            <p className="font-body text-[0.92rem] leading-relaxed text-ink-muted">
              {invitation.texte}
            </p>
          </div>
        ) : null}

        {titre ? (
        <div className="flex flex-col gap-1.5">
          <h1 className="font-ui text-xl font-semibold text-ink">{titre}</h1>
        </div>
        ) : null}

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

/**
 * The one mark the form uses to say a field cannot be left empty. Hidden from
 * assistive tech: the field is called "Nom", not "Nom étoile" — `aria-required`
 * on the input is what actually carries the obligation.
 */
function Etoile() {
  return (
    <span aria-hidden className="text-danger">
      *
    </span>
  )
}

/** A titled group of fields — the fiche is long enough to need sections. */
function Bloc({
  titre,
  children,
}: {
  titre: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="border-b border-border pb-2 font-ui text-[0.9rem] font-medium text-ink">
        {titre}
      </h2>
      {children}
    </section>
  )
}

function Champ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  requis,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  requis?: boolean
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelCls}>
        {label} {requis ? <Etoile /> : null}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-required={requis || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={fieldCls}
      />
    </label>
  )
}
