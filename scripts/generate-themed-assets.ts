#!/usr/bin/env node
/**
 * Generate themed game assets using Scenario AI API.
 * Generates isometric grass tiles, building sprites, and HUD icons.
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { requestImage, SCENARIO_MODEL_UI, SCENARIO_MODEL_GAME_ASSETS } from '../agents/skills/images.js';

async function downloadImage(url: string, outputPath: string): Promise<void> {
  console.log(`Downloading ${url} to ${outputPath}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`✓ Saved ${outputPath}`);
}

async function generateAssets() {
  const assetsDir = resolve(process.cwd(), 'public/assets');
  
  console.log('🎨 Generating themed game assets...\n');
  
  // 1. Generate isometric grass tile (64x64, repeatable)
  console.log('1. Generating isometric grass tile...');
  const grassResult = await requestImage({
    prompt: 'isometric grass tile, seamless, repeatable, game asset, pixel art style, green grass texture, 64x64',
    modelId: SCENARIO_MODEL_GAME_ASSETS,
    width: 64,
    height: 64,
    aspectRatio: '1:1',
  });
  await downloadImage(grassResult.url, resolve(assetsDir, 'grass-tile.png'));
  
  // 2. Generate isometric house (1x1 grid cell, no background, transparent)
  console.log('\n2. Generating isometric house...');
  const houseResult = await requestImage({
    prompt: 'isometric house building, small residential home, pixel art, transparent background, no ground, 64x64, game asset',
    modelId: SCENARIO_MODEL_GAME_ASSETS,
    width: 64,
    height: 64,
    aspectRatio: '1:1',
  });
  await downloadImage(houseResult.url, resolve(assetsDir, 'house.png'));
  
  // 3. Generate isometric shop (1x1 grid cell, no background, transparent)
  console.log('\n3. Generating isometric shop...');
  const shopResult = await requestImage({
    prompt: 'isometric shop building, small store, pixel art, transparent background, no ground, 64x64, game asset',
    modelId: SCENARIO_MODEL_GAME_ASSETS,
    width: 64,
    height: 64,
    aspectRatio: '1:1',
  });
  await downloadImage(shopResult.url, resolve(assetsDir, 'shop.png'));
  
  // 4. Generate collect coins button icon
  console.log('\n4. Generating collect coins icon...');
  const collectResult = await requestImage({
    prompt: 'collect coins button icon, simple flat icon, game UI, golden coin symbol, 48x48',
    modelId: SCENARIO_MODEL_UI,
    width: 48,
    height: 48,
    aspectRatio: '1:1',
  });
  await downloadImage(collectResult.url, resolve(assetsDir, 'icon-collect.png'));
  
  // 5. Generate reset button icon
  console.log('\n5. Generating reset icon...');
  const resetResult = await requestImage({
    prompt: 'reset button icon, simple flat icon, game UI, circular arrow symbol, 48x48',
    modelId: SCENARIO_MODEL_UI,
    width: 48,
    height: 48,
    aspectRatio: '1:1',
  });
  await downloadImage(resetResult.url, resolve(assetsDir, 'icon-reset.png'));
  
  // 6. Generate building select icon
  console.log('\n6. Generating building select icon...');
  const buildingResult = await requestImage({
    prompt: 'building select icon, simple flat icon, game UI, house/building symbol, 48x48',
    modelId: SCENARIO_MODEL_UI,
    width: 48,
    height: 48,
    aspectRatio: '1:1',
  });
  await downloadImage(buildingResult.url, resolve(assetsDir, 'icon-building.png'));
  
  console.log('\n✨ All themed assets generated successfully!');
}

generateAssets().catch((error) => {
  console.error('❌ Error generating assets:', error);
  process.exit(1);
});
