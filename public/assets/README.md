# Game Assets

This directory contains all game assets including building sprites, icons, and tiles.

## Current Images

- **house.png** – House building sprite
- **shop.png** – Shop building sprite
- **factory.png** – Factory building sprite
- **grass-tile.png** – Grass ground tile
- **icon-building.png** – Building placement icon
- **icon-collect.png** – Coin collection icon
- **icon-reset.png** – Reset/trash icon

## Generating AI Images

These images can be generated using the Scenario AI API. See **[docs/GENERATING_IMAGES.md](../../docs/GENERATING_IMAGES.md)** for detailed instructions on:

- Setting up Scenario API credentials
- Running the image generation script
- Customizing image styles and prompts
- Adding new building assets

## Quick Start

To generate AI images for all buildings:

```bash
npm run generate-images
```

To create simple placeholder images (no API credentials needed):

```bash
npm run generate-placeholders
```

## Image Specifications

- **Building sprites**: 56×56 pixels (matches TILE_SIZE - 8)
- **Icons**: 48×48 pixels
- **Tiles**: 64×64 pixels
- Format: PNG with transparency
