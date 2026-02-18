# turing-town

A city-builder with endless possibilities. The game is driven by a living GitHub community: feature proposals and bug fixes from Discussions become real PRs.

## Project layout

- **`src/`** – The playable game (TypeScript, React, Vite, Phaser, ECS). Agents can commit directly here.
- **`agents/`** – Prompts, context (game rules), and skills for the GitHub Copilot Coding Agent and automation.
  - `agents/context/` – Game rules and design doc agents must follow.
  - `agents/prompts/` – Task templates (e.g. issue handling).
  - `agents/skills/` – Scripts agents can run (e.g. `images.ts` for Scenario AI image generation).
- **`.github/workflows/`** – GitHub Action that triages issues (ask for details, acknowledge, working on it, done). See `agents/README.md` for secrets (e.g. Scenario API, `GITHUB_TOKEN`).

## Run the game (SimCity v0.1)

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173).

### Core loop

1. **Place** – Click “Build House (25)” then click a grid tile to place a building.
2. **Earn** – Buildings generate coins over time.
3. **Collect** – Click “Collect coins” to add earned coins to your balance.
4. **Place more** – Use coins to build more houses and grow your town.

Progress resets on every browser refresh.
