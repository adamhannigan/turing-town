/**
 * App: mounts Phaser canvas and React HUD, holds game state.
 * Core loop: place → earn → collect → place more.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPhaserGame, destroyPhaserGame } from '@/game/phaserGame';
import { createInitialState, type GameState } from '@/game/state';
import { runCoinAccumulator } from '@/game/ecs/systems/coinAccumulator';
import { placeBuilding, collectCoins, resetGame } from '@/game/actions';
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
    if (s.selectedBuilding !== 'house') return;
    const ok = placeBuilding(s, gridX, gridY);
    if (ok) setState({ ...s });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    createPhaserGame(onCellClick);
    return () => destroyPhaserGame();
  }, [onCellClick]);

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

  const handleBuildModeToggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedBuilding: prev.selectedBuilding === 'house' ? null : 'house',
    }));
  }, []);

  const handleReset = useCallback(() => {
    resetGame(stateRef.current);
    setState({ ...stateRef.current });
  }, []);

  return (
    <div className="app">
      <HUD
        state={state}
        onCollect={handleCollect}
        onBuildModeToggle={handleBuildModeToggle}
        onReset={handleReset}
      />
      <div ref={containerRef} id="game-container" className="game-container" />
    </div>
  );
}
