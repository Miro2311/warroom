import { PartnerNode, RelationshipStatus } from "@/types";

/**
 * Orbital Physics Calculator
 * Calculates orbit radius and speed based on relationship status and intimacy
 */

export interface OrbitData {
  radius: number;        // Distance from sun in pixels
  period: number;        // Full rotation time in seconds
  speed: number;         // Angular velocity (degrees per second)
  proximity: number;     // 0-1 score (higher = closer)
  tier: 'close' | 'medium' | 'far' | 'void';
}

/**
 * Status Weight Mapping
 * Determines base proximity to sun based on relationship status
 */
const STATUS_WEIGHTS: Record<RelationshipStatus, number> = {
  'Exclusive': 1.0,           // Closest orbit
  'Dating': 0.7,              // Close-medium
  'It\'s Complicated': 0.5,   // Medium
  'Talking': 0.3,             // Far
  'Graveyard': 0.1,          // Void (drifting away)
};

/**
 * Orbit Tier Thresholds
 */
const ORBIT_TIERS = {
  close: { min: 150, max: 250 },   // Exclusive zone
  medium: { min: 250, max: 450 },  // Dating zone
  far: { min: 450, max: 650 },     // Talking zone
  void: { min: 650, max: 900 },    // Graveyard zone
};

/**
 * Calculate orbit radius based on status + intimacy
 */
export function calculateOrbitRadius(partner: PartnerNode): number {
  // Get status weight (default 0.5 if status not recognized)
  const statusWeight = STATUS_WEIGHTS[partner.status] || 0.5;

  // Normalize intimacy score (1-10 → 0-1)
  const intimacyFactor = Math.max(1, Math.min(10, partner.intimacy_score)) / 10;

  // Combined proximity score (status has more weight)
  // 60% status, 40% intimacy
  const proximity = (statusWeight * 0.6) + (intimacyFactor * 0.4);

  // Map proximity to pixel radius
  // High proximity = small radius (close to sun)
  // Low proximity = large radius (far from sun)
  const minRadius = 150;  // Closest possible orbit
  const maxRadius = 900;  // Farthest possible orbit

  const radius = maxRadius - (proximity * (maxRadius - minRadius));

  return Math.round(radius);
}

/**
 * Calculate orbital period (time for one full rotation)
 * Uses Kepler's Third Law: T² ∝ r³ (simplified to T ∝ r^1.5)
 */
export function calculateOrbitalPeriod(radius: number): number {
  const basePeriod = 20;   // 20 seconds at base radius (3x faster!)
  const baseRadius = 400;  // Reference radius

  // Period increases with radius (outer planets slower)
  const period = basePeriod * Math.pow(radius / baseRadius, 1.5);

  return Math.round(period);
}

/**
 * Calculate angular velocity (degrees per second)
 */
export function calculateAngularVelocity(period: number): number {
  // 360 degrees / period = degrees per second
  return 360 / period;
}

/**
 * Determine orbit tier based on radius
 */
export function getOrbitTier(radius: number): OrbitData['tier'] {
  if (radius <= ORBIT_TIERS.close.max) return 'close';
  if (radius <= ORBIT_TIERS.medium.max) return 'medium';
  if (radius <= ORBIT_TIERS.far.max) return 'far';
  return 'void';
}

/**
 * Get complete orbital data for a partner
 */
export function getOrbitData(partner: PartnerNode): OrbitData {
  const statusWeight = STATUS_WEIGHTS[partner.status] || 0.5;
  const intimacyFactor = Math.max(1, Math.min(10, partner.intimacy_score)) / 10;
  const proximity = (statusWeight * 0.6) + (intimacyFactor * 0.4);

  const radius = calculateOrbitRadius(partner);
  const period = calculateOrbitalPeriod(radius);
  const speed = calculateAngularVelocity(period);
  const tier = getOrbitTier(radius);

  return {
    radius,
    period,
    speed,
    proximity,
    tier,
  };
}

/**
 * Calculate random starting angle (0-360)
 * Used to spread planets around the orbit initially
 */
export function getRandomStartAngle(partnerId: string): number {
  // Use partner ID hash for consistent but random angles
  let hash = 0;
  for (let i = 0; i < partnerId.length; i++) {
    hash = partnerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

/**
 * Convert polar coordinates (angle, radius) to cartesian (x, y)
 */
export function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

/**
 * Get orbit path data for SVG rendering
 */
export function getOrbitPathData(radius: number): string {
  // Create circular path for orbit trail
  return `M ${radius},0 A ${radius},${radius} 0 1,1 ${-radius},0 A ${radius},${radius} 0 1,1 ${radius},0`;
}

/**
 * Calculate time offset for continuous animation
 * Ensures smooth transitions when component mounts
 */
export function calculateTimeOffset(partnerId: string, period: number): number {
  // Use partner ID to create consistent offset
  let hash = 0;
  for (let i = 0; i < partnerId.length; i++) {
    hash = partnerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Return offset in seconds
  return (Math.abs(hash) % period);
}
