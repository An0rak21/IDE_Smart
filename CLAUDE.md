# CLAUDE.md — IDE Smart (nom provisoire : PharmaIDE)

Plateforme de révision en pharmacologie pour étudiants en soins infirmiers (IFSI).
Porteur et relecteur scientifique : Sébastien, ancien formateur en pharmacologie en IFSI.

## Stack
Next.js 16 (App Router, `src/proxy.ts` à la place de middleware), TypeScript strict,
Tailwind CSS 4 (tokens dans `src/app/globals.css`), Supabase (auth + Postgres + RLS),
Stripe (abonnements), Vercel (région cdg1). Tests : Vitest.

## Commandes
- `npm run dev` : serveur local
- `npm run build` : build de production (doit passer avant tout commit)
- `npm test` : tests Vitest (doivent passer)
- `npx tsc --noEmit` : vérification des types
- `npm run content:check` : validation du contenu pédagogique

## Règles non négociables
1. **Exactitude pharmacologique.** Ne jamais modifier une dose, une présentation, une formule,
   un arrondi ou une tolérance dans `src/lib/doses/` sans le signaler explicitement dans le
   résumé de la tâche : Sébastien doit valider. Tout changement est couvert par un test.
2. **Les réponses ne partent jamais vers le navigateur avant la correction.** Le moteur
   `src/lib/doses/` et le client admin ne sont importés que côté serveur (Server Components,
   Server Actions, Route Handlers). Les composants client ne reçoivent que `PublicExercise`.
3. **Écritures de progression côté serveur** avec `createAdminClient()` après vérification
   de l'utilisateur via `createClient().auth.getUser()`. Jamais d'écriture directe depuis le client.
4. **RLS partout.** Toute nouvelle table : RLS activée + politiques dans une nouvelle migration
   `supabase/migrations/000N_*.sql`. Ne jamais modifier une migration déjà appliquée.
5. **Secrets** : `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_*` uniquement côté serveur.

## Accès gratuit / premium
`getAccount()` (`src/lib/account.ts`) renvoie `{ user, profile, subscription, premium }`.
Toujours vérifier `premium` côté serveur pour les limites (jamais seulement dans l'UI).
Limites de l'offre gratuite : voir `docs/sprint2-calculs-de-doses.md`.

## Interface
- Tout le texte visible est en **français**, casse de phrase (pas de Title Case, pas de MAJUSCULES),
  apostrophe typographique ’ dans le JSX, espace insécable avant les unités (`2\u00a0ml/h`).
- Nombres affichés avec `fr()` de `src/lib/doses/format.ts` (virgule décimale).
- Classes utilitaires existantes : `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.field`.
  Couleurs : `ink`, `ink-soft`, `teal`, `teal-deep`, `mint`, `mint-line`, `paper`, `signal`, `alert`, `ok`.
- Mobile d'abord (usage majoritaire sur téléphone). Champs numériques : `inputMode="decimal"`.
- Accessibilité : labels explicites, `role="status"`/`aria-live` pour les retours, focus visible,
  pas d'information portée par la couleur seule.
- Messages d'erreur : dire ce qui s'est passé et quoi faire, sans jargon ni excuses.

## Structure
- `src/app/(app)/` : pages connectées (layout = garde d'authentification)
- `src/app/api/` : Stripe, export et suppression de compte
- `src/lib/` : `account.ts`, `site.ts` (nom, prix, mention TVA), `stripe*.ts`, `supabase/`, `doses/`
- `supabase/migrations/` : schéma et RLS
- `content/` : contenu pédagogique (voir `docs/format-contenu.md`). Ne jamais modifier le
  contenu médical sans le signaler : Sébastien relit tout ; ce que Claude rédige reste `brouillon`.
- `docs/` : spécifications des sprints
