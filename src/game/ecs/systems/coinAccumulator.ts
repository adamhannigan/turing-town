/**
 * Building coin accumulation: each building adds coins over time.
 * Does not move coins to player; that's done on "Collect" action.
 */

import { queryEntities } from '../world';
import type { GameState } from '@/game/state';

export function runCoinAccumulator(_state: GameState, now: number): void {
  const buildings = queryEntities('building', 'gridCell');
  for (const entity of buildings) {
    const building = entity.building!;
    const elapsed = (now - building.lastEarnTime) / 1000;
    const added = elapsed * building.coinsPerSecond;
    building.accumulatedCoins += added;
    building.lastEarnTime = now;
  }
}
