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
export type BuildingTypeId = 'house' | 'shop' | 'factory' | 'tree' | 'fountain' | 'road' | 'farm' | 'water_tower' | 'power_plant' | 'mine' | 'park';

/** Natural resources that can be depleted and regenerate over time */
export type NaturalResourceType = 'wood' | 'stone' | 'water' | 'food';

export const NATURAL_RESOURCE_TYPES: NaturalResourceType[] = ['wood', 'stone', 'water', 'food'];

/** How much abundance is depleted per unit of natural resource produced */
export const DEPLETION_RATE_FACTOR = 1 / 2000;

/** Base regeneration rate of natural resource abundance per second */
export const REGEN_BASE_RATE = 0.0002;

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
  /** Bonus regeneration rate added to all natural resource abundances (per second per building) */
  regenBonus?: number;
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
  {
    id: 'farm', name: 'Farm', cost: 150, coinsPerSecond: 2, unlocked: false,
    produces: { food: 1.5, happiness: 0.02 },
    consumes: { water: 0.3 },
  },
  {
    id: 'water_tower', name: 'Water Tower', cost: 200, coinsPerSecond: 1, unlocked: false,
    produces: { water: 2.0 },
  },
  {
    id: 'power_plant', name: 'Power Plant', cost: 400, coinsPerSecond: 20, unlocked: false,
    produces: { electricity: 3.0 },
    consumes: { wood: 0.8 },
  },
  {
    id: 'mine', name: 'Mine', cost: 250, coinsPerSecond: 10, unlocked: false,
    produces: { stone: 1.0, metal: 0.5 },
    consumes: { electricity: 0.2 },
  },
  {
    id: 'park', name: 'Park', cost: 75, coinsPerSecond: 1, unlocked: true,
    produces: { happiness: 0.1 },
    regenBonus: 0.0003,
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
  /** Abundance of each natural resource (0.0 = fully depleted, 1.0 = fully abundant) */
  resourceAbundance: Record<NaturalResourceType, number>;
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

export function createInitialAbundance(): Record<NaturalResourceType, number> {
  return { wood: 1, stone: 1, water: 1, food: 1 };
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
    resourceAbundance: createInitialAbundance(),
  };
}
