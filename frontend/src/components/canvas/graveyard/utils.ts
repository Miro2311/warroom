import { GraveyardZoneConfig } from "./types";

export const GRAVEYARD_CONFIG: GraveyardZoneConfig = {
  centerX: 600, // Right side, offset from center
  centerY: 800, // Below the solar system
  width: 100,
  height: 120,
  radius: 80, // Small drop zone around tombstone
};

export const TOMBSTONE_GRID_CONFIG = {
  columnsPerRow: 4,
  tombstoneWidth: 120,
  tombstoneHeight: 140,
  spacing: 40,
  startY: GRAVEYARD_CONFIG.centerY + 150, // Below event horizon
};

/**
 * Check if a node position is within the graveyard event horizon
 */
export function isInGraveyardZone(
  nodeX: number,
  nodeY: number,
  graveyardConfig: GraveyardZoneConfig = GRAVEYARD_CONFIG
): boolean {
  const dx = nodeX - graveyardConfig.centerX;
  const dy = nodeY - graveyardConfig.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= graveyardConfig.radius;
}

/**
 * Calculate tombstone position in the grid
 */
export function calculateTombstonePosition(index: number): { x: number; y: number } {
  const row = Math.floor(index / TOMBSTONE_GRID_CONFIG.columnsPerRow);
  const col = index % TOMBSTONE_GRID_CONFIG.columnsPerRow;

  const totalWidth =
    TOMBSTONE_GRID_CONFIG.columnsPerRow * TOMBSTONE_GRID_CONFIG.tombstoneWidth +
    (TOMBSTONE_GRID_CONFIG.columnsPerRow - 1) * TOMBSTONE_GRID_CONFIG.spacing;

  const startX = GRAVEYARD_CONFIG.centerX - totalWidth / 2;

  const x = startX + col * (TOMBSTONE_GRID_CONFIG.tombstoneWidth + TOMBSTONE_GRID_CONFIG.spacing);
  const y = TOMBSTONE_GRID_CONFIG.startY + row * (TOMBSTONE_GRID_CONFIG.tombstoneHeight + TOMBSTONE_GRID_CONFIG.spacing);

  return { x, y };
}

/**
 * Get a hash-based consistent position for partner ID (for stable positioning)
 */
export function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
