# Issue task prompt

Use this when an agent picks up a GitHub issue (bug or incremental feature). These instructions are passed to GitHub Copilot and other agents working on this repo.

## Instructions

1. Read the issue title and body. Identify whether it is a **bug** or a **feature request**.
2. If the issue lacks details (e.g. steps to reproduce, expected vs actual, or clear acceptance criteria), respond on the issue asking for:
   - For bugs: steps to reproduce, expected behavior, actual behavior, environment (browser, OS).
   - For features: desired behavior, where it should appear (HUD, grid, new building type, etc.), and any constraints.
3. Once details are sufficient (or for trivial fixes), create a branch (e.g. `issue-<number>-short-slug`) and implement in `src/` following **`agents/context/game-rules.md`**. Do not break the core loop (place → earn → collect → place more).
4. **If the mechanic or change requires a new image** (new building, icon, tile, UI art):
   - **Building sprites:** Run **`npm run generate-images`** (or `npm run generate-images shop factory` for specific IDs). This uses Scenario and writes to **`public/assets/<id>.png`**. Do **not** use placeholders when this command succeeds. If it fails (e.g. missing `SCENARIO_API_KEY` / `SCENARIO_API_SECRET`), add a placeholder and note in the PR that assets should be replaced via Scenario once the **copilot** environment has those secrets.
   - **UI elements** (buttons, icons, HUD): use **`agents/skills/images.ts`** with **`SCENARIO_MODEL_UI`** (`requestImage`); download from the returned URL and save to **`public/assets/`**.
   - **Wire it in**: add the image in `src/game/scene.ts` preload and reference the same key in the building catalog or ECS sprite. Commit the new asset file with the code change.
5. Open a PR targeting the default branch. In the PR description, reference the issue (e.g. `Fixes #123`). Mark ready for review when done.
6. When the PR is merged, the issue will be commented and closed automatically.

## Context to always load

- **`agents/context/game-rules.md`** – rules of the game, where to put code, and **how to add new images** (Scenario API → `public/assets/` → scene preload).
- **`agents/skills/images.ts`** and **`agents/skills/README.md`** – when the task needs new art, use the Scenario skill and store output in the repo.
- Relevant files under `src/` for the area you are changing (e.g. `src/game/state.ts`, `src/game/actions.ts`, `src/game/scene.ts`, `src/hud/HUD.tsx`).

## Image tasks summary

| Step | Action |
|------|--------|
| 1 | **Buildings:** Run **`npm run generate-images`** (or with IDs, e.g. `npm run generate-images shop`). **UI:** Use `requestImage` with `SCENARIO_MODEL_UI` from `agents/skills/images.ts`. |
| 2 | Ensure the image is in **`public/assets/<name>.png`** (script writes there; for UI, download from result URL). |
| 3 | In `src/game/scene.ts` preload: `this.load.image('<key>', baseUrl + 'assets/<name>.png')`. |
| 4 | Use the same `<key>` in the building catalog or ECS sprite component. |
