/**
 * App: mounts Phaser canvas and React HUD, holds game state.
 * Core loop: place → earn → collect → place more.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPhaserGame, destroyPhaserGame } from '@/game/phaserGame';
import { createInitialState, type GameState, SECONDS_PER_DAY } from '@/game/state';
import { runCoinAccumulator, calculateIncomePerDay } from '@/game/ecs/systems/coinAccumulator';
import { runPopulationGrowth } from '@/game/ecs/systems/populationGrowth';
import { placeBuilding, collectCoins, resetGame, moveBuilding, upgradeBuilding, collectBuildingCoins } from '@/game/actions';
import { getEntity } from '@/game/ecs/world';
import { saveGame, loadGame, clearSave } from '@/game/storage';
import { restoreEntities } from '@/game/ecs/world';
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
      const incomePerDay = calculateIncomePerDay(SECONDS_PER_DAY);
      setState((prev) => ({ ...prev, lastEcsUpdateTime: now, incomePerDay }));
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

  const selectedEntity = selectedEntityId !== null ? getEntity(selectedEntityId) : null;

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
      />
      <div ref={containerRef} id="game-container" className="game-container" />
    </div>
  );
}
