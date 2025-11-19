import { create } from "zustand";
import { PartnerNode, User } from "@/types";
import { Node, Edge } from "@xyflow/react";

interface AppState {
  user: User | null;
  partners: PartnerNode[];
  selectedPartnerId: string | null;
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
  setUser: (user: User | null) => void;
  setPartners: (partners: PartnerNode[]) => void;
  addPartner: (partner: PartnerNode) => void;
  updatePartner: (id: string, updates: Partial<PartnerNode>) => void;
  setSelectedPartnerId: (id: string | null) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setLoading: (loading: boolean) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  partners: [],
  selectedPartnerId: null,
  nodes: [],
  edges: [],
  loading: true,
  setUser: (user) => set({ user }),
  setPartners: (partners) => set({ partners }),
  addPartner: (partner) =>
    set((state) => ({ partners: [...state.partners, partner] })),
  updatePartner: (id, updates) =>
    set((state) => ({
      partners: state.partners.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  setSelectedPartnerId: (id) => set({ selectedPartnerId: id }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setLoading: (loading) => set({ loading }),
  // We will implement proper onNodesChange/onEdgesChange from ReactFlow later
  onNodesChange: (changes) => {},
  onEdgesChange: (changes) => {},
}));
