# Sprint 3 — Affichage des modules et moteur de QCM

Lire `CLAUDE.md` et `docs/format-contenu.md` avant de commencer. Le format de contenu,
le chargeur (`src/lib/content/`), l'importeur et un exemple réel (module Cardiologie :
2 leçons, 1 fiche, 8 questions) sont **déjà écrits et testés**. Ce sprint les branche au site.

## 0. Préparation
- Dépendances : `npm i yaml zod @mdx-js/mdx remark-gfm` et `npm i -D tsx`.
- Scripts `package.json` :
  - `"content:check": "tsx scripts/validate-content.ts"`
  - `"content:import": "tsx --env-file=.env.local scripts/import-content.ts"`
- Appliquer `supabase/migrations/0003_content_import.sql`.
- `npm test` et `npm run content:check` passent. Puis `npm run content:import` (en brouillon, rien n'est publié).
- CI simple (GitHub Actions) : `npm ci`, `npm test`, `npm run content:check`, `npx tsc --noEmit` sur chaque push.

## 1. Rendu MDX (serveur uniquement)
- `src/lib/content/render.tsx` : compiler le corps des leçons avec `@mdx-js/mdx` (`evaluate`,
  `remarkPlugins: [remarkGfm]`, runtime `react/jsx-runtime`) dans un Server Component.
- Le contenu est lu depuis le disque au build : les pages de leçons et de fiches sont statiques
  (`generateStaticParams`) ; seul le contrôle d'accès est dynamique.
- Composants MDX (dans `src/components/content/`) :
  - `ARetenir` : fond `mint`, titre « À retenir ».
  - `Attention` : bordure `alert`, titre « Attention », icône non décorative avec texte.
  - `RoleInfirmier` : bloc en colonnes (Avant / Pendant / Éducation) sur desktop, empilé sur mobile.
  - `Verifier` : Server Component qui charge les questions publiées par `ref` (sans
    `is_correct` ni `explanation`) et rend un composant client ; correction via la Server
    Action du moteur de QCM (§3). Non connecté : invite à créer un compte.
  - Tableaux : conteneur `overflow-x-auto`, première colonne en `th scope="row"`.

## 2. Pages
| Route | Accès | Contenu |
| --- | --- | --- |
| `/modules` | public | Catalogue par semestre (modules publiés) |
| `/modules/[slug]` | public | Description, leçons (durée, gratuit/premium), fiches, entrée QCM |
| `/modules/[slug]/[lecon]` | leçon `free` : compte gratuit ; sinon premium | Objectifs, corps MDX, navigation précédente/suivante |
| `/fiches/[slug]` | public, sans compte (SEO) | Fiche structurée ; bouton « Imprimer / PDF » réservé au premium (feuille de style `@media print`) |
| `/modules/[slug]/qcm` | compte | Choix du mode et du nombre de questions |
| `/qcm/[attemptId]` | propriétaire de la tentative | Déroulé de la série |

- Leçon premium vue par un non-abonné : titre, objectifs, 2 premiers paragraphes, puis encart
  vers `/tarifs` (pas de contenu complet dans le HTML).
- **Brouillons** : un contenu `brouillon` n'est visible que pour `isAdminEmail()`, avec un bandeau
  jaune « Brouillon, non publié ». C'est l'outil de relecture de Sébastien. Pour les pages
  statiques, les brouillons ne sont pas générés : les servir dynamiquement aux admins.
- Liens depuis `/espace` (modules publiés) et depuis l'en-tête (« Modules »).

## 3. Moteur de QCM (`src/app/(app)/qcm/actions.ts` + `src/lib/qcm/`)
Migration `0004` : ajouter `question_ids uuid[] not null default '{}'` à `quiz_attempts`.

- `startAttempt(moduleSlug, mode: "training" | "exam", count: 10 | 20)` :
  questions publiées du module ; non premium → uniquement `is_free`, et mode examen interdit ;
  tirage aléatoire sans doublon (si moins de questions que demandé, prendre tout) ;
  insérer `quiz_attempts` avec `question_ids` et `question_count`. Rediriger vers `/qcm/[id]`.
- `answerQuestion(attemptId, questionId, optionIds: string[])` :
  vérifier propriétaire, question appartenant à la tentative, pas déjà répondue, tentative non terminée.
  Correction **tout ou rien** : juste si l'ensemble choisi = l'ensemble des bonnes options.
  Enregistrer `attempt_answers` (avec `question_version`). Entraînement : renvoyer `correct`,
  ids des bonnes options, `explanation`, `lesson_slug`. Examen : ne rien renvoyer d'autre que « enregistré ».
- `finishAttempt(attemptId)` : score = % de réponses justes sur `question_count` (non répondues = fausses),
  `finished_at`. Examen : afficher alors toutes les corrections.
- Série « Mes erreurs » (premium) : questions dont la dernière réponse de l'utilisateur est fausse,
  tous modules confondus, depuis `/espace`.
- Examen : minuteur de 1 min 30 par question, affiché, qui termine la série à zéro.
- Après chaque correction : lien « Revoir la leçon » et bouton « Signaler une erreur »
  (formulaire court → `question_reports`).
- Page `/admin/signalements` : liste, lien vers la question (`ref` + fichier), statut
  `open` / `fixed` / `rejected`.

## 4. Interface du QCM
- Une question par écran sur mobile ; barre de progression « 3 / 10 ».
- `single`, `true_false`, `case` : boutons radio dans un `fieldset` + `legend` ; `multiple` :
  cases à cocher avec la mention « Plusieurs réponses possibles ».
- `case` : le `context` s'affiche au-dessus, dans le style étiquette.
- Retour en entraînement : options justes en `ok`, option fausse choisie en `alert`, avec texte
  « Bonne réponse » / « Votre réponse » (pas la couleur seule), puis l'explication.
- Écran de fin : score, temps, liste des questions ratées avec lien vers la leçon.

## 5. Tests à ajouter
- Correction tout ou rien (`multiple` avec une option en trop, une en moins).
- Tirage : jamais de question non gratuite pour un non-abonné ; pas de doublon.
- Calcul du score avec questions non répondues.

## 6. Critères d'acceptation
- `npm test`, `npm run content:check`, `npx tsc --noEmit`, `npm run build` passent.
- `is_correct` et `explanation` n'apparaissent dans aucune réponse réseau avant la réponse
  (entraînement) ou la fin de série (examen).
- Un non-abonné ne peut ni lancer un examen ni accéder à une question premium, même en
  appelant les actions directement.
- Les brouillons sont invisibles pour un compte non admin.
- Parcours complet au clavier et sur 360 px.
