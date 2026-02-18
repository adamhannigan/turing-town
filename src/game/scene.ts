/**
 * Main Phaser scene: grid, buildings, placement feedback.
 * Renders ECS entities with building sprites and handles grid clicks.
 */

import Phaser from 'phaser';
import { getAllEntities } from './ecs/world';
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from './state';

let cellClickCallback: ((gridX: number, gridY: number) => void) | null = null;

export function setCellClickCallback(cb: (gridX: number, gridY: number) => void): void {
  cellClickCallback = cb;
}

export class MainScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private buildingSprites = new Map<number, Phaser.GameObjects.Sprite>();

  constructor() {
    super({ key: 'Main' });
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

  private ensureBuildingTexture(): void {
    if (!this.textures.exists('house')) {
      const size = TILE_SIZE - 8;
      const g = this.add.graphics();
      g.fillStyle(0x8b4513, 1);
      g.fillRoundedRect(4, 4, size, size, 4);
      g.fillStyle(0x654321, 0.8);
      g.fillRect(12, 12, size - 16, size - 24);
      g.fillStyle(0x228b22, 0.9);
      g.fillRect(14, size - 18, 8, 6);
      g.fillRect(size - 22, size - 18, 8, 6);
      g.generateTexture('house', size + 8, size + 8);
      g.destroy();
    }
  }

  update(): void {
    this.ensureBuildingTexture();
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
        this.buildingSprites.set(id, sprite);
      } else {
        sprite.setPosition(px, py);
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
