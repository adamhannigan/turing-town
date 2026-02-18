# turing-town

A city-builder with endless possibilities. The game is driven by a living GitHub community: feature proposals and bug fixes from Discussions become real PRs.

## Project layout

- **`src/`** – The playable game (TypeScript, React, Vite, Phaser, ECS). Agents can commit directly here.
- **`Agents/`** – (Planned) Scripts, soul files, prompts and rules for agent-driven development.

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
