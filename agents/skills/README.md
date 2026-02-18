# Agent skills

Scripts and tools that agents can run when handling issues (e.g. image generation).

## images.ts (Scenario AI – not set up yet)

**Status:** Scenario API is not configured. The game uses **placeholder images** in `public/assets/` (house.png, shop.png). Replace those files with your own art, or configure Scenario and use this skill later.

**Purpose:** Request images from Scenario AI (text-to-image or image-to-image). Use when an issue or task asks for generating art (e.g. building sprites, icons).

**Environment (GitHub secrets or local ENV):**

- `SCENARIO_API_KEY` – (required) Scenario API key.
- `SCENARIO_API_SECRET` – (required) Scenario API secret.
- `SCENARIO_MODEL_ID` – (optional) Default model ID for generation.

**Usage (when configured):**

```ts
import { requestImage } from "./images";

const result = await requestImage({
  prompt: "small pixel art house, top-down, green roof, 64x64",
  width: 64,
  height: 64,
});
// result.url or result.assetId for the generated image
```

Until then, use `npm run generate-placeholders` to regenerate placeholders, or replace the PNGs in `public/assets/` manually.
