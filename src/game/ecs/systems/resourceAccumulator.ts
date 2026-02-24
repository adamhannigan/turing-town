/**
 * Resource accumulation: each building with resourcesPerSecond adds resources
 * directly to the player's GameState each tick (auto-collected, unlike coins).
 * Tracks its own last-tick timestamp independently of the coin accumulator.
 */

import { queryEntities } from '../world';
import type { GameState } from '@/game/state';

let _lastTickTime = 0;

export function runResourceAccumulator(state: GameState, now: number): void {
  const elapsed = _lastTickTime === 0 ? 0 : (now - _lastTickTime) / 1000;
  _lastTickTime = now;

  const buildings = queryEntities('building', 'gridCell');
  for (const entity of buildings) {
    const building = entity.building!;
    if (!building.resourcesPerSecond) continue;

    const { wood, stone, energy } = building.resourcesPerSecond;

    if (wood) state.wood += elapsed * wood;
    if (stone) state.stone += elapsed * stone;
    if (energy) state.energy += elapsed * energy;
  }
}

/** Calculate total resource gain rates per second across all placed buildings. */
export function calculateResourceRates(): { wood: number; stone: number; energy: number } {
  const buildings = queryEntities('building', 'gridCell');
  let wood = 0;
  let stone = 0;
  let energy = 0;
  for (const entity of buildings) {
    const rps = entity.building?.resourcesPerSecond;
    if (!rps) continue;
    wood += rps.wood ?? 0;
    stone += rps.stone ?? 0;
    energy += rps.energy ?? 0;
  }
  return { wood, stone, energy };
}
