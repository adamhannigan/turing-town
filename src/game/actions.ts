/**
 * Player actions: place building, collect coins.
 * Mutates ECS world and game state.
 */

import { createEntity, queryEntities, clearWorld } from './ecs/world';
import type { GameState } from './state';
import type { BuildingTypeId } from './state';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  TILE_SIZE,
  INITIAL_COINS,
  getBuildingDef,
  isBuildingUnlocked,
} from './state';

export function placeBuilding(
  state: GameState,
  buildingTypeId: BuildingTypeId,
  gridX: number,
  gridY: number
): boolean {
  const def = getBuildingDef(buildingTypeId);
  if (!def || !isBuildingUnlocked(buildingTypeId)) return false;
  if (state.coins < def.cost) return false;
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    return false;
  }
  const existing = queryEntities('gridCell').find(
    (e) => e.gridCell!.gridX === gridX && e.gridCell!.gridY === gridY
  );
  if (existing) return false;

  state.coins -= def.cost;
  const now = Date.now();
  createEntity({
    gridCell: { gridX, gridY },
    position: {
      x: gridX * TILE_SIZE + TILE_SIZE / 2,
      y: gridY * TILE_SIZE + TILE_SIZE / 2,
    },
    building: {
      type: buildingTypeId,
      accumulatedCoins: 0,
      coinsPerSecond: def.coinsPerSecond,
      lastEarnTime: now,
    },
    sprite: { key: buildingTypeId },
  });
  return true;
}

/** Collect all accumulated coins from buildings into player balance */
export function collectCoins(state: GameState): number {
  const buildings = queryEntities('building');
  let total = 0;
  for (const entity of buildings) {
    const b = entity.building!;
    total += b.accumulatedCoins;
    b.accumulatedCoins = 0;
    b.lastEarnTime = Date.now();
  }
  state.coins += total;
  return total;
}

export function resetGame(state: GameState): void {
  clearWorld();
  state.coins = INITIAL_COINS;
  state.selectedBuilding = null;
  state.lastEcsUpdateTime = 0;
}
