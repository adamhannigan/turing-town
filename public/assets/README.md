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

These images can be generated using the Scenario AI API:

### Using GitHub Actions (Recommended)
1. Go to the **Actions** tab in GitHub
2. Run the **Generate AI Images** workflow
3. Images will be generated and committed automatically

This method has proper network access and uses the credentials configured in the **copilot** environment.

### Using Command Line Locally
See **[docs/GENERATING_IMAGES.md](../../docs/GENERATING_IMAGES.md)** for detailed instructions on:

- Setting up Scenario API credentials locally
- Running the image generation script
- Customizing image styles and prompts
- Adding new building assets

> **Note**: The GitHub Copilot agent cannot directly access external APIs due to network restrictions. Use the GitHub Actions workflow or generate locally.

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
