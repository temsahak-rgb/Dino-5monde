# 🦖 Français avec Dino

[← README principal](README.md) · **🇫🇷 Français** · [🇬🇧 English](README.en.md) · [🇮🇷 فارسی](README.fa.md)

> Une application web d'apprentissage du français, pensée pour faire progresser l'apprenant par des **cours courts, du vocabulaire, des exercices et des situations concrètes**.

**Navigation :** [Le projet](#le-projet) · [MVP actuel](#mvp-actuel) · [Fonctionnalités](#fonctionnalités) · [i18n](#internationalisation-i18n) · [Architecture](#architecture) · [Tests](#tests-et-qualité) · [Installation](#installation) · [Contribuer](#contribuer)

---

## Le projet

### En une phrase

**Français avec Dino est une plateforme web qui organise l'apprentissage du français en parcours progressifs plutôt qu'en une simple collection de fiches.**

L'utilisateur peut travailler la grammaire, le vocabulaire, des exercices et des situations pratiques comme l'aéroport, l'hôtel, le restaurant ou les urgences.

Le projet est particulièrement adapté aux **apprenants persanophones** : le français reste la langue étudiée, tandis que l'interface et de nombreux contenus pédagogiques peuvent utiliser le persan comme langue d'accompagnement.

### Pour quelqu'un qui ne connaît pas les applications d'apprentissage

On peut voir Dino comme la combinaison de :

- un manuel de français ;
- un cahier d'exercices ;
- des cartes de vocabulaire ;
- plusieurs parcours pédagogiques ;
- un test de placement ;
- un suivi de progression local.

Le parcours utilisateur général est simple :

```text
Je choisis la langue de l'interface
            ↓
Je choisis un parcours
            ↓
Je définis ou estime mon niveau
            ↓
Je choisis un thème ou une leçon
            ↓
Je consulte le contenu
            ↓
Je pratique
            ↓
Dino mémorise ma progression
```

Les contenus utilisent les niveaux du **CECRL** : A1, A2, B1, B2, C1 et, selon les modules, C2.

> La couverture n'est pas uniforme : le vocabulaire possède notamment des données jusqu'à C2, tandis que d'autres parcours sont actuellement davantage concentrés sur les niveaux inférieurs.

---

## MVP actuel

Le but du MVP n'est pas encore de fournir toutes les fonctions d'une plateforme éducative complète. Il vise d'abord à disposer d'un **cœur pédagogique réellement utilisable, extensible et testable**.

| Zone | État actuel |
|---|---|
| Onboarding | ✅ Présent |
| Test de placement | ✅ Présent |
| Grammaire | ✅ Fonctionnelle |
| Vocabulaire | ✅ Fonctionnel |
| Voyage | ✅ Fonctionnel |
| Exercices / quiz intégrés | ✅ Fonctionnels selon les contenus |
| Recherche | ✅ Présente |
| Actualités | ✅ Présentes |
| Sondages | ✅ Fonction présente |
| Quotidien, Jeux, page générale Exercices, Profil | Hors du périmètre publié ; aucune route factice exposée |
| Compte utilisateur distant | ❌ Non implémenté |
| Synchronisation multi-appareils | ❌ Non implémentée |

La progression repose aujourd'hui principalement sur `localStorage`.

Cela garde le MVP simple, mais implique que :

- la progression n'est pas synchronisée entre plusieurs navigateurs ou appareils ;
- supprimer les données locales du site peut supprimer la progression.

---

## Fonctionnalités

### 📚 Grammaire

Le module Grammaire propose un sélecteur de niveaux **A1 à C1**, des catalogues par niveau et des leçons structurées.

Une leçon peut contenir :

- une explication ;
- des exemples ;
- des tableaux ;
- des notes pédagogiques ;
- des exercices ou quiz ;
- une progression par section ;
- un favori / marque-page.

La logique de chargement et de progression est séparée de la présentation HTML.

### 🧠 Vocabulaire

Le module Vocabulaire organise une quantité importante de contenu par niveau et par thème.

Les activités incluent notamment :

- flashcards ;
- histoires simples ;
- histoires plus avancées ;
- quiz ;
- mini-jeux construits depuis les mots du pack : Pendu, Grille de lettres et Mots croisés ;
- mémorisation des mots difficiles ;
- révision spécifique des mots faibles.

Les données couvrent actuellement plusieurs niveaux jusqu'à **C2**, avec une couverture très variable selon les thèmes.

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

Les données peuvent associer :

```text
français
+
persan
+
aide phonétique
+
contexte
+
exercice
```

### 🔎 Recherche, actualités et sondages

Le dépôt contient également des fonctionnalités de recherche, d'actualités et de sondages. Elles complètent le cœur pédagogique mais ne constituent pas actuellement les parcours principaux du MVP.

---

## Internationalisation (i18n)

Dino possède désormais une couche d'internationalisation dédiée.

```text
src/i18n/
├── fr.ts
├── fa.ts
└── i18n.ts
```

### Deux langues d'interface

Les langues actuellement supportées sont :

```text
fr → français
fa → persan
```

Le choix est enregistré dans :

```text
localStorage["language"]
```

Le runtime synchronise également :

- `document.documentElement.lang` ;
- `document.documentElement.dir` ;
- le titre de la page.

Le français utilise `ltr`, le persan utilise `rtl`.

### `fr.ts` : catalogue de référence

Le catalogue français définit les clés canoniques de l'interface.

Conceptuellement :

```ts
const frMessages = {
    "common.back": "Retour",
    "common.continue": "Continuer",
    "navbar.grammar": "Grammaire"
} as const;

type TranslationKey = keyof typeof frMessages;
```

Le type `TranslationKey` est donc dérivé du catalogue de référence.

### `fa.ts` : même contrat, autre langue

Le catalogue persan doit implémenter les mêmes clés :

```ts
const faMessages: Record<TranslationKey, string> = {
    "common.back": "بازگشت",
    "common.continue": "ادامه",
    "navbar.grammar": "دستور زبان"
};
```

Une clé absente ou incorrecte devient ainsi détectable par TypeScript.

### `i18n.ts` : runtime

Le runtime fournit notamment :

```text
t(...)
getI18nLanguage()
setI18nLanguage(...)
applyDocumentLanguage(...)
localizedValue(...)
localizedTextClass()
```

Pour les textes d'interface :

```ts
t("common.back")
```

Pour un contenu pédagogique bilingue déjà stocké dans un JSON :

```ts
localizedValue(
    item.title,
    item.title_fa
)
```

### Interface et contenu pédagogique sont deux choses différentes

La règle importante est :

```text
src/i18n/*.ts
    =
textes de l'interface

data/**/*.json
    =
contenu pédagogique
```

Il ne faut donc pas recopier toutes les leçons dans les catalogues i18n.

### Pas de branchement de langue dans le métier

Les contrôleurs et moteurs ne doivent pas recréer des conditions comme :

```ts
if (lang === "fa") {
    ...
}
```

Les textes d'interface passent par `t()` et les valeurs pédagogiques bilingues passent par `localizedValue()`.

Cette règle est protégée par les tests d'architecture.

---

## Architecture

### Structure principale

```text
Dino-5monde/
├── app.ts
├── index.html
├── package.json
├── tsconfig.json
│
├── src/
│   ├── core/
│   │   ├── exerciseEngine.ts
│   │   ├── lessonEngine.ts
│   │   ├── pathEngine.ts
│   │   ├── placementEngine.ts
│   │   ├── progressEngine.ts
│   │   └── router.ts
│   │
│   ├── features/
│   │   ├── grammar/
│   │   ├── news/
│   │   ├── onboarding/
│   │   ├── polls/
│   │   ├── search/
│   │   ├── travel/
│   │   └── vocabulary/
│   │
│   ├── i18n/
│   │   ├── fr.ts
│   │   ├── fa.ts
│   │   └── i18n.ts
│   │
│   ├── pages/
│   ├── ui/
│   │   ├── ui.ts
│   │   └── views/
│   ├── styles/
│   └── types/
│
├── data/
├── tests/
│   ├── architecture/
│   └── data/
├── tools/
└── .github/workflows/
```

### Responsabilités

Le MVP converge vers les responsabilités suivantes :

```text
app.ts / router.ts
    → bootstrap et navigation

pages/ + features/* controllers
    → orchestration, événements, état d'écran

core/*Engine.ts + feature engines
    → logique métier et état réutilisable

ui/views/*.ts
    → HTML et présentation

i18n/*.ts
    → textes d'interface et direction LTR/RTL

data/**/*.json
    → contenu pédagogique

types/
    → contrats TypeScript exportés
```

### Contrôleurs / pages

Ils peuvent :

- recevoir les interactions utilisateur ;
- appeler les moteurs ;
- coordonner les états transitoires ;
- appeler les Views ;
- manipuler un DOM déjà rendu lorsque nécessaire.

Ils ne doivent pas recommencer à contenir les gros templates HTML des écrans.

### Engines

Ils portent la logique réutilisable :

- chargement des données ;
- calculs ;
- sélection de questions ;
- validation ;
- progression ;
- placement ;
- état métier.

Ils ne doivent pas produire les templates de l'interface.

### Views

Les Views de `src/ui/views/` possèdent la présentation :

- structure HTML ;
- labels ;
- layout spécifique à l'écran ;
- attributs `data-*` utiles aux contrôleurs ;
- appels à l'i18n.

### `data/`

Principe important :

```text
src/  = comment l'application fonctionne
data/ = ce que l'application enseigne
```

Les leçons et packs sont majoritairement décrits en JSON afin que l'ajout de contenu pédagogique n'oblige pas à réécrire le moteur.

### ES modules et dépendances explicites

Dino n'utilise actuellement ni React ni Vue.

Le TypeScript applicatif est compilé en **ES modules**. `index.html` ne connaît qu'un seul entry point, `app.js`, chargé avec `type="module"`. Les dépendances d'exécution et de types sont déclarées dans chaque fichier avec des `import`, et les API partagées avec des `export` explicites.

L'ordre de chargement est désormais calculé par le navigateur depuis ce graphe de modules ; il n'est plus maintenu à la main dans le HTML.

### Graphe de dépendances

Le [graphe applicatif généré](docs/dependency-graph.md) représente toutes les dépendances locales atteignables depuis `app.ts`. Il présente une vue d'ensemble agrégée par couche et des cartes repliables par domaine. Les imports de types sont suivis mais masqués dans les diagrammes afin de préserver leur lisibilité.

```bash
npm run graph:dependencies
npm run graph:dependencies:check
```

Le fichier est déterministe : la première commande le régénère, la seconde vérifie qu'il est à jour sans l'écrire.
Le générateur rejette également tout cycle de dépendances d'exécution. Les tests d'architecture complètent cette garantie en interdisant notamment les dépendances Vue → Feature/Page, Feature → Page et Engine → UI/Controller.

---

## Tests et qualité

### Commandes

```bash
npm test
npm run test:app
npm run test:data
npm run test:architecture
npm run test:e2e:install
npm run test:e2e
npm run typecheck
npm run build
npm run knip
npm run duplication
npm run graph:dependencies:check
```

`npm test` prend automatiquement tous les fichiers :

```text
tests/**/*.test.ts
```

Il n'est donc pas nécessaire de modifier `package.json` lorsqu'un nouveau test est ajouté.
`npm run test:app` est le sous-ensemble bloquant du pipeline de qualité du code ; les tests corpus restent volontairement isolés dans `npm run test:data` et leur workflow dédié.

### Tests E2E navigateur

La suite Playwright vérifie le démarrage réel de l'application, la bascule d'interface français ↔ persan (`lang`, `dir` et textes visibles), puis la persistance de la langue après navigation et rechargement.

À la première utilisation locale, installer uniquement Chromium :

```bash
npm run test:e2e:install
```

Puis lancer les scénarios contre un build de production servi automatiquement sur un port local déterministe :

```bash
npm run test:e2e
```

L'installation de Chromium nécessite un accès réseau. Aucun serveur manuel ni capture d'écran de référence n'est requis.

### Tests de données

Les tests sous :

```text
tests/data/
```

protègent la cohérence des données pédagogiques.

Le dépôt possède notamment un contrôle des identifiants du parcours Voyage.

### Tests d'architecture

Les tests sous :

```text
tests/architecture/
```

servent à empêcher les régressions structurelles.

Le test `ui-boundaries.test.ts` protège notamment contre :

- le retour de gros templates HTML dans les contrôleurs, pages ou moteurs ;
- les handlers DOM inline comme `onclick="..."` ;
- le retour des branchements directs de langue dans le métier ;
- la disparition des Views migrées ;
- le retour de l'ancien renderer Travel ;
- le retour de scripts classiques ou de plusieurs entry points dans `index.html`.

Autrement dit, la séparation actuelle n'est plus seulement une convention écrite : elle possède un garde-fou exécutable.

### CI

Le workflow GitHub Actions de qualité exécute :

```text
tests applicatifs → bloquant pour le job
TypeScript        → bloquant pour le job
production build  → bloquant pour le job
Knip              → informatif
jscpd             → informatif
```

Cela signifie qu'une régression de compilation, de test ou de build rend le job CI rouge.

Le workflow dédié **Dependency graph** exécute `npm run graph:dependencies`, puis compare le résultat à `docs/dependency-graph.md`. Une dépendance modifiée sans régénération du graphe rend ce job rouge.
Le workflow dédié **Corpus quality** exécute `npm run test:data`, publie des erreurs lisibles par fichier et champ, puis maintient un commentaire de rapport persistant sur les pull requests.
Le workflow dédié **Browser E2E** installe uniquement Chromium, démarre le build local et bloque la CI si le démarrage ou l'i18n régressent.

La configuration des règles de protection GitHub elles-mêmes reste indépendante de ce code.

---

## Installation

### Prérequis

Le projet demande :

- Git ;
- **Node.js 22.6 ou supérieur** ;
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

### Vérifier le projet

```bash
npm test
npm run typecheck
npm run build
```

### Construire l'application

```bash
npm run build
```

Le build est généré dans :

```text
dist/
```

Le script de build copie également les ressources statiques nécessaires, notamment `index.html`, les données pédagogiques et les styles.

### Lancer localement

Dino charge ses fichiers JSON avec `fetch()`. Il faut donc servir `dist/` avec HTTP plutôt que d'ouvrir directement `index.html` en `file://`.

Exemple :

```bash
python -m http.server 8080 --directory dist
```

Puis :

```text
http://localhost:8080
```

---

## Ajouter du contenu pédagogique

Les contenus doivent rester aussi indépendants que possible du code.

Exemples :

```text
data/lessons/       → leçons générales / grammaire
data/vocabulary/    → packs de vocabulaire
data/travel/        → parcours Voyage
```

Pour Voyage :

```text
data/travel/lessons.json
```

contient l'index, tandis que les fichiers détaillés se trouvent dans :

```text
data/travel/lessons/
```

Avant de contribuer du contenu, vérifier :

1. que l'identifiant est stable et unique ;
2. que la structure correspond au contrat attendu ;
3. que l'index et les fichiers détaillés restent cohérents ;
4. que les traductions pédagogiques nécessaires sont présentes ;
5. que `npm test` passe.

---

## Contribuer

### Avant une Pull Request

Au minimum :

```bash
npm test
npm run typecheck
npm run build
```

Puis, lorsque pertinent :

```bash
npm run knip
npm run duplication
```

### Principes

- faire des modifications ciblées ;
- ne pas recréer un moteur lorsqu'un moteur commun existe ;
- garder le HTML structurel dans `src/ui/views/` ;
- utiliser `t()` pour les textes d'interface ;
- utiliser `localizedValue()` pour les données pédagogiques bilingues ;
- garder les données pédagogiques dans `data/` autant que possible ;
- éviter les fichiers monolithiques ;
- préserver les identifiants stables ;
- ajouter un test lorsqu'un invariant mérite d'être protégé.

### Direction architecturale

L'objectif est de converger vers :

```text
contrôleurs simples
        +
moteurs réutilisables
        +
views dédiées
        +
contenus JSON
        +
i18n centralisé
        +
dépendances explicites
```

Les imports explicites alimentent désormais automatiquement le graphe d'architecture et rendent les dépendances indésirables visibles dans les revues de code.

---

## Direction produit

Les prochaines évolutions naturelles comprennent notamment :

- terminer le parcours Quotidien ;
- développer les Jeux ;
- compléter la page générale Exercices ;
- construire le Profil ;
- renforcer les exercices ;
- ajouter davantage de tests de données ;
- améliorer les recommandations de révision à partir des erreurs ;
- harmoniser la couverture des niveaux CECRL ;
- éventuellement ajouter plus tard des comptes et une synchronisation multi-appareils.

Ces éléments décrivent une **direction**, pas des fonctionnalités déjà livrées.

---

[← README principal](README.md) · [🇬🇧 English](README.en.md) · [🇮🇷 فارسی](README.fa.md)
