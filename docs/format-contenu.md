# Rédiger le contenu

Tout le contenu pédagogique vit dans le dépôt, dossier `content/`. Un module = un dossier.

```
content/modules/cardiologie/
  module.yml            titre, semestre, description, ordre des leçons
  lecons/01-rappels.mdx  une leçon = un fichier (le numéro sert juste au tri)
  fiches/*.yml          une fiche par classe thérapeutique
  qcm/*.yml             les questions, un fichier par leçon
```

## Le cycle de vie : brouillon → valide

Chaque fichier a un `status`. Tant qu'il est `brouillon`, il n'est visible que par les
administrateurs (aperçu sur le site). Après relecture, passer à `valide` : il est publié au
prochain import. Un module `brouillon` masque tout son contenu, même validé.

## Les leçons (`.mdx`)

En-tête obligatoire :

```yaml
---
slug: diuretiques          # minuscules et tirets, sans accent
title: Les diurétiques
duration: 15               # minutes
free: false                # true pour la 1re leçon du module (accès gratuit)
status: brouillon
updated: 2026-09-28
objectives:                # 1 à 5 objectifs
  - Situer le site d'action de chaque famille sur le néphron
---
```

Le corps s'écrit en Markdown : titres `##`, listes, **gras**, tableaux. Quatre blocs spéciaux :

| Bloc | Rendu |
| --- | --- |
| `<ARetenir>…</ARetenir>` | Encadré « À retenir » |
| `<Attention>…</Attention>` | Encadré de vigilance (danger, piège) |
| `<RoleInfirmier>…</RoleInfirmier>` | Encadré rôle infirmier (utiliser `###` Avant / Pendant / Éducation) |
| `<Verifier refs={["cardio-diur-001"]} />` | 2 à 5 questions de vérification en fin de leçon |

Deux caractères sont interdits tels quels : `<` suivi d'une espace ou d'un chiffre
(écrire « inférieur à »), et `{` hors d'un bloc. Le validateur les signale.

## Les fiches (`.yml`)

Toujours les mêmes rubriques, pour que toutes les fiches se ressemblent et s'impriment bien :
`molecules` (DCI + spécialités), `mecanisme`, `indications`, `contre_indications`,
`effets_indesirables`, `surveillance`, `interactions`, `education`, `a_retenir` (1 à 5 points).
Modèle : `content/modules/cardiologie/fiches/diuretiques-anse.yml`.

## Les questions (`.yml`)

```yaml
status: brouillon
questions:
  - ref: cardio-diur-001     # module-theme-numéro, unique, ne change jamais
    version: 1               # à augmenter à CHAQUE modification du contenu
    type: single             # single | multiple | true_false | case
    level: 1                 # 1 facile, 2 moyen, 3 difficile
    free: true               # fait partie de la série découverte gratuite
    lesson: diuretiques      # leçon vers laquelle renvoyer en cas d'erreur
    context: ...             # obligatoire pour un cas clinique (type: case)
    prompt: Où agit le furosémide ?
    options:
      - label: Sur la branche ascendante de l'anse de Henlé
        correct: true
      - label: Sur le tube contourné distal
    explanation: >-
      Pourquoi la bonne réponse est juste, et pourquoi les pièges sont faux.
```

Règles vérifiées automatiquement : une seule bonne réponse pour `single`, `true_false` et
`case` ; au moins une pour `multiple` ; `true_false` a exactement les options « Vrai » puis
« Faux » ; pas d'option en double ; chaque module a au moins quelques questions `free`.

**Corriger une question publiée** : modifier le texte ET augmenter `version`. Sinon l'import
refuse, pour qu'aucune correction ne passe inaperçue. Ne jamais réutiliser une `ref`.
Pour retirer une question, supprimer son bloc : elle est dépubliée, pas effacée.

## Les commandes

```bash
npm run content:check    # valide tout le contenu (à lancer avant chaque commit)
npm run content:import -- --dry-run   # montre ce qui changerait en base
npm run content:import   # importe modules et questions dans Supabase
```
