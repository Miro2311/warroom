"use client";

import React, { useMemo } from "react";
import { Node } from "@xyflow/react";
import { PartnerNode, User } from "@/types";
import { calculateTombstonePosition } from "./utils";
import { GraveyardNode } from "./types";

interface GraveyardGridProps {
  partners: PartnerNode[];
  users: User[]; // All users in the group to map user_id to username
}

/**
 * GraveyardGrid - Manages layout and positioning of tombstones
 * Returns React Flow nodes for all graveyard partners
 */
export function useGraveyardGrid(partners: PartnerNode[], users: User[]): Node[] {
  const graveyardNodes = useMemo(() => {
    // Filter only graveyard partners
    const graveyardPartners = partners.filter((p) => p.status === "Graveyard");
    console.log('GraveyardGrid: Found graveyard partners:', graveyardPartners.length, graveyardPartners);

    // Sort by graveyard_date (oldest first)
    const sorted = [...graveyardPartners].sort((a, b) => {
      const dateA = a.graveyard_date ? new Date(a.graveyard_date).getTime() : 0;
      const dateB = b.graveyard_date ? new Date(b.graveyard_date).getTime() : 0;
      return dateA - dateB;
    });

    // Create nodes with grid positions
    const nodes = sorted.map((partner, index) => {
      const position = calculateTombstonePosition(index);
      const owner = users.find((u) => u.id === partner.user_id);
      const owner_username = owner?.username || "Unknown";

      console.log('GraveyardGrid: Creating tombstone node', { partner: partner.nickname, position, owner_username });

      return {
        id: `tombstone-${partner.id}`,
        type: "tombstone",
        position,
        data: {
          partner,
          owner_username,
        },
        draggable: false,
        selectable: true,
      };
    });

    console.log('GraveyardGrid: Total tombstone nodes created:', nodes.length);
    return nodes;
  }, [partners, users]);

  return graveyardNodes;
}

/**
 * Get count of partners in graveyard
 */
export function useGraveyardCount(partners: PartnerNode[]): number {
  return useMemo(() => {
    return partners.filter((p) => p.status === "Graveyard").length;
  }, [partners]);
}

/**
 * Get graveyard stats for a specific user
 */
export function getUserGraveyardStats(partners: PartnerNode[], userId: string) {
  const userGraveyard = partners.filter(
    (p) => p.status === "Graveyard" && p.user_id === userId
  );

  const causeBreakdown = userGraveyard.reduce((acc, partner) => {
    const cause = partner.cause_of_death || "Unknown";
    acc[cause] = (acc[cause] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: userGraveyard.length,
    causeBreakdown,
    totalMoneyLost: userGraveyard.reduce((sum, p) => sum + p.financial_total, 0),
    totalTimeLost: userGraveyard.reduce((sum, p) => sum + p.time_total, 0),
  };
}
