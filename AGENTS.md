# Instructions for GitHub Copilot and other agents

When working on issues in this repo, follow the context and prompts in **`agents/`**.

## Must read

- **`agents/context/game-rules.md`** – Tech stack, core loop, ECS, where to put code, and **how to add new images**.
- **`agents/prompts/issue-task.md`** – Step-by-step issue handling and when to generate images.

## New images (mechanics, buildings, UI)

If the mechanic or change **requires a new image** (new building, icon, tile):

1. **Generate** it using the Scenario API via **`agents/skills/images.ts`** (`requestImage`). **Use the correct model:** **`SCENARIO_MODEL_UI`** for UI elements (buttons, icons, HUD); **`SCENARIO_MODEL_GAME_ASSETS`** for game/Phaser assets (buildings, roads, tiles) — that model is **isometric** and matches our gameplay style. See **`agents/skills/README.md`** for usage. Requires `SCENARIO_API_KEY` and `SCENARIO_API_SECRET` (repo secrets or env).
2. **Store** the image in the repo under **`public/assets/<name>.png`** (download from the API result URL). Commit the file.
3. **Use** it in the game: add to `src/game/scene.ts` preload and reference the same key in the building catalog or ECS sprite.

Do not rely on external URLs at runtime: always save generated images into **`public/assets/`** and reference them from the repo.
