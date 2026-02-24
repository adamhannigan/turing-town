#!/usr/bin/env node
/**
 * Generate 16 road tile variants for the road connectivity system.
 * Bitmask: N=1 (toward gy-1, NE diamond edge), E=2 (toward gx+1, SE edge),
 *          S=4 (toward gy+1, SW edge), W=8 (toward gx-1, NW edge).
 *
 * Diamond vertices in 64x32 image:
 *   T(32,0)  R(64,16)  B(32,32)  L(0,16)
 *
 * Inset diamond (border ~4px each side):
 *   T'(32,7)  R'(60,16)  B'(32,25)  L'(4,16)
 *
 * Each tile = inset diamond (center pad) + edge slots for active connections.
 */

import PureImage from 'pureimage';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GRASS  = '#4a9d3f';
const ROAD   = '#8c8c8c';

function fillPolygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

/**
 * Build a 64x32 road tile for the given connection bitmask.
 * N=1 (NE edge), E=2 (SE edge), S=4 (SW edge), W=8 (NW edge).
 */
function createRoadTile(mask) {
  const canvas = PureImage.make(64, 32);
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 64, 32);

  // Full diamond in grass colour (the non-road border area)
  ctx.fillStyle = GRASS;
  fillPolygon(ctx, [[32,0],[64,16],[32,32],[0,16]]);

  // Road concrete
  ctx.fillStyle = ROAD;

  // Centre pad (inset diamond) – always drawn
  fillPolygon(ctx, [[32,7],[60,16],[32,25],[4,16]]);

  // N slot → toward NE edge (T→R)
  if (mask & 1) fillPolygon(ctx, [[32,0],[64,16],[60,16],[32,7]]);

  // E slot → toward SE edge (R→B)
  if (mask & 2) fillPolygon(ctx, [[64,16],[32,32],[32,25],[60,16]]);

  // S slot → toward SW edge (B→L)
  if (mask & 4) fillPolygon(ctx, [[32,32],[0,16],[4,16],[32,25]]);

  // W slot → toward NW edge (L→T)
  if (mask & 8) fillPolygon(ctx, [[0,16],[32,0],[32,7],[4,16]]);

  return canvas;
}

/** Sprite key for each bitmask value */
const NAMES = [
  'road',      // 0
  'road-n',    // 1
  'road-e',    // 2
  'road-ne',   // 3
  'road-s',    // 4
  'road-ns',   // 5
  'road-es',   // 6
  'road-nes',  // 7
  'road-w',    // 8
  'road-nw',   // 9
  'road-ew',   // 10
  'road-new',  // 11
  'road-sw',   // 12
  'road-nsw',  // 13
  'road-esw',  // 14
  'road-cross',// 15
];

async function saveCanvas(canvas, filePath) {
  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (c) => chunks.push(c));
  await PureImage.encodePNGToStream(canvas, pass);
  writeFileSync(filePath, Buffer.concat(chunks));
  console.log(`✓  ${filePath}`);
}

async function main() {
  const assetsDir = resolve(__dirname, '../public/assets');
  console.log('🛣️  Generating road tile variants...\n');
  for (let mask = 0; mask <= 15; mask++) {
    const canvas = createRoadTile(mask);
    await saveCanvas(canvas, resolve(assetsDir, `${NAMES[mask]}.png`));
  }
  console.log('\n✨ All 16 road tile variants generated!');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
