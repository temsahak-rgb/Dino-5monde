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
controllers / pages  → orchestration et événements
engines              → logique et état
ui/views             → HTML et présentation
i18n                 → textes d'interface et direction
data                 → contenu pédagogique JSON
```

L'application est compilée en **ES modules**. `index.html` charge uniquement `app.js` avec `type="module"` ; chaque dépendance applicative ou de type est déclarée par un `import`, et les API partagées sont exportées explicitement.

Le [graphe de dépendances](docs/dependency-graph.md) est généré depuis ces imports réels avec `npm run graph:dependencies`. Il fournit une vue agrégée par couche puis des cartes repliables par domaine ; les imports de types sont suivis mais masqués pour conserver un dessin lisible. Le générateur rejette tout cycle d'exécution, les tests verrouillent les frontières entre couches, et un workflow CI dédié échoue si le graphe suivi par Git n'est plus à jour.

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

La suite de tests contient également des **tests d'architecture** destinés à empêcher le retour de HTML dans les contrôleurs/moteurs et d'autres régressions de séparation des responsabilités.

---

[🇫🇷 Français](README.fr.md) · [🇬🇧 English](README.en.md) · [🇮🇷 فارسی](README.fa.md)
