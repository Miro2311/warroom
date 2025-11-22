"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PartnerNode } from "@/types";
import { X } from "lucide-react";

interface GraveyardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  graveyardPartners: PartnerNode[];
  ownerUsername: string;
}

export const GraveyardPanel = ({
  isOpen,
  onClose,
  graveyardPartners,
  ownerUsername
}: GraveyardPanelProps) => {
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (typeof window === "undefined") return null;

  const handleMouseEnter = (partnerId: string, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 140
    });
    setHoveredPartner(partnerId);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel - Centered */}
          <motion.div
            className="fixed top-1/2 left-1/2 z-[210] w-[90vw] max-w-5xl"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-[#0A0A0F] border-2 border-toxic-green/30 rounded-lg shadow-[0_0_50px_rgba(57,255,20,0.2)] overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b-2 border-toxic-green/20 flex items-center justify-between bg-gradient-to-r from-toxic-green/5 to-transparent">
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-wider text-toxic-green drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
                    ⚰️ Graveyard
                  </h2>
                  <p className="font-mono text-sm text-gray-400 mt-1">
                    {graveyardPartners.length} {graveyardPartners.length === 1 ? 'soul' : 'souls'} laid to rest
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-toxic-green/10 rounded-lg transition-colors border border-toxic-green/20"
                >
                  <X className="w-6 h-6 text-toxic-green" />
                </button>
              </div>

              {/* Body - Scrollable Grid */}
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {graveyardPartners.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-7xl mb-6 opacity-20">🪦</div>
                    <p className="font-mono text-base text-gray-500">
                      The graveyard is empty... for now
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {graveyardPartners.map((partner) => (
                      <motion.div
                        key={partner.id}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="relative"
                        onMouseEnter={(e) => handleMouseEnter(partner.id, e)}
                        onMouseLeave={() => setHoveredPartner(null)}
                      >
                        {/* Tombstone */}
                        <div className="relative flex flex-col items-center group">
                          {/* Tombstone Stone */}
                          <div className="relative w-32 h-40 bg-gradient-to-b from-gray-700 to-gray-900 rounded-t-full border-2 border-gray-600 shadow-[0_10px_30px_rgba(0,0,0,0.8)] overflow-hidden">
                            {/* Texture overlay */}
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOCIgbnVtT2N0YXZlcz0iNCIgLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-20" />

                            {/* RIP Cross */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2">
                              <div className="text-gray-400 text-3xl">✞</div>
                            </div>

                            {/* Name */}
                            <div className="absolute top-16 left-0 right-0 text-center px-3">
                              <p className="font-display text-sm font-bold text-gray-300 uppercase tracking-wide truncate">
                                {partner.nickname}
                              </p>
                            </div>

                            {/* Dates */}
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                              <p className="font-mono text-[10px] text-gray-500">
                                {new Date(partner.created_at).getFullYear()} - {new Date(partner.graveyard_date || Date.now()).getFullYear()}
                              </p>
                            </div>

                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-toxic-green/0 group-hover:bg-toxic-green/10 transition-colors duration-300 rounded-t-full" />
                          </div>

                          {/* Ground/Base */}
                          <div className="w-36 h-8 bg-gradient-to-b from-gray-800 to-gray-950 rounded-b-lg shadow-[0_5px_15px_rgba(0,0,0,0.9)]" />

                          {/* Cause of Death Badge */}
                          {partner.cause_of_death && (
                            <div className="mt-3 px-3 py-1 bg-toxic-green/10 border border-toxic-green/30 rounded-full">
                              <p className="font-mono text-[10px] text-toxic-green uppercase tracking-wide">
                                {partner.cause_of_death === 'Custom' && partner.cause_of_death_custom
                                  ? partner.cause_of_death_custom.substring(0, 20)
                                  : partner.cause_of_death}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Floating Tooltip - Rendered outside panel */}
          <AnimatePresence>
            {hoveredPartner && (
              <motion.div
                className="fixed bg-black/95 border border-toxic-green/40 rounded-lg p-4 min-w-[220px] z-[300] pointer-events-none"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                  transform: 'translateX(-50%)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  const partner = graveyardPartners.find(p => p.id === hoveredPartner);
                  if (!partner) return null;

                  return (
                    <>
                      {/* Title */}
                      <div className="font-display text-xs text-toxic-green uppercase tracking-wider mb-3 border-b border-toxic-green/20 pb-2">
                        Relationship Highlights
                      </div>

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-gray-400">Total Spent</span>
                          <span className="font-mono text-sm text-white font-semibold">${partner.financial_total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-gray-400">Time Invested</span>
                          <span className="font-mono text-sm text-white font-semibold">{partner.time_total || 0}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-gray-400">Intimacy Score</span>
                          <span className="font-mono text-sm text-lust-pink font-semibold">{partner.intimacy_score || 0}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] text-gray-400">Simp Index</span>
                          <span className="font-mono text-sm text-simp-red font-semibold">
                            {partner.intimacy_score > 0
                              ? ((partner.financial_total + partner.time_total * 20) / partner.intimacy_score).toFixed(1)
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Cause */}
                      {partner.cause_of_death && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="font-mono text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                            Cause of Death
                          </div>
                          <div className="font-mono text-xs text-white">
                            {partner.cause_of_death === 'Custom' && partner.cause_of_death_custom
                              ? partner.cause_of_death_custom
                              : partner.cause_of_death
                            }
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
