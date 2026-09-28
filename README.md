# IDE Smart

Plateforme de révision en pharmacologie pour les étudiants en soins infirmiers.
Ce dépôt contient le **sprint 1 : l'infrastructure**, sans contenu pédagogique.

Ce qui fonctionne :

- landing, tarifs, pages légales (modèles à compléter), page 404 ;
- inscription et connexion par lien magique (e-mail) ou Google, sans mot de passe ;
- espace étudiant (progression, modules, offre) et page compte (profil, abonnement, export RGPD, suppression) ;
- abonnement Stripe mensuel et annuel, essai de 7 jours sans carte, portail client, webhook de synchronisation ;
- page `/admin` de suivi des inscrits et des abonnés ;
- schéma de base complet (contenus, QCM, progression, calculs) avec Row Level Security.

Stack : Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Supabase, Stripe, Vercel.

---

## 1. Supabase

1. Créer un projet sur supabase.com, **région Paris (eu-west-3)** ou Francfort.
2. **SQL Editor** : coller et exécuter `supabase/migrations/0001_init.sql`
   (ou `supabase link` puis `supabase db push` avec la CLI).
3. **Authentication > URL Configuration**
   - Site URL : `https://votre-domaine.fr` (en local : `http://localhost:3000`)
   - Redirect URLs : `http://localhost:3000/**` et `https://votre-domaine.fr/**`
4. **Authentication > Email Templates > Magic Link** : remplacer le lien par
   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">Se connecter</a>
   ```
   Faire de même dans le modèle **Confirm signup** (même lien, `type=email`).
   Ce format permet d'ouvrir le lien sur un autre appareil que celui qui l'a demandé.
5. **Authentication > Providers > Google** : activer, puis créer un identifiant OAuth
   « Application Web » dans Google Cloud Console avec comme URI de redirection :
   `https://<ref-du-projet>.supabase.co/auth/v1/callback`.
6. **Authentication > SMTP** : brancher un vrai service d'envoi (Resend, Brevo…).
   L'envoi intégré de Supabase est limité à quelques e-mails par heure, insuffisant en production.
7. Récupérer dans **Project Settings > API** : l'URL, la clé `anon` et la clé `service_role`.

> Le plan gratuit de Supabase met le projet en pause après une semaine sans activité.
> Prévoir le plan payant avant l'ouverture aux étudiants.

## 2. Stripe

1. **Produits** : créer un produit « Premium » avec deux prix récurrents en EUR :
   2,99 €/mois et 19,90 €/an (prix annuel à confirmer). Noter les deux `price_...`.
2. **Paramètres > Facturation > Portail client** : autoriser la résiliation (fin de période),
   le changement d'offre entre les deux prix, la mise à jour du moyen de paiement et l'accès aux factures.
3. **Paramètres > Facturation > Factures** : ajouter en pied de facture
   `TVA non applicable, art. 293 B du CGI`. Ne pas activer Stripe Tax (franchise en base).
4. **Développeurs > Webhooks** : point de terminaison `https://votre-domaine.fr/api/stripe/webhook`
   avec les événements `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `customer.subscription.paused`, `customer.subscription.resumed`. Noter le secret `whsec_...`.
5. En local :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   et utiliser le `whsec_...` affiché. Carte de test : `4242 4242 4242 4242`.

## 3. Lancer en local

```bash
cp .env.example .env.local   # puis remplir les valeurs
npm install
npm run dev
```

Pour accéder à `/admin`, mettre son adresse dans `ADMIN_EMAILS`.

## 4. Déployer sur Vercel

1. Pousser le dépôt sur GitHub, puis l'importer dans Vercel.
2. Renseigner toutes les variables de `.env.example` (avec `NEXT_PUBLIC_SITE_URL` = le domaine final).
3. `vercel.json` place les fonctions à Paris (`cdg1`), au plus près de la base Supabase.
4. Mettre à jour l'URL du webhook Stripe et les Redirect URLs Supabase avec le domaine final.

## 5. Organisation du code

```
src/
  app/
    page.tsx                 landing
    tarifs/                  offres + boutons d'abonnement
    connexion/               lien magique et Google
    auth/callback, confirm/  retours de connexion (Google, e-mail)
    (app)/espace/            tableau de bord étudiant
    (app)/compte/            profil, abonnement, export, suppression
    (app)/admin/             suivi des inscrits (réservé à ADMIN_EMAILS)
    api/stripe/              checkout, portail, webhook
    api/compte/              export JSON, suppression du compte
    mentions-legales, cgu, cgv, confidentialite/
  components/                en-tête, pied de page, étiquette de seringue…
  lib/
    site.ts                  nom, prix, durée d'essai, mention TVA
    account.ts               utilisateur + profil + abonnement
    stripe.ts, stripe-sync.ts
    supabase/                clients serveur, admin et session
  proxy.ts                   rafraîchit la session, protège /espace, /compte, /admin
supabase/migrations/         schéma SQL et règles RLS
```

## 6. Règles de sécurité à garder en tête

- Les tables sont protégées par RLS : un étudiant ne lit que ses propres données.
- Les colonnes `question_options.is_correct` et `questions.explanation` ne sont **pas lisibles**
  depuis le navigateur : la correction des QCM se fera côté serveur avec le client admin.
- Les écritures de progression (tentatives, réponses, calculs) passent par le serveur.
- La clé `service_role` ne doit jamais être exposée côté client (`src/lib/supabase/admin.ts`
  est marqué `server-only`).

## 7. Suite prévue

1. Générateur de calculs de doses (perfusion, seringue électrique, dilutions, dose selon le poids).
2. Moteur de QCM (entraînement et examen) et import des questions.
3. Modules Cardiologie, Hémostase et Douleur.
