"use client";

import React, { useEffect, useCallback } from "react";
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
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceRadial,
  SimulationNodeDatum,
} from "d3-force";
import "@xyflow/react/dist/style.css";
import { useStore } from "@/store/useStore";
import { SunNode } from "./SunNode";
import { PlanetNode } from "./PlanetNode";

// Define node types
const nodeTypes = {
  sun: SunNode,
  planet: PlanetNode,
};

// Extend Node type for D3
interface D3Node extends SimulationNodeDatum {
  id: string;
  type: string;
}

function WarRoomFlow() {
  const { user, partners, setSelectedPartnerId } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === "planet") {
      setSelectedPartnerId(node.id);
    } else {
      setSelectedPartnerId(null);
    }
  }, [setSelectedPartnerId]);

  const onPaneClick = useCallback(() => {
    setSelectedPartnerId(null);
  }, [setSelectedPartnerId]);

  // Initialize Nodes & Edges
  useEffect(() => {
    if (!user) return;

    // 1. Create initial nodes (without positions, D3 will handle it)
    // Sun
    const sunNode: Node = {
      id: "sun",
      type: "sun",
      position: { x: 0, y: 0 },
      data: { user },
      draggable: false,
    };

    // Planets
    const planetNodes: Node[] = partners.map((p) => ({
      id: p.id,
      type: "planet",
      position: { x: 0, y: 0 }, // Initial pos
      data: { partner: p },
    }));

    const initialNodes = [sunNode, ...planetNodes];
    const initialEdges = partners.map((p) => ({
      id: `e-sun-${p.id}`,
      source: "sun",
      target: p.id,
      animated: true,
      style: {
        stroke: "#00F0FF",
        strokeWidth: 1,
        strokeDasharray: "5, 5",
        opacity: 0.2,
      },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);

    // 2. D3 Simulation
    const simulationNodes: D3Node[] = initialNodes.map((n) => ({
      ...n,
      type: n.type || "default",
      x: 0,
      y: 0,
    }));

    const simulation = forceSimulation(simulationNodes)
      .force(
        "charge",
        forceManyBody().strength(-1000) // Repulsion
      )
      .force(
        "collide",
        forceCollide().radius(80) // Prevent overlap - increased for larger nodes
      )
      .force(
        "radial",
        forceRadial((d: D3Node) => {
          if (d.id === "sun") return 0;
          // Find partner data to determine radius
          const p = partners.find((partner) => partner.id === d.id);
          if (p) {
             // Intimacy 10 = close (200px), Intimacy 1 = far (600px)
             return 600 - (p.intimacy_score * 40);
          }
          return 300;
        }, 0, 0).strength(0.8)
      )
      .on("tick", () => {
        setNodes((nds) =>
          nds.map((node) => {
            const d3Node = simulationNodes.find((n) => n.id === node.id);
            if (d3Node && d3Node.x !== undefined && d3Node.y !== undefined) {
              return {
                ...node,
                position: { x: d3Node.x, y: d3Node.y },
              };
            }
            return node;
          })
        );
      });
      
    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [user, partners, setNodes, setEdges]);

  return (
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
