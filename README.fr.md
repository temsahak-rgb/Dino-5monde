# 🦖 Français avec Dino

[← README principal](README.md) · **🇫🇷 Français** · [🇬🇧 English](README.en.md)

> Une application web d'apprentissage du français, pensée pour faire progresser l'apprenant par des **cours courts, du vocabulaire, des exercices et des situations concrètes**.

**Navigation :** [Le projet](#le-projet) · [Fonctionnalités](#fonctionnalités) · [Installation](#installation) · [Architecture](#architecture) · [Contribuer](#contribuer)

---

## Le projet

### En une phrase

**Français avec Dino est une plateforme web qui organise l'apprentissage du français en parcours progressifs plutôt qu'en une simple collection de fiches.**

L'utilisateur peut travailler la grammaire, le vocabulaire ou des situations pratiques comme l'aéroport, l'hôtel, le restaurant ou les urgences.

Le projet est particulièrement adapté aux **apprenants persanophones** : l'interface et de nombreux contenus peuvent utiliser le persan comme langue d'accompagnement, tout en gardant le français comme langue étudiée.

### Pour quelqu'un qui ne connaît pas les applications d'apprentissage

On peut voir Dino comme la combinaison de :

- un manuel de français ;
- un cahier d'exercices ;
- des cartes de vocabulaire ;
- un parcours organisé par niveau ;
- un suivi de progression.

Le principe est simple :

```text
Je choisis comment je veux apprendre
            ↓
Je définis ou estime mon niveau
            ↓
Je choisis un thème
            ↓
Je consulte une leçon
            ↓
Je pratique
            ↓
Dino mémorise ma progression
```

### À qui s'adresse Dino ?

Dino vise plusieurs usages :

- **débuter en français** ;
- **structurer un apprentissage déjà commencé** ;
- **réviser du vocabulaire** ;
- **comprendre la grammaire** ;
- **préparer un voyage ou une situation réelle** ;
- apprendre avec une **aide en persan** lorsque cela est utile.

Les contenus utilisent les niveaux du **CECRL** : A1, A2, B1, B2, C1 et, pour certains modules, C2.

> La couverture n'est pas encore identique partout : le vocabulaire possède des données A1 à C2, tandis que la grammaire et le placement sont actuellement principalement organisés jusqu'à C1.

---

## Expérience d'apprentissage

### 1. Choisir la langue d'interface

Au premier lancement, l'application permet de choisir entre :

- français ;
- persan.

Le projet gère également l'affichage **RTL** nécessaire au persan.

### 2. Choisir un parcours

L'onboarding propose actuellement trois orientations :

- **Français général** ;
- **Français Voyage** ;
- **Français Quotidien**.

Le parcours général peut proposer un test de placement. Le niveau peut aussi être choisi manuellement.

### 3. Apprendre par sections

Une leçon peut être divisée en plusieurs parties :

```text
Leçon
├── explication
├── tableau ou exemples
├── vocabulaire
├── dialogue
├── exercice
└── quiz
```

Le moteur mémorise les sections terminées et les erreurs lorsque les exercices le permettent.

### 4. Revenir plus tard

La progression est sauvegardée dans le navigateur avec `localStorage`.

Cela permet d'utiliser l'application sans serveur de compte utilisateur, mais il faut connaître la limite :

> **La progression n'est pas encore synchronisée entre plusieurs appareils ou navigateurs.**

Supprimer les données locales du site peut également supprimer cette progression.

---

## Fonctionnalités

### 📚 Grammaire

Le module Grammaire propose des catalogues par niveau et de vraies leçons structurées.

Une leçon peut contenir :

- une explication ;
- des exemples ;
- des tableaux ;
- des notes pédagogiques ;
- des exercices ou quiz ;
- une progression par section ;
- un favori / marque-page.

Les données de grammaire sont actuellement organisées principalement de **A1 à C1**.

### 🧠 Vocabulaire

Le module Vocabulaire possède une quantité importante de contenus organisés par niveau et par thème.

Les activités prévues par le moteur incluent notamment :

- **flashcards** ;
- histoires simples ;
- histoires plus avancées ;
- quiz ;
- mémorisation des mots difficiles ;
- révision spécifique des mots faibles.

Les données de vocabulaire couvrent actuellement **A1 à C2**, avec une couverture très variable selon le niveau et le thème.

### ✈️ Voyage

Le parcours Voyage est orienté vers des situations concrètes plutôt que vers des règles isolées.

Parmi les thèmes présents :

- alphabet et nombres utiles ;
- conversations courtes ;
- aéroport et contrôle frontière ;
- bagages ;
- transport depuis l'aéroport ;
- hôtel et réception ;
- banque et change ;
- téléphone et Internet ;
- météo ;
- restaurant et café ;
- demander son chemin ;
- shopping ;
- tourisme ;
- sécurité ;
- santé et urgences ;
- départ et au revoir.

Les leçons peuvent associer :

```text
français + persan + aide phonétique + contexte + exercice
```

L'objectif est que l'apprenant puisse **réutiliser immédiatement une phrase dans une situation réelle**.

### 🔎 Recherche, actualités et contenus complémentaires

Le dépôt contient également des fonctionnalités de recherche, d'actualités et de sondages. Elles complètent le cœur pédagogique sans constituer actuellement les parcours principaux.

### 🚧 Parties encore en construction

L'interface contient déjà des entrées pour plusieurs zones qui ne sont pas encore finalisées :

| Zone | État actuel |
|---|---|
| Grammaire | ✅ Fonctionnelle |
| Vocabulaire | ✅ Fonctionnel |
| Voyage | ✅ Fonctionnel |
| Exercices intégrés aux leçons | ✅ Fonctionnels selon le contenu |
| Recherche | ✅ Présente |
| Actualités | ✅ Présentes |
| Quotidien | 🚧 Écran principal encore en construction |
| Jeux | 🚧 Placeholder |
| Page générale Exercices | 🚧 Placeholder |
| Profil | 🚧 Placeholder |
| Compte utilisateur distant | ❌ Non implémenté |
| Synchronisation multi-appareils | ❌ Non implémentée |

Dino doit donc être considéré comme **une base pédagogique déjà utilisable, mais encore en développement**.

---

## Installation

### Prérequis

Le projet demande :

- Git ;
- **Node.js 22 ou supérieur** ;
- npm.

Vérification :

```bash
node --version
npm --version
git --version
```

### Récupérer la branche `increment`

```bash
git clone https://github.com/Slimtrat/Dino-5monde.git
cd Dino-5monde
git checkout increment
```

### Installer les dépendances

```bash
npm ci
```

### Construire l'application

```bash
npm run build
```

Le build TypeScript est généré dans :

```text
dist/
```

Le script de build copie également dans `dist/` les éléments statiques nécessaires, notamment `index.html`, les données pédagogiques et les styles.

### Lancer localement

Dino charge ses fichiers JSON avec `fetch()`. Il vaut donc mieux servir `dist/` avec un serveur HTTP plutôt que d'ouvrir directement `index.html` en `file://`.

Avec Python, par exemple :

```bash
python -m http.server 8080 --directory dist
```

Puis ouvrir :

```text
http://localhost:8080
```

---

## Commandes utiles

```bash
npm run build
npm run typecheck
npm test
npm run knip
npm run duplication
```

| Commande | Rôle |
|---|---|
| `npm run build` | Compile TypeScript et prépare `dist/` |
| `npm run typecheck` | Vérifie les types TypeScript sans générer de fichiers |
| `npm test` | Lance les tests actuels |
| `npm run knip` | Analyse le code potentiellement inutilisé |
| `npm run duplication` | Recherche la duplication avec jscpd |

La suite de tests est encore limitée ; elle vérifie notamment actuellement la cohérence des identifiants du parcours Voyage.

---

## Architecture

### Vue rapide

```text
Dino-5monde/
├── app.ts
├── index.html
├── package.json
├── tsconfig.json
│
├── src/
│   ├── core/
│   ├── features/
│   │   ├── grammar/
│   │   ├── news/
│   │   ├── onboarding/
│   │   ├── polls/
│   │   ├── search/
│   │   ├── travel/
│   │   └── vocabulary/
│   ├── pages/
│   ├── styles/
│   ├── types/
│   └── ui/
│
├── data/
│   ├── daily/
│   ├── exercises/
│   ├── lessons/
│   ├── news/
│   ├── polls/
│   ├── travel/
│   └── vocabulary/
│
├── tests/
├── tools/
└── .github/workflows/
```

### `src/` : comment Dino fonctionne

`src/` contient le comportement de l'application.

Les responsabilités sont progressivement séparées :

- `core/` : moteurs partagés, routing, progression, placement, exercices ;
- `features/` : fonctionnalités pédagogiques ;
- `pages/` : écrans généraux ;
- `ui/` : helpers et chaînes d'interface ;
- `types/` : types TypeScript globaux ;
- `styles/` : CSS.

### `data/` : ce que Dino enseigne

Le principe architectural important est :

```text
src/  = le moteur

data/ = le contenu pédagogique
```

Les leçons, listes de vocabulaire et parcours Voyage sont majoritairement décrits en JSON.

Cela permet d'ajouter du contenu sans devoir réécrire toute l'application.

### Une architecture TypeScript volontairement simple

Dino n'utilise actuellement ni React ni Vue.

Le TypeScript est compilé en **scripts navigateur classiques** (`module: none`). `index.html` charge ensuite les fichiers JavaScript dans un ordre explicite.

Conséquence importante pour un développeur :

> **L'ordre des scripts dans `index.html` compte**, car plusieurs fonctions sont partagées globalement entre les fichiers.

La migration vers TypeScript améliore la sécurité des types, mais l'application conserve pour le moment cette architecture globale afin de rester compatible avec son fonctionnement historique.

### Pas de backend actuellement

Il n'y a pas aujourd'hui de backend applicatif chargé de gérer :

- les comptes ;
- l'authentification ;
- la progression distante ;
- la synchronisation cloud.

La plupart de l'état utilisateur est conservée localement dans le navigateur.

---

## Ajouter du contenu pédagogique

L'objectif est de garder les contenus aussi indépendants que possible du moteur.

Exemples :

```text
data/lessons/       → cours généraux / grammaire
data/vocabulary/    → packs de vocabulaire
data/travel/        → parcours Voyage
```

Pour Voyage, l'index se trouve dans :

```text
data/travel/lessons.json
```

et les leçons détaillées sont séparées dans :

```text
data/travel/lessons/
```

Ce découpage évite de concentrer des milliers de lignes de contenu dans un seul fichier.

Lorsqu'un nouveau contenu est ajouté, il faut surtout vérifier :

1. que son identifiant est unique ;
2. que son format correspond au type attendu par le moteur ;
3. que les liens entre index et fichier détaillé sont cohérents ;
4. que le build et les tests passent.

---

## Qualité du code

Le dépôt contient un workflow GitHub Actions de contrôle qualité.

Il exécute notamment :

- les tests de cohérence des données ;
- le typecheck TypeScript ;
- le build de production ;
- Knip ;
- jscpd pour la duplication.

Le workflow actuel produit surtout un **rapport informatif** : après l'installation des dépendances, plusieurs contrôles ne bloquent volontairement pas immédiatement le job afin de rendre la dette visible avant de rendre les règles plus strictes.

---

## Contribuer

### Avant une Pull Request

Au minimum :

```bash
npm run typecheck
npm test
npm run build
```

Puis, lorsque pertinent :

```bash
npm run knip
npm run duplication
```

### Principes recommandés

- faire des modifications ciblées ;
- éviter de recréer un moteur lorsqu'un moteur commun existe déjà ;
- préférer plusieurs fichiers cohérents à un fichier monolithique ;
- garder les données pédagogiques dans `data/` autant que possible ;
- conserver des identifiants stables et uniques ;
- tester les parcours impactés dans le navigateur.

### Pourquoi cette discipline ?

Dino contient déjà beaucoup plus de **données pédagogiques** que de code applicatif. Le risque principal à long terme n'est donc pas seulement d'ajouter des fonctionnalités : c'est de laisser apparaître plusieurs implémentations concurrentes du même comportement.

L'objectif de l'architecture actuelle est de converger progressivement vers :

```text
un moteur commun
        +
plusieurs types de contenus
        +
plusieurs parcours pédagogiques
```

plutôt que vers une collection de pages indépendantes qui réimplémentent chacune leurs propres règles.

---

## Direction du projet

Les prochaines évolutions naturelles sont notamment :

- terminer le parcours Quotidien ;
- développer les Jeux ;
- construire la page générale Exercices ;
- construire le Profil ;
- renforcer les exercices et les tests ;
- exploiter davantage les erreurs de l'apprenant pour recommander des révisions ;
- améliorer la cohérence entre les niveaux ;
- éventuellement ajouter plus tard des comptes et une synchronisation multi-appareils.

Ces éléments décrivent une **direction**, pas des fonctionnalités déjà livrées.

---

[← README principal](README.md) · [🇬🇧 English](README.en.md)
