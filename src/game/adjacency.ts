/**
 * Building adjacency bonuses (synergy system).
 * Buildings placed next to certain neighbors receive income multiplier bonuses.
 * All calculations are client-side only.
 */

import type { Entity } from './ecs/components';
import type { BuildingTypeId } from './state';

export interface AdjacencyBonusDef {
  /** The building type that receives the bonus */
  sourceType: BuildingTypeId;
  /** The building type that must be adjacent to trigger the bonus */
  neighborType: BuildingTypeId;
  /** Bonus added to multiplier per qualifying neighbor (e.g. 0.25 = +25%) */
  bonusPerNeighbor: number;
  /** Short label shown in the UI */
  label: string;
}

export const ADJACENCY_BONUSES: AdjacencyBonusDef[] = [
  {
    sourceType: 'house',
    neighborType: 'tree',
    bonusPerNeighbor: 0.25,
    label: 'Park bonus (+25% tax)',
  },
  {
    sourceType: 'house',
    neighborType: 'fountain',
    bonusPerNeighbor: 0.25,
    label: 'Fountain bonus (+25% tax)',
  },
  {
    sourceType: 'shop',
    neighborType: 'house',
    bonusPerNeighbor: 0.15,
    label: 'Customer bonus (+15% coins)',
  },
  {
    sourceType: 'factory',
    neighborType: 'factory',
    bonusPerNeighbor: 0.2,
    label: 'Industrial cluster (+20% coins)',
  },
];

/** Returns entities orthogonally adjacent to (gridX, gridY) */
export function getAdjacentEntities(
  gridX: number,
  gridY: number,
  allEntities: Entity[]
): Entity[] {
  return allEntities.filter((e) => {
    if (!e.gridCell) return false;
    const dx = Math.abs(e.gridCell.gridX - gridX);
    const dy = Math.abs(e.gridCell.gridY - gridY);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  });
}

/**
 * Returns the total income multiplier for a building based on its neighbors.
 * Base is 1.0; each qualifying neighbor adds its bonusPerNeighbor.
 */
export function getAdjacencyMultiplier(
  entity: Entity,
  allEntities: Entity[]
): number {
  if (!entity.gridCell || !entity.building) return 1;
  const { gridX, gridY } = entity.gridCell;
  const neighbors = getAdjacentEntities(gridX, gridY, allEntities);

  let bonus = 0;
  for (const def of ADJACENCY_BONUSES) {
    if (def.sourceType !== entity.building.type) continue;
    const count = neighbors.filter(
      (n) => n.building?.type === def.neighborType
    ).length;
    bonus += count * def.bonusPerNeighbor;
  }
  return 1 + bonus;
}

/**
 * Returns human-readable descriptions of active adjacency bonuses for a building.
 * Used by the HUD synergy panel.
 */
export function getActiveAdjacencyBonuses(
  entity: Entity,
  allEntities: Entity[]
): string[] {
  if (!entity.gridCell || !entity.building) return [];
  const { gridX, gridY } = entity.gridCell;
  const neighbors = getAdjacentEntities(gridX, gridY, allEntities);

  const active: string[] = [];
  for (const def of ADJACENCY_BONUSES) {
    if (def.sourceType !== entity.building.type) continue;
    const count = neighbors.filter(
      (n) => n.building?.type === def.neighborType
    ).length;
    if (count > 0) {
      active.push(count > 1 ? `${def.label} ×${count}` : def.label);
    }
  }
  return active;
}
