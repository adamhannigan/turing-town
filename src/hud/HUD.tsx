/**
 * React HUD: coins, building dropdown (tycoon-style), collect, reset.
 */

import type { GameState } from '@/game/state';
import type { BuildingTypeId } from '@/game/state';
import { BUILDING_CATALOG, getBuildingDef } from '@/game/state';

interface HUDProps {
  state: GameState;
  onBuildingSelect: (id: BuildingTypeId | null) => void;
  onCollect: () => void;
  onReset: () => void;
}

export function HUD({
  state,
  onBuildingSelect,
  onCollect,
  onReset,
}: HUDProps) {
  const selectedDef = state.selectedBuilding
    ? getBuildingDef(state.selectedBuilding)
    : null;
  const canAffordSelected =
    selectedDef && state.coins >= selectedDef.cost;

  return (
    <div className="hud">
      <div className="hud-bar">
        <div className="coins">
          <span className="coins-icon">🪙</span>
          <span className="coins-value">{Math.floor(state.coins)}</span>
        </div>
        <div className="actions">
          <label className="building-select-wrap">
            <span className="building-select-label">Building</span>
            <select
              className="building-select"
              value={state.selectedBuilding ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onBuildingSelect(
                  v ? (v as BuildingTypeId) : null
                );
              }}
              title="Select a building to place"
            >
              <option value="">Select building…</option>
              {BUILDING_CATALOG.map((def) => (
                <option
                  key={def.id}
                  value={def.id}
                  disabled={!def.unlocked}
                >
                  {def.unlocked
                    ? `${def.name} (${def.cost} coins)`
                    : `${def.name} (Locked)`}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="collect-btn"
            onClick={onCollect}
          >
            Collect coins
          </button>
          <button type="button" className="reset-btn" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>
      {state.selectedBuilding && (
        <p className="hint">
          {canAffordSelected
            ? 'Click a tile on the grid to place the selected building.'
            : `Need ${selectedDef ? Math.max(0, selectedDef.cost - Math.floor(state.coins)) : 0} more coins to place this building.`}
        </p>
      )}
    </div>
  );
}
