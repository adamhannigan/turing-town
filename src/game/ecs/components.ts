/**
 * ECS component types for Turing Town.
 * Entities are plain objects; components are properties on those objects.
 */

export type EntityId = number;

export interface Position {
  x: number;
  y: number;
}

export interface GridCell {
  gridX: number;
  gridY: number;
}

/** Building occupies a cell and can produce coins */
export interface Building {
  /** Building type id (matches state BUILDING_CATALOG and sprite key) */
  type: string;
  /** Coins accumulated since last collect (visual only; actual coins in GameState) */
  accumulatedCoins: number;
  /** Coins per second this building generates */
  coinsPerSecond: number;
  /** Last time we updated accumulated (ms) */
  lastEarnTime: number;
}

/** Rendered representation in Phaser */
export interface Sprite {
  key: string;
  frame?: string;
}

export type ComponentMap = {
  position: Position;
  gridCell: GridCell;
  building: Building;
  sprite: Sprite;
};

export type Entity = {
  id: EntityId;
} & Partial<ComponentMap>;
