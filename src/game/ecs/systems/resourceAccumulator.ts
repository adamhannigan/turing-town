/**
 * Resource accumulation: each building produces or consumes resources over time.
 * Runs every ECS tick and mutates state.resources directly.
 * Natural resources (wood, stone, water, food) have abundance tracking:
 * - Producing buildings deplete abundance over time.
 * - Abundance regenerates naturally; Park buildings speed up regeneration.
 * - Production rates are scaled by current abundance.
 */

import { queryEntities } from '../world';
import type { GameState } from '@/game/state';
import {
  getBuildingDef,
  type ResourceType,
  type NaturalResourceType,
  NATURAL_RESOURCE_TYPES,
  DEPLETION_RATE_FACTOR,
  REGEN_BASE_RATE,
} from '@/game/state';

/** Maps building type to the natural resource its production depletes */
const BUILDING_DEPLETES: Partial<Record<string, NaturalResourceType[]>> = {
  tree:        ['wood'],
  farm:        ['food'],
  fountain:    ['water'],
  water_tower: ['water'],
  mine:        ['stone'],
};

export function runResourceAccumulator(state: GameState, deltaSeconds: number): void {
  if (deltaSeconds <= 0) return;
  const buildings = queryEntities('building', 'gridCell');

  // Count park buildings for regeneration bonus
  let parkRegenBonus = 0;

  for (const entity of buildings) {
    const building = entity.building!;
    const def = getBuildingDef(building.type as Parameters<typeof getBuildingDef>[0]);
    if (!def) continue;

    if (def.regenBonus) parkRegenBonus += def.regenBonus;

    const depletedResources = BUILDING_DEPLETES[building.type] ?? [];

    if (def.produces) {
      for (const [resource, rate] of Object.entries(def.produces) as [ResourceType, number][]) {
        if (!rate) continue;
        // Scale natural resource production by its current abundance
        const naturalRes = resource as NaturalResourceType;
        const isNatural = NATURAL_RESOURCE_TYPES.includes(naturalRes);
        const abundance = isNatural ? (state.resourceAbundance[naturalRes] ?? 1) : 1;
        const scaledRate = isNatural ? rate * Math.max(0.1, abundance) : rate;

        state.resources[resource] = Math.max(0, state.resources[resource] + scaledRate * deltaSeconds);

        // Deplete abundance for natural resources being produced
        if (isNatural && depletedResources.includes(naturalRes)) {
          state.resourceAbundance[naturalRes] = Math.max(
            0,
            state.resourceAbundance[naturalRes] - rate * DEPLETION_RATE_FACTOR * deltaSeconds
          );
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

  // Regenerate all natural resource abundances over time
  const regenRate = REGEN_BASE_RATE + parkRegenBonus;
  for (const res of NATURAL_RESOURCE_TYPES) {
    state.resourceAbundance[res] = Math.min(1, state.resourceAbundance[res] + regenRate * deltaSeconds);
  }

  // Keep money and population in sync with existing tracked fields
  state.resources.money = state.coins;
  state.resources.population = state.totalPopulation;
}
