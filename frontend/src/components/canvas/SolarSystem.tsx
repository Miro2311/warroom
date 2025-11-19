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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "@/store/useStore";
import { useLoadData } from "@/hooks/useLoadData";
import { SunNode } from "./SunNode";
import { PlanetNode } from "./PlanetNode";
import { OrbitalPathsContainer } from "./OrbitalPath";
import { PartnerDetailModal } from "../dashboard/PartnerDetailModal";
import {
  getOrbitData,
  polarToCartesian,
  getRandomStartAngle,
  calculateTimeOffset,
} from "@/lib/orbitCalculator";

// Define node types
const nodeTypes = {
  sun: SunNode,
  planet: PlanetNode,
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
  const { user, partners, loading, setSelectedPartnerId, selectedPartnerId } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  // Orbital states for animation - use ref to avoid re-renders
  const orbitalStatesRef = useRef<OrbitalState[]>([]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());
  const [, forceUpdate] = useState({});

  // Load data from Supabase
  useLoadData();

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
      } else {
        setSelectedPartnerId(null);
      }
    },
    [setSelectedPartnerId, fitView]
  );

  const onPaneClick = useCallback(() => {
    setSelectedPartnerId(null);
  }, [setSelectedPartnerId]);

  // Initialize Orbital States
  useEffect(() => {
    if (!user || loading || partners.length === 0) return;

    // Calculate orbital data for each partner
    const initialStates: OrbitalState[] = partners.map((partner) => {
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

  // Orbital Animation Loop with optimized updates
  useEffect(() => {
    if (orbitalStatesRef.current.length === 0 || !user) return;

    let frameCount = 0;
    const updateInterval = 3; // Update every 3 frames for 20fps (smoother performance)

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Pause animation when a planet is selected
      if (!selectedPartnerId) {
        // Update orbital angles
        orbitalStatesRef.current = orbitalStatesRef.current.map((state) => ({
          ...state,
          angle: (state.angle + state.speed * deltaTime) % 360,
        }));
      }

      // Only update React state every N frames to reduce re-renders
      frameCount++;
      if (frameCount >= updateInterval) {
        frameCount = 0;

        // Update node positions
        const planetNodes: Node[] = partners.map((partner) => {
          const orbitalState = orbitalStatesRef.current.find(
            (s) => s.partnerId === partner.id
          );

          let position = { x: 0, y: 0 };
          if (orbitalState) {
            position = polarToCartesian(orbitalState.angle, orbitalState.radius);
          }

          return {
            id: partner.id,
            type: "planet",
            position,
            data: { partner },
            draggable: false,
          };
        });

        const sunNode: Node = {
          id: "sun",
          type: "sun",
          position: { x: 0, y: 0 },
          data: { user },
          draggable: false,
        };

        setNodes([sunNode, ...planetNodes]);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [user, partners, setNodes, selectedPartnerId]);

  // Initialize edges once
  useEffect(() => {
    if (!user || loading || partners.length === 0) return;

    const newEdges: Edge[] = partners.map((p) => ({
      id: `e-sun-${p.id}`,
      source: "sun",
      target: p.id,
      animated: false,
      type: 'straight', // Straight lines from center
      style: {
        stroke: "#00F0FF",
        strokeWidth: 1,
        strokeDasharray: "5, 5",
        opacity: 0.15,
      },
    }));

    setEdges(newEdges);
  }, [user, partners, loading, setEdges]);

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
  const handleSavePartner = (updatedPartner: any) => {
    // TODO: Update partner in Supabase
    console.log("Saving partner:", updatedPartner);
    // For now, we'll just update the local state through the store
    // This will be implemented when we add Supabase mutations
  };

  // Handle close modal
  const handleCloseModal = () => {
    // First: Close modal
    setSelectedPartnerId(null);

    // Second: Zoom back to the sun (center of solar system) after modal starts closing
    setTimeout(() => {
      const sunNode = nodes.find((n) => n.id === "sun");
      if (sunNode) {
        fitView({
          nodes: [sunNode],
          duration: 1000,
          padding: 0.8, // Show full solar system around sun
          maxZoom: 1,
        });
      } else {
        // Fallback if sun not found
        fitView({ padding: 0.2, duration: 1000 });
      }
    }, 200);
  };

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
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        className="bg-deep-space"
      >
        <Background color="#1A1A2E" gap={40} size={1} />
        <Controls className="bg-glass-panel border-white/10 fill-holo-cyan" />
      </ReactFlow>

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        partner={selectedPartner}
        isOpen={!!selectedPartnerId}
        onClose={handleCloseModal}
        onSave={handleSavePartner}
      />
    </>
  );
}

export default function SolarSystem() {
  return (
    <div className="w-full h-screen bg-deep-space">
      <ReactFlowProvider>
        <WarRoomFlow />
      </ReactFlowProvider>
    </div>
  );
}
