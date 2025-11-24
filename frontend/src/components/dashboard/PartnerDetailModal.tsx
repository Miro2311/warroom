"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { PartnerNode, RelationshipStatus } from "@/types";
import { AnimatedTabs, TabContent } from "@/components/ui/animated-tabs";
import {
  X,
  Home,
  Clock,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { OverviewTab } from "./tabs/OverviewTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { IntelTab } from "./tabs/IntelTab";

interface PartnerDetailModalProps {
  partner: PartnerNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPartner: PartnerNode) => void;
}

const STATUS_OPTIONS: RelationshipStatus[] = [
  "Talking",
  "Dating",
  "It's Complicated",
  "Signed",
  "Exclusive",
  "Graveyard",
];

const TABS = [
  { id: "overview", label: "Overview", icon: <Home className="w-4 h-4" /> },
  { id: "timeline", label: "Timeline", icon: <Clock className="w-4 h-4" /> },
  { id: "intel", label: "Intel", icon: <Shield className="w-4 h-4" /> },
];

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({
  partner,
  isOpen,
  onClose,
  onSave,
}) => {
  const { user: authUser } = useAuth();
  const [editedPartner, setEditedPartner] = useState<PartnerNode | null>(partner);
  const [activeTab, setActiveTab] = useState("overview");

  // Check if current user is the owner
  const isOwner = authUser?.id === partner?.user_id;

  // Update local state when partner changes
  React.useEffect(() => {
    if (partner) {
      setEditedPartner({ ...partner });
    }
  }, [partner]);

  if (!partner || !editedPartner) return null;

  const handleUpdate = async (updates: Partial<PartnerNode>) => {
    if (!editedPartner) return;

    const updated = { ...editedPartner, ...updates };
    setEditedPartner(updated);

    // Auto-save changes immediately
    if (isOwner) {
      try {
        await onSave(updated);
      } catch (error) {
        console.error('Error saving partner:', error);
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-[110] w-[95vw] md:w-[90vw] max-w-7xl h-[95vh] md:h-[90vh] bg-deep-space border border-white/20 shadow-2xl overflow-hidden rounded-lg"
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {/* Header */}
                <div className="border-b border-white/10 p-4 md:p-6 flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                      {/* Always render Dialog.Title for accessibility */}
                      {isOwner ? (
                        <VisuallyHidden.Root>
                          <Dialog.Title>
                            {partner.nickname}
                          </Dialog.Title>
                        </VisuallyHidden.Root>
                      ) : (
                        <Dialog.Title className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wider">
                          {partner.nickname}
                        </Dialog.Title>
                      )}
                      {isOwner && (
                        <input
                          type="text"
                          value={editedPartner.nickname}
                          onChange={(e) =>
                            handleUpdate({ nickname: e.target.value })
                          }
                          className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wider bg-white/10 border border-white/20 px-2 md:px-3 py-1 rounded focus:outline-none focus:border-holo-cyan transition-colors w-full md:w-auto min-w-[200px]"
                          aria-label="Partner nickname"
                        />
                      )}
                      {isOwner && (
                        <select
                          value={editedPartner.status}
                          onChange={(e) =>
                            handleUpdate({
                              status: e.target.value as RelationshipStatus,
                            })
                          }
                          className="bg-white/10 border border-white/20 px-2 md:px-3 py-2 rounded text-white font-display text-sm focus:outline-none focus:border-holo-cyan transition-colors min-h-[44px]"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <VisuallyHidden.Root>
                      <Dialog.Description>
                        Partner details for {partner.nickname}
                      </Dialog.Description>
                    </VisuallyHidden.Root>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Close Button */}
                    <Dialog.Close asChild>
                      <motion.button
                        className="w-11 h-11 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-5 h-5 text-white" />
                      </motion.button>
                    </Dialog.Close>
                  </div>
                </div>

                {/* Tabs & Content */}
                <div className="h-[calc(95vh-120px)] md:h-[calc(90vh-120px)] overflow-y-auto p-4 md:p-6">
                  <AnimatedTabs
                    tabs={TABS}
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabContent value="overview">
                      <OverviewTab
                        partner={partner}
                        isEditing={isOwner}
                        editedPartner={editedPartner}
                        onUpdate={handleUpdate}
                      />
                    </TabContent>
                    <TabContent value="timeline">
                      <TimelineTab partner={partner} />
                    </TabContent>
                    <TabContent value="intel">
                      <IntelTab partner={partner} />
                    </TabContent>
                  </AnimatedTabs>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
