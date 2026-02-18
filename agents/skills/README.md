# Agent skills

Scripts and tools that agents (e.g. GitHub Copilot) run when handling issues.

## images.ts (Scenario AI)

**Purpose:** Generate images for the game (buildings, icons, tiles) via Scenario API. When an issue or mechanic **requires a new image**, agents must:

1. **Building sprites:** Run **`npm run generate-images`** (see `scripts/generate-images.ts`). It uses this skill with the isometric model and writes to **`public/assets/<id>.png`**. Prefer this over calling `requestImage` directly so Scenario is always used when credentials are available.
2. **UI or other assets:** Call this skill with the **correct model** (see below); **store** the image under **`public/assets/<name>.png`** (download from the returned URL).
3. Wire assets in via `src/game/scene.ts` preload and the building catalog or ECS.

**Which model to use:**

- **UI elements** (buttons, icons, HUD art): use **`SCENARIO_MODEL_UI`** (`model_mcYj5uGzXteUw6tKapsaDgBP`).
- **Game/Phaser assets** (buildings, roads, tiles): use **`SCENARIO_MODEL_GAME_ASSETS`** (`model_nB7x6dxqtxtmFDm8tdFdv9xP`) — **isometric** style, matches gameplay.

**Environment (GitHub repo secrets or local ENV):**

- `SCENARIO_API_KEY` – (required) Scenario API key.
- `SCENARIO_API_SECRET` – (required) Scenario API secret.
- `SCENARIO_MODEL_ID` – (optional) Fallback when `modelId` is not passed.

**Usage:**

```ts
import { requestImage, SCENARIO_MODEL_UI, SCENARIO_MODEL_GAME_ASSETS } from "./images";

// UI element (e.g. HUD icon)
const uiResult = await requestImage({
  prompt: "simple flat icon for collect coins button, game UI",
  modelId: SCENARIO_MODEL_UI,
  width: 64,
  height: 64,
  aspectRatio: "1:1",
});

// Game asset (building, road, tile) — isometric
const assetResult = await requestImage({
  prompt: "isometric pixel art house, 56x56, green roof, game asset",
  modelId: SCENARIO_MODEL_GAME_ASSETS,
  width: 56,
  height: 56,
  aspectRatio: "1:1",
});
// Download from result.url and save to public/assets/<name>.png, then use in scene preload.
```

If Scenario is not configured, add a placeholder in `public/assets/` and note in the PR that the asset should be replaced via Scenario once credentials are set.
