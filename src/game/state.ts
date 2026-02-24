/**
 * Game state shared between React HUD and Phaser/ECS.
 * Not persisted; resets on refresh.
 */

import type { QuestProgress } from './quests';
import { createInitialQuestState } from './quests';

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 6;
export const TILE_SIZE = 64;

export const INITIAL_COINS = 50;

/** Number of real-time seconds that constitute one in-game "day" */
export const SECONDS_PER_DAY = 60;

/** The 10 core city resource types */
export type ResourceType =
  | 'food'
  | 'water'
  | 'wood'
  | 'stone'
  | 'metal'
  | 'electricity'
  | 'money'
  | 'population'
  | 'goods'
  | 'happiness';

export const ALL_RESOURCE_TYPES: ResourceType[] = [
  'food', 'water', 'wood', 'stone', 'metal',
  'electricity', 'money', 'population', 'goods', 'happiness',
];

export interface ResourceDef {
  name: string;
  icon: string;
}

export const RESOURCE_DEFS: Record<ResourceType, ResourceDef> = {
  food:        { name: 'Food',        icon: '🌽' },
  water:       { name: 'Water',       icon: '💧' },
  wood:        { name: 'Wood',        icon: '🪵' },
  stone:       { name: 'Stone',       icon: '🪨' },
  metal:       { name: 'Metal',       icon: '⚙️' },
  electricity: { name: 'Electricity', icon: '⚡' },
  money:       { name: 'Money',       icon: '🪙' },
  population:  { name: 'Population',  icon: '👥' },
  goods:       { name: 'Goods',       icon: '📦' },
  happiness:   { name: 'Happiness',   icon: '😊' },
};

export type Resources = Record<ResourceType, number>;

/** Building type id (must match sprite keys in public/assets and catalog) */
export type BuildingTypeId = 'house' | 'shop' | 'factory' | 'tree' | 'fountain' | 'road';

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
  /** Resources produced per second (amounts added each second while placed) */
  produces?: Partial<Resources>;
  /** Resources consumed per second (amounts subtracted each second while placed) */
  consumes?: Partial<Resources>;
}

/** Catalog of all buildings. Order = display order. First is unlocked, rest locked. */
export const BUILDING_CATALOG: BuildingDef[] = [
  {
    id: 'house', name: 'House', cost: 25, coinsPerSecond: 0, unlocked: true,
    populationCapacity: 4, taxPerPersonPerSecond: 0.5,
    produces: { happiness: 0.05 },
    consumes: { food: 0.02, water: 0.02 },
  },
  {
    id: 'shop', name: 'Shop', cost: 100, coinsPerSecond: 5, unlocked: true,
    produces: { goods: 0.5, happiness: 0.05 },
  },
  {
    id: 'factory', name: 'Factory', cost: 200, coinsPerSecond: 30, unlocked: false,
    produces: { goods: 2, metal: 0.5 },
    consumes: { wood: 0.3 },
  },
  {
    id: 'tree', name: 'Tree', cost: 10, coinsPerSecond: 0, unlocked: true,
    produces: { wood: 0.3, food: 0.1 },
  },
  {
    id: 'fountain', name: 'Fountain', cost: 75, coinsPerSecond: 2, unlocked: true,
    produces: { water: 0.5, happiness: 0.1 },
  },
  {
    id: 'road', name: 'Road', cost: 5, coinsPerSecond: 0, unlocked: true,
  },
];

export function getBuildingDef(id: BuildingTypeId): BuildingDef | undefined {
  return BUILDING_CATALOG.find((b) => b.id === id);
}

export function isBuildingUnlocked(id: BuildingTypeId): boolean {
  return getBuildingDef(id)?.unlocked ?? false;
}

/** Maximum upgrade level for any building */
export const MAX_UPGRADE_LEVEL = 5;

/** Coins required to upgrade a building from its current level to the next */
export function getUpgradeCost(def: BuildingDef, currentLevel: number): number {
  return Math.floor(def.cost * Math.pow(2, currentLevel + 1));
}

/** Coins per second (or tax rate) after applying upgrade levels (+50% per level) */
export function getUpgradedEarnings(base: number, level: number): number {
  return base * (1 + level * 0.5);
}

export interface GameState {
  coins: number;
  selectedBuilding: BuildingTypeId | null;
  lastEcsUpdateTime: number;
  totalPopulation: number;
  /** Total income (taxes + building earnings) per in-game day */
  incomePerDay: number;
  /** Cumulative coins collected via the collect button */
  totalCoinsCollected: number;
  /** Cumulative buildings placed */
  totalBuildingsPlaced: number;
  /** Cumulative building upgrades applied */
  totalUpgradesApplied: number;
  /** Active quest progress slots */
  quests: QuestProgress[];
  /** Index of the next quest in QUEST_CATALOG to offer when a slot opens */
  nextQuestIndex: number;
  /** Current amounts of each core resource */
  resources: Resources;
}

export function createInitialResources(): Resources {
  return {
    food: 50,
    water: 50,
    wood: 0,
    stone: 0,
    metal: 0,
    electricity: 0,
    money: INITIAL_COINS,
    population: 0,
    goods: 0,
    happiness: 50,
  };
}

export function createInitialState(): GameState {
  const { quests, nextQuestIndex } = createInitialQuestState();
  return {
    coins: INITIAL_COINS,
    selectedBuilding: null,
    lastEcsUpdateTime: 0,
    totalPopulation: 0,
    incomePerDay: 0,
    totalCoinsCollected: 0,
    totalBuildingsPlaced: 0,
    totalUpgradesApplied: 0,
    quests,
    nextQuestIndex,
    resources: createInitialResources(),
  };
}
