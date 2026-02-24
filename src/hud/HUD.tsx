/**
 * React HUD: coins, building dropdown (tycoon-style), collect, reset.
 */

import type { GameState } from '@/game/state';
import type { BuildingTypeId } from '@/game/state';
import { BUILDING_CATALOG, getBuildingDef, MAX_UPGRADE_LEVEL, getUpgradeCost, ALL_RESOURCE_TYPES, RESOURCE_DEFS, NATURAL_RESOURCE_TYPES } from '@/game/state';
import type { Entity } from '@/game/ecs/components';
import type { QuestDef, QuestProgress } from '@/game/quests';

interface ActiveQuestDisplay {
  def: QuestDef;
  progress: QuestProgress;
  currentValue: number;
}

interface HUDProps {
  state: GameState;
  onBuildingSelect: (id: BuildingTypeId | null) => void;
  onCollect: () => void;
  onReset: () => void;
  /** Currently selected building entity for upgrades */
  selectedEntity?: Entity | null;
  onUpgrade: () => void;
  onEntityDeselect: () => void;
  quests: ActiveQuestDisplay[];
  onQuestClaim: (questId: string) => void;
  /** Active adjacency synergy descriptions for the selected building */
  synergies?: string[];
}

export function HUD({
  state,
  onBuildingSelect,
  onCollect,
  onReset,
  selectedEntity,
  onUpgrade,
  onEntityDeselect,
  quests,
  onQuestClaim,
  synergies = [],
}: HUDProps) {
  const selectedDef = state.selectedBuilding
    ? getBuildingDef(state.selectedBuilding)
    : null;
  const canAffordSelected =
    selectedDef && state.coins >= selectedDef.cost;
  
  const base = import.meta.env.BASE_URL;

  // Upgrade panel data
  const building = selectedEntity?.building ?? null;
  const buildingDef = building ? getBuildingDef(building.type as BuildingTypeId) : null;
  const upgradeLevel = building?.upgradeLevel ?? 0;
  const upgradeCost = buildingDef ? getUpgradeCost(buildingDef, upgradeLevel) : 0;
  const canUpgrade = upgradeLevel < MAX_UPGRADE_LEVEL;
  const canAffordUpgrade = state.coins >= upgradeCost;

  return (
    <div className="hud">
      <div className="hud-bar">
        <div className="coins">
          <img src={`${base}assets/icon-collect.png`} alt="Coins" className="coins-icon-img" />
          <span className="coins-value">{Math.floor(state.coins)}</span>
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
            <img src={`${base}assets/icon-reset.png`} alt="Reset" className="icon-img-inline" />
            Reset
          </button>
        </div>
      </div>
      <div className="resources-bar">
        {ALL_RESOURCE_TYPES.map((type) => {
          const def = RESOURCE_DEFS[type];
          const value = type === 'money'
            ? Math.floor(state.coins)
            : type === 'population'
            ? state.totalPopulation
            : Math.floor(state.resources?.[type] ?? 0);
          const isNatural = NATURAL_RESOURCE_TYPES.includes(type as typeof NATURAL_RESOURCE_TYPES[number]);
          const abundance = isNatural ? (state.resourceAbundance?.[type as typeof NATURAL_RESOURCE_TYPES[number]] ?? 1) : 1;
          const depletionClass = isNatural && abundance < 0.15
            ? ' resource-depleted'
            : isNatural && abundance < 0.4
            ? ' resource-low'
            : '';
          return (
            <div
              key={type}
              className={`resource-item${depletionClass}`}
              title={isNatural ? `${def.name} (abundance: ${Math.round(abundance * 100)}%)` : def.name}
            >
              <span className="resource-icon">{def.icon}</span>
              <span className="resource-value">{value}</span>
              {isNatural && abundance < 0.4 && (
                <span className="resource-abundance" style={{ color: abundance < 0.15 ? '#ff4444' : '#ff9900' }}>
                  {Math.round(abundance * 100)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      {state.selectedBuilding && (
        <p className="hint">
          {canAffordSelected
            ? 'Click a tile on the grid to place the selected building.'
            : `Need ${selectedDef ? Math.max(0, selectedDef.cost - Math.floor(state.coins)) : 0} more coins to place this building.`}
        </p>
      )}
      {building && buildingDef && !state.selectedBuilding && (
        <div className="upgrade-panel">
          <div className="upgrade-panel-header">
            <span className="upgrade-panel-title">{buildingDef.name}</span>
            <span className="upgrade-panel-level">
              {'★'.repeat(upgradeLevel)}{'☆'.repeat(MAX_UPGRADE_LEVEL - upgradeLevel)}
            </span>
            <button type="button" className="upgrade-panel-close" onClick={onEntityDeselect}>✕</button>
          </div>
          <div className="upgrade-panel-body">
            {canUpgrade ? (
              <>
                <span className="upgrade-cost-label">
                  Upgrade to Level {upgradeLevel + 1}: <strong>{upgradeCost} coins</strong>
                </span>
                <button
                  type="button"
                  className="upgrade-btn"
                  onClick={onUpgrade}
                  disabled={!canAffordUpgrade}
                  title={canAffordUpgrade ? 'Upgrade this building' : `Need ${upgradeCost - Math.floor(state.coins)} more coins`}
                >
                  Upgrade ↑
                </button>
              </>
            ) : (
              <span className="upgrade-maxed">✦ Max Level!</span>
            )}
          </div>
          {synergies.length > 0 && (
            <div className="synergy-panel">
              <span className="synergy-panel-label">⚡ Synergies</span>
              <ul className="synergy-list">
                {synergies.map((s) => (
                  <li key={s} className="synergy-item">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {quests.length > 0 && (
        <div className="quests-panel">
          <div className="quests-panel-header">🏆 Quests</div>
          <div className="quests-list">
            {quests.map(({ def, progress, currentValue }) => {
              const pct = Math.min(100, Math.floor((currentValue / def.target) * 100));
              return (
                <div key={def.id} className={`quest-item${progress.completed ? ' quest-completed' : ''}`}>
                  <div className="quest-item-header">
                    <span className="quest-title">{def.title}</span>
                    <span className="quest-reward">+{def.reward} 🪙</span>
                  </div>
                  <div className="quest-description">{def.description}</div>
                  <div className="quest-progress-row">
                    <div className="quest-progress-bar">
                      <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="quest-progress-text">
                      {Math.min(currentValue, def.target).toLocaleString()} / {def.target.toLocaleString()}
                    </span>
                  </div>
                  {progress.completed && (
                    <button
                      type="button"
                      className="quest-claim-btn"
                      onClick={() => onQuestClaim(def.id)}
                    >
                      Claim reward
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
