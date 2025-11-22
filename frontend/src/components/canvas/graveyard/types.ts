import { PartnerNode } from "@/types";

export interface GraveyardNode {
  id: string;
  partner: PartnerNode;
  owner_username: string; // Who owned this relationship
  position: { x: number; y: number };
  index: number; // Position in graveyard grid
}

export interface GraveyardZoneConfig {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  radius: number;
}

export interface WarpAnimationState {
  nodeId: string;
  phase: "dragging" | "warping" | "tombstone";
  progress: number;
}
