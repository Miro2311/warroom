"use client";

import React from "react";
import { useStore } from "@/store/useStore";
import { SimpMeter } from "./SimpMeter";
import { X, DollarSign, Clock, Heart, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const PartnerPanel = () => {
  const { partners, selectedPartnerId, setSelectedPartnerId } = useStore();

  const partner = partners.find((p) => p.id === selectedPartnerId);

  if (!selectedPartnerId || !partner) return null;

  // Calculate Simp Index
  const simpIndex =
    partner.simp_index ||
    (partner.financial_total + partner.time_total * 20) /
      (partner.intimacy_score || 1);

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-glass-panel border-l border-white/10 backdrop-blur-xl z-50 flex flex-col transition-transform duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
        <div>
          <h2 className="text-2xl font-display font-bold text-white tracking-wider uppercase">
            {partner.nickname}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-holo-cyan animate-pulse" />
            <span className="text-xs font-mono text-holo-cyan uppercase">
              {partner.status}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedPartnerId(null)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Simp Meter Section */}
        <div className="flex flex-col items-center">
          <SimpMeter value={simpIndex} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded border border-white/5 flex flex-col items-center">
            <DollarSign className="w-5 h-5 text-green-400 mb-2" />
            <div className="text-xs text-gray-400 font-mono uppercase">
              Spent
            </div>
            <div className="text-xl font-display font-bold text-white">
              ${partner.financial_total}
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded border border-white/5 flex flex-col items-center">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-xs text-gray-400 font-mono uppercase">
              Hours
            </div>
            <div className="text-xl font-display font-bold text-white">
              {partner.time_total}h
            </div>
          </div>
          <div className="bg-black/40 p-4 rounded border border-white/5 flex flex-col items-center col-span-2">
            <Heart className="w-5 h-5 text-lust-pink mb-2" />
            <div className="text-xs text-gray-400 font-mono uppercase">
              Intimacy Score
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-lust-pink h-full transition-all duration-500"
                style={{ width: `${(partner.intimacy_score / 10) * 100}%` }}
              />
            </div>
            <div className="text-sm font-mono font-bold text-lust-pink mt-1">
              {partner.intimacy_score}/10
            </div>
          </div>
        </div>

        {/* Actions (Placeholders) */}
        <div className="space-y-3">
          <h3 className="text-sm font-display font-bold text-white/50 uppercase mb-4">
            Tactical Actions
          </h3>
          <button className="w-full py-3 bg-holo-cyan/10 border border-holo-cyan/50 text-holo-cyan font-mono text-sm uppercase tracking-widest hover:bg-holo-cyan/20 transition-colors flex items-center justify-center gap-2">
            <DollarSign className="w-4 h-4" /> Log Expense
          </button>
          <button className="w-full py-3 bg-lust-pink/10 border border-lust-pink/50 text-lust-pink font-mono text-sm uppercase tracking-widest hover:bg-lust-pink/20 transition-colors flex items-center justify-center gap-2">
            <Heart className="w-4 h-4" /> Log Date
          </button>
          <button className="w-full py-3 bg-simp-red/10 border border-simp-red/50 text-simp-red font-mono text-sm uppercase tracking-widest hover:bg-simp-red/20 transition-colors flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Report Red Flag
          </button>
        </div>
      </div>
    </div>
  );
};
