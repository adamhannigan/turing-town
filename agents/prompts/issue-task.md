# Issue task prompt

Use this when an agent picks up a GitHub issue (bug or incremental feature).

## Instructions

1. Read the issue title and body. Identify whether it is a **bug** or a **feature request**.
2. If the issue lacks details (e.g. steps to reproduce, expected vs actual, or clear acceptance criteria), respond on the issue asking for:
   - For bugs: steps to reproduce, expected behavior, actual behavior, environment (browser, OS).
   - For features: desired behavior, where it should appear (HUD, grid, new building type, etc.), and any constraints.
3. Once details are sufficient (or for trivial fixes), comment that you are **working on this** and create a branch (e.g. `issue-<number>-short-slug`).
4. Implement the fix or feature in `src/` following the rules in `agents/context/game-rules.md`. Do not break the core loop (place → earn → collect → place more).
5. Open a PR targeting the default branch. In the PR description, reference the issue (e.g. `Fixes #123`).
6. When the PR is ready (or merged), comment on the issue that the **ticket is done** and link the PR.

## Context to always load

- `agents/context/game-rules.md` – rules of the game and where to put code.
- Relevant files under `src/` for the area you are changing (e.g. `src/game/actions.ts`, `src/hud/HUD.tsx`).

## Image tasks

The game currently uses **placeholder images** in `public/assets/` (see `public/assets/README.md`). If the issue asks for new art, add or replace PNGs there; the Scene AI skill in `agents/skills/images.ts` is not set up yet, so do not rely on it unless Scenario credentials are configured.
