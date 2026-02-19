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
  const entity: Partial<import('./ecs/components').Entity> = {
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
  };
  
  // Add population component if building has population capacity
  if (def.populationCapacity && def.populationCapacity > 0) {
    entity.population = {
      current: 0,
      max: def.populationCapacity,
      taxPerPersonPerSecond: def.taxPerPersonPerSecond || 0,
    };
  }
  
  createEntity(entity);
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

/** Move a building from one grid cell to another, preserving its state */
export function moveBuilding(
  entityId: number,
  toGridX: number,
  toGridY: number
): boolean {
  const entities = queryEntities('gridCell');
  const entity = entities.find((e) => e.id === entityId);
  if (!entity) return false;

  // Validate target position is within bounds
  if (toGridX < 0 || toGridX >= GRID_WIDTH || toGridY < 0 || toGridY >= GRID_HEIGHT) {
    return false;
  }

  // Check target cell is empty (allow moving to same position)
  const existing = entities.find(
    (e) => e.gridCell!.gridX === toGridX && e.gridCell!.gridY === toGridY && e.id !== entityId
  );
  if (existing) return false;

  // Update grid position
  entity.gridCell!.gridX = toGridX;
  entity.gridCell!.gridY = toGridY;

  // Update world position to match
  if (entity.position) {
    entity.position.x = toGridX * TILE_SIZE + TILE_SIZE / 2;
    entity.position.y = toGridY * TILE_SIZE + TILE_SIZE / 2;
  }

  return true;
}

export function resetGame(state: GameState): void {
  clearWorld();
  state.coins = INITIAL_COINS;
  state.selectedBuilding = null;
  state.lastEcsUpdateTime = 0;
  state.totalPopulation = 0;
}
