/**
 * Client-side persistence: save and load game state to/from localStorage.
 */

import type { GameState } from './state';
import type { Entity } from './ecs/components';
import type { QuestProgress } from './quests';
import type { Resources } from './state';
import { getAllEntities } from './ecs/world';

const STORAGE_KEY = 'turing-town-save';

interface SaveData {
  state: Pick<GameState, 'coins' | 'selectedBuilding' | 'totalPopulation' | 'incomePerDay'> & {
    totalCoinsCollected?: number;
    totalBuildingsPlaced?: number;
    totalUpgradesApplied?: number;
    quests?: QuestProgress[];
    nextQuestIndex?: number;
    resources?: Resources;
  };
  entities: Entity[];
}

export function saveGame(state: GameState): void {
  const data: SaveData = {
    state: {
      coins: state.coins,
      selectedBuilding: state.selectedBuilding,
      totalPopulation: state.totalPopulation,
      incomePerDay: state.incomePerDay,
      totalCoinsCollected: state.totalCoinsCollected,
      totalBuildingsPlaced: state.totalBuildingsPlaced,
      totalUpgradesApplied: state.totalUpgradesApplied,
      quests: state.quests,
      nextQuestIndex: state.nextQuestIndex,
      resources: state.resources,
    },
    entities: getAllEntities(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}
