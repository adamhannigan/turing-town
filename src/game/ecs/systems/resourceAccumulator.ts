/**
 * Resource accumulation: each building produces or consumes resources over time.
 * Runs every ECS tick and mutates state.resources directly.
 */

import { queryEntities } from '../world';
import type { GameState } from '@/game/state';
import { getBuildingDef, type ResourceType } from '@/game/state';

export function runResourceAccumulator(state: GameState, deltaSeconds: number): void {
  if (deltaSeconds <= 0) return;
  const buildings = queryEntities('building', 'gridCell');

  for (const entity of buildings) {
    const building = entity.building!;
    const def = getBuildingDef(building.type as Parameters<typeof getBuildingDef>[0]);
    if (!def) continue;

    if (def.produces) {
      for (const [resource, rate] of Object.entries(def.produces) as [ResourceType, number][]) {
        if (rate) {
          state.resources[resource] = Math.max(0, state.resources[resource] + rate * deltaSeconds);
        }
      }
    }

    if (def.consumes) {
      for (const [resource, rate] of Object.entries(def.consumes) as [ResourceType, number][]) {
        if (rate) {
          state.resources[resource] = Math.max(0, state.resources[resource] - rate * deltaSeconds);
        }
      }
    }
  }

  // Keep money and population in sync with existing tracked fields
  state.resources.money = state.coins;
  state.resources.population = state.totalPopulation;
}
