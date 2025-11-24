import { create } from "zustand";
import { PartnerNode, User, CauseOfDeath } from "@/types";
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from "@xyflow/react";
import { XPService } from "@/services/xpService";
import { AchievementService } from "@/services/achievementService";
import { LevelUpResult } from "@/types/xp";

interface AppState {
  user: User | null;
  partners: PartnerNode[];
  selectedPartnerId: string | null;
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
  currentGroupId: string | null;
  // Graveyard state
  warpingNodeId: string | null;
  pendingGraveyardNodeId: string | null;
  // User stats modal state
  isUserStatsModalOpen: boolean;
  selectedStatsUser: User | null;
  // XP/Level state
  levelUpResult: LevelUpResult | null;
  showLevelUpModal: boolean;
  setUser: (user: User | null) => void;
  setPartners: (partners: PartnerNode[]) => void;
  addPartner: (partner: PartnerNode) => void;
  updatePartner: (id: string, updates: Partial<PartnerNode>) => void;
  setSelectedPartnerId: (id: string | null) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setLoading: (loading: boolean) => void;
  setCurrentGroupId: (groupId: string | null) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  // Graveyard actions
  setWarpingNodeId: (id: string | null) => void;
  setPendingGraveyardNodeId: (id: string | null) => void;
  moveToGraveyard: (partnerId: string, cause: CauseOfDeath, customReason?: string) => void;
  // User stats modal actions
  setUserStatsModalOpen: (open: boolean) => void;
  setSelectedStatsUser: (user: User | null) => void;
  // XP actions
  setLevelUpResult: (result: LevelUpResult | null) => void;
  setShowLevelUpModal: (show: boolean) => void;
  handleStatusChange: (partnerId: string, oldStatus: string, newStatus: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  partners: [],
  selectedPartnerId: null,
  nodes: [],
  edges: [],
  loading: true,
  currentGroupId: null,
  warpingNodeId: null,
  pendingGraveyardNodeId: null,
  isUserStatsModalOpen: false,
  selectedStatsUser: null,
  levelUpResult: null,
  showLevelUpModal: false,
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
  setCurrentGroupId: (groupId) => set({ currentGroupId: groupId }),
  // React Flow change handlers
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },
  // Graveyard actions
  setWarpingNodeId: (id) => set({ warpingNodeId: id }),
  setPendingGraveyardNodeId: (id) => set({ pendingGraveyardNodeId: id }),
  // User stats modal actions
  setUserStatsModalOpen: (open) => set({ isUserStatsModalOpen: open }),
  setSelectedStatsUser: (user) => set({ selectedStatsUser: user }),
  // XP actions
  setLevelUpResult: (result) => set({ levelUpResult: result }),
  setShowLevelUpModal: (show) => set({ showLevelUpModal: show }),
  handleStatusChange: async (partnerId, oldStatus, newStatus) => {
    const state = get();
    if (!state.user || !state.currentGroupId) return;

    // Award XP for status change
    const result = await XPService.handleStatusChange(
      state.user.id,
      state.currentGroupId,
      partnerId,
      oldStatus,
      newStatus
    );

    // Check performance rewards if moving to positive status
    if (newStatus === "Exclusive" || newStatus === "Dating") {
      const partner = state.partners.find(p => p.id === partnerId);
      if (partner) {
        await XPService.checkPerformanceRewards(
          state.user.id,
          state.currentGroupId,
          partnerId,
          partner.simp_index,
          partner.intimacy_score
        );
      }
    }

    // Check for toxic relationship end
    if (newStatus === "Graveyard" && oldStatus !== "Graveyard") {
      await XPService.awardToxicBreakupXP(
        state.user.id,
        state.currentGroupId,
        partnerId
      );
    }

    // Check achievements
    await AchievementService.checkAchievements(state.user.id, state.currentGroupId);

    // Show level up modal if leveled up
    if (result && result.leveled_up) {
      set({ levelUpResult: result, showLevelUpModal: true });

      // Refresh user data to get new level
      const { supabase } = await import('@/lib/supabase');
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', state.user.id)
        .single();

      if (userData) {
        set({ user: userData });
      }
    }
  },
  moveToGraveyard: async (partnerId, cause, customReason) => {
    console.log('Store: moveToGraveyard called', { partnerId, cause, customReason });

    if (!partnerId) {
      console.error('Cannot move to graveyard: partnerId is null or undefined');
      return;
    }

    // Update in database first
    const { supabase } = await import('@/lib/supabase');

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session:', session ? 'Authenticated' : 'Not authenticated');

    if (!session) {
      console.error('User is not authenticated. Cannot update partner.');
      return;
    }

    const updateData = {
      status: 'Graveyard',
      cause_of_death: cause,
      cause_of_death_custom: customReason || null,
      graveyard_date: new Date().toISOString(),
    };

    console.log('Updating partner with data:', updateData);
    console.log('Partner ID to update:', partnerId);

    // First, verify the partner exists
    const { data: existingPartner, error: fetchError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch partner from database:');
      console.error('Fetch error:', JSON.stringify(fetchError, null, 2));
      return;
    }

    if (!existingPartner) {
      console.error('Partner not found in database with ID:', partnerId);
      return;
    }

    console.log('Found existing partner:', existingPartner);

    const { data, error } = await supabase
      .from('partners')
      .update(updateData)
      .eq('id', partnerId)
      .select();

    if (error) {
      console.error('Failed to update partner in database:');
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Error keys:', Object.keys(error));
      return;
    }

    console.log('Database update response:', data);

    console.log('✅ Partner moved to graveyard in database');

    // Get old status before update
    const state = get();
    const partner = state.partners.find(p => p.id === partnerId);
    const oldStatus = partner?.status || "Dating";

    // Update local state
    set((state) => {
      const updatedPartners = state.partners.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              status: "Graveyard" as const,
              cause_of_death: cause,
              cause_of_death_custom: customReason,
              graveyard_date: new Date().toISOString(),
            }
          : p
      );
      console.log('Store: Updated partners:', updatedPartners.filter(p => p.status === 'Graveyard'));
      return {
        partners: updatedPartners,
        warpingNodeId: null,
        pendingGraveyardNodeId: null,
      };
    });

    // Handle XP for status change
    await get().handleStatusChange(partnerId, oldStatus, "Graveyard");
  },
}));
