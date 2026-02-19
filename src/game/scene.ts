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

export class MainScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private buildingSprites = new Map<number, Phaser.GameObjects.Sprite>();
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

        // Drag start: store entity and original position
        sprite.on("dragstart", () => {
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
    }

    for (const [id, sprite] of this.buildingSprites) {
      if (!seen.has(id)) {
        sprite.destroy();
        this.buildingSprites.delete(id);
      }
    }
  }
}
