# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step. Open `index.html` directly in Chrome:

```
start chrome "C:\Code\claude_code\learning_games\index.html"
```

The app runs from `file://`. There is no server, no npm, no bundler. Do not introduce any of these.

The font (`fonts/PressStart2P-Regular.ttf`) must remain local — Google Fonts CDN does not load from `file://`.

## Architecture

Single-page app with four screens toggled by `showScreen(id)` in `game.js`. All scripts are loaded as plain globals in `index.html` in this order, which defines their dependency:

```
db.js → speech.js → rewards.js → bonus.js → game.js
```

### File responsibilities

| File | Role |
|---|---|
| `db.js` | All localStorage access. Two keys: `spellingQuest_wordLists` (array of `{id, label, words[], dateAdded}`) and `spellingQuest_mobIndex` (int 0–5). `saveWordList` deduplicates by sorted word set. `getAllWordLists` also deduplicates on read to clean up any pre-fix duplicates. `deleteWordList(id)` removes a list by id. |
| `speech.js` | Thin wrapper around `window.speechSynthesis`. Exports `speech.speak(text)`, `speech.speakWord(word)`, `speech.setVoicePreference(pref)`, and `speech.listVoices()`. Voice preference is `'us'` (Google US English) or `'uk-female'` (Google UK English Female). Voices load async — uses `onvoiceschanged` to populate. |
| `rewards.js` | Pixel-art mob rendering via `<canvas>` and block-burst particle animation. `MOBS` array holds 6 entries (Creeper, Pig, Cow, Chicken, Enderman, Sheep) as 2-D token grids decoded by `parseGrid()`. `revealMob(index)` draws the mob into `#champion-mob`. `triggerBlockBurst()` spawns 20 CSS-transitioned particles. |
| `bonus.js` | Self-contained endless runner bonus game. IIFE exporting `bonus.startGame(onDead)` and `bonus.stopGame()`. Canvas 960×380 internal resolution. Three obstacle types: pig (30px, weight 4), creeper (50px, weight 4), enderman (76px, weight 1). Variable jump: hold Space for tall arc (reduced gravity while rising), tap for short hop. `onDead` callback is fired when player collides; game.js shows the home button in response. |
| `game.js` | All game logic: screen transitions, word list I/O (export/import JSON file), session state (`gs`), letter-slot input system, `blankWord()` difficulty logic, feedback overlay, champion screen, bonus game integration. |
| `style.css` | Minecraft theme. CSS variables in `:root`. Pixel art uses `image-rendering: pixelated` on canvas elements. |

### Screens

| Screen ID | Purpose |
|---|---|
| `parent-screen` | Word list entry, history, difficulty/voice settings |
| `game-screen` | Active spelling session |
| `champion-screen` | Session result — mob reveal, score, practice words |
| `bonus-screen` | Endless runner (perfect score only) |

`showScreen(id)` is defined in `game.js` and toggles `.hidden` on all four screens.

### Game state (`gs` in `game.js`)

```js
{ words[], wordIndex, attempts, correctCount, wrongWords[], results[] }
```

`results[]` accumulates `'correct'` or `'wrong'` per word and drives the progress pip row.

Session flow: `startQuest()` → `nextWord()` → `renderWord()` → keydown handler → `checkAnswer()` → `handleCorrect()` / `handleWrong()` → `nextWord()` or `endSession()`.

### Letter-slot input system

There is no `<input>` element during gameplay. A global `document.addEventListener('keydown', ...)` captures all alpha keys, Backspace, and Enter while `awaitingInput === true`. `typedLetters[]` holds the current in-progress answer. `updateLetterSlots()` syncs the DOM. `awaitingInput` is set `false` during feedback display and `true` when a new word is rendered.

### Difficulty levels (`blankWord` in `game.js`)

| Level | Hint shown | Blanks |
|---|---|---|
| easy | All letters except 1 random (never first) | 1 |
| medium | Most letters | 2 (≤4-letter words) or 3 (longer) |
| hard | First 1–2 letters only | rest |
| extreme | All blanks; word spoken aloud | all |

### Voice selection (`speech.js`)

Available voices confirmed on this machine (run `speech.listVoices()` in DevTools to check):
- `Google US English` — default, neural, high quality
- `Google UK English Female` — alternate, selectable via UI toggle on parent screen

`speech.setVoicePreference('us' | 'uk-female')` switches the active voice.

### Progress row

Replaces the old XP bar. A row of 22×22px block pips at the top of the game screen:
- Dark/empty — not yet attempted
- Green ✓ — correct
- Red ✗ — wrong (3 misses and revealed)

Only correct answers fill green pips; wrong reveals do not advance the row.

### Parent screen — new word list panel

The "New Word List" panel has a collapsible body (`#new-list-body`) toggled by clicking the panel header. The label/textarea collapse; the difficulty toggles and Start Game button always stay visible. The panel auto-collapses after `startQuest()` and on page load if any lists exist — so the child cannot see the word list on the home screen.

### Champion screen — conditional messaging

- **Perfect score**: title "YOU DID IT!", subtitle "Spelling Champion!", score text "Perfect score! BONUS ROUND unlocked!", **BONUS ROUND!** button shown, Play Again hidden.
- **Imperfect score**: title "NICE TRY!", subtitle "Keep Practicing!", practice words listed, Play Again shown, BONUS ROUND! hidden.

Both paths show the mob reveal. Play Again and Change Words both navigate to `parent-screen`.

### Bonus runner (`bonus.js`)

Triggered from champion screen BONUS ROUND! button (perfect scores only).

- **Physics**: gravity 1200 px/s² normal, 360 px/s² while jump held and rising (Mario-style variable arc). Jump velocity −430 px/s. Tap = short hop (~77px), hold = full arc (~160px).
- **Obstacles**: pig (30px tall, weight 4), creeper (50px, weight 4), enderman (76px, weight 1 — rare). Spawned with weighted random; 25% chance of a long breathing gap.
- **Difficulty ramp**: speed 200→480 px/s, +10 px/s every 5 seconds. Min obstacle gap shrinks from 300px to 130px over ~90 seconds.
- **AABB collision**: 5px inset on all sides (forgiveness for young players).
- **Game over**: RAF loop stops, `onDead` callback fires → game.js shows `#bonus-home-btn` below canvas. Player clicks button to return home; no auto-navigate.
- **Score**: `Math.floor(distance / 10)` displayed as "BLOCKS".

### Persistence

- **Session**: `localStorage` (`spellingQuest_wordLists`). Survives browser restart but not browser data clear.
- **Durable**: Parent clicks "Save to File" → downloads `spelling-quest-wordlists.json`; "Load from File" merges by id. Intended long-term backup.
- **Delete**: Each history item has a red ✕ button that calls `deleteWordList(id)` and re-renders.

## Development Workflow

### Branch strategy

```
main        ← production (GitHub Pages live site)
staging     ← integration branch; all PRs target here first
feature/*   ← new features, cut from staging
bugfix/*    ← bug fixes, cut from staging
chore/*     ← staging → main promotions and housekeeping
```

**Never push directly to `main` or `staging`.** All work goes through a PR.

### Starting a task

1. Check out `staging` and pull latest: `git checkout staging && git pull`
2. Cut a new branch from `staging`:
   - Feature: `git checkout -b feature/ps-N-short-description`
   - Bug fix: `git checkout -b bugfix/ps-N-short-description`
3. Do the work, commit with the story number in the message (see below)
4. Notify the user to test locally via `python serve.py`
5. On approval, open a PR from the feature/bugfix branch into `staging`

### Promoting staging → main

1. Use branch name `chore/staging-to-main` (or `chore/ps-N-release` if tied to a story)
2. PR description must list every story/change being promoted (not just "merge staging")
3. After merge, GitHub Pages auto-deploys from `main`

### Commit message format

```
ps-N: short imperative description

- bullet detail if needed
```

Example: `ps-4: add difficulty toggle persistence`

### PR format

- Title: `ps-N: short description` (feature/bugfix) or `chore: promote staging → main [ps-N, ps-M]`
- Body: what changed, how to test, story reference

### Work tracking (Beads)

- All stories live in Beads
- Story IDs are sequential and take the form `ps-1`, `ps-2`, `ps-3`, …
- Open a story before starting work; close it when the PR merges to `staging`

### Versioning

- SemVer: `MAJOR.MINOR.PATCH` (currently in `0.x` pre-release)
- Bump the patch on every change; update `#version-badge` in `index.html`
- Update `CACHE` constant in `sw.js` to match (triggers service worker refresh)

### Staging preview URL

GitHub Pages free tier only publishes one branch (currently `main`). For staging:
- Test locally with `python serve.py` before opening the staging PR
- If a hosted staging URL becomes useful later, Netlify or Cloudflare Pages support free branch-preview deployments

## Planned future work

- Math phase: addition, subtraction, number recognition (not yet started; keep game.js difficulty logic cleanly separable)
