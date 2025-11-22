"use client";

import React, { useState } from "react";
import { PartnerNode } from "@/types";
import { BlurImage } from "@/components/ui/blur-image";
import { AnimatedSwitch } from "@/components/ui/animated-switch";
import { AnimatedBadge } from "@/components/ui/animated-badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  MessageSquare,
  MapPin,
} from "lucide-react";

interface MediaTabProps {
  partner: PartnerNode;
}

// Mock media data - would come from backend
const mockMedia = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400",
    type: "image" as const,
    caption: "First date at the cafe",
    date: "2024-11-10",
    location: "Downtown Coffee Shop",
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=400",
    type: "image" as const,
    caption: "Dinner together",
    date: "2024-11-17",
    location: "Italian Restaurant",
  },
  {
    id: "3",
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    type: "screenshot" as const,
    caption: "Cute text conversation",
    date: "2024-11-15",
  },
  {
    id: "4",
    url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
    type: "image" as const,
    caption: "Weekend getaway",
    date: "2024-11-12",
    location: "Beach Resort",
  },
  {
    id: "5",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400",
    type: "screenshot" as const,
    caption: "Planning our next date",
    date: "2024-11-18",
  },
  {
    id: "6",
    url: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400",
    type: "image" as const,
    caption: "Movie night",
    date: "2024-11-16",
    location: "Cinema",
  },
];

export const MediaTab: React.FC<MediaTabProps> = ({ partner }) => {
  const [globalBlur, setGlobalBlur] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<typeof mockMedia[0] | null>(null);
  const [filterType, setFilterType] = useState<"all" | "image" | "screenshot">("all");

  const filteredMedia =
    filterType === "all"
      ? mockMedia
      : mockMedia.filter((m) => m.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold text-white uppercase">
            Media Gallery
          </h3>
          <p className="text-sm text-white/50 font-mono">
            Photos and screenshots with Fog of War protection
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatedSwitch
            checked={!globalBlur}
            onCheckedChange={(checked) => setGlobalBlur(!checked)}
            label={globalBlur ? "Blurred" : "Visible"}
          />
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-holo-cyan/20 hover:bg-holo-cyan/30 border border-holo-cyan/50 text-holo-cyan font-mono text-sm uppercase tracking-wider rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="w-4 h-4" />
            Upload
          </motion.button>
        </div>
      </div>

      {/* Fog of War Info Banner */}
      <motion.div
        className="p-4 rounded-lg bg-holo-cyan/10 border border-holo-cyan/30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          {globalBlur ? (
            <EyeOff className="w-5 h-5 text-holo-cyan" />
          ) : (
            <Eye className="w-5 h-5 text-holo-cyan" />
          )}
          <div>
            <h5 className="text-sm font-display font-bold text-holo-cyan">
              Fog of War {globalBlur ? "Active" : "Disabled"}
            </h5>
            <p className="text-xs text-white/70">
              {globalBlur
                ? "All media is blurred by default. Hover to reveal temporarily."
                : "All media is visible. Enable blur for privacy protection."}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "All Media", count: mockMedia.length },
          {
            id: "image",
            label: "Photos",
            count: mockMedia.filter((m) => m.type === "image").length,
          },
          {
            id: "screenshot",
            label: "Screenshots",
            count: mockMedia.filter((m) => m.type === "screenshot").length,
          },
        ].map((filter) => {
          const isActive = filterType === filter.id;
          return (
            <motion.button
              key={filter.id}
              onClick={() => setFilterType(filter.id as any)}
              className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-holo-cyan text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filter.label} ({filter.count})
            </motion.button>
          );
        })}
      </div>

      {/* Media Grid */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        layout
      >
        {filteredMedia.map((media, index) => (
          <motion.div
            key={media.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <div
              className="group cursor-pointer"
              onClick={() => setSelectedMedia(media)}
            >
              <BlurImage
                src={media.url}
                alt={media.caption}
                blurred={globalBlur}
                aspectRatio="square"
                showToggle={false}
              />
              <motion.div
                className="mt-2 space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                <p className="text-sm font-display text-white group-hover:text-holo-cyan transition-colors">
                  {media.caption}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white/50">
                    {media.date}
                  </span>
                  <AnimatedBadge
                    variant={media.type === "image" ? "info" : "warning"}
                    size="sm"
                  >
                    {media.type}
                  </AnimatedBadge>
                </div>
                {media.location && (
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <MapPin className="w-3 h-3" />
                    <span>{media.location}</span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredMedia.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ImageIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 font-mono">No media found</p>
        </motion.div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              className="relative max-w-4xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption}
                className="w-full h-auto rounded-lg"
              />
              <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <h4 className="text-lg font-display font-bold text-white mb-2">
                  {selectedMedia.caption}
                </h4>
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <span className="font-mono">{selectedMedia.date}</span>
                  {selectedMedia.location && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedMedia.location}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <EyeOff className="w-6 h-6 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
