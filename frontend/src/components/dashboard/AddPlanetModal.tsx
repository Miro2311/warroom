"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

interface AddPlanetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPlanetModal: React.FC<AddPlanetModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { currentGroupId, addPartner } = useStore();

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim() || !user) {
      console.error("Missing required data");
      return;
    }

    setLoading(true);

    try {
      // Create new partner - Partners are GLOBAL (belong to user, not group)
      // group_id is optional/legacy - we keep it for backwards compatibility
      const newPartner = {
        nickname: nickname.trim(),
        user_id: user.id,
        group_id: currentGroupId || null, // Optional - for legacy support
        status: "Talking", // Default status
        financial_total: 0,
        time_total: 0,
        intimacy_score: 5, // Default middle value
      };

      const { data, error } = await supabase
        .from("partners")
        .insert(newPartner)
        .select()
        .single();

      if (error) {
        console.error("Error creating partner:", error);
        alert("Failed to create partner: " + error.message);
        return;
      }

      console.log("Partner created successfully:", data);

      // No sync needed - partners are global now!
      // The partner will automatically appear in all groups the user is in

      // Add to store
      addPartner(data);

      // Award XP for adding a new partner
      if (user?.id && currentGroupId) {
        const { XPService } = await import("@/services/xpService");
        await XPService.awardPartnerAdded(user.id, currentGroupId, data.id);
        console.log("Awarded XP for creating new partner");
      }

      // Close modal and reset
      setNickname("");
      onClose();

      // Refresh the page to show the new planet
      window.location.reload();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      alert("An error occurred while creating the partner");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNickname("");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-deep-space border border-holo-cyan/30 rounded-lg p-8 w-full max-w-md relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-holo-cyan/20 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-holo-cyan" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white uppercase">
                  Add New Planet
                </h2>
                <p className="text-sm text-white/50 font-mono">
                  Launch a new connection into your orbit
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nickname field */}
              <div>
                <label className="text-xs font-mono text-white/50 uppercase tracking-wider mb-2 block">
                  Nickname *
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded text-white font-mono focus:outline-none focus:border-holo-cyan transition-colors"
                  placeholder="e.g. Coffee Shop Girl, Gym Crush..."
                  autoFocus
                  required
                  maxLength={50}
                />
                <p className="text-xs text-white/30 mt-1 font-mono">
                  You can add more details later in the planet details
                </p>
              </div>

              {/* Info box */}
              <div className="p-4 rounded-lg bg-holo-cyan/10 border border-holo-cyan/30">
                <p className="text-xs text-holo-cyan font-mono">
                  <strong>Default Settings:</strong><br />
                  • Status: Talking<br />
                  • Intimacy Score: 5/10<br />
                  • Money Spent: $0<br />
                  • Time Invested: 0h
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-display rounded transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={!nickname.trim() || loading}
                  className={`flex-1 py-3 font-display font-bold rounded transition-colors ${
                    !nickname.trim() || loading
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-holo-cyan hover:bg-holo-cyan/80 text-black'
                  }`}
                  whileHover={nickname.trim() && !loading ? { scale: 1.02 } : {}}
                  whileTap={nickname.trim() && !loading ? { scale: 0.98 } : {}}
                >
                  {loading ? "Creating..." : "Launch Planet"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
