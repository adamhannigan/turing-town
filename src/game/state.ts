/**
 * Game state shared between React HUD and Phaser/ECS.
 * Not persisted; resets on refresh.
 */

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 6;
export const TILE_SIZE = 64;

export const INITIAL_COINS = 50;

/** Building type id (must match sprite keys in public/assets and catalog) */
export type BuildingTypeId = 'house' | 'shop' | 'factory';

export interface BuildingDef {
  id: BuildingTypeId;
  name: string;
  cost: number;
  coinsPerSecond: number;
  /** Only the first building is unlocked at start; others for future progression */
  unlocked: boolean;
}

/** Catalog of all buildings. Order = display order. First is unlocked, rest locked. */
export const BUILDING_CATALOG: BuildingDef[] = [
  { id: 'house', name: 'House', cost: 25, coinsPerSecond: 5, unlocked: true },
  { id: 'shop', name: 'Shop', cost: 80, coinsPerSecond: 12, unlocked: false },
  { id: 'factory', name: 'Factory', cost: 200, coinsPerSecond: 30, unlocked: false },
];

export function getBuildingDef(id: BuildingTypeId): BuildingDef | undefined {
  return BUILDING_CATALOG.find((b) => b.id === id);
}

export function isBuildingUnlocked(id: BuildingTypeId): boolean {
  return getBuildingDef(id)?.unlocked ?? false;
}

export interface GameState {
  coins: number;
  selectedBuilding: BuildingTypeId | null;
  lastEcsUpdateTime: number;
}

export function createInitialState(): GameState {
  return {
    coins: INITIAL_COINS,
    selectedBuilding: null,
    lastEcsUpdateTime: 0,
  };
}
