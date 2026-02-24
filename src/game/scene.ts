/**
 * Main Phaser scene: isometric grid, buildings, placement feedback.
 * Renders ECS entities with building sprites and handles grid clicks.
 */

import Phaser from "phaser";
import { getAllEntities } from "./ecs/world";
import { GRID_WIDTH, GRID_HEIGHT } from "./state";
import {
  gridToScreen,
  screenToGrid,
  getGridOffset,
  ISO_TILE_WIDTH,
  ISO_TILE_HEIGHT,
} from "./isometric";

let cellClickCallback: ((gridX: number, gridY: number) => void) | null = null;
let dragStartCallback:
  | ((entityId: number, gridX: number, gridY: number) => void)
  | null = null;
let dragEndCallback:
  | ((entityId: number, toGridX: number, toGridY: number) => void)
  | null = null;
let entityClickCallback: ((entityId: number) => void) | null = null;

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

/** Gold tints applied to upgraded buildings, indexed by upgrade level */
const UPGRADE_TINTS = [0xffffff, 0xffe8b0, 0xffd700, 0xffc800, 0xffb000, 0xffa000];

export class MainScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private buildingSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private upgradeLabels = new Map<number, Phaser.GameObjects.Text>();
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
    // Road tiles – all 16 connectivity variants
    const roadVariants = [
      'road', 'road-n', 'road-e', 'road-ne',
      'road-s', 'road-ns', 'road-es', 'road-nes',
      'road-w', 'road-nw', 'road-ew', 'road-new',
      'road-sw', 'road-nsw', 'road-esw', 'road-cross',
    ];
    for (const key of roadVariants) {
      this.load.image(key, `${base}assets/${key}.png`);
    }
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

      // Road tiles are rendered as flat isometric diamonds; other buildings
      // use a taller sprite anchored at 88% to sit on the ground.
      const isRoad = entity.building?.type === 'road';

      let sprite = this.buildingSprites.get(id);
      if (!sprite) {
        if (isRoad) {
          // Flat tile: origin at top-centre of diamond, sized to fill the tile exactly
          sprite = this.add.sprite(px, py, entity.sprite!.key);
          sprite.setDisplaySize(ISO_TILE_WIDTH, ISO_TILE_HEIGHT);
          sprite.setOrigin(0.5, 0);
          sprite.setDepth(gridX + gridY - 0.5); // roads sit below buildings
        } else {
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
          sprite.setDepth(gridX + gridY);
        }

        sprite.setData('isRoad', isRoad);
        sprite.setInteractive({ draggable: true, useHandCursor: true });

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
            const isRoad = sprite!.getData('isRoad') as boolean;
            // Road origin is at (px, py); building origin is at (px, py+16)
            const yAdjust = isRoad ? 0 : ISO_TILE_HEIGHT / 2;
            // Convert screen position to grid position
            const gridPos = screenToGrid(
              dragX - this.gridOffset.x,
              dragY - this.gridOffset.y - yAdjust
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
            sprite!.y = this.gridOffset.y + snapScreen.y + yAdjust;
          }
        );

        // Drag end: determine target cell and finalize move
        sprite.on("dragend", (_pointer: Phaser.Input.Pointer) => {
          // Use the sprite's current position (already snapped during drag)
          const isRoad = sprite!.getData('isRoad') as boolean;
          const yAdjust = isRoad ? 0 : ISO_TILE_HEIGHT / 2;
          const gridPos = screenToGrid(
            sprite!.x - this.gridOffset.x,
            sprite!.y - this.gridOffset.y - yAdjust
          );
          sprite!.setAlpha(1);

          // Call the callback to handle movement logic
          dragEndCallback?.(id, gridPos.gridX, gridPos.gridY);

          this.draggedEntity = null;
        });

        // Pointer up without drag = click → select entity for upgrade
        sprite.on("pointerup", () => {
          if (!hasDragged) {
            entityClickCallback?.(id);
          }
        });

        this.buildingSprites.set(id, sprite);
      } else {
        // Only update position if not currently being dragged
        if (this.draggedEntity !== id) {
          if (isRoad) {
            sprite.setPosition(px, py);
            sprite.setDepth(gridX + gridY - 0.5);
          } else {
            sprite.setPosition(px, py + ISO_TILE_HEIGHT / 2);
            sprite.setDepth(gridX + gridY);
          }
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
            fontSize: '8px',
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
      }
    }
  }
}
