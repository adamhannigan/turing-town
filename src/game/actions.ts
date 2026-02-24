/**
 * Player actions: place building, collect coins.
 * Mutates ECS world and game state.
 */

import { createEntity, queryEntities, clearWorld, getEntity } from './ecs/world';
import type { GameState } from './state';
import type { BuildingTypeId } from './state';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  TILE_SIZE,
  INITIAL_COINS,
  getBuildingDef,
  isBuildingUnlocked,
  MAX_UPGRADE_LEVEL,
  getUpgradeCost,
  getUpgradedEarnings,
} from './state';
import { createInitialQuestState } from './quests';

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
      upgradeLevel: 0,
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
  state.totalBuildingsPlaced = (state.totalBuildingsPlaced ?? 0) + 1;
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
  state.totalCoinsCollected = (state.totalCoinsCollected ?? 0) + total;
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
  state.totalCoinsCollected = 0;
  state.totalBuildingsPlaced = 0;
  state.totalUpgradesApplied = 0;
  const initial = createInitialQuestState();
  state.quests = initial.quests;
  state.nextQuestIndex = initial.nextQuestIndex;
}

/**
 * Upgrade a placed building by entity id.
 * Deducts the upgrade cost from state.coins and increases earnings.
 * Returns true if the upgrade succeeded.
 */
export function upgradeBuilding(state: GameState, entityId: number): boolean {
  const entity = getEntity(entityId);
  if (!entity?.building) return false;

  const def = getBuildingDef(entity.building.type as BuildingTypeId);
  if (!def) return false;

  const currentLevel = entity.building.upgradeLevel ?? 0;
  if (currentLevel >= MAX_UPGRADE_LEVEL) return false;

  const cost = getUpgradeCost(def, currentLevel);
  if (state.coins < cost) return false;

  state.coins -= cost;
  entity.building.upgradeLevel = currentLevel + 1;
  state.totalUpgradesApplied = (state.totalUpgradesApplied ?? 0) + 1;

  // Recalculate coinsPerSecond based on new level
  entity.building.coinsPerSecond = getUpgradedEarnings(def.coinsPerSecond, entity.building.upgradeLevel);

  // Update tax rate for population buildings
  if (entity.population && def.taxPerPersonPerSecond) {
    entity.population.taxPerPersonPerSecond = getUpgradedEarnings(
      def.taxPerPersonPerSecond,
      entity.building.upgradeLevel
    );
  }

  return true;
}
