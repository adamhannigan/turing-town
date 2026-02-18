/**
 * App: mounts Phaser canvas and React HUD, holds game state.
 * Core loop: place → earn → collect → place more.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPhaserGame, destroyPhaserGame } from '@/game/phaserGame';
import { createInitialState, type GameState } from '@/game/state';
import { runCoinAccumulator } from '@/game/ecs/systems/coinAccumulator';
import { placeBuilding, collectCoins, resetGame, moveBuilding } from '@/game/actions';
import { HUD } from '@/hud/HUD';
import '@/index.css';

const ECS_UPDATE_INTERVAL_MS = 100;

export default function App() {
  const [state, setState] = useState<GameState>(createInitialState);
  const stateRef = useRef(state);
  const containerRef = useRef<HTMLDivElement>(null);

  stateRef.current = state;

  const onCellClick = useCallback((gridX: number, gridY: number) => {
    const s = stateRef.current;
    if (!s.selectedBuilding) return;
    const ok = placeBuilding(s, s.selectedBuilding, gridX, gridY);
    if (ok) setState({ ...s });
  }, []);

  const onDragStart = useCallback((_entityId: number, _gridX: number, _gridY: number) => {
    // Optional: could track drag state here if needed for UI feedback
  }, []);

  const onDragEnd = useCallback((entityId: number, toGridX: number, toGridY: number) => {
    const ok = moveBuilding(entityId, toGridX, toGridY);
    if (ok) {
      setState({ ...stateRef.current });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    createPhaserGame(onCellClick, onDragStart, onDragEnd);
    return () => destroyPhaserGame();
  }, [onCellClick, onDragStart, onDragEnd]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      runCoinAccumulator(stateRef.current, now);
      setState((prev) => ({ ...prev, lastEcsUpdateTime: now }));
    }, ECS_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleCollect = useCallback(() => {
    collectCoins(stateRef.current);
    setState({ ...stateRef.current });
  }, []);

  const handleBuildingSelect = useCallback(
    (id: import('@/game/state').BuildingTypeId | null) => {
      setState((prev) => ({ ...prev, selectedBuilding: id }));
    },
    []
  );

  const handleReset = useCallback(() => {
    resetGame(stateRef.current);
    setState({ ...stateRef.current });
  }, []);

  return (
    <div className="app">
      <HUD
        state={state}
        onBuildingSelect={handleBuildingSelect}
        onCollect={handleCollect}
        onReset={handleReset}
      />
      <div ref={containerRef} id="game-container" className="game-container" />
    </div>
  );
}
