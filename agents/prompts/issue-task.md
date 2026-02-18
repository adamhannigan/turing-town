# Issue task prompt

Use this when an agent picks up a GitHub issue (bug or incremental feature). These instructions are passed to GitHub Copilot and other agents working on this repo.

## Instructions

1. Read the issue title and body. Identify whether it is a **bug** or a **feature request**.
2. If the issue lacks details (e.g. steps to reproduce, expected vs actual, or clear acceptance criteria), respond on the issue asking for:
   - For bugs: steps to reproduce, expected behavior, actual behavior, environment (browser, OS).
   - For features: desired behavior, where it should appear (HUD, grid, new building type, etc.), and any constraints.
3. Once details are sufficient (or for trivial fixes), create a branch (e.g. `issue-<number>-short-slug`) and implement in `src/` following **`agents/context/game-rules.md`**. Do not break the core loop (place → earn → collect → place more).
4. **If the mechanic or change requires a new image** (new building, icon, tile, UI art):
   - Generate the image using the **Scenario API** via **`agents/skills/images.ts`** (`requestImage`). **Use the correct model:** for **UI elements** (buttons, icons, HUD) use **`SCENARIO_MODEL_UI`**; for **game/Phaser assets** (buildings, roads, tiles) use **`SCENARIO_MODEL_GAME_ASSETS`** (isometric style). See `agents/skills/README.md` for usage. Ensure `SCENARIO_API_KEY` and `SCENARIO_API_SECRET` are configured (repo secrets or env).
   - **Download** the image from the returned URL and **store it in the repo** under **`public/assets/`** (e.g. `public/assets/newbuilding.png`). Use PNG; dimensions appropriate for the game (e.g. 56×56 for building sprites).
   - **Wire it in**: add the image in `src/game/scene.ts` preload (e.g. `this.load.image('newbuilding', baseUrl + 'assets/newbuilding.png')`) and reference the same key in the building catalog or ECS sprite. Commit the new asset file with the code change.
   - If Scenario credentials are not available, add a placeholder PNG under `public/assets/` (or run `npm run generate-placeholders` and rename) and note in the PR that the asset should be replaced via Scenario once configured.
5. Open a PR targeting the default branch. In the PR description, reference the issue (e.g. `Fixes #123`). Mark ready for review when done.
6. When the PR is merged, the issue will be commented and closed automatically.

## Context to always load

- **`agents/context/game-rules.md`** – rules of the game, where to put code, and **how to add new images** (Scenario API → `public/assets/` → scene preload).
- **`agents/skills/images.ts`** and **`agents/skills/README.md`** – when the task needs new art, use the Scenario skill and store output in the repo.
- Relevant files under `src/` for the area you are changing (e.g. `src/game/state.ts`, `src/game/actions.ts`, `src/game/scene.ts`, `src/hud/HUD.tsx`).

## Image tasks summary

| Step | Action |
|------|--------|
| 1 | Use `agents/skills/images.ts` → `requestImage({ prompt, modelId, width?, height? })`. **modelId:** `SCENARIO_MODEL_UI` for UI elements; `SCENARIO_MODEL_GAME_ASSETS` for buildings/roads/tiles (isometric). |
| 2 | Save the image to **`public/assets/<name>.png`** in the repo (download from result URL). |
| 3 | In `src/game/scene.ts` preload: `this.load.image('<key>', baseUrl + 'assets/<name>.png')`. |
| 4 | Use the same `<key>` in the building catalog or ECS sprite component. |
