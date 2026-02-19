/**
 * Building coin accumulation: each building adds coins over time.
 * For buildings with population, coins come from taxes instead of base coinsPerSecond.
 * Does not move coins to player; that's done on "Collect" action.
 */

import { queryEntities } from '../world';
import type { GameState } from '@/game/state';

export function runCoinAccumulator(_state: GameState, now: number): void {
  const buildings = queryEntities('building', 'gridCell');
  for (const entity of buildings) {
    const building = entity.building!;
    const elapsed = (now - building.lastEarnTime) / 1000;
    
    let coinsToAdd = 0;
    
    // If building has population, calculate tax income
    if (entity.population) {
      const pop = entity.population;
      const taxIncome = pop.current * pop.taxPerPersonPerSecond;
      coinsToAdd = elapsed * taxIncome;
    } else {
      // Otherwise use the building's base coinsPerSecond
      coinsToAdd = elapsed * building.coinsPerSecond;
    }
    
    building.accumulatedCoins += coinsToAdd;
    building.lastEarnTime = now;
  }
}
