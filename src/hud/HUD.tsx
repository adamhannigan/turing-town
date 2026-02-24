/**
 * React HUD: coins, resources, building dropdown (tycoon-style), collect, reset.
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

function formatRate(rate: number): string {
  return rate > 0 ? `+${rate.toFixed(1)}/s` : '';
}

function buildingCostLabel(def: ReturnType<typeof getBuildingDef>): string {
  if (!def) return '';
  const parts: string[] = [`${def.cost}🪙`];
  const rc = def.resourceCost;
  if (rc?.wood) parts.push(`${rc.wood}🪵`);
  if (rc?.stone) parts.push(`${rc.stone}🪨`);
  if (rc?.energy) parts.push(`${rc.energy}⚡`);
  return parts.join(' ');
}

function canAfford(state: GameState, def: ReturnType<typeof getBuildingDef>): boolean {
  if (!def) return false;
  if (state.coins < def.cost) return false;
  const rc = def.resourceCost;
  if (rc?.wood && state.wood < rc.wood) return false;
  if (rc?.stone && state.stone < rc.stone) return false;
  if (rc?.energy && state.energy < rc.energy) return false;
  return true;
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
  const affordable = canAfford(state, selectedDef ?? undefined);

  const base = import.meta.env.BASE_URL;

  return (
    <div className="hud">
      <div className="hud-bar">
        <div className="coins">
          <img src={`${base}assets/icon-collect.png`} alt="Coins" className="coins-icon-img" />
          <span className="coins-value">{Math.floor(state.coins)}</span>
        </div>
        <div className="resources">
          <div className="resource-item" title="Wood">
            <span className="resource-icon">🪵</span>
            <span className="resource-value">{Math.floor(state.wood)}</span>
            {state.woodPerSecond > 0 && (
              <span className="resource-rate">{formatRate(state.woodPerSecond)}</span>
            )}
          </div>
          <div className="resource-item" title="Stone">
            <span className="resource-icon">🪨</span>
            <span className="resource-value">{Math.floor(state.stone)}</span>
            {state.stonePerSecond > 0 && (
              <span className="resource-rate">{formatRate(state.stonePerSecond)}</span>
            )}
          </div>
          <div className="resource-item" title="Energy">
            <span className="resource-icon">⚡</span>
            <span className="resource-value">{Math.floor(state.energy)}</span>
            {state.energyPerSecond > 0 && (
              <span className="resource-rate">{formatRate(state.energyPerSecond)}</span>
            )}
          </div>
        </div>
        <div className="population">
          <span className="population-label">Population:</span>
          <span className="population-value">{state.totalPopulation}</span>
        </div>
        <div className="tax-revenue">
          <span className="tax-revenue-label">Revenue/day:</span>
          <span className="tax-revenue-value">{Math.floor(state.incomePerDay)}</span>
        </div>
        <div className="actions">
          <label className="building-select-wrap">
            <img src={`${base}assets/icon-building.png`} alt="Building" className="icon-img" />
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
                    ? `${def.name} (${buildingCostLabel(def)})`
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
            <img src={`${base}assets/icon-reset.png`} alt="Reset" className="icon-img-inline" />
            Reset
          </button>
        </div>
      </div>
      {state.selectedBuilding && (
        <p className="hint">
          {affordable
            ? 'Click a tile on the grid to place the selected building.'
            : `Requires: ${selectedDef ? buildingCostLabel(selectedDef) : ''}.`}
        </p>
      )}
    </div>
  );
}
