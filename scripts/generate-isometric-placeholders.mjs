#!/usr/bin/env node
/**
 * Generate isometric-style placeholder assets until Scenario API is configured.
 * Creates grass tiles, building sprites, and HUD icons.
 */

import PureImage from 'pureimage';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Draw an isometric tile shape (diamond)
 */
function drawIsometricTile(ctx, x, y, width, height, fillColor, strokeColor = null) {
  const hw = width / 2;
  const hh = height / 2;
  
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(x, y - hh);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hh);
  ctx.lineTo(x - hw, y);
  ctx.closePath();
  ctx.fill();
  
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/**
 * Draw an isometric grass tile (repeatable)
 */
function createGrassTile(size) {
  const canvas = PureImage.make(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background with transparency
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  
  // Draw isometric diamond tile with grass color
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Base grass color
  drawIsometricTile(ctx, centerX, centerY, size - 4, size / 2 - 2, '#4a9d3f');
  
  // Add some texture with slightly lighter/darker shades
  const grassShades = ['#52a847', '#42913a', '#3f8837'];
  for (let i = 0; i < 6; i++) {
    const offsetX = Math.random() * (size - 20) - (size / 2 - 10);
    const offsetY = Math.random() * (size - 20) - (size / 2 - 10);
    const shade = grassShades[Math.floor(Math.random() * grassShades.length)];
    ctx.fillStyle = shade;
    ctx.fillRect(centerX + offsetX, centerY + offsetY, 4, 2);
  }
  
  return canvas;
}

/**
 * Draw an isometric house building
 */
function createHouse(size) {
  const canvas = PureImage.make(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background with transparency
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Draw base (floor) - isometric diamond
  drawIsometricTile(ctx, centerX, centerY + 10, size - 16, 12, '#b8956a');
  
  // Draw walls - left side (darker)
  ctx.fillStyle = '#c9a882';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 8);
  ctx.lineTo(centerX - (size - 16) / 2, centerY + 10);
  ctx.lineTo(centerX - (size - 16) / 2, centerY + 4);
  ctx.lineTo(centerX, centerY - 14);
  ctx.closePath();
  ctx.fill();
  
  // Draw walls - right side (lighter)
  ctx.fillStyle = '#d4b593';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 8);
  ctx.lineTo(centerX + (size - 16) / 2, centerY + 10);
  ctx.lineTo(centerX + (size - 16) / 2, centerY + 4);
  ctx.lineTo(centerX, centerY - 14);
  ctx.closePath();
  ctx.fill();
  
  // Draw roof - isometric shape
  ctx.fillStyle = '#8b4513';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 24);
  ctx.lineTo(centerX + (size - 12) / 2, centerY - 14);
  ctx.lineTo(centerX, centerY - 8);
  ctx.lineTo(centerX - (size - 12) / 2, centerY - 14);
  ctx.closePath();
  ctx.fill();
  
  // Add door
  ctx.fillStyle = '#654321';
  ctx.fillRect(centerX - 4, centerY + 2, 8, 8);
  
  return canvas;
}

/**
 * Draw an isometric shop building
 */
function createShop(size) {
  const canvas = PureImage.make(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background with transparency
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Draw base (floor) - isometric diamond
  drawIsometricTile(ctx, centerX, centerY + 10, size - 16, 12, '#9b9b9b');
  
  // Draw walls - left side (darker)
  ctx.fillStyle = '#7d98a8';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 8);
  ctx.lineTo(centerX - (size - 16) / 2, centerY + 10);
  ctx.lineTo(centerX - (size - 16) / 2, centerY + 4);
  ctx.lineTo(centerX, centerY - 14);
  ctx.closePath();
  ctx.fill();
  
  // Draw walls - right side (lighter)
  ctx.fillStyle = '#8faabb';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 8);
  ctx.lineTo(centerX + (size - 16) / 2, centerY + 10);
  ctx.lineTo(centerX + (size - 16) / 2, centerY + 4);
  ctx.lineTo(centerX, centerY - 14);
  ctx.closePath();
  ctx.fill();
  
  // Draw awning/roof - flat style for shop
  ctx.fillStyle = '#c94040';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 20);
  ctx.lineTo(centerX + (size - 10) / 2, centerY - 12);
  ctx.lineTo(centerX, centerY - 8);
  ctx.lineTo(centerX - (size - 10) / 2, centerY - 12);
  ctx.closePath();
  ctx.fill();
  
  // Add window
  ctx.fillStyle = '#5a7d8f';
  ctx.fillRect(centerX - 6, centerY - 4, 12, 8);
  
  // Add sign
  ctx.fillStyle = '#d4a853';
  ctx.fillRect(centerX - 8, centerY - 2, 16, 3);
  
  return canvas;
}

/**
 * Draw an isometric factory building
 */
function createFactory(size) {
  const canvas = PureImage.make(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background with transparency
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Draw base (floor) - isometric diamond
  drawIsometricTile(ctx, centerX, centerY + 10, size - 16, 12, '#6b6b6b');
  
  // Draw walls - left side (darker)
  ctx.fillStyle = '#4a5f7f';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 10);
  ctx.lineTo(centerX - (size - 16) / 2, centerY + 10);
  ctx.lineTo(centerX - (size - 16) / 2, centerY + 2);
  ctx.lineTo(centerX, centerY - 18);
  ctx.closePath();
  ctx.fill();
  
  // Draw walls - right side (lighter)
  ctx.fillStyle = '#5a6f8f';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 10);
  ctx.lineTo(centerX + (size - 16) / 2, centerY + 10);
  ctx.lineTo(centerX + (size - 16) / 2, centerY + 2);
  ctx.lineTo(centerX, centerY - 18);
  ctx.closePath();
  ctx.fill();
  
  // Draw smokestacks
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(centerX - 8, centerY - 22, 5, 8);
  ctx.fillRect(centerX + 3, centerY - 24, 5, 10);
  
  // Add smoke puffs
  ctx.fillStyle = 'rgba(100,100,100,0.6)';
  ctx.fillRect(centerX - 6, centerY - 26, 3, 4);
  ctx.fillRect(centerX + 5, centerY - 28, 3, 4);
  
  // Add windows
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(centerX - 6, centerY - 2, 4, 4);
  ctx.fillRect(centerX + 2, centerY - 2, 4, 4);
  
  return canvas;
}

/**
 * Draw a collect coins icon
 */
function createCollectIcon(size) {
  const canvas = PureImage.make(size, size);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 3;
  
  // Draw coin (circle with shine)
  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Add inner circle
  ctx.strokeStyle = '#d4a140';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 4, 0, Math.PI * 2);
  ctx.stroke();
  
  // Add shine
  ctx.fillStyle = '#fff9c4';
  ctx.beginPath();
  ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

/**
 * Draw a reset icon
 */
function createResetIcon(size) {
  const canvas = PureImage.make(size, size);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 3;
  
  // Draw circular arrow
  ctx.strokeStyle = '#4a9d3f';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0.2 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();
  
  // Draw arrow head
  ctx.fillStyle = '#4a9d3f';
  ctx.beginPath();
  ctx.moveTo(centerX - radius * 0.7, centerY - radius * 0.7);
  ctx.lineTo(centerX - radius * 0.9, centerY - radius * 0.3);
  ctx.lineTo(centerX - radius * 0.3, centerY - radius * 0.9);
  ctx.closePath();
  ctx.fill();
  
  return canvas;
}

/**
 * Draw a building icon
 */
function createBuildingIcon(size) {
  const canvas = PureImage.make(size, size);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, size, size);
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Draw simple building shape
  ctx.fillStyle = '#7d98a8';
  ctx.fillRect(centerX - 12, centerY - 8, 24, 20);
  
  // Draw roof
  ctx.fillStyle = '#8b4513';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 16);
  ctx.lineTo(centerX + 16, centerY - 8);
  ctx.lineTo(centerX - 16, centerY - 8);
  ctx.closePath();
  ctx.fill();
  
  // Draw windows
  ctx.fillStyle = '#5a7d8f';
  ctx.fillRect(centerX - 8, centerY - 4, 6, 6);
  ctx.fillRect(centerX + 2, centerY - 4, 6, 6);
  
  // Draw door
  ctx.fillStyle = '#654321';
  ctx.fillRect(centerX - 3, centerY + 4, 6, 8);
  
  return canvas;
}

async function saveCanvas(canvas, filePath) {
  const { PassThrough } = await import('stream');
  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (c) => chunks.push(c));
  await PureImage.encodePNGToStream(canvas, pass);
  writeFileSync(filePath, Buffer.concat(chunks));
  console.log(`✓ Created ${filePath}`);
}

async function generateAssets() {
  const assetsDir = resolve(__dirname, '../public/assets');
  
  console.log('🎨 Generating isometric placeholder assets...\n');
  
  // Generate grass tile
  console.log('1. Generating isometric grass tile...');
  const grass = createGrassTile(64);
  await saveCanvas(grass, resolve(assetsDir, 'grass-tile.png'));
  
  // Generate house
  console.log('2. Generating isometric house...');
  const house = createHouse(64);
  await saveCanvas(house, resolve(assetsDir, 'house.png'));
  
  // Generate shop
  console.log('3. Generating isometric shop...');
  const shop = createShop(64);
  await saveCanvas(shop, resolve(assetsDir, 'shop.png'));
  
  // Generate factory
  console.log('4. Generating isometric factory...');
  const factory = createFactory(64);
  await saveCanvas(factory, resolve(assetsDir, 'factory.png'));
  
  // Generate collect icon
  console.log('5. Generating collect icon...');
  const collect = createCollectIcon(48);
  await saveCanvas(collect, resolve(assetsDir, 'icon-collect.png'));
  
  // Generate reset icon
  console.log('6. Generating reset icon...');
  const reset = createResetIcon(48);
  await saveCanvas(reset, resolve(assetsDir, 'icon-reset.png'));
  
  // Generate building icon
  console.log('7. Generating building icon...');
  const building = createBuildingIcon(48);
  await saveCanvas(building, resolve(assetsDir, 'icon-building.png'));
  
  console.log('\n✨ All isometric placeholder assets generated!');
  console.log('Note: Replace these with Scenario AI assets once API credentials are configured.');
}

generateAssets().catch((error) => {
  console.error('❌ Error generating assets:', error);
  process.exit(1);
});
