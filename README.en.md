# 🦖 Français avec Dino

[← Main README](README.md) · [🇫🇷 Français](README.fr.md) · **🇬🇧 English** · [🇮🇷 فارسی](README.fa.md)

> A web application for learning French through **short lessons, vocabulary, exercises and practical real-life situations**.

**Navigation:** [Project](#project) · [Current MVP](#current-mvp) · [Features](#features) · [i18n](#internationalization-i18n) · [Architecture](#architecture) · [Tests](#tests-and-quality) · [Installation](#installation) · [Contributing](#contributing)

---

## Project

### In one sentence

**Français avec Dino is a web platform that organises French learning into progressive learning paths instead of acting as a simple collection of static lessons.**

Learners can work on grammar, vocabulary, exercises and practical situations such as airports, hotels, restaurants or emergencies.

The project is particularly suitable for **Persian-speaking learners**. French remains the language being learned, while the interface and many learning resources can use Persian as a support language.

### For someone unfamiliar with language-learning applications

Dino can be understood as a combination of:

- a French textbook;
- an exercise book;
- vocabulary flashcards;
- several learning paths;
- a placement test;
- local progress tracking.

The general user flow is:

```text
Choose the interface language
            ↓
Choose a learning path
            ↓
Choose or estimate a level
            ↓
Choose a topic or lesson
            ↓
Read the content
            ↓
Practise
            ↓
Dino stores progress
```

The content uses **CEFR** levels: A1, A2, B1, B2, C1 and, depending on the module, C2.

> Coverage is not uniform yet. Vocabulary data notably reaches C2, while some other paths currently focus more heavily on lower levels.

---

## Current MVP

The MVP is not intended to provide every feature of a complete learning platform yet. Its current purpose is to provide an **actually usable, extensible and testable educational core**.

| Area | Current status |
|---|---|
| Onboarding | ✅ Present |
| Placement test | ✅ Present |
| Grammar | ✅ Functional |
| Vocabulary | ✅ Functional |
| Travel | ✅ Functional |
| Integrated exercises / quizzes | ✅ Functional depending on content |
| Search | ✅ Present |
| News | ✅ Present |
| Polls | ✅ Feature present |
| Daily | 🚧 Partially built |
| Games | 🚧 Placeholder |
| Global Exercises page | 🚧 Placeholder |
| Profile | 🚧 Placeholder |
| Remote user accounts | ❌ Not implemented |
| Cross-device sync | ❌ Not implemented |

Progress currently relies mainly on `localStorage`.

This keeps the MVP simple, but it means:

- progress is not synchronised between browsers or devices;
- clearing local site data can remove saved progress.

---

## Features

### 📚 Grammar

The Grammar module provides level-based catalogues and structured lessons.

A lesson can contain:

- explanations;
- examples;
- tables;
- teaching notes;
- exercises or quizzes;
- section progress;
- bookmarks.

Loading and progress logic are separated from HTML presentation.

### 🧠 Vocabulary

The Vocabulary module contains a large amount of level- and topic-based material.

Activities include:

- flashcards;
- simple stories;
- more advanced stories;
- quizzes;
- weak-word tracking;
- dedicated weak-word review.

Vocabulary data currently spans several levels up to **C2**, with highly variable coverage depending on topic.

### ✈️ Travel

The Travel path is built around practical situations rather than isolated rules.

Topics include:

- alphabet and useful numbers;
- short conversations;
- airports and border control;
- luggage;
- airport transport;
- hotels and reception;
- banks and currency exchange;
- phones and Internet;
- weather;
- restaurants and cafés;
- asking for directions;
- shopping;
- tourism;
- safety;
- health and emergencies;
- departure and goodbyes.

Travel data can combine:

```text
French
+
Persian
+
phonetic support
+
context
+
exercise
```

### 🔎 Search, news and polls

The repository also contains search, news and poll features. They complement the educational core but are not currently the primary learning paths of the MVP.

---

## Internationalization (i18n)

Dino now has a dedicated internationalization layer.

```text
src/i18n/
├── fr.ts
├── fa.ts
└── i18n.ts
```

### Two interface languages

The currently supported interface languages are:

```text
fr → French
fa → Persian
```

The selected language is stored in:

```text
localStorage["language"]
```

The runtime also synchronises:

- `document.documentElement.lang`;
- `document.documentElement.dir`;
- the document title.

French uses `ltr`; Persian uses `rtl`.

### `fr.ts`: reference catalogue

The French catalogue defines the canonical interface keys.

Conceptually:

```ts
const frMessages = {
    "common.back": "Retour",
    "common.continue": "Continuer",
    "navbar.grammar": "Grammaire"
} as const;

type TranslationKey = keyof typeof frMessages;
```

`TranslationKey` is therefore derived from the reference catalogue.

### `fa.ts`: same contract, another language

The Persian catalogue must implement the same keys:

```ts
const faMessages: Record<TranslationKey, string> = {
    "common.back": "بازگشت",
    "common.continue": "ادامه",
    "navbar.grammar": "دستور زبان"
};
```

Missing or invalid keys can therefore be caught by TypeScript.

### `i18n.ts`: runtime

The runtime exposes helpers including:

```text
t(...)
getI18nLanguage()
setI18nLanguage(...)
applyDocumentLanguage(...)
localizedValue(...)
localizedTextClass()
```

Interface copy uses:

```ts
t("common.back")
```

Bilingual educational data already stored in JSON uses:

```ts
localizedValue(
    item.title,
    item.title_fa
)
```

### Interface copy and educational content are separate concerns

The important rule is:

```text
src/i18n/*.ts
    =
application interface copy

data/**/*.json
    =
educational content
```

Lessons should therefore not be duplicated into the i18n catalogues.

### No language branching in business logic

Controllers and engines should not reintroduce conditions such as:

```ts
if (lang === "fa") {
    ...
}
```

Interface copy goes through `t()`, while bilingual educational values go through `localizedValue()`.

This rule is protected by architecture tests.

---

## Architecture

### Main structure

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

### Responsibilities

The MVP is converging on these responsibilities:

```text
app.ts / router.ts
    → bootstrap and top-level navigation

pages/ + features/* controllers
    → orchestration, events and screen state

core/*Engine.ts + feature engines
    → reusable logic and state

ui/views/*.ts
    → HTML and presentation

i18n/*.ts
    → interface copy and LTR/RTL direction

data/**/*.json
    → educational content

types/
    → global TypeScript contracts
```

### Controllers / pages

They may:

- receive user interactions;
- call engines;
- coordinate transient screen state;
- call Views;
- manipulate already-rendered DOM when required.

They should not grow large structural HTML templates again.

### Engines

Engines own reusable logic such as:

- data loading;
- calculations;
- question selection;
- answer validation;
- progress;
- placement;
- domain state.

They should not generate interface templates.

### Views

Files under `src/ui/views/` own presentation:

- structural HTML;
- labels;
- screen-specific layout;
- `data-*` attributes used by controllers;
- i18n calls.

### `data/`

A key principle is:

```text
src/  = how the application works
data/ = what the application teaches
```

Lessons and packs are mostly represented as JSON so educational content can grow independently from the application engine.

### Classic scripts are an explicit transitional state

Dino currently uses neither React nor Vue.

Application TypeScript is still compiled to **classic browser scripts** using `module: none`. `index.html` therefore defines an explicit loading order.

> Script order is currently a real application dependency.

The next structural migration is to explicit `import` / `export` dependencies.

### Dependency graph

The automatically generated dependency graph is intentionally **postponed until the explicit-import migration is complete**.

Before that migration, a tool would need to infer relationships from globals and script order. After it, a generator can read the TypeScript imports directly and produce a reliable graph.

The intended future output will document the real relationships between:

```text
page / controller
        ↓
engine(s)
        ↓
view
        ↓
DOM
```

without maintaining a hand-written dependency graph.

---

## Tests and quality

### Commands

```bash
npm test
npm run test:data
npm run test:architecture
npm run typecheck
npm run build
npm run knip
npm run duplication
```

`npm test` automatically runs files matching:

```text
tests/**/*.test.ts
```

Adding another test therefore does not require editing `package.json`.

### Data tests

Tests under:

```text
tests/data/
```

protect educational-data consistency.

The repository currently includes a Travel lesson identifier consistency test.

### Architecture tests

Tests under:

```text
tests/architecture/
```

protect structural invariants.

`ui-boundaries.test.ts` notably protects against:

- structural HTML returning to controllers, pages or engines;
- inline DOM handlers such as `onclick="..."`;
- direct interface-language branching returning to business logic;
- migrated Views disappearing;
- the legacy Travel renderer returning;
- classic script dependency order being broken in `index.html`.

The architecture is therefore no longer only a written convention: it has an executable regression guard.

### CI

GitHub Actions currently runs:

```text
tests             → blocking for the job
TypeScript        → blocking for the job
production build  → blocking for the job
Knip              → informative
jscpd             → informative
```

A test, typecheck or build regression therefore makes the CI job fail.

GitHub branch/ruleset configuration remains separate from this repository code.

---

## Installation

### Requirements

The project requires:

- Git;
- **Node.js 22.6 or newer**;
- npm.

Check your environment:

```bash
node --version
npm --version
git --version
```

### Clone the `increment` branch

```bash
git clone https://github.com/Slimtrat/Dino-5monde.git
cd Dino-5monde
git checkout increment
```

### Install dependencies

```bash
npm ci
```

### Verify the project

```bash
npm test
npm run typecheck
npm run build
```

### Build

```bash
npm run build
```

The build is generated in:

```text
dist/
```

The build script also copies required static assets, including `index.html`, educational data and styles.

### Run locally

Dino loads JSON data through `fetch()`, so `dist/` should be served through HTTP instead of opening `index.html` directly using `file://`.

Example:

```bash
python -m http.server 8080 --directory dist
```

Then open:

```text
http://localhost:8080
```

---

## Adding educational content

Educational content should remain as independent from application code as possible.

Examples:

```text
data/lessons/       → general lessons / grammar
data/vocabulary/    → vocabulary packs
data/travel/        → Travel path
```

For Travel:

```text
data/travel/lessons.json
```

contains the index, while detailed lesson files live in:

```text
data/travel/lessons/
```

Before contributing content, verify that:

1. its identifier is stable and unique;
2. its structure matches the expected contract;
3. index entries and detailed files remain coherent;
4. required educational translations are present;
5. `npm test` passes.

---

## Contributing

### Before opening a Pull Request

At minimum:

```bash
npm test
npm run typecheck
npm run build
```

When relevant:

```bash
npm run knip
npm run duplication
```

### Principles

- keep changes focused;
- do not recreate an engine when a shared engine already exists;
- keep structural HTML under `src/ui/views/`;
- use `t()` for interface copy;
- use `localizedValue()` for bilingual educational data;
- keep educational data under `data/` whenever possible;
- avoid monolithic files;
- preserve stable identifiers;
- add a test when an invariant deserves protection.

### Architectural direction

The target is to converge towards:

```text
simple controllers
        +
reusable engines
        +
dedicated views
        +
JSON content
        +
centralised i18n
        +
explicit dependencies
```

The future explicit-import migration will then make it possible to generate the architecture dependency graph automatically and detect unwanted dependencies more precisely.

---

## Product direction

Natural next steps include:

- completing the Daily path;
- building Games;
- completing the global Exercises area;
- building the Profile area;
- strengthening exercises;
- adding more data-consistency tests;
- using learner mistakes to recommend reviews;
- improving consistency across CEFR levels;
- eventually adding accounts and cross-device synchronisation.

These items describe **direction**, not already delivered functionality.

---

[← Main README](README.md) · [🇫🇷 Français](README.fr.md) · [🇮🇷 فارسی](README.fa.md)
