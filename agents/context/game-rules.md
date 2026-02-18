# Turing Town – Game Rules & Context

Context for agents implementing features or fixing bugs. Follow these rules when editing `src/` or proposing changes.

## Vision

Turing Town is a browser-based city builder (retro SimCity–style). The community drives development via GitHub Discussions; proposals and bug reports become issues, and agents implement them as PRs.

## Tech Stack (do not change without discussion)

- **Runtime:** Vite, React 18, TypeScript, Phaser 3.
- **Game logic:** ECS in `src/game/ecs/` (world, components, systems). No persistence in v1; state resets on refresh.
- **UI:** React HUD in `src/hud/`; Phaser handles the playable scene only.

## Core Loop (v1 – must preserve)

1. **Place** – Player selects a building type and clicks a grid cell to place it (costs coins).
2. **Earn** – Buildings produce coins over time (e.g. coins per second).
3. **Collect** – Player clicks “Collect coins” to add earned coins to their balance.
4. **Place more** – Player spends coins to place more buildings.

If a change breaks this loop (e.g. placement no longer costs coins, or coins never accumulate), it is a regression.

## Grid & Constants

- Grid size: 8×6 cells (see `GRID_WIDTH`, `GRID_HEIGHT` in `src/game/state.ts`).
- Tile size: 64px.
- Initial coins: 50.

**Building catalog (tycoon-style):** All building types live in `BUILDING_CATALOG` in `src/game/state.ts`. Each has: `id`, `name`, `cost`, `coinsPerSecond`, `unlocked`. Only the first building (House) is unlocked at start; others are locked for future progression. The HUD shows a dropdown of buildings (unlocked selectable, locked shown as “Locked”). New building types: add to the catalog, add a sprite in `public/assets/` and scene preload, and optionally run `npm run generate-placeholders` for a placeholder PNG.

## ECS Conventions

- **Entities** are plain objects with an `id` and optional components (e.g. `gridCell`, `building`, `sprite`).
- **Components** are defined in `src/game/ecs/components.ts`. Add new component types there when adding new gameplay concepts.
- **Systems** live in `src/game/ecs/systems/`. They query entities and mutate component data or game state. Keep systems focused (e.g. one system for coin accumulation).
- **World** is in `src/game/ecs/world.ts`. Use `createEntity`, `queryEntities`, `removeEntity`, `clearWorld`; do not add global mutable state outside the world and `GameState`.

## Where to put new code

- New **buildings or entities** → components + optional new system + Phaser scene sprite/asset handling.
- New **UI (HUD)** → `src/hud/` (React).
- New **gameplay rules** (e.g. costs, rates) → `src/game/state.ts` or `src/game/actions.ts`.
- **Images/assets** for the game → see **New images** below.

## New images (mechanics, buildings, UI art)

When a mechanic or change **requires a new image** (e.g. new building sprite, icon, tile):

1. **Generate** the image using the **Scenario API** via `agents/skills/images.ts`:
   - **UI elements** (buttons, icons, HUD art): use **`SCENARIO_MODEL_UI`** (`model_mcYj5uGzXteUw6tKapsaDgBP`). Example: `requestImage({ prompt: "...", modelId: SCENARIO_MODEL_UI, ... })`.
   - **Game/Phaser assets** (buildings, roads, tiles): use **`SCENARIO_MODEL_GAME_ASSETS`** (`model_nB7x6dxqtxtmFDm8tdFdv9xP`). This is an **isometric** model matching our gameplay style. Example: `requestImage({ prompt: "isometric ...", modelId: SCENARIO_MODEL_GAME_ASSETS, ... })`.
   - Use a clear prompt; for buildings/tiles mention "isometric" when using the game-asset model. Ensure `SCENARIO_API_KEY` and `SCENARIO_API_SECRET` are set (repo secrets or env).
2. **Store** the generated image in the repo under **`public/assets/`** (e.g. `public/assets/buildingname.png`). Download from the returned URL and commit the file. Use PNG; size should match game use (e.g. 56×56 or 64×64 for buildings to match `TILE_SIZE`).
3. **Use** the asset in the game: add `this.load.image('key', baseUrl + 'assets/buildingname.png')` in `src/game/scene.ts` preload, and reference the same key in the building catalog / ECS sprite component.

Do not add placeholder-only art when the task asks for real assets: generate via Scenario, save to `public/assets/`, then wire it in. If Scenario credentials are not available, add a placeholder PNG and note in the PR that the asset should be replaced via Scenario once configured.

## Out of scope for v1

- Persistence (save/load).
- Weather, events, level progression (planned later).
- Multiplayer or backend.

Agents should implement only what the issue or discussion asks for; avoid scope creep.
