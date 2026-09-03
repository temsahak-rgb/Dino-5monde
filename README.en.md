# 🦖 Français avec Dino

[← Main README](README.md) · [🇫🇷 Français](README.fr.md) · **🇬🇧 English**

> A web application for learning French through **short lessons, vocabulary, exercises and practical real-life situations**.

**Navigation:** [Project](#project) · [Features](#features) · [Installation](#installation) · [Architecture](#architecture) · [Contributing](#contributing)

---

## Project

### In one sentence

**Français avec Dino is a web platform that organises French learning into progressive learning paths instead of acting as a simple collection of static lessons.**

Learners can work on grammar, vocabulary and practical situations such as airports, hotels, restaurants or emergencies.

The project is particularly suitable for **Persian-speaking learners**. The interface and many learning resources can use Persian as a support language while keeping French at the centre of the learning experience.

### For someone unfamiliar with language-learning applications

Dino can be understood as a combination of:

- a French textbook;
- an exercise book;
- vocabulary flashcards;
- a level-based learning path;
- a progress tracker.

The basic flow is simple:

```text
Choose how I want to learn
            ↓
Choose or estimate my level
            ↓
Choose a topic
            ↓
Read a lesson
            ↓
Practise
            ↓
Dino remembers my progress
```

### Who is Dino for?

Dino supports several use cases:

- **starting French from the beginning**;
- **structuring an existing learning journey**;
- **reviewing vocabulary**;
- **understanding grammar**;
- **preparing for travel and real situations**;
- learning with **Persian support** when useful.

The content uses **CEFR** levels: A1, A2, B1, B2, C1 and, in some modules, C2.

> Coverage is not identical across the whole application yet: vocabulary data currently ranges from A1 to C2, while grammar and placement are mainly organised up to C1.

---

## Learning experience

### 1. Choose the interface language

On first launch, the application can use:

- French;
- Persian.

The project also handles **RTL** display for Persian text.

### 2. Choose a learning path

The onboarding currently exposes three directions:

- **General French**;
- **Travel French**;
- **Daily French**.

The General path can offer a placement test. The learner can also select a level manually.

### 3. Learn through sections

A lesson can be split into several parts:

```text
Lesson
├── explanation
├── table or examples
├── vocabulary
├── dialogue
├── exercise
└── quiz
```

The engine can remember completed sections and exercise mistakes when the activity supports them.

### 4. Come back later

Progress is stored in the browser with `localStorage`.

This keeps the current application simple and avoids requiring a user-account server, but it has an important limitation:

> **Progress is not yet synchronised between devices or browsers.**

Clearing local website data can also remove saved progress.

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

Grammar data is currently organised mainly from **A1 to C1**.

### 🧠 Vocabulary

The Vocabulary module contains a large amount of level- and topic-based material.

The learning engine includes activities such as:

- **flashcards**;
- simple stories;
- more advanced stories;
- quizzes;
- weak-word tracking;
- dedicated weak-word review.

Vocabulary data currently ranges from **A1 to C2**, with very different coverage depending on level and topic.

### ✈️ Travel

The Travel path is built around practical situations rather than isolated rules.

Topics currently include:

- alphabet and useful numbers;
- short conversations;
- airports and border control;
- luggage problems;
- airport transport;
- hotels and reception desks;
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

Travel lessons can combine:

```text
French + Persian + phonetic support + context + exercises
```

The objective is to let learners **reuse useful French immediately in a real situation**.

### 🔎 Search, news and additional content

The repository also contains search, news and poll features. They complement the core learning experience but are not currently the main learning paths.

### 🚧 Areas still under development

| Area | Current status |
|---|---|
| Grammar | ✅ Functional |
| Vocabulary | ✅ Functional |
| Travel | ✅ Functional |
| Lesson-integrated exercises | ✅ Functional depending on content |
| Search | ✅ Present |
| News | ✅ Present |
| Daily | 🚧 Main page still under development |
| Games | 🚧 Placeholder |
| Global Exercises page | 🚧 Placeholder |
| Profile | 🚧 Placeholder |
| Remote user accounts | ❌ Not implemented |
| Cross-device sync | ❌ Not implemented |

Dino should therefore be considered **a usable educational foundation that is still under active development**.

---

## Installation

### Requirements

The project requires:

- Git;
- **Node.js 22 or newer**;
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

### Build the application

```bash
npm run build
```

The TypeScript build is generated in:

```text
dist/
```

The build script also copies required static resources into `dist/`, including `index.html`, educational data and styles.

### Run locally

Dino loads JSON data through `fetch()`, so `dist/` should be served through HTTP instead of opening `index.html` directly with `file://`.

For example with Python:

```bash
python -m http.server 8080 --directory dist
```

Then open:

```text
http://localhost:8080
```

---

## Useful commands

```bash
npm run build
npm run typecheck
npm test
npm run knip
npm run duplication
```

| Command | Purpose |
|---|---|
| `npm run build` | Compile TypeScript and prepare `dist/` |
| `npm run typecheck` | Check TypeScript types without emitting files |
| `npm test` | Run the current tests |
| `npm run knip` | Analyse potentially unused code |
| `npm run duplication` | Detect duplicated code with jscpd |

The test suite is still limited; it currently includes checks for Travel lesson identifier consistency.

---

## Architecture

### Quick view

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

### `src/`: how Dino works

`src/` contains application behaviour.

Responsibilities are progressively separated into:

- `core/`: shared engines, routing, progress, placement and exercises;
- `features/`: learning features;
- `pages/`: general screens;
- `ui/`: interface helpers and localisation strings;
- `types/`: global TypeScript types;
- `styles/`: CSS.

### `data/`: what Dino teaches

A key architectural principle is:

```text
src/  = the engine

data/ = the educational content
```

Lessons, vocabulary packs and Travel paths are mostly described in JSON.

This makes it possible to grow the educational content without rewriting the whole application.

### A deliberately simple TypeScript architecture

Dino currently uses neither React nor Vue.

TypeScript is compiled to **classic browser scripts** (`module: none`). `index.html` then loads JavaScript files in an explicit order.

An important consequence for developers is:

> **Script order in `index.html` matters**, because several functions are shared globally between files.

The TypeScript migration improves type safety while preserving compatibility with the application's historical global-script architecture.

### No application backend yet

There is currently no backend responsible for:

- user accounts;
- authentication;
- remote progress;
- cloud synchronisation.

Most user state is stored locally in the browser.

---

## Adding educational content

The goal is to keep educational content as independent from the engine as possible.

Examples:

```text
data/lessons/       → general lessons / grammar
data/vocabulary/    → vocabulary packs
data/travel/        → Travel path
```

For Travel, the index lives in:

```text
data/travel/lessons.json
```

and detailed lessons are split into:

```text
data/travel/lessons/
```

This avoids concentrating thousands of lines of learning content in one giant file.

When adding new content, verify that:

1. its identifier is unique;
2. its structure matches the engine's expected data shape;
3. index entries and detailed files stay consistent;
4. build and tests still pass.

---

## Code quality

The repository contains a GitHub Actions quality workflow.

It currently runs checks including:

- data consistency tests;
- TypeScript type checking;
- production build;
- Knip;
- jscpd duplication analysis.

The current workflow is mainly **informative**: after dependency installation, several checks intentionally report issues without immediately failing the whole job. This makes technical debt visible before rules are tightened.

---

## Contributing

### Before opening a Pull Request

At minimum:

```bash
npm run typecheck
npm test
npm run build
```

When relevant, also run:

```bash
npm run knip
npm run duplication
```

### Recommended principles

- keep changes focused;
- do not recreate an engine when a shared engine already exists;
- prefer several coherent files over a monolithic file;
- keep educational data under `data/` whenever possible;
- preserve stable and unique identifiers;
- manually test impacted user flows in the browser.

### Why this matters

Dino already contains far more **educational data** than application code. The long-term risk is therefore not only adding too many features: it is allowing several competing implementations of the same behaviour to grow independently.

The desired direction is progressively closer to:

```text
one shared engine
       +
multiple content types
       +
multiple learning paths
```

rather than a collection of independent pages each reimplementing their own rules.

---

## Project direction

Natural future steps include:

- completing the Daily path;
- building Games;
- building the global Exercises area;
- building the Profile area;
- strengthening exercises and tests;
- using learner mistakes to recommend revisions;
- improving consistency across CEFR levels;
- eventually adding accounts and cross-device synchronisation.

These items describe **direction**, not already delivered functionality.

---

[← Main README](README.md) · [🇫🇷 Français](README.fr.md)
