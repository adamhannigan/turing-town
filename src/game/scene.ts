/**
 * Main Phaser scene: isometric grid, buildings, placement feedback.
 * Renders ECS entities with building sprites and handles grid clicks.
 */

import Phaser from "phaser";
import { getAllEntities, getEntity } from "./ecs/world";
import { GRID_WIDTH, GRID_HEIGHT } from "./state";
import {
  gridToScreen,
  screenToGrid,
  getGridOffset,
  ISO_TILE_WIDTH,
  ISO_TILE_HEIGHT,
} from "./isometric";
import { getAdjacencyMultiplier } from "./adjacency";

let cellClickCallback: ((gridX: number, gridY: number) => void) | null = null;
let dragStartCallback:
  | ((entityId: number, gridX: number, gridY: number) => void)
  | null = null;
let dragEndCallback:
  | ((entityId: number, toGridX: number, toGridY: number) => void)
  | null = null;
let entityClickCallback: ((entityId: number) => void) | null = null;
let collectBuildingCallback: ((entityId: number) => void) | null = null;

export function setCellClickCallback(
  cb: (gridX: number, gridY: number) => void
): void {
  cellClickCallback = cb;
}

export function setDragCallbacks(
  onDragStart: (entityId: number, gridX: number, gridY: number) => void,
  onDragEnd: (entityId: number, toGridX: number, toGridY: number) => void
): void {
  dragStartCallback = onDragStart;
  dragEndCallback = onDragEnd;
}

export function setEntityClickCallback(cb: (entityId: number) => void): void {
  entityClickCallback = cb;
}

export function setCollectBuildingCallback(cb: (entityId: number) => void): void {
  collectBuildingCallback = cb;
}

/** Gold tints applied to upgraded buildings, indexed by upgrade level */
const UPGRADE_TINTS = [0xffffff, 0xffe8b0, 0xffd700, 0xffc800, 0xffb000, 0xffa000];

/** Pixels per upgrade star character in the label (used for synergy label positioning) */
const STAR_WIDTH_PX = 8;
/** Horizontal offset (px) between upgrade stars and synergy label */
const SYNERGY_LABEL_OFFSET_PX = 6;
/** Font size for in-scene building labels (upgrade stars, synergy indicator) */
const BUILDING_LABEL_FONT_SIZE = '8px';

export class MainScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private buildingSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private upgradeLabels = new Map<number, Phaser.GameObjects.Text>();
  private synergyLabels = new Map<number, Phaser.GameObjects.Text>();
  private coinIndicators = new Map<number, Phaser.GameObjects.Image>();
  private draggedEntity: number | null = null;
  private gridOffset!: { x: number; y: number };

  constructor() {
    super({ key: "Main" });
  }

  preload(): void {
    const base = import.meta.env.BASE_URL;
    this.load.image("house", `${base}assets/house.png`);
    this.load.image("shop", `${base}assets/shop.png`);
    this.load.image("factory", `${base}assets/factory.png`);
    this.load.image("tree", `${base}assets/tree.png`);
    this.load.image("fountain", `${base}assets/fountain.png`);
    this.load.image("road", `${base}assets/road.png`);
    this.load.image("coin-icon", `${base}assets/icon-collect.png`);
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.gridOffset = getGridOffset(GRID_WIDTH, GRID_HEIGHT, width, height);

    // Apply 2x zoom to the camera
    this.cameras.main.setZoom(2);

    this.gridGraphics = this.add.graphics();
    this.drawGrid();
    this.createZones();
  }

  private drawGrid(): void {
    const g = this.gridGraphics;
    g.lineStyle(1, 0x4a9d3f, 0.5);

    // Draw isometric grid lines
    for (let gy = 0; gy <= GRID_HEIGHT; gy++) {
      for (let gx = 0; gx <= GRID_WIDTH; gx++) {
        const screenPos = gridToScreen(gx, gy);
        const x = this.gridOffset.x + screenPos.x;
        const y = this.gridOffset.y + screenPos.y;

        // Draw lines to adjacent cells
        if (gx < GRID_WIDTH) {
          const nextX = gridToScreen(gx + 1, gy);
          g.lineBetween(
            x,
            y,
            this.gridOffset.x + nextX.x,
            this.gridOffset.y + nextX.y
          );
        }
        if (gy < GRID_HEIGHT) {
          const nextY = gridToScreen(gx, gy + 1);
          g.lineBetween(
            x,
            y,
            this.gridOffset.x + nextY.x,
            this.gridOffset.y + nextY.y
          );
        }
      }
    }
  }

  private createZones(): void {
    for (let gy = 0; gy < GRID_HEIGHT; gy++) {
      for (let gx = 0; gx < GRID_WIDTH; gx++) {
        const screenPos = gridToScreen(gx, gy);

        // Create a diamond-shaped zone for each isometric tile
        const zone = this.add
          .zone(
            this.gridOffset.x + screenPos.x,
            this.gridOffset.y + screenPos.y,
            ISO_TILE_WIDTH,
            ISO_TILE_HEIGHT
          )
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });

        const x = gx;
        const y = gy;
        zone.on("pointerdown", () => {
          cellClickCallback?.(x, y);
        });
      }
    }
  }

  update(): void {
    const entities = getAllEntities();
    const withSprite = entities.filter((e) => e.gridCell && e.sprite);
    const seen = new Set<number>();

    for (const entity of withSprite) {
      const id = entity.id;
      seen.add(id);
      const { gridX, gridY } = entity.gridCell!;
      const screenPos = gridToScreen(gridX, gridY);
      const px = this.gridOffset.x + screenPos.x;
      const py = this.gridOffset.y + screenPos.y;

      let sprite = this.buildingSprites.get(id);
      if (!sprite) {
        // Position sprite so its bottom aligns with the bottom of the isometric tile
        sprite = this.add.sprite(
          px,
          py + ISO_TILE_HEIGHT / 2,
          entity.sprite!.key
        );
        // Use full isometric tile width and make buildings proportional
        sprite.setDisplaySize(ISO_TILE_WIDTH, ISO_TILE_WIDTH);
        // Anchor sprite at 88% from top to align building base with grid base
        // This accounts for the visual base of buildings within the sprite
        sprite.setOrigin(0, 0.88);
        sprite.setInteractive({ draggable: true, useHandCursor: true });

        // Set depth based on grid position for proper layering
        sprite.setDepth(gridX + gridY);

        let hasDragged = false;

        // Track pointer down to detect click vs drag
        sprite.on("pointerdown", () => {
          hasDragged = false;
        });

        // Drag start: store entity and original position
        sprite.on("dragstart", () => {
          hasDragged = true;
          this.draggedEntity = id;
          sprite!.setAlpha(0.6);
          dragStartCallback?.(id, gridX, gridY);
        });

        // Dragging: follow pointer with isometric grid snapping
        sprite.on(
          "drag",
          (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            // Convert screen position to grid position
            const gridPos = screenToGrid(
              dragX - this.gridOffset.x,
              dragY - this.gridOffset.y - ISO_TILE_HEIGHT / 2
            );

            // Clamp to valid grid bounds
            const snapGridX = Math.max(
              0,
              Math.min(GRID_WIDTH - 1, gridPos.gridX)
            );
            const snapGridY = Math.max(
              0,
              Math.min(GRID_HEIGHT - 1, gridPos.gridY)
            );

            // Convert back to screen position
            const snapScreen = gridToScreen(snapGridX, snapGridY);
            sprite!.x = this.gridOffset.x + snapScreen.x;
            sprite!.y = this.gridOffset.y + snapScreen.y + ISO_TILE_HEIGHT / 2;
          }
        );

        // Drag end: determine target cell and finalize move
        sprite.on("dragend", (_pointer: Phaser.Input.Pointer) => {
          // Use the sprite's current position (already snapped during drag)
          const gridPos = screenToGrid(
            sprite!.x - this.gridOffset.x,
            sprite!.y - this.gridOffset.y - ISO_TILE_HEIGHT / 2
          );
          sprite!.setAlpha(1);

          // Call the callback to handle movement logic
          dragEndCallback?.(id, gridPos.gridX, gridPos.gridY);

          this.draggedEntity = null;
        });

        // Pointer up without drag = click → collect coins if available, then select entity for upgrade
        sprite.on("pointerup", () => {
          if (!hasDragged) {
            const entity = getEntity(id);
            const accumulated = entity?.building?.accumulatedCoins ?? 0;
            if (accumulated >= 1) {
              const amount = Math.floor(accumulated);
              collectBuildingCallback?.(id);
              this.spawnCollectAnimation(
                sprite!.x + ISO_TILE_WIDTH / 2,
                sprite!.y - ISO_TILE_HEIGHT,
                amount
              );
            }
            entityClickCallback?.(id);
          }
        });

        this.buildingSprites.set(id, sprite);
      } else {
        // Only update position if not currently being dragged
        if (this.draggedEntity !== id) {
          sprite.setPosition(px, py + ISO_TILE_HEIGHT / 2);
          sprite.setDepth(gridX + gridY);
        }
        sprite.setTexture(entity.sprite!.key);
        sprite.setVisible(true);
      }

      // Upgrade level label: show stars above upgraded buildings
      const level = entity.building?.upgradeLevel ?? 0;
      if (level > 0) {
        let label = this.upgradeLabels.get(id);
        if (!label) {
          label = this.add.text(0, 0, '', {
            fontSize: BUILDING_LABEL_FONT_SIZE,
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 2,
          });
          label.setOrigin(0.5, 1);
          this.upgradeLabels.set(id, label);
        }
        label.setText('★'.repeat(level));
        label.setPosition(px + ISO_TILE_WIDTH / 2, py);
        label.setDepth(gridX + gridY + 10);
        label.setVisible(true);
      } else {
        const label = this.upgradeLabels.get(id);
        if (label) label.setVisible(false);
      }

      // Apply a gold tint to upgraded buildings
      sprite!.setTint(UPGRADE_TINTS[Math.min(level, UPGRADE_TINTS.length - 1)]);

      // Synergy indicator: show ⚡ on buildings that have active adjacency bonuses
      const allEntities = withSprite;
      const hasSynergy = getAdjacencyMultiplier(entity, allEntities) > 1;
      if (hasSynergy) {
        let synergyLabel = this.synergyLabels.get(id);
        if (!synergyLabel) {
          synergyLabel = this.add.text(0, 0, '⚡', {
            fontSize: BUILDING_LABEL_FONT_SIZE,
            color: '#00e5ff',
            stroke: '#000000',
            strokeThickness: 2,
          });
          synergyLabel.setOrigin(0.5, 1);
          this.synergyLabels.set(id, synergyLabel);
        }
        // Position synergy label to the right of the upgrade stars
        const starWidth = level > 0 ? level * STAR_WIDTH_PX : 0;
        synergyLabel.setPosition(px + ISO_TILE_WIDTH / 2 + starWidth / 2 + SYNERGY_LABEL_OFFSET_PX, py);
        synergyLabel.setDepth(gridX + gridY + 10);
        synergyLabel.setVisible(true);
      } else {
        const synergyLabel = this.synergyLabels.get(id);
        if (synergyLabel) synergyLabel.setVisible(false);
      }

      // Coin indicator: floating coin icon above buildings with accumulated coins
      const accumulated = entity.building?.accumulatedCoins ?? 0;
      const indicatorX = px + ISO_TILE_WIDTH / 2;
      const indicatorBaseY = py - 12;
      const floatOffset = Math.sin(this.time.now / 400) * 4;
      if (accumulated >= 1) {
        let indicator = this.coinIndicators.get(id);
        if (!indicator) {
          indicator = this.add.image(indicatorX, indicatorBaseY, 'coin-icon');
          indicator.setDisplaySize(12, 12);
          indicator.setOrigin(0.5);
          this.coinIndicators.set(id, indicator);
        }
        indicator.setPosition(indicatorX, indicatorBaseY + floatOffset);
        indicator.setDepth(gridX + gridY + 20);
        indicator.setVisible(true);
      } else {
        const indicator = this.coinIndicators.get(id);
        if (indicator) indicator.setVisible(false);
      }
    }

    for (const [id, sprite] of this.buildingSprites) {
      if (!seen.has(id)) {
        sprite.destroy();
        this.buildingSprites.delete(id);
        const label = this.upgradeLabels.get(id);
        if (label) {
          label.destroy();
          this.upgradeLabels.delete(id);
        }
        const synergyLabel = this.synergyLabels.get(id);
        if (synergyLabel) {
          synergyLabel.destroy();
          this.synergyLabels.delete(id);
        }
        const indicator = this.coinIndicators.get(id);
        if (indicator) {
          indicator.destroy();
          this.coinIndicators.delete(id);
        }
      }
    }
  }

  private spawnCollectAnimation(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y, `+${amount}`, {
      fontSize: '10px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5, 1);
    text.setDepth(1000);
    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }
}
