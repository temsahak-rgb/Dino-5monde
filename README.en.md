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
| Daily, Games, global Exercises, Profile | Outside the published scope; no placeholder route is exposed |
| Remote user accounts | ❌ Not implemented |
| Cross-device sync | ❌ Not implemented |

Progress currently relies mainly on `localStorage`.

This keeps the MVP simple, but it means:

- progress is not synchronised between browsers or devices;
- clearing local site data can remove saved progress.

---

## Features

### 📚 Grammar

The Grammar module provides an **A1 to C1** level selector, level-based catalogues and structured lessons.

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
- pack-powered mini-games: Hangman, Word Search and Crosswords;
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

Components and engines should not reintroduce conditions such as:

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
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── AppRouter.tsx
│   │   ├── AppLayout.tsx
│   │   └── routes.ts
│   │
│   ├── core/
│   │   ├── exerciseEngine.ts
│   │   ├── lessonEngine.ts
│   │   ├── placementEngine.ts
│   │   ├── progressEngine.ts
│   │   └── staticData.ts
│   │
│   ├── features/
│   │   ├── exercises/
│   │   ├── grammar/
│   │   ├── news/
│   │   ├── onboarding/
│   │   ├── search/
│   │   ├── travel/
│   │   └── vocabulary/
│   │
│   ├── i18n/
│   │   ├── fr.ts
│   │   ├── fa.ts
│   │   └── i18n.ts
│   │
│   ├── pages/          # route components
│   ├── ui/components/  # shared React components
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
src/main.tsx
    → mounts the React root

app/App.tsx + AppRouter.tsx + AppLayout.tsx + routes.ts
    → global providers, routes and shared shell

pages/*.tsx
    → route screens and orchestration

ui/components/*.tsx + features/**/*.tsx
    → declarative presentation, interactions and local state

features/**/*.ts + core/*.ts
    → framework-independent engines, repositories and logic

i18n/*.ts
    → interface copy and LTR/RTL direction

data/**/*.json
    → educational content

types/
    → exported TypeScript contracts
```

### Shareable navigation

Every durable screen has a canonical React Router path, for example:

```text
/grammar/A1
/grammar/lesson/A1-G-001
/vocabulary/B1/arrival-office
/travel/TR-006
/journal/2026-w34-azadi-tower
/info/about
```

These URLs support direct opening, reload, and browser Back/Forward. React Router owns navigation, `routes.ts` centralises the durable path contract, and the onboarding loader preserves the requested destination. Transient state—current question, score, flipped card, game board, or subsection—intentionally stays out of the URL.

### Pages and React components

Pages under `src/pages/`:

- read route parameters;
- call engines;
- load and coordinate screen data;
- compose feature components and shared components.

Components under `src/features/` own domain interactions and local state. Components under `src/ui/components/` provide shared building blocks and the application shell. Rendering stays declarative in JSX; these layers must not reintroduce imperative DOM orchestration.

### Engines

Engines own reusable logic such as:

- data loading;
- calculations;
- question selection;
- answer validation;
- progress;
- placement;
- domain state.

They should neither import React nor produce interface components.

### `data/`

A key principle is:

```text
src/  = how the application works
data/ = what the application teaches
```

Lessons and packs are mostly represented as JSON so educational content can grow independently from the application engine.

### React, Vite and explicit dependencies

Dino is a **React + TypeScript** SPA. Vite transforms `src/main.tsx`, the only entry point declared by `index.html`, and produces the optimised ES module build. Every runtime and type dependency is declared with an `import`, and shared APIs use explicit `export` declarations.

React Router owns screens and browser history; the browser and Vite derive loading order from the module graph.

### Dependency graph

The [generated application graph](docs/dependency-graph.md) contains every local dependency reachable from `src/main.tsx`. Its main view follows the React tree—App, router, layout, pages, components and features—before engines and source modules. Collapsible branches then detail each domain. Type-only imports are tracked but hidden from the diagrams to keep them readable.

```bash
npm run graph:dependencies
npm run graph:dependencies:check
```

The file is deterministic: the first command regenerates it, while the second verifies it without writing.
The generator also rejects every runtime dependency cycle. Architecture tests reinforce that guarantee by preventing the legacy bootstrap, router and Views from returning, and by keeping engines independent from React and UI components.

---

## Tests and quality

### Commands

```bash
npm test
npm run test:app
npm run test:data
npm run test:features
npm run test:architecture
npm run test:e2e:install
npm run test:e2e
npm run typecheck
npm run build
npm run knip
npm run duplication
npm run graph:dependencies:check
```

`npm test` automatically runs files matching:

```text
tests/**/*.test.ts
```

Adding another test therefore does not require editing `package.json`.
`npm run test:app` is the blocking code-quality subset; corpus tests are intentionally isolated in `npm run test:data` and their dedicated workflow.

### Cucumber feature contracts

Scenarios under `features/` are written in English. Every scenario inherits exactly one lifecycle state: `@implemented` is executed and blocking; `@planned` remains visible in progress without being executed. Cucumber covers pure product contracts, while Playwright remains solely responsible for browser journeys.

### Browser E2E tests

The Playwright suite exercises the real application startup, the French ↔ Persian interface switch (visible copy, `lang`, and `dir`), and language persistence after navigation and a full reload.

Install Chromium once before the first local run:

```bash
npm run test:e2e:install
```

Then run the scenarios against a production build served automatically on a deterministic local port:

```bash
npm run test:e2e
```

Installing Chromium requires network access. No manually managed server or reference screenshot is required.

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

Architecture tests notably protect against:

- the legacy bootstrap, router and View files returning;
- the React mount or declared routes disappearing;
- direct interface-language branching returning to business logic;
- engines depending on React or interface components;
- classic scripts or multiple entry points returning to `index.html`.

The architecture is therefore no longer only a written convention: it has an executable regression guard.

### CI

The code-quality GitHub Actions workflow runs:

```text
application tests → blocking for the job
TypeScript        → blocking for the job
production build  → blocking for the job
Knip              → informative
jscpd             → informative
```

A test, typecheck or build regression therefore makes the CI job fail.

The dedicated **Dependency graph** workflow runs manually, executes `npm run graph:dependencies`, and commits only `docs/dependency-graph.md` to the selected branch when it changes. Its `[skip ci]` commit triggers neither application checks nor deployment.
The dedicated **Corpus quality** workflow runs `npm run test:data` and publishes readable file/field errors in its summary and artifact.
The dedicated **Browser E2E** workflow installs Chromium only, starts the local build, and blocks CI when startup or i18n regresses.
The dedicated **Feature contracts** workflow executes `@implemented` Cucumber scenarios, enforces the lifecycle-tag policy, and publishes HTML/JUnit reports.
The secured **Project Vigie** workflow then runs from the trusted `develop` branch, never checks out pull-request code, and never replays the test suites. It consolidates existing results into one persistent comment with three collapsible panels — **Data**, **Technical**, and **Features** — plus status lights and progress bars. Feature progress is measured automatically from delivered, planned, and invalid scenarios while pull-request `.feature` files are handled only as non-executable data.

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

Vite compiles React and Tailwind, emits optimised assets, copies educational data through the project plugin, and regenerates the search index.

### Run locally

Start the Vite development server:

```bash
npm run dev
```

To inspect the production build locally:

```bash
npm run build
npm run preview
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
- keep route screens under `src/pages/`, domain components under `src/features/`, and shared building blocks under `src/ui/components/`;
- keep engines and repositories independent from React;
- use `t()` for interface copy;
- use `localizedValue()` for bilingual educational data;
- keep educational data under `data/` whenever possible;
- avoid monolithic files;
- preserve stable identifiers;
- add a test when an invariant deserves protection.

### Architectural direction

The target is to converge towards:

```text
simple route pages
        +
reusable engines
        +
dedicated React components
        +
JSON content
        +
centralised i18n
        +
explicit dependencies
```

Explicit imports now feed the architecture graph automatically and make unwanted dependencies visible during code review.

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
