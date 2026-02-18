# Instructions for GitHub Copilot and other agents

When working on issues in this repo, follow the context and prompts in **`agents/`**.

## Must read

- **`agents/context/game-rules.md`** – Tech stack, core loop, ECS, where to put code, and **how to add new images**.
- **`agents/prompts/issue-task.md`** – Step-by-step issue handling and when to generate images.

## New images (mechanics, buildings, UI)

If the mechanic or change **requires a new image** (new building, icon, tile):

1. **Building sprites:** Run **`npm run generate-images`** so Scenario is used and images are written to **`public/assets/`**. Do not use placeholders when this succeeds. (For Copilot to have credentials, add **`SCENARIO_API_KEY`** and **`SCENARIO_API_SECRET`** to the repo’s **copilot** environment: Settings → Environments → copilot → Environment secrets.)
2. **UI elements:** Use **`agents/skills/images.ts`** with **`SCENARIO_MODEL_UI`**; download and save to **`public/assets/<name>.png`**.
3. **Use** the asset in the game: add to `src/game/scene.ts` preload and reference the same key in the building catalog or ECS sprite.

Do not rely on external URLs at runtime: always save generated images into **`public/assets/`** and reference them from the repo.
