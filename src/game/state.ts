/**
 * Game state shared between React HUD and Phaser/ECS.
 * Not persisted; resets on refresh.
 */

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 6;
export const TILE_SIZE = 64;

export const INITIAL_COINS = 50;
export const INITIAL_WOOD = 10;
export const INITIAL_STONE = 10;
export const INITIAL_ENERGY = 0;

/** Number of real-time seconds that constitute one in-game "day" */
export const SECONDS_PER_DAY = 60;

/** The three resource types beyond coins */
export interface ResourceAmount {
  wood?: number;
  stone?: number;
  energy?: number;
}

/** Building type id (must match sprite keys in public/assets and catalog) */
export type BuildingTypeId = 'house' | 'shop' | 'factory' | 'tree' | 'fountain' | 'road' | 'lumber_mill' | 'quarry' | 'power_plant';

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
  /** Resource costs required in addition to coins (auto-deducted on place) */
  resourceCost?: ResourceAmount;
  /** Resources generated per second (auto-collected each game tick) */
  resourcesPerSecond?: ResourceAmount;
}

/** Catalog of all buildings. Order = display order. First is unlocked, rest locked. */
export const BUILDING_CATALOG: BuildingDef[] = [
  { id: 'house', name: 'House', cost: 25, coinsPerSecond: 0, unlocked: true, populationCapacity: 4, taxPerPersonPerSecond: 0.5 },
  { id: 'shop', name: 'Shop', cost: 100, coinsPerSecond: 5, unlocked: true },
  { id: 'lumber_mill', name: 'Lumber Mill', cost: 50, coinsPerSecond: 0, unlocked: true, resourcesPerSecond: { wood: 1 } },
  { id: 'quarry', name: 'Quarry', cost: 75, coinsPerSecond: 0, unlocked: true, resourcesPerSecond: { stone: 1 } },
  { id: 'power_plant', name: 'Power Plant', cost: 150, coinsPerSecond: 0, unlocked: true, resourceCost: { wood: 5, stone: 5 }, resourcesPerSecond: { energy: 2 } },
  { id: 'factory', name: 'Factory', cost: 200, coinsPerSecond: 30, unlocked: true, resourceCost: { wood: 10, stone: 10, energy: 5 } },
  { id: 'tree', name: 'Tree', cost: 10, coinsPerSecond: 0, unlocked: true },
  { id: 'fountain', name: 'Fountain', cost: 75, coinsPerSecond: 2, unlocked: true },
  { id: 'road', name: 'Road', cost: 5, coinsPerSecond: 0, unlocked: true },
];

export function getBuildingDef(id: BuildingTypeId): BuildingDef | undefined {
  return BUILDING_CATALOG.find((b) => b.id === id);
}

export function isBuildingUnlocked(id: BuildingTypeId): boolean {
  return getBuildingDef(id)?.unlocked ?? false;
}

export interface GameState {
  coins: number;
  wood: number;
  stone: number;
  energy: number;
  woodPerSecond: number;
  stonePerSecond: number;
  energyPerSecond: number;
  selectedBuilding: BuildingTypeId | null;
  lastEcsUpdateTime: number;
  totalPopulation: number;
  /** Total income (taxes + building earnings) per in-game day */
  incomePerDay: number;
}

export function createInitialState(): GameState {
  return {
    coins: INITIAL_COINS,
    wood: INITIAL_WOOD,
    stone: INITIAL_STONE,
    energy: INITIAL_ENERGY,
    woodPerSecond: 0,
    stonePerSecond: 0,
    energyPerSecond: 0,
    selectedBuilding: null,
    lastEcsUpdateTime: 0,
    totalPopulation: 0,
    incomePerDay: 0,
  };
}
