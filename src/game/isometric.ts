/**
 * Isometric coordinate conversion utilities.
 * Converts between screen coordinates and grid coordinates for isometric view.
 */

import { TILE_SIZE } from './state';

// Isometric tile dimensions
export const ISO_TILE_WIDTH = TILE_SIZE;
export const ISO_TILE_HEIGHT = TILE_SIZE / 2;

/**
 * Convert grid coordinates to isometric screen coordinates (center of tile).
 */
export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  const x = (gridX - gridY) * (ISO_TILE_WIDTH / 2);
  const y = (gridX + gridY) * (ISO_TILE_HEIGHT / 2);
  return { x, y };
}

/**
 * Convert screen coordinates to grid coordinates.
 * Returns the grid cell that contains the screen point.
 */
export function screenToGrid(screenX: number, screenY: number): { gridX: number; gridY: number } {
  // Reverse the isometric transformation
  const tileX = screenX / (ISO_TILE_WIDTH / 2);
  const tileY = screenY / (ISO_TILE_HEIGHT / 2);
  
  const gridX = Math.floor((tileX + tileY) / 2);
  const gridY = Math.floor((tileY - tileX) / 2);
  
  return { gridX, gridY };
}

/**
 * Get the offset to center the isometric grid on the screen.
 */
export function getGridOffset(gridWidth: number, gridHeight: number, screenWidth: number, screenHeight: number): { x: number; y: number } {
  // Center the grid horizontally and position it in the upper portion vertically
  const gridScreenWidth = (gridWidth + gridHeight) * (ISO_TILE_WIDTH / 2);
  const gridScreenHeight = (gridWidth + gridHeight) * (ISO_TILE_HEIGHT / 2);
  
  return {
    x: (screenWidth - gridScreenWidth) / 2 + (gridHeight * ISO_TILE_WIDTH / 2),
    y: (screenHeight - gridScreenHeight) / 2 + ISO_TILE_HEIGHT,
  };
}
