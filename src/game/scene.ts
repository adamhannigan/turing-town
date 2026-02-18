/**
 * Main Phaser scene: grid, buildings, placement feedback.
 * Renders ECS entities with building sprites and handles grid clicks.
 */

import Phaser from 'phaser';
import { getAllEntities } from './ecs/world';
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from './state';

let cellClickCallback: ((gridX: number, gridY: number) => void) | null = null;
let dragStartCallback: ((entityId: number, gridX: number, gridY: number) => void) | null = null;
let dragEndCallback: ((entityId: number, toGridX: number, toGridY: number) => void) | null = null;

export function setCellClickCallback(cb: (gridX: number, gridY: number) => void): void {
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

  constructor() {
    super({ key: 'Main' });
  }

  preload(): void {
    const base = import.meta.env.BASE_URL;
    this.load.image('house', `${base}assets/house.png`);
    this.load.image('shop', `${base}assets/shop.png`);
    this.load.image('factory', `${base}assets/factory.png`);
  }

  create(): void {
    this.gridGraphics = this.add.graphics();
    this.drawGrid();
    this.createZones();
  }

  private drawGrid(): void {
    const g = this.gridGraphics;
    g.lineStyle(2, 0x1a3d0a, 1);
    for (let x = 0; x <= GRID_WIDTH; x++) {
      g.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      g.lineBetween(0, y * TILE_SIZE, GRID_WIDTH * TILE_SIZE, y * TILE_SIZE);
    }
  }

  private createZones(): void {
    for (let gy = 0; gy < GRID_HEIGHT; gy++) {
      for (let gx = 0; gx < GRID_WIDTH; gx++) {
        const zone = this.add
          .zone(
            gx * TILE_SIZE + TILE_SIZE / 2,
            gy * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE,
            TILE_SIZE
          )
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        const x = gx;
        const y = gy;
        zone.on('pointerdown', () => {
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
      const px = gridX * TILE_SIZE + TILE_SIZE / 2;
      const py = gridY * TILE_SIZE + TILE_SIZE / 2;

      let sprite = this.buildingSprites.get(id);
      if (!sprite) {
        sprite = this.add.sprite(px, py, entity.sprite!.key);
        sprite.setDisplaySize(TILE_SIZE - 8, TILE_SIZE - 8);
        sprite.setInteractive({ draggable: true, useHandCursor: true });
        
        // Drag start: store entity and original position
        sprite.on('dragstart', () => {
          this.draggedEntity = id;
          sprite!.setAlpha(0.6);
          dragStartCallback?.(id, gridX, gridY);
        });

        // Dragging: follow pointer with grid snapping
        sprite.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
          // Snap to grid during drag, clamping to valid grid bounds
          const snapGridX = Math.max(0, Math.min(GRID_WIDTH - 1, Math.floor(dragX / TILE_SIZE)));
          const snapGridY = Math.max(0, Math.min(GRID_HEIGHT - 1, Math.floor(dragY / TILE_SIZE)));
          const snapX = snapGridX * TILE_SIZE + TILE_SIZE / 2;
          const snapY = snapGridY * TILE_SIZE + TILE_SIZE / 2;
          sprite!.x = snapX;
          sprite!.y = snapY;
        });

        // Drag end: determine target cell and finalize move
        sprite.on('dragend', (pointer: Phaser.Input.Pointer) => {
          const toGridX = Math.floor(pointer.x / TILE_SIZE);
          const toGridY = Math.floor(pointer.y / TILE_SIZE);
          sprite!.setAlpha(1);
          
          // Call the callback to handle movement logic
          dragEndCallback?.(id, toGridX, toGridY);
          
          this.draggedEntity = null;
        });

        this.buildingSprites.set(id, sprite);
      } else {
        // Only update position if not currently being dragged
        if (this.draggedEntity !== id) {
          sprite.setPosition(px, py);
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
