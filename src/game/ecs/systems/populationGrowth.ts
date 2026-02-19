/**
 * Population growth: people naturally move into houses over time.
 * Growth rate: 1 person per 10 seconds per house with available capacity.
 */

import { queryEntities } from '../world';
import type { GameState } from '@/game/state';

const POPULATION_GROWTH_INTERVAL = 10000; // 10 seconds per person
const ECS_UPDATE_INTERVAL_MS = 100; // Must match the interval in App.tsx

export function runPopulationGrowth(state: GameState): void {
  const housesWithPopulation = queryEntities('building', 'population');
  
  let totalPopulation = 0;
  
  for (const entity of housesWithPopulation) {
    const pop = entity.population!;
    
    // Count current population
    totalPopulation += pop.current;
    
    // Only grow if not at max capacity
    if (pop.current < pop.max) {
      // Calculate growth per update: 1 person per 10 seconds
      // Updates per 10 seconds = 10000ms / 100ms = 100 updates
      // Growth per update = 1 / 100 = 0.01 people per update
      const updatesPerGrowthInterval = POPULATION_GROWTH_INTERVAL / ECS_UPDATE_INTERVAL_MS;
      const growthPerUpdate = 1 / updatesPerGrowthInterval;
      
      pop.current = Math.min(pop.max, pop.current + growthPerUpdate);
    }
  }
  
  state.totalPopulation = Math.floor(totalPopulation);
}
