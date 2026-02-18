/**
 * React HUD: coins, build mode, collect button.
 */

import type { GameState } from '@/game/state';
import { HOUSE_COST } from '@/game/state';

interface HUDProps {
  state: GameState;
  onCollect: () => void;
  onBuildModeToggle: () => void;
  onReset: () => void;
}

export function HUD({ state, onCollect, onBuildModeToggle, onReset }: HUDProps) {
  const buildMode = state.selectedBuilding === 'house';
  const canAfford = state.coins >= HOUSE_COST;

  return (
    <div className="hud">
      <div className="hud-bar">
        <div className="coins">
          <span className="coins-icon">🪙</span>
          <span className="coins-value">{Math.floor(state.coins)}</span>
        </div>
        <div className="actions">
          <button
            type="button"
            className={`build-btn ${buildMode ? 'active' : ''} ${!canAfford ? 'disabled' : ''}`}
            onClick={onBuildModeToggle}
            disabled={!canAfford}
            title={`Place House (${HOUSE_COST} coins)`}
          >
            {buildMode ? '✓ Build mode' : `Build House (${HOUSE_COST})`}
          </button>
          <button type="button" className="collect-btn" onClick={onCollect}>
            Collect coins
          </button>
          <button type="button" className="reset-btn" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
      {buildMode && (
        <p className="hint">Click a tile on the grid to place a house.</p>
      )}
    </div>
  );
}
