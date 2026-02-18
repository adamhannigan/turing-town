/**
 * Game state shared between React HUD and Phaser/ECS.
 * Not persisted; resets on refresh.
 */

export const GRID_WIDTH = 8;
export const GRID_HEIGHT = 6;
export const TILE_SIZE = 64;

export const INITIAL_COINS = 50;
export const HOUSE_COST = 25;
export const HOUSE_COINS_PER_SECOND = 5;

export interface GameState {
  coins: number;
  selectedBuilding: 'house' | null;
  lastEcsUpdateTime: number;
}

export function createInitialState(): GameState {
  return {
    coins: INITIAL_COINS,
    selectedBuilding: null,
    lastEcsUpdateTime: 0,
  };
}
