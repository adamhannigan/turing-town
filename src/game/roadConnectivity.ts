/**
 * Road connectivity helpers.
 *
 * Each road entity's sprite key is determined by which of its 4 grid
 * neighbours also contain road buildings.  The bitmask uses:
 *   N = 1  (toward gy-1, shares NE diamond edge)
 *   E = 2  (toward gx+1, shares SE diamond edge)
 *   S = 4  (toward gy+1, shares SW diamond edge)
 *   W = 8  (toward gx-1, shares NW diamond edge)
 */

import { queryEntities } from './ecs/world';
import { GRID_WIDTH, GRID_HEIGHT } from './state';

/** Sprite key for each connection bitmask (index = mask 0-15). */
const ROAD_SPRITE_KEYS: readonly string[] = [
  'road',       // 0  – isolated pad
  'road-n',     // 1
  'road-e',     // 2
  'road-ne',    // 3
  'road-s',     // 4
  'road-ns',    // 5
  'road-es',    // 6
  'road-nes',   // 7
  'road-w',     // 8
  'road-nw',    // 9
  'road-ew',    // 10
  'road-new',   // 11
  'road-sw',    // 12
  'road-nsw',   // 13
  'road-esw',   // 14
  'road-cross', // 15
];

function hasRoadAt(gridX: number, gridY: number): boolean {
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    return false;
  }
  return queryEntities('gridCell', 'building').some(
    (e) =>
      e.gridCell!.gridX === gridX &&
      e.gridCell!.gridY === gridY &&
      e.building!.type === 'road'
  );
}

/** Return the correct sprite key for the road at (gridX, gridY). */
export function getRoadSpriteKey(gridX: number, gridY: number): string {
  let mask = 0;
  if (hasRoadAt(gridX, gridY - 1)) mask |= 1; // N
  if (hasRoadAt(gridX + 1, gridY)) mask |= 2; // E
  if (hasRoadAt(gridX, gridY + 1)) mask |= 4; // S
  if (hasRoadAt(gridX - 1, gridY)) mask |= 8; // W
  return ROAD_SPRITE_KEYS[mask];
}

/**
 * Recompute and apply the correct sprite key for every road entity
 * within 1 Manhattan step of (gridX, gridY) – including the cell itself.
 * Call this after placing or removing a road at (gridX, gridY).
 */
export function updateAdjacentRoadSprites(gridX: number, gridY: number): void {
  const roads = queryEntities('gridCell', 'building', 'sprite').filter(
    (e) => e.building!.type === 'road'
  );
  for (const entity of roads) {
    const { gridX: ex, gridY: ey } = entity.gridCell!;
    if (Math.abs(ex - gridX) + Math.abs(ey - gridY) <= 1) {
      entity.sprite!.key = getRoadSpriteKey(ex, ey);
    }
  }
}
