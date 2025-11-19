"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { PartnerNode, RelationshipStatus } from "@/types";
import { X, DollarSign, Clock, Heart, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

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
  "Exclusive",
  "Graveyard",
];

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({
  partner,
  isOpen,
  onClose,
  onSave,
}) => {
  // Local state for editing
  const [editedPartner, setEditedPartner] = useState<PartnerNode | null>(partner);
  const [isEditing, setIsEditing] = useState(false);

  // Update local state when partner changes
  React.useEffect(() => {
    if (partner) {
      setEditedPartner({ ...partner });
      setIsEditing(false);
    }
  }, [partner]);

  if (!partner || !editedPartner) return null;

  // Calculate derived stats
  const simpIndex =
    (editedPartner.financial_total + editedPartner.time_total * 20) /
    (editedPartner.intimacy_score || 1);
  const roi =
    editedPartner.financial_total / Math.max(editedPartner.intimacy_score, 1);

  const handleSave = () => {
    onSave(editedPartner);
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setEditedPartner({ ...partner });
    setIsEditing(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Dialog.Overlay>

            {/* Modal Content */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-5xl h-[85vh] bg-black border border-white/10 shadow-2xl overflow-hidden"
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
                <div className="border-b border-white/10 p-6 flex items-center justify-between bg-white/5">
                  <div>
                    <Dialog.Title className="text-2xl font-display font-bold text-white uppercase tracking-wider">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedPartner.nickname}
                          onChange={(e) =>
                            setEditedPartner({
                              ...editedPartner,
                              nickname: e.target.value,
                            })
                          }
                          className="bg-white/10 border border-white/20 px-3 py-1 rounded focus:outline-none focus:border-holo-cyan transition-colors"
                        />
                      ) : (
                        partner.nickname
                      )}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-white/50 font-mono mt-1">
                      Partner ID: {partner.id.slice(0, 8)}...
                    </Dialog.Description>
                  </div>

                  {/* Close Button */}
                  <Dialog.Close asChild>
                    <motion.button
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-white" />
                    </motion.button>
                  </Dialog.Close>
                </div>

                {/* Content Area */}
                <div className="overflow-y-auto h-[calc(85vh-140px)] p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column - Status & Basic Info */}
                    <div className="space-y-6">
                      {/* Status */}
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-white/50 uppercase tracking-wider">
                          Relationship Status
                        </label>
                        {isEditing ? (
                          <select
                            value={editedPartner.status}
                            onChange={(e) =>
                              setEditedPartner({
                                ...editedPartner,
                                status: e.target.value as RelationshipStatus,
                              })
                            }
                            className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-display focus:outline-none focus:border-holo-cyan transition-colors"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded border border-white/10 text-white font-display">
                            {partner.status}
                          </div>
                        )}
                      </div>

                      {/* Intimacy Score */}
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-white/50 uppercase tracking-wider flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Intimacy Score
                        </label>
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={editedPartner.intimacy_score}
                              onChange={(e) =>
                                setEditedPartner({
                                  ...editedPartner,
                                  intimacy_score: parseInt(e.target.value),
                                })
                              }
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs font-mono text-white/50">
                              <span>1</span>
                              <span className="text-holo-cyan text-lg font-bold">
                                {editedPartner.intimacy_score}
                              </span>
                              <span>10</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-lust-pink to-holo-cyan"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(partner.intimacy_score / 10) * 100}%`,
                                }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                            </div>
                            <span className="text-2xl font-mono font-bold text-white">
                              {partner.intimacy_score}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Financial Total */}
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-white/50 uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Money Spent
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedPartner.financial_total}
                            onChange={(e) =>
                              setEditedPartner({
                                ...editedPartner,
                                financial_total: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                            placeholder="0"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded border border-white/10 text-white font-mono text-2xl">
                            ${partner.financial_total.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Time Invested */}
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-white/50 uppercase tracking-wider flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Time Invested (Hours)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editedPartner.time_total}
                            onChange={(e) =>
                              setEditedPartner({
                                ...editedPartner,
                                time_total: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                            placeholder="0"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white/5 rounded border border-white/10 text-white font-mono text-2xl">
                            {partner.time_total}h
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Analytics */}
                    <div className="space-y-6">
                      {/* Simp Index */}
                      <motion.div
                        className={cn(
                          "p-6 rounded-lg border-2",
                          simpIndex > 500
                            ? "bg-simp-red/10 border-simp-red"
                            : simpIndex > 200
                            ? "bg-yellow-500/10 border-yellow-500"
                            : "bg-holo-cyan/10 border-holo-cyan"
                        )}
                        animate={{
                          scale: simpIndex > 500 ? [1, 1.02, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat: simpIndex > 500 ? Infinity : 0,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-xs font-mono text-white/50 uppercase">
                            Simp Index
                          </span>
                        </div>
                        <div className="text-5xl font-mono font-bold text-white">
                          {Math.round(simpIndex)}
                        </div>
                        <div className="mt-2 text-sm font-mono text-white/50">
                          {simpIndex > 500
                            ? "CRITICAL - High Simp Alert"
                            : simpIndex > 200
                            ? "CAUTION - Watch spending"
                            : "SAFE - Balanced relationship"}
                        </div>
                      </motion.div>

                      {/* ROI */}
                      <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="w-5 h-5" />
                          <span className="text-xs font-mono text-white/50 uppercase">
                            Cost Per Intimacy Point
                          </span>
                        </div>
                        <div className="text-4xl font-mono font-bold text-white">
                          ${roi.toFixed(2)}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="space-y-3">
                        <div className="p-4 rounded bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase mb-1">
                            <Calendar className="w-4 h-4" />
                            Created
                          </div>
                          <div className="text-sm font-mono text-white">
                            {new Date(partner.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="p-4 rounded bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 text-xs font-mono text-white/50 uppercase mb-1">
                            <Calendar className="w-4 h-4" />
                            Last Updated
                          </div>
                          <div className="text-sm font-mono text-white">
                            {new Date(partner.last_updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-white/10 p-6 flex items-center justify-end gap-3 bg-white/5">
                  {isEditing ? (
                    <>
                      <motion.button
                        onClick={handleCancel}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-display rounded transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={handleSave}
                        className="px-6 py-3 bg-holo-cyan hover:bg-holo-cyan/80 text-black font-display font-bold rounded transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Save Changes
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-holo-cyan hover:bg-holo-cyan/80 text-black font-display font-bold rounded transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit Partner
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};
