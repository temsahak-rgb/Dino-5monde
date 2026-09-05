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
- 🇫🇷🇮🇷 interface français / persan ;
- ↔️ gestion LTR / RTL ;
- 💾 progression enregistrée localement ;
- 🧪 TypeScript + JSON + tests d'architecture.

> **État / Status:** projet en développement. La navigation publique est resserrée sur Accueil, Grammaire, Vocabulaire, Voyage et Recherche. Les routes factices Quotidien, Jeux, Exercices et Profil ont été retirées du MVP publié.

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
i18n/                → textes d'interface et direction
data/                → contenu pédagogique JSON
```

L'application est une SPA **React + TypeScript** construite par Vite. `index.html` charge uniquement `src/main.tsx` ; `AppRouter` et `AppLayout` structurent ensuite les routes, les pages et les composants.

Les écrans durables ont un chemin React Router canonique (`/grammar/A1`, `/grammar/lesson/A1-G-001`, `/travel/TR-006`, etc.). Ces liens supportent l’ouverture directe, le rechargement et l’historique arrière/avant ; l’état temporaire d’un exercice ou d’un jeu reste volontairement hors URL.

Le [graphe de dépendances](docs/dependency-graph.md) est généré depuis les imports réels atteignables à partir de `src/main.tsx` avec `npm run graph:dependencies`. Il suit l'arbre React — application, routeur, layout, pages, composants, features, puis moteurs et modules — et propose des branches repliables par domaine. Les imports de types sont suivis mais masqués pour conserver un dessin lisible. Le générateur rejette tout cycle d'exécution et les tests verrouillent les frontières entre couches. Le workflow GitHub Actions **Dependency graph** est volontairement indépendant de la CI des PR : lancé manuellement avec `workflow_dispatch`, il régénère le graphe puis commit uniquement `docs/dependency-graph.md` sur la branche choisie. Son commit `[skip ci]` ne relance ni les contrôles applicatifs ni le déploiement.

---

## Qualité

La CI exécute notamment :

```bash
npm test
npm run typecheck
npm run build
npm run knip
npm run duplication
npm run graph:dependencies:check
```

Les tests, le typecheck TypeScript et le build font échouer le job en cas d'erreur. Les analyses Knip et duplication restent informatives.

Après les contrôles d’une pull request, le workflow sécurisé **Project Vigie** réutilise leurs résultats sans relancer les tests. Depuis la branche de confiance `develop` — jamais depuis le code proposé par la PR — il maintient un seul commentaire avec trois panneaux repliables : **Data**, **Technique** et **Features**, accompagnés de voyants et de barres de progression.

La suite de tests contient également des **tests d'architecture** destinés à empêcher le retour du DOM impératif et les dépendances de moteurs vers React ou l'UI.

---

[🇫🇷 Français](README.fr.md) · [🇬🇧 English](README.en.md) · [🇮🇷 فارسی](README.fa.md)
