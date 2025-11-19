import { create } from "zustand";
import { PartnerNode, User } from "@/types";
import { Node, Edge } from "@xyflow/react";

interface AppState {
  user: User | null;
  partners: PartnerNode[];
  selectedPartnerId: string | null;
  nodes: Node[];
  edges: Edge[];
  setUser: (user: User) => void;
  addPartner: (partner: PartnerNode) => void;
  updatePartner: (id: string, updates: Partial<PartnerNode>) => void;
  setSelectedPartnerId: (id: string | null) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
}

// Mock data
const MOCK_USER: User = {
  id: "u1",
  username: "Agent007",
  current_xp: 1250,
  level: 5,
};

const MOCK_PARTNERS: PartnerNode[] = [
  {
    id: "p1",
    user_id: "u1",
    nickname: "The Barista",
    status: "Talking",
    financial_total: 45,
    time_total: 3,
    intimacy_score: 3,
    created_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
  },
  {
    id: "p2",
    user_id: "u1",
    nickname: "Gym Crush",
    status: "It's Complicated",
    financial_total: 120,
    time_total: 10,
    intimacy_score: 7,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    last_updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const useStore = create<AppState>((set, get) => ({
  user: MOCK_USER,
  partners: MOCK_PARTNERS,
  selectedPartnerId: null,
  nodes: [],
  edges: [],
  setUser: (user) => set({ user }),
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
  // We will implement proper onNodesChange/onEdgesChange from ReactFlow later
  onNodesChange: (changes) => {},
  onEdgesChange: (changes) => {},
}));
