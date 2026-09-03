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

> **État / Status:** projet en développement. Grammaire, Vocabulaire et Voyage constituent actuellement le cœur utilisable du MVP. Quotidien, Jeux, la page générale Exercices et Profil restent à compléter.

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

L'application utilise encore des **scripts navigateur classiques** (`module: none`). La migration vers des `import` / `export` explicites est une étape structurelle prévue.

Le **graphe de dépendances généré automatiquement** sera ajouté après cette migration, afin qu'il soit calculé à partir des imports réels plutôt que déduit des symboles globaux.

---

## Qualité

La CI exécute notamment :

```bash
npm test
npm run typecheck
npm run build
npm run knip
npm run duplication
```

Les tests, le typecheck TypeScript et le build font échouer le job en cas d'erreur. Les analyses Knip et duplication restent informatives.

La suite de tests contient également des **tests d'architecture** destinés à empêcher le retour de HTML dans les contrôleurs/moteurs et d'autres régressions de séparation des responsabilités.

---

[🇫🇷 Français](README.fr.md) · [🇬🇧 English](README.en.md) · [🇮🇷 فارسی](README.fa.md)
