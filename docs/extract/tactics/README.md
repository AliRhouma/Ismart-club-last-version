# Procédés (`/dashboard/tactics`) — extraction

Source: `https://pprod.ismart-club.com/dashboard/tactics`
Backend: `https://pprodback.ismart-club.com` (REST, `Authorization: Bearer <JWT>`)
Extracted: 2026-07-31 · club/team `fb4200ec-d401-4dfb-b6e6-9b2d71522bae`

## Endpoints the screen calls

| Endpoint | Role |
| --- | --- |
| `GET /tactical-phases?excludeTypes=DIVERSE,ATTACHEMENT` | The left rail: groups → phases → principles (with `_count.tactics`) |
| `GET /categories?` | The "Catégories" filter |
| `GET /tactics/search?pr=<principleId>&ph=<phaseId>&type=game&type=situation&type=exercice&title=&createdBy=` | The card grid. **Returns `[]` with no `pr`** — a principle must be selected, which is why the page opens on "Pas des procédés trouvés". |
| `GET /teams/members?withAdmins=true&withTrainers=true` | The "Crée par" filter |

Filter state lives in the URL query string (`pr`, `ph`, `type`, `title`, `createdBy`).

## Taxonomy (3 groups → 7 phases → 24 principles)

**On a le ballon** (`PRINCIPLE`)
- Conserver - Progresser — Créer et utiliser des espaces (84), Jouer dans les intervalles et entres les lignes (33)
- Déséquilibrer - Finir — Jouer à l'opposé après avoir fixé collectivement (22), Jouer combiné pour créer un surnombre (42), Se démarquer pour fixer et éliminer, passer ou finir (54)

**On n'a pas le ballon** (`PRINCIPLE`)
- S'opposer à la progression — Freiner la progression de l'adversaire, organiser et reorganiser les alignements (57)
- S'organiser pour protéger son but — Densifier et être actif dans le CJD (19), S'organiser en desequilibre (31), Défendre son but, récupérer ou dégager le ballon (22)

**Procédés complémentaires** (`COMPLEMENTARY`)
- Exercices spécifiques — Finition (21), Gardien de but (0), Techniques Défensives (2), Prises de balle (2), Dribbles (2)
- Préparation athlétique — Endurance (14), Vitesse (3), Coordination motrice (3)
- Divers — Exercices d'echauffements (58), Jeux d'éveil (18), Jonglage (2), Coups de pieds arrêtés (6), Cohésion (7), Evaluation (14)

Every principle carries a `color` hex used as its badge (`#1E3A8A`, `#0060FD`, `#EF4444`, `#EA580C`…).

**516 unique procédés** — 256 `game` (Jeu), 191 `exercice` (Exercice), 69 `situation` (Situation).

## Shape of one procédé

```jsonc
{
  "id": "uuid",
  "title": "Sortie de balle - Situation 6vs6 + GDB",
  "type": "game | situation | exercice",
  "tacticalPhaseId": "uuid", "tacticalPrincipleId": "uuid",
  "tacticalPhase": { … }, "tacticalPrinciple": { …, "color": "#1E3A8A" },
  "teamId": "uuid", "createdById": "uuid", "isPublic": false,
  "programSessionId": null,          // set when the procédé belongs to a séance
  "surface": [50, 50],               // [largeur, longueur] en m
  "squad": [12, 1],                  // [joueurs, gardiens]
  "duration": "10", "recuperation": "30", "sequence": "10*1",
  "materials": [{ "amount": 12, "equipment": "/things/equipments/general/02.svg" }],
  "preview": "https://…/tactics/image-….png",   // still of the tactic board
  "previewVideo": "https://…/tactic-preview-….webm",  // animated version, often null
  "translations": {}, "sourceLanguage": "fr",
  "originalTacticId": null, "originalTeamId": null,   // set on a duplicated/imported procédé
  "createdAt": "…", "updatedAt": "…",
  "fields": [ { "id": "49d2f424", "title": "Objectif", "content": "<p>…</p>" } ]
}
```

`fields[]` is a free-form ordered list of rich-text (HTML) sections — it is not a fixed
schema, and the titles are inconsistent across records (two naming waves: lowercase
`objectif`/`buts`/`consignes`/`comportement individuel`/`comportement collectif`/`variables`/
`transition` on ~273 records, capitalised `Objectif`/`But(s)`/`Organisation`/`Consignes`/
`Comportements Attendus Collectif`/`Comportements attendus Individuels`/`Variables` on ~240–270,
plus `Critères de réalisation` on 87 and a handful of one-off titles on the évaluation records).

## Files

- `tactical-phases.json` — raw taxonomy response (groups → phases → principles + counts)
- `tree.json` — flattened taxonomy with per-principle tactic counts
- `tactics-full.json` — all 516 procédés, raw API records (7.7 MB)
- `tactics-slim.json` — same 516, HTML stripped from `fields[].content` (1.1 MB)
