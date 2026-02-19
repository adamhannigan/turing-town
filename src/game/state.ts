/**
 * Game state shared between React HUD and Phaser/ECS.
 * Not persisted; resets on refresh.
 */

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 6;
export const TILE_SIZE = 64;

export const INITIAL_COINS = 50;

/** Building type id (must match sprite keys in public/assets and catalog) */
export type BuildingTypeId = 'house' | 'shop' | 'factory' | 'tree' | 'fountain';

export interface BuildingDef {
  id: BuildingTypeId;
  name: string;
  cost: number;
  coinsPerSecond: number;
  /** Only the first building is unlocked at start; others for future progression */
  unlocked: boolean;
  /** Maximum population capacity (0 means no population) */
  populationCapacity?: number;
  /** Tax per person per second (only applies if populationCapacity > 0) */
  taxPerPersonPerSecond?: number;
}

/** Catalog of all buildings. Order = display order. First is unlocked, rest locked. */
export const BUILDING_CATALOG: BuildingDef[] = [
  { id: 'house', name: 'House', cost: 25, coinsPerSecond: 0, unlocked: true, populationCapacity: 4, taxPerPersonPerSecond: 0.5 },
  { id: 'shop', name: 'Shop', cost: 100, coinsPerSecond: 5, unlocked: true },
  { id: 'factory', name: 'Factory', cost: 200, coinsPerSecond: 30, unlocked: false },
  { id: 'tree', name: 'Tree', cost: 10, coinsPerSecond: 0, unlocked: true },
  { id: 'fountain', name: 'Fountain', cost: 75, coinsPerSecond: 2, unlocked: true },
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
  totalPopulation: number;
}

export function createInitialState(): GameState {
  return {
    coins: INITIAL_COINS,
    selectedBuilding: null,
    lastEcsUpdateTime: 0,
    totalPopulation: 0,
  };
}
