/**
 * City quest definitions, catalog, and progress helpers.
 * Quests guide player progression with goals and coin rewards.
 */

export type QuestType =
  | 'collect_coins'
  | 'place_buildings'
  | 'reach_coins'
  | 'upgrade_buildings'
  | 'reach_population';

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  /** Target value to reach */
  target: number;
  /** Coin reward upon claiming */
  reward: number;
}

export interface QuestProgress {
  id: string;
  /** Whether the target has been reached */
  completed: boolean;
  /** Whether the reward has been claimed by the player */
  claimed: boolean;
}

/** Ordered catalog of quests from easiest to hardest */
export const QUEST_CATALOG: QuestDef[] = [
  { id: 'place_2', title: 'Getting Started', description: 'Place 2 buildings', type: 'place_buildings', target: 2, reward: 30 },
  { id: 'collect_100', title: 'First Collection', description: 'Collect 100 coins total', type: 'collect_coins', target: 100, reward: 50 },
  { id: 'pop_5', title: 'Small Community', description: 'Reach 5 population', type: 'reach_population', target: 5, reward: 40 },
  { id: 'place_5', title: 'Urban Planner', description: 'Place 5 buildings', type: 'place_buildings', target: 5, reward: 80 },
  { id: 'collect_500', title: 'Coin Collector', description: 'Collect 500 coins total', type: 'collect_coins', target: 500, reward: 150 },
  { id: 'reach_200', title: 'Modest Savings', description: 'Hold 200 coins at once', type: 'reach_coins', target: 200, reward: 100 },
  { id: 'upgrade_1', title: 'First Upgrade', description: 'Upgrade 1 building', type: 'upgrade_buildings', target: 1, reward: 100 },
  { id: 'collect_1000', title: 'Coin Hoarder', description: 'Collect 1,000 coins total', type: 'collect_coins', target: 1000, reward: 300 },
  { id: 'pop_20', title: 'Growing City', description: 'Reach 20 population', type: 'reach_population', target: 20, reward: 200 },
  { id: 'place_15', title: 'City Builder', description: 'Place 15 buildings', type: 'place_buildings', target: 15, reward: 250 },
  { id: 'upgrade_5', title: 'Upgrader', description: 'Upgrade 5 buildings total', type: 'upgrade_buildings', target: 5, reward: 500 },
  { id: 'reach_10000', title: 'Wealthy City', description: 'Hold 10,000 coins at once', type: 'reach_coins', target: 10000, reward: 1000 },
  { id: 'collect_10000', title: 'Tycoon', description: 'Collect 10,000 coins total', type: 'collect_coins', target: 10000, reward: 2000 },
  { id: 'pop_100', title: 'Bustling Metropolis', description: 'Reach 100 population', type: 'reach_population', target: 100, reward: 1500 },
  { id: 'upgrade_15', title: 'Master Builder', description: 'Upgrade 15 buildings total', type: 'upgrade_buildings', target: 15, reward: 2000 },
];

export const ACTIVE_QUEST_SLOTS = 3;

/** Look up a quest definition by id */
export function getQuestDef(id: string): QuestDef | undefined {
  return QUEST_CATALOG.find((q) => q.id === id);
}

/** Build the initial quest state (first N quests from catalog) */
export function createInitialQuestState(): { quests: QuestProgress[]; nextQuestIndex: number } {
  const count = Math.min(ACTIVE_QUEST_SLOTS, QUEST_CATALOG.length);
  const quests: QuestProgress[] = QUEST_CATALOG.slice(0, count).map((def) => ({
    id: def.id,
    completed: false,
    claimed: false,
  }));
  return { quests, nextQuestIndex: count };
}

/**
 * Get the current progress value for a quest type.
 * Accepts individual tracking values to avoid circular imports with state.ts.
 */
export function getQuestCurrentValue(
  type: QuestType,
  values: {
    totalCoinsCollected: number;
    totalBuildingsPlaced: number;
    coins: number;
    totalUpgradesApplied: number;
    totalPopulation: number;
  }
): number {
  switch (type) {
    case 'collect_coins': return values.totalCoinsCollected;
    case 'place_buildings': return values.totalBuildingsPlaced;
    case 'reach_coins': return values.coins;
    case 'upgrade_buildings': return values.totalUpgradesApplied;
    case 'reach_population': return values.totalPopulation;
  }
}

