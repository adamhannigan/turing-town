/**
 * Generates placeholder PNGs for the game. Run: node scripts/generate-placeholders.mjs
 * Output: public/assets/house.png, shop.png, factory.png. Replace these with real art later.
 */

import * as PImage from 'pureimage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'assets');

fs.mkdirSync(outDir, { recursive: true });

const SIZE = 56; // TILE_SIZE - 8

function drawHouse(ctx) {
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(4, 4, SIZE, SIZE);
  ctx.fillStyle = 'rgba(101, 67, 33, 0.8)';
  ctx.fillRect(12, 12, SIZE - 16, SIZE - 24);
  ctx.fillStyle = '#228b22';
  ctx.fillRect(14, SIZE - 18, 8, 6);
  ctx.fillRect(SIZE - 22, SIZE - 18, 8, 6);
}

function drawShop(ctx) {
  ctx.fillStyle = '#6b6b6b';
  ctx.fillRect(4, 4, SIZE, SIZE);
  ctx.fillStyle = 'rgba(80, 80, 80, 0.9)';
  ctx.fillRect(10, 10, SIZE - 20, SIZE - 28);
  ctx.fillStyle = '#8b0000';
  ctx.fillRect(4, 4, SIZE, 10);
}

function drawFactory(ctx) {
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(4, 4, SIZE, SIZE);
  ctx.fillStyle = 'rgba(60, 60, 60, 0.95)';
  ctx.fillRect(8, 8, SIZE - 16, SIZE - 20);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(8, 8, SIZE - 16, 6);
  ctx.fillRect(8, SIZE - 22, SIZE - 16, 6);
}

async function writePlaceholder(name, draw) {
  const img = PImage.make(SIZE + 8, SIZE + 8);
  const ctx = img.getContext('2d');
  draw(ctx);
  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (c) => chunks.push(c));
  await PImage.encodePNGToStream(img, pass);
  const outPath = path.join(outDir, `${name}.png`);
  fs.writeFileSync(outPath, Buffer.concat(chunks));
  console.log('Wrote', outPath);
}

await writePlaceholder('house', drawHouse);
await writePlaceholder('shop', drawShop);
await writePlaceholder('factory', drawFactory);
console.log('Placeholder images generated in public/assets/');
