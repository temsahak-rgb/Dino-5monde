# 🦖 Français avec Dino

> **Une application web pour apprendre le français par la pratique.**  
> **A web application for learning French through practice.**  
> **یک اپلیکیشن وب برای یادگیری زبان فرانسه از طریق تمرین.**

Dino combine des parcours pédagogiques, de la grammaire, du vocabulaire, des exercices et des situations concrètes, avec une interface français/persan et un support RTL.

Dino combines learning paths, grammar, vocabulary, exercises and practical situations, with a French/Persian interface and RTL support.

---

## Documentation

### 🇫🇷 [Documentation française](README.fr.md)

Présentation du MVP, installation, i18n, architecture, tests et règles de contribution.

### 🇬🇧 [English documentation](README.en.md)

MVP overview, installation, i18n, architecture, tests and contribution rules.

### 🇮🇷 [مستندات فارسی](README.fa.md)

معرفی MVP، نصب، چندزبانه‌سازی، معماری، تست‌ها و قوانین مشارکت.

---

## MVP en bref · At a glance

- 🎯 niveaux CECRL / CEFR de **A1 à C2** selon les modules ;
- 📚 grammaire structurée ;
- 🧠 vocabulaire par niveau et thème ;
- ✈️ parcours Français Voyage ;
- 📝 exercices et quiz intégrés aux contenus ;
- 🧭 onboarding et test de placement ;
- 🔎 recherche et contenus complémentaires ;
- 🛍️ boutique de leçons sur `/shop`, avec 100 crédits de bienvenue ;
- 👤 compte sans mot de passe et profil privé `Saurus` ;
- 🇫🇷🇮🇷 interface français / persan ;
- ↔️ gestion LTR / RTL ;
- 💾 progression enregistrée localement ;
- 🧪 TypeScript + JSON + tests d'architecture.

> **État / Status:** projet en développement. Le Profil et la Boutique sont désormais livrés ; les routes factices Quotidien, Jeux et page générale Exercices restent hors du MVP publié.

---

## Architecture actuelle

Le MVP sépare désormais explicitement :

```text
src/main.tsx         → montage React
app/                 → providers, routeur et layout
pages/               → écrans associés aux routes
ui/components/       → composants React partagés
features/            → composants métier, moteurs et repositories
core/                → logique réutilisable indépendante de React
services/backend/    → frontière TypeScript vers Auth et PostgreSQL
i18n/                → textes d'interface et direction
data/                → contenu pédagogique JSON
supabase/            → configuration et migrations du backend versionnées
```

L'application est une SPA **React + TypeScript** construite par Vite. `index.html` charge uniquement `src/main.tsx` ; `AppRouter` et `AppLayout` structurent ensuite les routes, les pages et les composants.

Le premier backend repose sur **Supabase**. Il est optionnel tant que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` ne sont pas définies, ce qui préserve le site statique actuel. Il porte les comptes, les profils, le portefeuille de crédits et les droits d'accès privés, tous protégés par Row Level Security. Chaque compte reçoit 100 crédits au départ ; l'achat d'une leçon est atomique côté PostgreSQL et laisse une trace dans un registre append-only.

La boutique est disponible sur `/shop`. Elle utilise aujourd'hui uniquement des crédits virtuels : aucun paiement en argent réel n'est encore raccordé. Le corpus pédagogique reste dans `data/`, sans migration ni modification, et demeure donc publiquement téléchargeable avec le site GitHub Pages. Avant toute vente réelle, les contenus payants devront être servis par une frontière backend privée ; les droits Supabase seuls ne constituent pas une protection du JSON public.

Le déploiement GitHub Pages injecte ces valeurs depuis les variables de dépôt `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY`. Le projet Supabase n’est donc jamais codé en dur : passer à l’environnement du client consiste à remplacer ces deux variables puis à rejouer les migrations versionnées.

Le développement local du backend nécessite Docker Desktop :

```bash
cp .env.example .env.local
npm run backend:start
npm run backend:reset
npm run backend:test
npm run backend:types
```

`npm run backend:test` exécute notamment les contrôles SQL pgTAP de la boutique. `npm run backend:stop` arrête ensuite l’environnement local. Phone OTP reste volontairement désactivé tant qu’un fournisseur SMS payant et ses protections anti-abus ne sont pas configurés.

Le parcours de compte utilise une **connexion email sans mot de passe** : `/auth` envoie un lien sécurisé vers la destination demandée et sait aussi vérifier un OTP à 6 chiffres, puis `/profile` crée ou modifie le profil privé et sa préférence d’affichage `Saurus`. Sur le plan gratuit, le modèle d’email Supabase par défaut est conservé ; le modèle OTP bilingue prêt dans `supabase/templates/` sera activé après raccordement d’un SMTP dédié. L’expéditeur intégré ne dessert que les adresses autorisées de l’équipe : un SMTP dédié reste donc obligatoire avant l’ouverture aux apprenants.

Les écrans durables ont un chemin React Router canonique (`/grammar/A1`, `/grammar/lesson/A1-G-001`, `/travel/TR-006`, etc.). Ces liens supportent l’ouverture directe, le rechargement et l’historique arrière/avant ; l’état temporaire d’un exercice ou d’un jeu reste volontairement hors URL.

Le [graphe de dépendances](docs/dependency-graph.md) est généré depuis les imports réels atteignables à partir de `src/main.tsx` avec `npm run graph:dependencies`. Il suit l'arbre React — application, routeur, layout, pages, composants, features, puis moteurs et modules — et propose des branches repliables par domaine. Les imports de types sont suivis mais masqués pour conserver un dessin lisible. Le générateur rejette tout cycle d'exécution et les tests verrouillent les frontières entre couches. Le workflow GitHub Actions **Dependency graph** est volontairement indépendant de la CI des PR : lancé manuellement avec `workflow_dispatch`, il régénère le graphe puis commit uniquement `docs/dependency-graph.md` sur la branche choisie. Son commit `[skip ci]` ne relance ni les contrôles applicatifs ni le déploiement.

---

## Qualité

La CI exécute notamment :

```bash
npm test
npm run test:features
npm run test:e2e
npm run typecheck
npm run build
npm run knip
npm run duplication
```

Les tests, le typecheck TypeScript et le build font échouer le job en cas d'erreur. Les analyses Knip et duplication restent informatives.

`npm run graph:dependencies:check` reste une vérification locale. Le workflow **Dependency graph** est exclusivement manuel ; son commit `[skip ci]` ne lance ni la CI ordinaire ni le déploiement.

Les contrats produit Cucumber vivent dans `features/` et sont rédigés en anglais. Chaque scénario hérite exactement d’un état : `@implemented` est exécuté et bloquant, tandis que `@planned` est compté dans l’avancement sans être exécuté. Ces contrats testent la logique métier ; Playwright conserve seul la responsabilité des parcours réels dans Chromium.

Dès qu’une pull request est ouverte ou mise à jour, le workflow sécurisé **Project Vigie** attend puis réutilise les résultats de ses contrôles sans relancer les tests. Déclenché avec `pull_request_target`, il exécute exclusivement le code de confiance de `develop` — jamais le code proposé par la PR — et limite son écriture au commentaire sticky. Il y maintient trois panneaux repliables : **Data**, **Technique** et **Features**, accompagnés de voyants et de barres de progression. Le panneau Features mesure automatiquement les scénarios `@implemented`, `@planned` et invalides à partir des seuls fichiers `.feature` proposés par la PR, téléchargés et traités comme de la donnée non exécutable.

La suite de tests contient également des **tests d'architecture** destinés à empêcher le retour du DOM impératif et les dépendances de moteurs vers React ou l'UI.

---

[🇫🇷 Français](README.fr.md) · [🇬🇧 English](README.en.md) · [🇮🇷 فارسی](README.fa.md)
