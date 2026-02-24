/**
 * Building coin accumulation: each building adds coins over time.
 * For buildings with population, coins come from taxes instead of base coinsPerSecond.
 * Does not move coins to player; that's done on "Collect" action.
 */

import { queryEntities } from '../world';
import type { GameState } from '@/game/state';
import { getAdjacencyMultiplier } from '@/game/adjacency';

export function runCoinAccumulator(_state: GameState, now: number): void {
  const buildings = queryEntities('building', 'gridCell');
  for (const entity of buildings) {
    const building = entity.building!;
    const elapsed = (now - building.lastEarnTime) / 1000;
    const multiplier = getAdjacencyMultiplier(entity, buildings);

    let coinsToAdd = 0;

    // If building has population, calculate tax income
    if (entity.population) {
      const pop = entity.population;
      const taxIncome = pop.current * pop.taxPerPersonPerSecond;
      coinsToAdd = elapsed * taxIncome * multiplier;
    } else {
      // Otherwise use the building's base coinsPerSecond
      coinsToAdd = elapsed * building.coinsPerSecond * multiplier;
    }

    building.accumulatedCoins += coinsToAdd;
    building.lastEarnTime = now;
  }
}

/**
 * Calculate the total income per in-game day based on current building states.
 * Includes tax income from populated buildings and base income from other buildings.
 * Adjacency bonuses are applied.
 */
export function calculateIncomePerDay(secondsPerDay: number): number {
  const buildings = queryEntities('building', 'gridCell');
  let incomePerSecond = 0;
  for (const entity of buildings) {
    const multiplier = getAdjacencyMultiplier(entity, buildings);
    if (entity.population) {
      const pop = entity.population;
      incomePerSecond += pop.current * pop.taxPerPersonPerSecond * multiplier;
    } else {
      incomePerSecond += (entity.building?.coinsPerSecond ?? 0) * multiplier;
    }
  }
  return incomePerSecond * secondsPerDay;
}
