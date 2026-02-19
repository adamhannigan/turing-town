/**
 * Phaser game bootstrap. Creates game instance and main scene.
 * Call from React after canvas is mounted.
 */

import Phaser from 'phaser';
import { MainScene, setCellClickCallback, setDragCallbacks } from './scene';

const CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#2d5016',
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
};

let gameInstance: Phaser.Game | null = null;

export function getPhaserGame(): Phaser.Game | null {
  return gameInstance;
}

export function createPhaserGame(
  onCellClick: (gridX: number, gridY: number) => void,
  onDragStart?: (entityId: number, gridX: number, gridY: number) => void,
  onDragEnd?: (entityId: number, toGridX: number, toGridY: number) => void
): Phaser.Game {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
  setCellClickCallback(onCellClick);
  if (onDragStart && onDragEnd) {
    setDragCallbacks(onDragStart, onDragEnd);
  }
  gameInstance = new Phaser.Game(CONFIG);
  return gameInstance;
}

export function destroyPhaserGame(): void {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
}
