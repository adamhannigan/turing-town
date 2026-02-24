/**
 * App: mounts Phaser canvas and React HUD, holds game state.
 * Core loop: place → earn → collect → place more.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPhaserGame, destroyPhaserGame } from '@/game/phaserGame';
import { createInitialState, type GameState, SECONDS_PER_DAY } from '@/game/state';
import { runCoinAccumulator, calculateIncomePerDay } from '@/game/ecs/systems/coinAccumulator';
import { runPopulationGrowth } from '@/game/ecs/systems/populationGrowth';
import { runResourceAccumulator } from '@/game/ecs/systems/resourceAccumulator';
import { placeBuilding, collectCoins, resetGame, moveBuilding, upgradeBuilding, collectBuildingCoins } from '@/game/actions';
import { getEntity, getAllEntities } from '@/game/ecs/world';
import { saveGame, loadGame, clearSave } from '@/game/storage';
import { restoreEntities } from '@/game/ecs/world';
import { QUEST_CATALOG, getQuestDef, getQuestCurrentValue, type QuestDef, type QuestProgress } from '@/game/quests';
import { getActiveAdjacencyBonuses } from '@/game/adjacency';
import { HUD } from '@/hud/HUD';
import '@/index.css';

const ECS_UPDATE_INTERVAL_MS = 100;

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = loadGame();
    if (saved) {
      restoreEntities(saved.entities);
      return { ...createInitialState(), ...saved.state, lastEcsUpdateTime: 0 };
    }
    return createInitialState();
  });
  const stateRef = useRef(state);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  stateRef.current = state;

  const onCellClick = useCallback((gridX: number, gridY: number) => {
    const s = stateRef.current;
    if (!s.selectedBuilding) return;
    const ok = placeBuilding(s, s.selectedBuilding, gridX, gridY);
    if (ok) setState({ ...s });
  }, []);

  const onDragStart = useCallback((_entityId: number, _gridX: number, _gridY: number) => {
    // No-op callback needed to enable drag functionality
  }, []);

  const onDragEnd = useCallback((entityId: number, toGridX: number, toGridY: number) => {
    const ok = moveBuilding(entityId, toGridX, toGridY);
    if (ok) {
      setState({ ...stateRef.current });
    }
  }, []);

  const onEntityClick = useCallback((entityId: number) => {
    // Only select for upgrade when not in building placement mode
    if (stateRef.current.selectedBuilding) return;
    setSelectedEntityId((prev) => (prev === entityId ? null : entityId));
  }, []);

  const onBuildingCollect = useCallback((entityId: number) => {
    collectBuildingCoins(stateRef.current, entityId);
    setState({ ...stateRef.current });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    createPhaserGame(onCellClick, onDragStart, onDragEnd, onEntityClick, onBuildingCollect);
    return () => destroyPhaserGame();
  }, [onCellClick, onDragStart, onDragEnd, onEntityClick, onBuildingCollect]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      runPopulationGrowth(stateRef.current);
      runCoinAccumulator(stateRef.current, now);
      const deltaSeconds = ECS_UPDATE_INTERVAL_MS / 1000;
      runResourceAccumulator(stateRef.current, deltaSeconds);
      const incomePerDay = calculateIncomePerDay(SECONDS_PER_DAY);
      setState((prev) => {
        const updated = {
          ...prev,
          lastEcsUpdateTime: now,
          incomePerDay,
          resources: { ...stateRef.current.resources },
        };
        // Update quest completion status
        const questValues = {
          totalCoinsCollected: updated.totalCoinsCollected,
          totalBuildingsPlaced: updated.totalBuildingsPlaced,
          coins: updated.coins,
          totalUpgradesApplied: updated.totalUpgradesApplied,
          totalPopulation: updated.totalPopulation,
        };
        const quests: QuestProgress[] = updated.quests.map((q) => {
          if (q.completed || q.claimed) return q;
          const def = getQuestDef(q.id);
          if (!def) return q;
          const current = getQuestCurrentValue(def.type, questValues);
          if (current >= def.target) return { ...q, completed: true };
          return q;
        });
        return { ...updated, quests };
      });
    }, ECS_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Persist game state whenever it changes
  useEffect(() => {
    saveGame(state);
  }, [state]);

  const handleCollect = useCallback(() => {
    collectCoins(stateRef.current);
    setState({ ...stateRef.current });
  }, []);

  const handleBuildingSelect = useCallback(
    (id: import('@/game/state').BuildingTypeId | null) => {
      setState((prev) => ({ ...prev, selectedBuilding: id }));
      setSelectedEntityId(null);
    },
    []
  );

  const handleReset = useCallback(() => {
    resetGame(stateRef.current);
    clearSave();
    setSelectedEntityId(null);
    setState({ ...stateRef.current });
  }, []);

  const handleUpgrade = useCallback(() => {
    if (selectedEntityId === null) return;
    const ok = upgradeBuilding(stateRef.current, selectedEntityId);
    if (ok) setState({ ...stateRef.current });
  }, [selectedEntityId]);

  const handleEntityDeselect = useCallback(() => {
    setSelectedEntityId(null);
  }, []);

  const handleQuestClaim = useCallback((questId: string) => {
    setState((prev) => {
      const def = getQuestDef(questId);
      if (!def) return prev;
      const quests: QuestProgress[] = prev.quests.map((q) =>
        q.id === questId && q.completed && !q.claimed ? { ...q, claimed: true } : q
      );
      // Replace claimed quest with next available one
      const claimedIndex = quests.findIndex((q) => q.id === questId && q.claimed);
      let { nextQuestIndex } = prev;
      if (claimedIndex !== -1 && nextQuestIndex < QUEST_CATALOG.length) {
        quests[claimedIndex] = { id: QUEST_CATALOG[nextQuestIndex].id, completed: false, claimed: false };
        nextQuestIndex += 1;
      } else if (claimedIndex !== -1) {
        // No more quests; remove the slot
        quests.splice(claimedIndex, 1);
      }
      const coins = prev.coins + def.reward;
      stateRef.current.coins = coins;
      return { ...prev, coins, quests, nextQuestIndex };
    });
  }, []);

  const selectedEntity = selectedEntityId !== null ? getEntity(selectedEntityId) : null;
  const selectedEntitySynergies = selectedEntity
    ? getActiveAdjacencyBonuses(selectedEntity, getAllEntities())
    : [];

  const activeQuestDisplays = state.quests
    .filter((q) => !q.claimed)
    .map((q) => {
      const def = getQuestDef(q.id);
      if (!def) return null;
      const currentValue = getQuestCurrentValue(def.type, {
        totalCoinsCollected: state.totalCoinsCollected,
        totalBuildingsPlaced: state.totalBuildingsPlaced,
        coins: state.coins,
        totalUpgradesApplied: state.totalUpgradesApplied,
        totalPopulation: state.totalPopulation,
      });
      return { def, progress: q, currentValue };
    })
    .filter(Boolean) as { def: QuestDef; progress: QuestProgress; currentValue: number }[];

  return (
    <div className="app">
      <HUD
        state={state}
        onBuildingSelect={handleBuildingSelect}
        onCollect={handleCollect}
        onReset={handleReset}
        selectedEntity={selectedEntity}
        onUpgrade={handleUpgrade}
        onEntityDeselect={handleEntityDeselect}
        quests={activeQuestDisplays}
        onQuestClaim={handleQuestClaim}
        synergies={selectedEntitySynergies}
      />
      <div ref={containerRef} id="game-container" className="game-container" />
    </div>
  );
}
