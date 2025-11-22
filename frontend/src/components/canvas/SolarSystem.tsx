"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useLoadData } from "@/hooks/useLoadData";
import { SunNode } from "./SunNode";
import { PlanetNode } from "./PlanetNode";
import { PartnerDetailModal } from "../dashboard/PartnerDetailModal";
import { UserStatsModal } from "../dashboard/UserStatsModal";
import { DashboardHeader } from "../dashboard/DashboardHeader";
import { GalaxyBackground } from "./GalaxyBackground";
import { BettingStudioPanel } from "../ui/BettingStudioPanel";
import { AddPlanetModal } from "../dashboard/AddPlanetModal";
import {
  GraveyardZone,
  TombstoneNode,
  CauseOfDeathModal,
  GraveyardPanel,
  useGraveyardGrid,
  useGraveyardCount,
  isInGraveyardZone,
  GRAVEYARD_CONFIG,
} from "./graveyard";
import { CauseOfDeath } from "@/types";
import {
  getOrbitData,
  polarToCartesian,
  getRandomStartAngle,
  calculateTimeOffset,
} from "@/lib/orbitCalculator";
import { Variants } from "framer-motion";

const warpAnimation: Variants = {
  initial: {
    scale: 1,
    rotate: 0,
    opacity: 1,
  },
  warping: {
    scale: [1, 0.8, 0.3, 0.1],
    rotate: [0, 180, 540, 720],
    opacity: [1, 0.9, 0.5, 0],
    transition: {
      duration: 1.5,
      ease: [0.6, 0.05, 0.01, 0.9],
      times: [0, 0.3, 0.7, 1],
    },
  },
};

// Define node types
const nodeTypes = {
  sun: SunNode,
  planet: PlanetNode,
  graveyardZone: GraveyardZone,
  tombstone: TombstoneNode,
};

// Orbital state for each partner
interface OrbitalState {
  partnerId: string;
  radius: number;
  angle: number; // Current angle in degrees
  speed: number; // Degrees per second
  tier: 'close' | 'medium' | 'far' | 'void';
  status: string;
}

/**
 * TODO: Multi-Solar System Architecture (Future)
 *
 * Current: 1 User = 1 Solar System (1 Sun + N Planets)
 * Future: 1 Group = Multiple Solar Systems (N Users = N Suns with their planets)
 *
 * Implementation plan:
 * - Each user gets their own solar system positioned in space
 * - Sun nodes positioned around a group center with spacing
 * - Zoom levels:
 *   - Level 1: Full galaxy view (all solar systems visible)
 *   - Level 2: Single solar system view (current implementation)
 *   - Level 3: Planet detail view (modal)
 * - Navigation: Click sun to zoom into that user's dating network
 */

function WarRoomFlow() {
  const {
    user,
    partners,
    loading,
    currentGroupId,
    setSelectedPartnerId,
    selectedPartnerId,
    warpingNodeId,
    setWarpingNodeId,
    pendingGraveyardNodeId,
    setPendingGraveyardNodeId,
    moveToGraveyard,
    isUserStatsModalOpen,
    setUserStatsModalOpen,
  } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  // Graveyard state
  const [showCauseOfDeathModal, setShowCauseOfDeathModal] = useState(false);
  const [showGraveyardPanel, setShowGraveyardPanel] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isInGraveyard, setIsInGraveyard] = useState(false);

  // Betting Studio state
  const [showBettingStudioPanel, setShowBettingStudioPanel] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  // Add Planet Modal state
  const [showAddPlanetModal, setShowAddPlanetModal] = useState(false);

  // Get graveyard count
  const graveyardCount = useGraveyardCount(partners);
  const graveyardPartners = partners.filter((p) => p.status === "Graveyard");

  // Track all group members with their partners for multi-sun galaxy view
  const [allGroupUsers, setAllGroupUsers] = useState<any[]>([]);
  const [allGroupPartnersMap, setAllGroupPartnersMap] = useState<Map<string, any[]>>(new Map());

  // Orbital states for animation - use ref to avoid re-renders
  const orbitalStatesRef = useRef<OrbitalState[]>([]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());
  const [, forceUpdate] = useState({});

  // Track if initial zoom has been done
  const hasInitialZoomedRef = useRef(false);

  // Load data from Supabase
  useLoadData();

  // Center on current user's sun when nodes are ready
  useEffect(() => {
    if (user && !loading && nodes.length > 0 && !hasInitialZoomedRef.current) {
      // Find current user's sun
      const currentUserSun = nodes.find(n => n.id === `sun-${user.id}`);

      if (currentUserSun) {
        // Use requestAnimationFrame to ensure ReactFlow is fully rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            console.log('🎯 Centering on user sun at:', currentUserSun.position);
            console.log('📊 Total nodes:', nodes.length);

            fitView({
              nodes: [currentUserSun],
              duration: 800,
              padding: 0.5,
              minZoom: 0.4,
              maxZoom: 0.8,
            });

            hasInitialZoomedRef.current = true;
          });
        });
      }
    }
  }, [user, loading, nodes, fitView]);

  // Listen for graveyard panel open event from header
  useEffect(() => {
    const handleOpenGraveyard = () => {
      setShowGraveyardPanel(true);
    };

    window.addEventListener('open-graveyard-panel', handleOpenGraveyard);
    return () => window.removeEventListener('open-graveyard-panel', handleOpenGraveyard);
  }, []);

  // Listen for betting studio panel open event from header
  useEffect(() => {
    const handleOpenBettingStudio = () => {
      setShowBettingStudioPanel(true);
    };

    window.addEventListener('open-betting-studio', handleOpenBettingStudio);
    return () => window.removeEventListener('open-betting-studio', handleOpenBettingStudio);
  }, []);

  // Listen for add planet modal open event from header
  useEffect(() => {
    const handleOpenAddPlanet = () => {
      setShowAddPlanetModal(true);
    };

    window.addEventListener('open-add-planet-modal', handleOpenAddPlanet);
    return () => window.removeEventListener('open-add-planet-modal', handleOpenAddPlanet);
  }, []);

  // Load group members and organize partners by user
  useEffect(() => {
    const loadGroupMembers = async () => {
      if (!currentGroupId) return;

      const { supabase } = await import('@/lib/supabase');

      // Get all group members with full user data
      const { data: membersData } = await supabase
        .from('group_members')
        .select('user_id, users(id, username, level, current_xp, avatar_url)')
        .eq('group_id', currentGroupId);

      if (membersData) {
        const members = membersData.map((m: any) => m.users).filter(Boolean);
        setGroupMembers(members);
        setAllGroupUsers(members);

        // Use partners from store (already loaded ALL partners in group by useLoadData)
        // Group them by user_id for multi-sun view
        const partnersMap = new Map<string, any[]>();

        for (const member of members) {
          const memberPartners = partners.filter(p => p.user_id === member.id);
          partnersMap.set(member.id, memberPartners);
        }

        setAllGroupPartnersMap(partnersMap);
        console.log('Group members loaded:', members.length);
        console.log('Partners map:', partnersMap);
      }
    };

    loadGroupMembers();
  }, [currentGroupId, partners]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === "planet") {
        // First: Start zoom animation
        fitView({
          nodes: [node],
          duration: 1000,
          padding: 0.25,
          maxZoom: 1.8,
        });

        // Second: Open modal AFTER zoom completes
        setTimeout(() => {
          setSelectedPartnerId(node.id);
        }, 1100); // Wait for zoom to finish
      } else if (node.type === "sun") {
        // Zoom into this user's solar system (sun + its planets)
        const userId = node.id.replace('sun-', '');
        const userPartners = allGroupPartnersMap.get(userId) || [];
        const activePlanetIds = userPartners
          .filter((p: any) => p.status !== "Graveyard")
          .map((p: any) => p.id);

        const relevantNodes = nodes.filter(
          n => n.id === node.id || activePlanetIds.includes(n.id)
        );

        if (relevantNodes.length > 0) {
          fitView({
            nodes: relevantNodes,
            duration: 1000,
            padding: 0.3,
            maxZoom: 1.2,
          });
        }
      } else {
        setSelectedPartnerId(null);
      }
    },
    [setSelectedPartnerId, fitView, allGroupPartnersMap, nodes]
  );

  const onPaneClick = useCallback(() => {
    setSelectedPartnerId(null);
  }, [setSelectedPartnerId]);

  // Handle cause of death confirmation
  const handleCauseOfDeathConfirm = useCallback(
    (cause: CauseOfDeath, customReason?: string) => {
      console.log('Cause of Death confirmed:', { partnerId: pendingGraveyardNodeId, cause, customReason });
      if (pendingGraveyardNodeId) {
        moveToGraveyard(pendingGraveyardNodeId, cause, customReason);
        console.log('moveToGraveyard called');
      }
      setShowCauseOfDeathModal(false);
    },
    [pendingGraveyardNodeId, moveToGraveyard]
  );

  const handleCauseOfDeathCancel = useCallback(() => {
    setShowCauseOfDeathModal(false);
    setPendingGraveyardNodeId(null);
    setWarpingNodeId(null);
  }, [setPendingGraveyardNodeId, setWarpingNodeId]);

  // Initialize Orbital States (only for non-graveyard partners)
  useEffect(() => {
    if (!user || loading || partners.length === 0) return;

    // Only include partners NOT in graveyard
    const activePartners = partners.filter((p) => p.status !== "Graveyard");

    // Calculate orbital data for each active partner
    const initialStates: OrbitalState[] = activePartners.map((partner) => {
      const orbitData = getOrbitData(partner);
      const startAngle = getRandomStartAngle(partner.id);
      const timeOffset = calculateTimeOffset(partner.id, orbitData.period);

      // Adjust angle based on time offset for continuous motion
      const adjustedAngle = (startAngle + (timeOffset * orbitData.speed)) % 360;

      return {
        partnerId: partner.id,
        radius: orbitData.radius,
        angle: adjustedAngle,
        speed: orbitData.speed,
        tier: orbitData.tier,
        status: partner.status,
      };
    });

    orbitalStatesRef.current = initialStates;
    forceUpdate({}); // Trigger initial render
  }, [user, partners, loading]);

  // Helper function: Seeded random number generator (consistent positions per user)
  const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
  };

  // Helper function: Generate random position with minimum distance check
  const generateRandomPosition = (
    userId: string,
    existingPositions: { x: number; y: number }[],
    minDistance: number,
    maxAttempts: number = 50
  ): { x: number; y: number } => {
    const minRadius = 600;  // Minimum distance from center
    const maxRadius = 1400; // Maximum distance from center

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Use seeded random for consistency
      const seed1 = seededRandom(`${userId}-${attempt}-x`);
      const seed2 = seededRandom(`${userId}-${attempt}-y`);

      // Random angle and radius
      const angle = seed1 * 2 * Math.PI;
      const radius = minRadius + seed2 * (maxRadius - minRadius);

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Check minimum distance from all existing positions
      const tooClose = existingPositions.some(pos => {
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        return dist < minDistance;
      });

      if (!tooClose) {
        return { x, y };
      }
    }

    // Fallback: return a position even if it's close (shouldn't happen often)
    const fallbackAngle = seededRandom(userId) * 2 * Math.PI;
    const fallbackRadius = minRadius + seededRandom(`${userId}-fallback`) * (maxRadius - minRadius);
    return {
      x: Math.cos(fallbackAngle) * fallbackRadius,
      y: Math.sin(fallbackAngle) * fallbackRadius,
    };
  };

  // Initialize ALL nodes (Multiple Suns for each group member + their Planets)
  useEffect(() => {
    if (!user || loading || allGroupUsers.length === 0) return;

    // STEP 1: Calculate ABSOLUTE positions for all suns (independent of viewer)
    // Sort users by ID to ensure consistent order for everyone
    const sortedUsers = [...allGroupUsers].sort((a, b) => a.id.localeCompare(b.id));

    const minSunDistance = 700; // Minimum distance between suns
    const absolutePositions = new Map<string, { x: number; y: number }>();
    const existingPositions: { x: number; y: number }[] = [];

    // First user gets center position in ABSOLUTE space
    const firstUser = sortedUsers[0];
    absolutePositions.set(firstUser.id, { x: 0, y: 0 });
    existingPositions.push({ x: 0, y: 0 });

    // Generate absolute positions for all other users
    for (let i = 1; i < sortedUsers.length; i++) {
      const groupUser = sortedUsers[i];
      const position = generateRandomPosition(groupUser.id, existingPositions, minSunDistance);
      absolutePositions.set(groupUser.id, position);
      existingPositions.push(position);
    }

    // STEP 2: Calculate offset to center current user's sun at (0, 0) on screen
    const currentUserAbsolutePos = absolutePositions.get(user.id) || { x: 0, y: 0 };
    const offsetX = -currentUserAbsolutePos.x;
    const offsetY = -currentUserAbsolutePos.y;

    // STEP 3: Create sun nodes with offset applied (so current user appears at center)
    const sunNodes: Node[] = allGroupUsers.map((groupUser) => {
      const absolutePos = absolutePositions.get(groupUser.id) || { x: 0, y: 0 };

      // Apply offset so current user's sun is at (0, 0)
      const x = absolutePos.x + offsetX;
      const y = absolutePos.y + offsetY;

      // Get this user's partners
      const userPartners = allGroupPartnersMap.get(groupUser.id) || [];
      const activePartners = userPartners.filter((p: any) => p.status !== "Graveyard");

      return {
        id: `sun-${groupUser.id}`,
        type: "sun",
        position: { x, y },
        data: { user: groupUser, partners: activePartners },
        draggable: false,
      };
    });

    // Create planet nodes for ALL users
    const allPlanetNodes: Node[] = [];

    allGroupUsers.forEach((groupUser) => {
      const userPartners = allGroupPartnersMap.get(groupUser.id) || [];
      const activePartners = userPartners.filter((p: any) => p.status !== "Graveyard");

      // Find this user's sun position
      const sunNode = sunNodes.find(s => s.id === `sun-${groupUser.id}`);
      if (!sunNode) return;

      // Create planets orbiting this user's sun
      activePartners.forEach((partner: any) => {
        const orbitalState = orbitalStatesRef.current.find(
          (s) => s.partnerId === partner.id
        );

        // Calculate position relative to this user's sun
        let relativePosition = { x: 0, y: 0 };
        if (orbitalState) {
          relativePosition = polarToCartesian(orbitalState.angle, orbitalState.radius);
        }

        const absolutePosition = {
          x: sunNode.position.x + relativePosition.x,
          y: sunNode.position.y + relativePosition.y,
        };

        allPlanetNodes.push({
          id: partner.id,
          type: "planet",
          position: absolutePosition,
          data: { partner },
          draggable: true,
        });
      });
    });

    // Set all nodes (multiple suns + all planets)
    setNodes([...sunNodes, ...allPlanetNodes]);
  }, [user, loading, allGroupUsers, allGroupPartnersMap, graveyardCount, setNodes]);

  // Orbital Animation Loop with optimized updates - ONLY updates positions, not entire nodes
  useEffect(() => {
    if (orbitalStatesRef.current.length === 0 || !user || allGroupUsers.length === 0) return;

    let frameCount = 0;
    const updateInterval = 3; // Update every 3 frames for 20fps (smoother performance)

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Pause animation when a planet is selected or dragging
      if (!selectedPartnerId && !draggedNodeId) {
        // Update orbital angles
        orbitalStatesRef.current = orbitalStatesRef.current.map((state) => ({
          ...state,
          angle: (state.angle + state.speed * deltaTime) % 360,
        }));
      }

      // Only update positions every N frames
      frameCount++;
      if (frameCount >= updateInterval) {
        frameCount = 0;

        // Update only positions, not entire nodes
        setNodes((currentNodes) =>
          currentNodes.map((node) => {
            // Skip if it's not a planet node
            if (node.type !== "planet") return node;

            // Skip if this node is being dragged
            if (node.id === draggedNodeId) return node;

            // Skip if this node is warping to graveyard
            if (node.id === warpingNodeId) return node;

            // Find orbital state for this planet
            const orbitalState = orbitalStatesRef.current.find(
              (s) => s.partnerId === node.id
            );

            if (!orbitalState) return node;

            // Find the sun node that this planet belongs to
            const partner = node.data?.partner as any;
            if (!partner || !partner.user_id) return node;
            const sunNode = currentNodes.find(n => n.id === `sun-${partner.user_id}`);

            if (!sunNode) return node;

            // Calculate new position relative to the sun
            const relativePosition = polarToCartesian(orbitalState.angle, orbitalState.radius);
            const absolutePosition = {
              x: sunNode.position.x + relativePosition.x,
              y: sunNode.position.y + relativePosition.y,
            };

            // Return node with updated position
            return {
              ...node,
              position: absolutePosition,
            };
          })
        );
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [user, selectedPartnerId, draggedNodeId, allGroupUsers, setNodes]);

  // Initialize edges for all planets to their respective suns
  useEffect(() => {
    if (!user || loading || allGroupUsers.length === 0) return;

    const newEdges: Edge[] = [];

    allGroupUsers.forEach((groupUser) => {
      const userPartners = allGroupPartnersMap.get(groupUser.id) || [];
      const activePartners = userPartners.filter((p: any) => p.status !== "Graveyard");

      activePartners.forEach((partner: any) => {
        newEdges.push({
          id: `e-sun-${groupUser.id}-${partner.id}`,
          source: `sun-${groupUser.id}`,
          target: partner.id,
          animated: false,
          type: 'straight',
          style: {
            stroke: "#00F0FF",
            strokeWidth: 1,
            strokeDasharray: "5, 5",
            opacity: 0.15,
          },
        });
      });
    });

    setEdges(newEdges);
  }, [user, loading, allGroupUsers, allGroupPartnersMap, setEdges]);

  // Show loading state
  if (loading || !user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-deep-space">
        <div className="text-center">
          <div className="animate-pulse text-holo-cyan text-2xl font-display mb-2">
            Loading War Room...
          </div>
          <div className="text-white/50 text-sm font-mono">
            Initializing tactical systems
          </div>
        </div>
      </div>
    );
  }

  // Get selected partner
  const selectedPartner = partners.find((p) => p.id === selectedPartnerId) || null;

  // Handle save
  const handleSavePartner = async (updatedPartner: any) => {
    try {
      console.log("Saving partner:", updatedPartner);

      // Get old partner data to detect status changes and other updates
      const oldPartner = partners.find(p => p.id === updatedPartner.id);
      const oldStatus = oldPartner?.status;
      const newStatus = updatedPartner.status;
      const oldSimpIndex = oldPartner?.simp_index;
      const newSimpIndex = updatedPartner.simp_index;
      const oldIntimacy = oldPartner?.intimacy_score;
      const newIntimacy = updatedPartner.intimacy_score;
      const oldPhotoUrl = oldPartner?.photo_url;
      const newPhotoUrl = updatedPartner.photo_url;

      // Track updated fields for XP
      const updatedFields: string[] = [];
      if (oldPartner) {
        if (oldPartner.nickname !== updatedPartner.nickname) updatedFields.push('nickname');
        if (oldIntimacy !== newIntimacy) updatedFields.push('intimacy_score');
        if (oldPartner.time_total !== updatedPartner.time_total) updatedFields.push('time_total');
      }

      // Import supabase
      const { supabase } = await import('@/lib/supabase');

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User is not authenticated. Cannot update partner.');
        return;
      }

      // Automatically update last_updated_at timestamp
      // Note: financial_total is auto-calculated from transactions, so we don't update it here
      const updateData = {
        nickname: updatedPartner.nickname,
        status: updatedPartner.status,
        time_total: updatedPartner.time_total,
        intimacy_score: updatedPartner.intimacy_score,
        last_updated_at: new Date().toISOString(),
      };

      console.log('Updating partner in Supabase:', updateData);

      // Update in Supabase
      const { data, error } = await supabase
        .from('partners')
        .update(updateData)
        .eq('id', updatedPartner.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update partner:', error);
        return;
      }

      console.log('Partner updated successfully in database:', data);

      // Update local state through the store
      useStore.getState().updatePartner(updatedPartner.id, {
        ...updatedPartner,
        last_updated_at: updateData.last_updated_at,
      });

      // Handle XP for status change
      if (oldStatus && newStatus && oldStatus !== newStatus) {
        console.log(`Status changed: ${oldStatus} -> ${newStatus}, awarding XP...`);
        await useStore.getState().handleStatusChange(updatedPartner.id, oldStatus, newStatus);
      }

      // Award XP for decay cleanup if node was rusted
      if (oldPartner && user && currentGroupId) {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(oldPartner.last_updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceUpdate >= 14) {
          const { XPService } = await import('@/services/xpService');
          await XPService.awardDecayCleanup(user.id, currentGroupId, updatedPartner.id);
          console.log('Awarded XP for decay cleanup');
        }
      }

      // Award XP for partner info update
      if (user && currentGroupId && updatedFields.length > 0) {
        const { XPService } = await import('@/services/xpService');
        await XPService.awardPartnerInfoUpdated(
          user.id,
          currentGroupId,
          updatedPartner.id,
          updatedFields
        );
        console.log('Awarded XP for updating partner info:', updatedFields);
      }

      // Award XP for adding photo
      if (user && currentGroupId && !oldPhotoUrl && newPhotoUrl) {
        const { XPService } = await import('@/services/xpService');
        await XPService.awardPartnerPhotoAdded(user.id, currentGroupId, updatedPartner.id);
        console.log('Awarded XP for adding partner photo');
      }

      // Check for improvement rewards
      if (user && currentGroupId && oldPartner) {
        const { XPService } = await import('@/services/xpService');
        await XPService.checkImprovementRewards(
          user.id,
          currentGroupId,
          updatedPartner.id,
          oldSimpIndex,
          newSimpIndex,
          oldIntimacy,
          newIntimacy
        );
      }

      // Check performance rewards
      if (user && currentGroupId) {
        const { XPService } = await import('@/services/xpService');
        await XPService.checkPerformanceRewards(
          user.id,
          currentGroupId,
          updatedPartner.id,
          updatedPartner.simp_index,
          updatedPartner.intimacy_score
        );
      }

      // Check penalties
      if (user && currentGroupId) {
        const { XPService } = await import('@/services/xpService');
        await XPService.checkPenalties(
          user.id,
          currentGroupId,
          updatedPartner.id,
          updatedPartner.simp_index,
          oldPartner?.last_updated_at
        );
      }

      // Check for serial dating penalty
      if (user && currentGroupId && newStatus === 'Graveyard' && oldStatus !== 'Graveyard') {
        const { XPService } = await import('@/services/xpService');
        await XPService.checkSerialDatingPenalty(user.id, currentGroupId);
      }

      // Refresh user data to get updated XP
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData) {
          useStore.getState().setUser(userData);
          console.log('User data refreshed, new XP:', userData.current_xp, 'Level:', userData.level);
        }
      }

    } catch (error) {
      console.error('Error saving partner:', error);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    // First: Close modal
    setSelectedPartnerId(null);

    // Second: Zoom back to current user's sun after modal starts closing
    setTimeout(() => {
      const currentUserSun = nodes.find((n) => n.id === `sun-${user?.id}`);
      if (currentUserSun) {
        fitView({
          nodes: [currentUserSun],
          duration: 1000,
          padding: 0.5,
          maxZoom: 0.8,
        });
      } else {
        // Fallback if sun not found
        fitView({ padding: 0.2, duration: 1000 });
      }
    }, 200);
  };

  // Get pending partner for cause of death modal
  const pendingPartner = partners.find((p) => p.id === pendingGraveyardNodeId);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.5,
          minZoom: 0.4,
          maxZoom: 0.8,
        }}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        className="bg-deep-space touch-pan"
        panOnScroll={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        selectNodesOnDrag={false}
      >
        {/* Galaxy Background with stars and nebulae */}
        <GalaxyBackground />

        {/* Subtle grid overlay */}
        <Background color="#1A1A2E" gap={40} size={1} />
        <Controls
          className="bg-glass-panel border-white/10 fill-holo-cyan [&>button]:w-11 [&>button]:h-11 [&>button]:bg-glass-panel [&>button]:border [&>button]:border-white/10"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />

        {/* Warp Animation Overlay */}
        <AnimatePresence>
          {warpingNodeId && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="text-6xl"
                  variants={warpAnimation}
                  initial="initial"
                  animate="warping"
                >
                  💫
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </ReactFlow>

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        partner={selectedPartner}
        isOpen={!!selectedPartnerId}
        onClose={handleCloseModal}
        onSave={handleSavePartner}
      />

      {/* User Stats Modal */}
      <UserStatsModal
        user={user}
        partners={partners}
        isOpen={isUserStatsModalOpen}
        onClose={() => setUserStatsModalOpen(false)}
      />

      {/* Cause of Death Modal */}
      <CauseOfDeathModal
        isOpen={showCauseOfDeathModal}
        partnerNickname={pendingPartner?.nickname || "Unknown"}
        onConfirm={handleCauseOfDeathConfirm}
        onCancel={handleCauseOfDeathCancel}
      />

      {/* Graveyard Panel */}
      <GraveyardPanel
        isOpen={showGraveyardPanel}
        onClose={() => setShowGraveyardPanel(false)}
        graveyardPartners={graveyardPartners}
        ownerUsername={user?.username || "Unknown"}
      />

      {/* Betting Studio Panel */}
      <BettingStudioPanel
        isOpen={showBettingStudioPanel}
        onClose={() => setShowBettingStudioPanel(false)}
        groupId={currentGroupId || ""}
        groupMembers={groupMembers}
      />

      {/* Add Planet Modal */}
      <AddPlanetModal
        isOpen={showAddPlanetModal}
        onClose={() => setShowAddPlanetModal(false)}
      />
    </>
  );
}

export default function SolarSystem() {
  return (
    <div className="w-full h-screen bg-deep-space relative">
      <DashboardHeader />
      <ReactFlowProvider>
        <WarRoomFlow />
      </ReactFlowProvider>
    </div>
  );
}
